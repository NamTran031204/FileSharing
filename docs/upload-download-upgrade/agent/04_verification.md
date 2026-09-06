# 04 — Verification: Upload/Download Pipeline v2

> **Vai trò tài liệu:** cách **dựng môi trường**, **chạy kịch bản kiểm chứng**, và **nghiệm thu** phase upload/download v2. Đây là nơi agent ghi lại **kết quả thật** (không phải kết quả kỳ vọng) khi báo cáo từng WP.
> Tiêu chí DoD gốc nằm ở `00_guardrails.md` §6 — file này **tham chiếu**, không chép lại. Tên endpoint/field/ErrorCode lấy từ `01_api_contract.md`; key config/schema từ `02_schema_config.md`; task id từ `03_tasks.md`.
>
> Toàn bộ lệnh viết cho **PowerShell trên Windows 11**, đường dẫn tuyệt đối, dùng stack docker sẵn có của repo. Thư mục làm việc tạm: `E:\tmp\upload-v2-smoke\` (ngoài repo — không làm bẩn `git status`).
>
> Ngày chốt: 2026-09-02 · Nhánh cơ sở: `web-flux`

---

## 1. Dựng môi trường

### 1.1 Biến dùng lại cho cả phiên

```powershell
$ROOT   = "E:\DaiCuongBK\Project3\FileSharing"
$DOCK   = "$ROOT\server\dockers"
$TMP    = "E:\tmp\upload-v2-smoke"
New-Item -ItemType Directory -Force -Path $TMP | Out-Null

# Đọc credential root MinIO từ .env (KHÔNG hardcode vào script, KHÔNG in ra log chung)
$envMap = @{}
Get-Content "$DOCK\.env" | Where-Object { $_ -match "^\s*[A-Z_]+=" } | ForEach-Object {
    $k,$v = $_ -split "=", 2; $envMap[$k.Trim()] = $v.Trim()
}
$MINIO_USER = $envMap["MINIO_ROOT_USER"]
$MINIO_PASS = $envMap["MINIO_ROOT_PASSWORD"]

$API   = "http://localhost:5000"
$MINIO = "http://localhost:9000"
$MONGO = "mongodb://admin:admin123456@localhost:27017/metadata?authSource=admin"
$BUCKET = "file-sharing"
```

### 1.2 Hạ tầng (Mongo / Kafka / MinIO / mc)

```powershell
docker compose -f "$DOCK\docker-compose.yml" up -d
docker compose -f "$DOCK\docker-compose.yml" ps
# -> filesharing-mongodb, kafka-broker, kafka-zookeeper, kafka-ui, minio-server = Up
#    minio-mc = Exited (0)  <-- đúng kỳ vọng: container one-shot chạy init-bucket.sh rồi thoát

docker network ls --filter name=minio    # -> ghi lại tên thật, thường là dockers_minio-network
```

### 1.3 `mc` không cần cài trên host

Container `minio-mc` là one-shot → **không** `docker exec` được. Dùng container tạm:

```powershell
function mcx {
  docker run --rm --network dockers_minio-network `
    -e MC_HOST_myminio="http://$([uri]::EscapeDataString($MINIO_USER)):$([uri]::EscapeDataString($MINIO_PASS))@minio:9000" `
    --entrypoint mc minio/mc:latest @args
}

mcx alias list           # -> myminio
mcx ls myminio/$BUCKET   # -> liệt kê object hiện có
```

### 1.4 Chạy `init-upload-hardening.sh` (WP1 — `T-1.3`)

Script mount vào container tạm; **không** thêm volume cho service `mc` trong `docker-compose.yml` (whitelist WP1 chỉ cho thêm biến env).

```powershell
docker run --rm --network dockers_minio-network `
  -v "$DOCK\scripts:/scripts:ro" `
  -e MINIO_HOST=http://minio:9000 `
  -e MINIO_ROOT_USER=$MINIO_USER -e MINIO_ROOT_PASSWORD=$MINIO_PASS `
  --entrypoint sh minio/mc:latest /scripts/init-upload-hardening.sh
# -> in [1/5]..[5/5], exit code 0
$LASTEXITCODE   # -> 0
```

### 1.5 Build & chạy backend

```powershell
mvn -f "$ROOT\server\pom.xml" install -pl filesharing-core -DskipTests   # bắt buộc sau mỗi thay đổi core
mvn -f "$ROOT\server\pom.xml" clean install -DskipTests                  # -> BUILD SUCCESS, 6 module

mvn -f "$ROOT\server\pom.xml" spring-boot:run -pl filesharing-filehandler
# -> app UP tại :5000; log có "Mongo indexes bootstrap completed."
```

### 1.6 Client

```powershell
cd "$ROOT\client"
npm install            # chỉ khi node_modules chưa có — KHÔNG thêm package mới (00_guardrails §2.4)
npm run gen-api        # server phải đang chạy ở :5000
npm run dev            # -> http://localhost:5173
npm run build          # -> exit 0
npm run lint
```

### 1.7 Lấy JWT cho 2 user (owner + user khác)

Cần **2 tài khoản** để kiểm nhánh 403.

```powershell
function Get-Jwt($email, $password) {
  $body = @{ email = $email; password = $password } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$API/api/auth/login" -Method Post -ContentType "application/json" -Body $body
  return $r.data.token     # điều chỉnh theo field thật của response login
}
$JWT_OWNER = Get-Jwt "owner@example.com" "<pass>"
$JWT_OTHER = Get-Jwt "other@example.com" "<pass>"
$H_OWNER = @{ Authorization = "Bearer $JWT_OWNER"; "Content-Type" = "application/json" }
$H_OTHER = @{ Authorization = "Bearer $JWT_OTHER"; "Content-Type" = "application/json" }
```

### 1.8 Hàm tiện ích: cắt part + MD5

```powershell
function Split-IntoParts($filePath, [long]$partSize, $outDir) {
  New-Item -ItemType Directory -Force -Path $outDir | Out-Null
  $fs = [IO.File]::OpenRead($filePath); $n = 0; $result = @()
  try {
    while ($true) {
      $buf = New-Object byte[] $partSize
      $read = $fs.Read($buf, 0, $partSize)
      if ($read -le 0) { break }
      $n++
      $p = Join-Path $outDir "part.$n"
      [IO.File]::WriteAllBytes($p, $buf[0..($read-1)])
      $hash = [Security.Cryptography.MD5]::Create().ComputeHash($buf, 0, $read)
      $result += [pscustomobject]@{
        partNumber = $n
        path       = $p
        size       = $read
        md5Hex     = ($hash | ForEach-Object { $_.ToString("x2") }) -join ''
        md5B64     = [Convert]::ToBase64String($hash)
      }
    }
  } finally { $fs.Dispose() }
  return $result
}

function Put-Part($url, $part) {
  # --upload-file = PUT; -D - để đọc ETag; KHÔNG đặt Content-Type (00_guardrails §, contract "Hợp đồng PUT part")
  $out = curl.exe -s -D - -o NUL -X PUT --upload-file $part.path -H "Content-MD5: $($part.md5B64)" $url
  return $out    # chứa dòng "HTTP/1.1 200 OK" và "ETag: \"...\""
}
```

> **Cấm** ghi presigned URL ra file log/console chung (`00_guardrails.md` §2.15). Trong script chỉ giữ URL trong biến, khi in ra chỉ in `partNumber` + HTTP status.

---

## 2. Bộ smoke test 3 pha

Mọi kịch bản dưới đây dùng biến của §1. Sau mỗi kịch bản: **dọn** object/session mình tạo (`00_guardrails.md` §2.10).

### 2.1 Kịch bản A — happy path: E1 → PUT 2 part → E4

Mục tiêu: chứng minh pipeline 3 pha chạy end-to-end, `Content-MD5` được MinIO chấp nhận, size/etag thật ghi vào metadata.

**Chuẩn bị:** file test 16 MiB (đủ 2 part × 8 MiB — `partSize` server sẽ trả 8 MiB theo `01_api_contract.md` §0.5).

```powershell
$f = "$TMP\test-16mib.bin"
$fs = [IO.File]::OpenWrite($f); $rand = New-Object byte[] (1MB)
(New-Object Random).NextBytes($rand)
1..16 | ForEach-Object { $fs.Write($rand, 0, $rand.Length) }; $fs.Close()
```

| # | Bước | Lệnh | Kết quả mong đợi |
|---|---|---|---|
| A1 | E1 initiate | `Invoke-RestMethod "$API/api/asset/create-new" -Method Post -Headers $H_OWNER -Body $e1Body` | HTTP **200**; `data.upload.sessionId` có giá trị; `uploadMode = "MULTIPART"`; `partSize = 8388608`; `partCount = 2`; `urls` có key `"1"`,`"2"`; **body không chứa chuỗi `uploadId`** |
| A2 | Cắt part + MD5 | `$parts = Split-IntoParts $f 8388608 "$TMP\parts"` | 2 part, part 1 = 8388608 byte, part 2 = 8388608 byte |
| A3 | PUT part 1,2 | `Put-Part $urls."1" $parts[0]` / `Put-Part $urls."2" $parts[1]` | Mỗi PUT: **`HTTP/1.1 200 OK`** + header `ETag` |
| A4 | E4 complete | `Invoke-RestMethod "$API/api/uploads/$sid/complete" -Method Post -Headers $H_OWNER -Body $completeBody` | HTTP **200**; `data.uploadStatus = "COMPLETED"`; `data.fileSize = 16777216`; `data.etag` dạng `<hex>-2`; `data.processingStatus` theo loại media |
| A5 | Đối chiếu storage | `mcx stat myminio/$BUCKET/$objectName` | `Size` = 16 MiB, khớp `data.fileSize` |
| A6 | Không còn multipart dở | `mcx ls --incomplete myminio/$BUCKET` | **trống** |

```powershell
# A1
$e1Body = @{ projectId=$PROJECT_ID; folderId=$FOLDER_ID; fileName="test-16mib.bin";
             mimeType="application/octet-stream"; fileSize=16777216; mediaType="OTHER" } | ConvertTo-Json
$e1 = Invoke-RestMethod "$API/api/asset/create-new" -Method Post -Headers $H_OWNER -Body $e1Body
$sid = $e1.data.upload.sessionId; $urls = $e1.data.upload.urls
$objectName = $e1.data.version.objectName
$e1.data.upload | ConvertTo-Json -Compress | Select-String "uploadId"    # -> KHÔNG có kết quả

# A3
$etags = @{}
foreach ($p in $parts) {
  $resp = Put-Part $urls."$($p.partNumber)" $p
  ($resp -split "`n") | Where-Object { $_ -match "^HTTP|^ETag" }    # -> HTTP/1.1 200 OK ; ETag: "..."
  $etags[$p.partNumber] = ([regex]::Match($resp, 'ETag:\s*"?([^"\r\n]+)"?')).Groups[1].Value
}

# A4
$completeBody = @{ parts = @($parts | ForEach-Object {
    @{ partNumber = $_.partNumber; etag = $etags[$_.partNumber]; md5 = $_.md5Hex } }) } | ConvertTo-Json -Depth 4
$e4 = Invoke-RestMethod "$API/api/uploads/$sid/complete" -Method Post -Headers $H_OWNER -Body $completeBody
$e4.data | Format-List
```

### 2.2 Kịch bản B — resume (bỏ part 2, GET E3, bù part, complete)

Mục tiêu: chứng minh REL-01 — `ListParts` là nguồn chân lý, client bù đúng part thiếu.

| # | Bước | Kết quả mong đợi |
|---|---|---|
| B1 | E1 initiate file 16 MiB mới | 200, `partCount = 2` |
| B2 | PUT **chỉ part 1** | `HTTP/1.1 200 OK` |
| B3 | `GET /api/uploads/{sessionId}` (E3) | 200; `status = "UPLOADING"`; `receivedParts` = **1 phần tử** `{partNumber:1, size:8388608, etag:...}`; `uploadedBytes = 8388608`; `expiresAt` **mới hơn** giá trị E1 trả (sliding TTL) |
| B4 | Tính part thiếu `[1..partCount] − receivedParts` | `[2]` |
| B5 | E2 xin URL cho part thiếu | 200; `urls` có đúng key `"2"`; `urlExpiresAt` = now + `upload.part-url-ttl`; `expiresAt` lại trượt tiếp |
| B6 | PUT part 2 | `HTTP/1.1 200 OK` |
| B7 | E4 complete | 200, `fileSize = 16777216` |
| B8 | E3 lần nữa (sau complete) | 200; `status = "COMPLETED"`; `receivedParts = []`; `resource` đầy đủ (chống double-commit — `01_api_contract.md` E3.4) |

```powershell
# B3
$e3 = Invoke-RestMethod "$API/api/uploads/$sid" -Method Get -Headers $H_OWNER
$e3.data.receivedParts        # -> 1 phần tử
$missing = 1..$e3.data.partCount | Where-Object { $_ -notin $e3.data.receivedParts.partNumber }
$missing                      # -> 2

# B5
$e2 = Invoke-RestMethod "$API/api/uploads/$sid/part-urls" -Method Post -Headers $H_OWNER `
      -Body (@{ partNumbers = @($missing) } | ConvertTo-Json)
$e2.data.urls.PSObject.Properties.Name        # -> 2
[datetime]$e2.data.expiresAt -gt [datetime]$e1.data.upload.expiresAt   # -> True (sliding TTL)
```

### 2.3 Kịch bản C — các nhánh lỗi

Bảng dưới là **hợp đồng phải đúng cả HTTP status lẫn `CommonResponse.code`** (mã lấy từ `01_api_contract.md` §9). Chỉ đúng sau khi `T-4.1` (`GlobalExceptionHandler`) đã xong.

| # | Kịch bản | Lệnh (rút gọn) | HTTP | `code` / ErrorCode |
|---|---|---|---|---|
| C1 | Thiếu JWT | E3 không header `Authorization` | **401** | `5205` `USER_NOT_AUTHENTICATED` |
| C2 | Session không tồn tại | `GET /api/uploads/khong-ton-tai` | **404** | `5501` `SESSION_NOT_FOUND` |
| C3 | **Sai owner** | E3/E4/E5 với `$H_OTHER` | **403** | `5104` `FILE_PERMISSION_ERROR` — và **MinIO không nhận request nào** (kiểm bằng log MinIO, xem §4.4) |
| C4 | E2 `partNumber = 0` | `{"partNumbers":[0]}` | **400** | `400` `BAD_REQUEST` |
| C5 | E2 `partNumber > partCount` | `{"partNumbers":[141]}` | **400** | `400` — message dạng `partNumber 141 out of range [1..2]` |
| C6 | E2 batch > 50 | `partNumbers` 51 phần tử | **400** | `400` — `partNumbers batch exceeds 50` |
| C7 | **Complete thiếu part** | PUT 1 part rồi E4 gửi 1 part | **400** | `5502` `UPLOAD_INCOMPLETE` — message **phải liệt kê** part thiếu, ví dụ `Missing parts: [2]` |
| C8 | Complete sai md5 | Sửa 1 ký tự trong `md5` hex | **400** | `5504` `CHECKSUM_MISMATCH` — message liệt kê part hỏng |
| C9 | Tổng size lệch | PUT part 2 ngắn hơn `partSize` rồi complete | **400** | `5503` `SIZE_MISMATCH` — `Expected 16777216 bytes, got ...` |
| C10 | E2 trên session `ABORTED` | E5 rồi E2 | **409** | `5505` `SESSION_INVALID_STATE` |
| C11 | E5 trên session `COMPLETED` | E4 rồi E5 | **409** | `5505` `SESSION_INVALID_STATE` |
| C12 | E1 vượt `max-file-size` | `fileSize = 53687091201` | **400** | `400` — kèm giới hạn; **không** document nào được insert |
| C13 | E1 vượt `max-sessions-per-user` (sau `T-7.6`) | tạo session thứ 21 | **429** | `5506` `SESSION_LIMIT_EXCEEDED`; `mc ls --incomplete` **không** phát sinh multipart mới |
| C14 | `Content-MD5` sai lúc PUT | PUT với MD5 base64 sai | **400** | body XML chứa `<Code>BadDigest</Code>` (MinIO trả, không qua filehandler) |

```powershell
function Invoke-Expect($uri, $method, $headers, $body) {
  try {
    $r = Invoke-WebRequest -Uri $uri -Method $method -Headers $headers -Body $body -SkipHttpErrorCheck
    $j = $r.Content | ConvertFrom-Json
    [pscustomobject]@{ status = $r.StatusCode; code = $j.code; message = $j.message }
  } catch { [pscustomobject]@{ status = "EXC"; code = ""; message = $_.Exception.Message } }
}

Invoke-Expect "$API/api/uploads/khong-ton-tai" "Get" $H_OWNER $null   # -> status 404, code 5501
Invoke-Expect "$API/api/uploads/$sid"          "Get" $H_OTHER $null   # -> status 403, code 5104
Invoke-Expect "$API/api/uploads/$sid/part-urls" "Post" $H_OWNER (@{partNumbers=@(0)} | ConvertTo-Json)  # -> 400
```

### 2.4 Kịch bản D — idempotency (REL-02)

| # | Bước | Kết quả mong đợi |
|---|---|---|
| D1 | E4 lần 1 | 200, ghi lại `assetId`, `fileId`, `etag`, `completedAt` |
| D2 | E4 lần 2 (cùng body) | **200**, **cùng** `assetId` + **cùng** `etag` + **cùng** `completedAt` |
| D3 | Không tác dụng phụ | Không có message Kafka thứ 2 (kiểm ở kafka-ui `:8090` hoặc log producer); `mc ls --incomplete` trống |
| D4 | E5 lần 1 / lần 2 trên session khác | Cả 2 lần **200**, `status = "ABORTED"`, **cùng** `abortedAt` |

```powershell
$r1 = Invoke-RestMethod "$API/api/uploads/$sid/complete" -Method Post -Headers $H_OWNER -Body $completeBody
$r2 = Invoke-RestMethod "$API/api/uploads/$sid/complete" -Method Post -Headers $H_OWNER -Body $completeBody
($r1.data.assetId -eq $r2.data.assetId) -and ($r1.data.etag -eq $r2.data.etag) -and ($r1.data.completedAt -eq $r2.data.completedAt)
# -> True
mcx ls --incomplete myminio/$BUCKET   # -> trống
```

### 2.5 Kịch bản E — download E6

| # | Kịch bản | HTTP | Kết quả |
|---|---|---|---|
| E-1 | Owner, file `COMPLETED` | **200** | `data.url` có `X-Amz-Signature`; body chứa **cả** `mimeType` **và** `contentType`; `fileSize` là số **nguyên** |
| E-2 | User khác, không quyền | **403** | `5104` `FILE_PERMISSION_ERROR` |
| E-3 | `objectName` không tồn tại | **404** | `5101` `FILE_NOT_FOUND` |
| E-4 | File đang `UPLOADING` | **409** | `5507` `FILE_NOT_READY` |
| E-5 | `objectName` rỗng | **400** | `5103` `FILE_OBJECT_NAME_CANNOT_BE_EMPTY` |
| E-6 | Tải thật bằng URL trả về | **200** | `curl -I <url>` → 200, `Content-Disposition: attachment`; dùng chính URL để `PUT` → **403** |
| E-7 | TTL đúng công thức | — | `X-Amz-Expires` trong URL == `clamp(fileSize/1_000_000, 900, 14400)` |

```powershell
$d = Invoke-RestMethod "$API/api/file-metadata/download" -Method Post -Headers $H_OWNER `
     -Body (@{ objectName = $objectName } | ConvertTo-Json)
$d.data.PSObject.Properties.Name       # -> url, fileSize, fileName, mimeType, contentType
$d.data.fileSize.GetType().Name        # -> Int64 (không phải Double)
curl.exe -s -o NUL -w "%{http_code}`n" -I $d.data.url        # -> 200
curl.exe -s -o NUL -w "%{http_code}`n" -X PUT --upload-file $parts[0].path $d.data.url   # -> 403
Invoke-Expect "$API/api/file-metadata/download" "Post" $H_OTHER (@{objectName=$objectName} | ConvertTo-Json)  # -> 403 / 5104
```

### 2.6 Kịch bản F — client v2 trên trình duyệt (WP5, `T-5.6`)

Chạy `npm run dev`, mở DevTools → Network, lọc `localhost:9000`.

| # | Quan sát | Tiêu chí PASS |
|---|---|---|
| F1 | Upload file ≥ 100 MiB | Mọi request `PUT` tới MinIO **có header `Content-MD5`** |
| F2 | Cột "Waterfall" | Số `PUT` chạy đồng thời **không vượt 6** |
| F3 | Cột "Size" | Mọi part == `partSize` server trả (part cuối được nhỏ hơn) |
| F4 | Payload các request tới `:5000` | Không request nào mang `objectName`/`uploadId` do client sinh; mọi control-plane call đi qua `/api/uploads/{sessionId}/...` |
| F5 | Resume | Ngắt mạng ~50% → reload tab → upload tiếp: **tổng bytes PUT lần 2 < kích thước file**; `mc stat` sau complete == size gốc |
| F6 | URL hết hạn | Hạ `upload.part-url-ttl` xuống `60s`, upload file lớn → client tự xin URL mới, **không** hiện lỗi cho người dùng. **Nhớ trả lại `900s`** |
| F7 | Console | Không dòng nào in presigned URL |
| F8 | Download | Blob tải về có đúng `contentType` (không còn `undefined` — vá R4) |

### 2.7 Kịch bản G — regression E7 (legacy, hợp đồng KHÔNG đổi)

Chạy **2 lần**: sau `T-3.6` (rewire sang SDK) và sau `T-4.11`.

| # | Endpoint | Tiêu chí PASS |
|---|---|---|
| G1 | `POST /api/file-metadata/upload-metadata` | HTTP status + tập tên field của `data` **giống hệt** baseline; `data.uploadId` và `data.partUrl` vẫn có |
| G2 | `POST /api/file-metadata/upload/complete` | Status + `data == "complete upload"` |
| G3 | `POST /api/file-metadata/upload/stop-upload` | Status + `data == "stopped upload"` |
| G4 | Log ứng dụng (sau `T-7.5`) | Mỗi lời gọi sinh **đúng 1** dòng `DEPRECATED endpoint called: ...` |
| G5 | Hành vi nội bộ (được phép đổi) | TTL part URL legacy đồng nhất `clamp(partCount × 60s, 1h, 6h)` — **không** phải tiêu chí hợp đồng, chỉ ghi nhận |

```powershell
Compare-Object `
  (Get-Content "$TMP\e7-baseline\upload-metadata.json" | ConvertFrom-Json).data.PSObject.Properties.Name `
  (Get-Content "$TMP\e7-after\upload-metadata.json"    | ConvertFrom-Json).data.PSObject.Properties.Name
# -> không có dòng nào (schema giống hệt)
```

### 2.8 Dọn dẹp sau smoke test

```powershell
# Chỉ xoá đúng object/session mình tạo — 00_guardrails §2.10
mcx rm myminio/$BUCKET/$objectName
mcx ls --incomplete myminio/$BUCKET                  # -> trống
docker exec filesharing-mongodb mongosh $MONGO --quiet --eval `
  "db.upload_sessions.deleteMany({ _id: { `$in: ['$sid'] } })"
Remove-Item -Recurse -Force $TMP\parts, $TMP\test-16mib.bin
```

---

## 3. Unit test cần viết

> **Điều kiện tiên quyết:** repo hiện **không có test suite** ở cả hai phía và `00_guardrails.md` §2.17 cấm tự dựng framework test mới; §2.4 cấm thêm package npm. Vì vậy mục này là **kế hoạch test đã đặc tả sẵn**, chỉ thực thi khi người dùng duyệt mở test suite. Khi chưa duyệt: mọi hành vi dưới đây được phủ bằng smoke test §2 và ghi kết quả thật vào báo cáo.
>
> Chỉ định **tên class + tên method + hành vi cần phủ** — không viết code test ở đây.

### 3.1 Backend — `filesharing-filehandler` (JUnit 5, chạy được với `spring-boot-starter-test` sẵn có nếu user duyệt)

**`UploadSessionPartSizeTest`** — công thức `partSize` (`01_api_contract.md` §0.5, PERF-02):

| Method | Hành vi phủ |
|---|---|
| `partSize_8MiBFile_returnsSingleMode()` | `declaredSize = 8388608` → `uploadMode = SINGLE`, `partSize = declaredSize`, `partCount = 1` |
| `partSize_8MiBPlusOne_returnsMultipart8MiB()` | `8388609` → `MULTIPART`, `partSize = 8388608`, `partCount = 2` (**biên dưới**) |
| `partSize_10MiB_returns8MiB()` | `10 MiB` → `8388608` |
| `partSize_50GiB_returns8MiB()` | `53687091200` → `8388608`, `partCount ≤ 10000` |
| `partSize_100GiB_returns16MiB()` | → `16777216` (**nấc 2**) |
| `partSize_200GiB_returns32MiB()` | → `33554432` (**nấc 3**) |
| `partSize_400GiB_returns64MiB()` | → `67108864` (**nấc 4**) |
| `partSize_neverExceeds10000Parts()` | Property test trên dải `1..640 GiB`: luôn `partCount ≤ 10000` |
| `partSize_roundsUpToStep_notInterpolated()` | Giá trị nằm giữa 2 nấc (ví dụ 120 GiB) → làm tròn **LÊN** nấc kế, không trả giá trị lạ |
| `create_sizeOverMaxFileSize_throwsBadRequest()` | `declaredSize > upload.max-file-size` → `FileBusinessException(BAD_REQUEST)`, **không** insert document |
| `create_sizeZeroOrNegative_throwsBadRequest()` | `0` và số âm |

**`UploadSessionTtlTest`** — TTL touch logic (`01_api_contract.md` §0.4, E2.4; `02_schema_config.md` §1.5):

| Method | Hành vi phủ |
|---|---|
| `touch_slidesExpiresAtByIdleTtl()` | `expiresAt` mới == `now + session-idle-ttl` |
| `touch_neverExceedsHardExpiresAt()` | Khi `now + idleTtl > hardExpiresAt` → `expiresAt == hardExpiresAt` (**không vượt trần cứng 7 ngày**) |
| `touch_movesInitiatedToUploading()` | `INITIATED → UPLOADING` sau E2/E3 thành công |
| `touch_doesNothingOnCompletedSession()` | `COMPLETED` → `expiresAt` không đổi |
| `touch_doesNothingOnAbortedSession()` | `ABORTED` → `expiresAt` không đổi |
| `get_expiredSession_throwsSessionNotFound()` | `expiresAt < now` → 404 `SESSION_NOT_FOUND` (chứ **không** phải 409) |
| `get_wrongOwner_throwsPermissionErrorBeforeStorageCall()` | Sai owner → `FILE_PERMISSION_ERROR`, verify bằng mock: `StorageService` **không** bị gọi lần nào |

**`UploadCompleteVerificationTest`** — các nhánh của E4 (`01_api_contract.md` E4.3, thứ tự bắt buộc):

| Method | Hành vi phủ |
|---|---|
| `complete_missingParts_throwsUploadIncompleteWithPartList()` | `ListParts` thiếu → `UPLOAD_INCOMPLETE`, message **chứa danh sách** part thiếu |
| `complete_sizeSumMismatch_throwsSizeMismatch()` | `Σ size != declaredSize` → `SIZE_MISMATCH` kèm 2 con số |
| `complete_missingMd5Entry_throwsChecksumMismatch()` | Part có trong `ListParts` nhưng thiếu `md5` → `CHECKSUM_MISMATCH` |
| `complete_etagMd5Mismatch_throwsChecksumMismatchWithPartList()` | ETag ≠ md5 khi `verify-etag-md5 = true` |
| `complete_verifyDisabled_skipsEtagCheck()` | `verify-etag-md5 = false` → bỏ qua so ETag, vẫn giữ check tổng size |
| `complete_abortedSession_throwsInvalidState()` | `ABORTED`/`EXPIRED` → 409 `SESSION_INVALID_STATE` |
| `complete_alreadyCompleted_returnsSameResourceWithoutSideEffect()` | Idempotent: trả `resource` cũ; mock `StorageService` và Kafka producer **không** bị gọi |
| `complete_concurrentRequests_onlyOneWins()` | 2 request song song: `findAndModify` có điều kiện → 1 thắng, 1 rơi nhánh idempotent |
| `complete_sideEffectOrder_kafkaLast()` | Verify thứ tự: `CompleteMultipartUpload` → `HeadObject` → Mongo → **Kafka cuối** |
| `complete_singleMode_usesHeadObjectNotListParts()` | `uploadMode = SINGLE` → không gọi `ListParts`/`CompleteMultipartUpload` |
| `complete_persistsPartMd5BeforeVerify()` | `session.partMd5` được ghi kể cả khi verify fail |

**`UploadSessionLimitTest`** (sau `T-7.6`): `create_whenOpenSessionsAtLimit_throws429()` — và **không** gọi `CreateMultipartUpload` khi bị chặn.

**`GlobalExceptionHandlerTest`** (core, sau `T-4.1`): mỗi `ErrorCode` map đúng `HttpStatus` của chính nó; `INTERNAL_SERVER_ERROR` vẫn 500.

### 3.2 Frontend — hill-climbing concurrency

> **Chưa chạy được:** client không có test runner và `00_guardrails.md` §2.4 **cấm thêm package npm** (vitest/jest đều là package mới). Hai đường hợp lệ: (a) người dùng duyệt thêm devDependency test runner; (b) phủ bằng quan sát DevTools §2.6 F2. Mặc định phase này: **(b)**.

**`AdaptiveBandwidthHillClimbTest`** — state transition của thuật toán (`../03_detailed_design.md` §WP5 mục 1):

| Method | Hành vi phủ |
|---|---|
| `probe_increasesThreadsWhenBelowMax()` | `threads < 6` → probe `threads++` |
| `plateau_backsOffOneThreadAndHolds()` | Sau K part, `aggregate` tăng **< 10%** → lùi `threads-1`, **không** probe lại ngay |
| `gain_aboveThreshold_keepsClimbing()` | Tăng ≥ 10% → giữ mức mới và tiếp tục leo |
| `neverExceedsMaxThreads6()` | Trần cứng 6 kể cả khi throughput vẫn tăng |
| `panicMode_onConsecutiveFailures_decrementsThreadsFloor1()` | Lỗi liên tiếp → `threads--`, sàn 1; **không** đụng chunk size |
| `chunkSizeNeverChanges()` | Sau mọi transition, `partSize` == giá trị server công bố (chứng minh đã bỏ adaptive chunk size) |
| `ewmaAlphaStaysZeroPointThree()` | Giữ EWMA alpha 0.3 của thuật toán cũ |

**`PartUrlManagerTest`**: `prefetchesWhenPoolBelowThreshold()`; `on403_refetchesUrlForSamePartAndRetries()`; `on403_doesNotConsumeNetworkRetryBudget()`; `onBadDigest_recomputesMd5AndRetriesSamePart()`.

---

## 4. Kiểm chứng hạ tầng

### 4.1 MinIO — lifecycle rule + service account

```powershell
mcx ilm rule ls myminio/$BUCKET
# -> 1 rule: ID=abort-incomplete-multipart-7d, Status=Enabled,
#    AbortIncompleteMultipartUpload = 7 days

mcx admin user svcacct ls myminio $MINIO_USER
# -> có svcuploadfsharing và svcdownloadfsharing

mcx admin user svcacct info myminio svcuploadfsharing
# -> policy gắn kèm chứa s3:PutObject, s3:AbortMultipartUpload, s3:ListMultipartUploadParts,
#    s3:GetObject (StatAndReconcile), s3:ListBucketMultipartUploads (ListIncompleteUploads)
mcx admin user svcacct info myminio svcdownloadfsharing
# -> policy CHỈ có s3:GetObject
```

Kiểm chứng **scope âm** (bắt buộc — `00_guardrails.md` §6 "DoD WP1"): xem `03_tasks.md` `T-1.5` cho lệnh đầy đủ. Tiêu chí: `svc-upload` `ls` → `AccessDenied`, `cp` → OK; `svc-download` `cp` → `AccessDenied`, `cat` → OK.

### 4.2 MongoDB — index của `upload_sessions`

```powershell
docker exec filesharing-mongodb mongosh $MONGO --quiet --eval "db.upload_sessions.getIndexes()"
```

Tiêu chí PASS (đối chiếu `02_schema_config.md` §2.1):

| Index | Key | Tuỳ chọn bắt buộc |
|---|---|---|
| `idx_upload_sessions_ttl` | `{ expiresAt: 1 }` | **`expireAfterSeconds: 172800`** (không phải `0`) |
| `idx_upload_sessions_owner_status` | `{ ownerId: 1, status: 1 }` | — |
| `idx_upload_sessions_status_expires` | `{ status: 1, expiresAt: 1 }` | — |
| `idx_upload_sessions_upload_id` | `{ uploadId: 1 }` | `sparse: true` |

```powershell
# Query của GC job phải dùng index, không COLLSCAN
docker exec filesharing-mongodb mongosh $MONGO --quiet --eval `
  "db.upload_sessions.find({status:{`$in:['INITIATED','UPLOADING']},expiresAt:{`$lt:new Date()}}).explain('queryPlanner').queryPlanner.winningPlan"
# -> stage IXSCAN, indexName: idx_upload_sessions_status_expires

# Không tạo collection ngoài dự tính
docker exec filesharing-mongodb mongosh $MONGO --quiet --eval "db.getCollectionNames()"
# -> có upload_sessions; KHÔNG có collection lạ khác
```

### 4.3 Job nền (WP6)

```powershell
# GC: ép 1 session hết hạn
docker exec filesharing-mongodb mongosh $MONGO --quiet --eval `
  "db.upload_sessions.updateOne({_id:'$sid'},{`$set:{expiresAt:new Date(Date.now()-3600000)}})"
# chờ ≤ 1 chu kỳ (15 phút, hoặc hạ chu kỳ khi test)
docker exec filesharing-mongodb mongosh $MONGO --quiet --eval "db.upload_sessions.findOne({_id:'$sid'}).status"   # -> EXPIRED
mcx ls --incomplete myminio/$BUCKET        # -> không còn multipart của session đó

# Reconcile: dữ liệu cũ KHÔNG bị đụng
docker exec filesharing-mongodb mongosh $MONGO --quiet --eval "db.metadata.countDocuments({})"   # trước
# ... chạy job ...
docker exec filesharing-mongodb mongosh $MONGO --quiet --eval "db.metadata.countDocuments({})"   # sau -> BẰNG NHAU
```

### 4.4 Log KHÔNG chứa presigned URL (SEC-07)

```powershell
# 1) Quét mã nguồn
rg -n "log\.(info|debug|warn|error).*(presigned|Url|url)" `
   "$ROOT\server\filesharing-filehandler\src\main\java" --glob "!**/target/**"
# -> 0 kết quả (log chỉ được chứa sessionId / partNumber / objectName / status)

rg -n "console\.log" "$ROOT\client\src\service" "$ROOT\client\src\api\fileApi"
# -> không dòng nào in URL

# 2) Quét log RUNTIME của filehandler (chuỗi chữ ký là dấu hiệu chắc chắn)
Select-String -Path "$ROOT\server\filesharing-filehandler\logs\*.log" -Pattern "X-Amz-Signature|X-Amz-Credential"
# -> 0 kết quả  (nếu app log ra stdout: chuyển hướng `... spring-boot:run *> $TMP\app.log` rồi quét file đó)

# 3) Quét log MinIO — dùng để chứng minh nhánh 403 KHÔNG chạm storage (C3)
docker logs minio-server --since 5m | Select-String "PUT|POST" | Select-Object -Last 20
```

### 4.5 Dependency & module

```powershell
mvn -f "$ROOT\server\pom.xml" dependency:tree -pl filesharing-filehandler | Select-String "software.amazon.awssdk"
# -> chỉ artifact s3 (+ transitive), KHÔNG có s3-transfer-manager / netty-nio-client khai báo trực tiếp

Select-String -Path "$ROOT\server\pom.xml" -Pattern "<module>"     # -> đúng 6 dòng
git -C $ROOT status --short                                        # -> không file lạ ngoài phạm vi WP đang làm
```

---

## 5. Checklist DoD toàn phase

> Nguồn tiêu chí: `00_guardrails.md` §6 (DoD WP0 → WP7). Bảng dưới **không chép lại** tiêu chí, chỉ ánh xạ sang mục chạy trong file này và ghi trạng thái. Đọc 2 chỗ đã lỗi thời của §6 theo delta `03_tasks.md` §0.3: **D1** (DoD WP2 "4 mã" → **7 mã**) và **D11** (DoD WP3 "`MinIoServiceImpl` không bị sửa" → được sửa đúng phạm vi `T-3.6`).

| WP | Checklist gốc | Chạy ở mục nào | Task chốt | Trạng thái |
|---|---|---|---|---|
| WP0 | `00_guardrails.md` §6 "DoD WP0" (4 mục) | §4.5 | T-0.3 | ☑ (2026-09-05) — `filesharing-uploadservice` đã gỡ khỏi đĩa + `pom.xml`; `mvn clean install` toàn reactor `BUILD SUCCESS`, Reactor Summary đúng 6 module (core, filehandler, notification, videocodec, imagecodec, imagerawproccess); 0 tham chiếu `uploadservice` ngoài `docs/`/`.claude/`; `.claude/rules/backend-uploadservice.md` đã xoá |
| WP1 | §6 "DoD WP1" (5 mục) | §1.4, §4.1 | T-1.5 | ☑ (2026-09-05) — xem ghi chú sai lệch bên dưới |
| WP2 | §6 "DoD WP2" (5 mục — đọc "7 mã" theo D1) | §4.2, §2.1 (bảng partSize), §2.3 C12 | T-2.6 | ☑ (2026-09-05) — xem §5.4 |
| WP3 | §6 "DoD WP3" (5 mục — đọc mục cuối theo D11) | §2.1, §4.5, §2.7 (G1–G3) | T-3.6 | ☑ (2026-09-05) — xem §5.5 |
| WP4 | §6 "DoD WP4" (8 mục) | §2.1–§2.5, §2.7 | T-4.11 | ☑ (2026-09-05) — xem §5.6 |
| WP5 | §6 "DoD WP5" (6 mục) | §2.6, §1.6 | T-5.6 | ☐ |
| WP6 | §6 "DoD WP6" (4 mục) | §4.3 | T-6.4 | ☐ |
| WP7 | §6 "DoD WP7" (6 mục) | §4.4, §4.5, §2.3 C13, §2.7 G4 | T-7.8 | ☐ |

### 5.1 Cổng chặn (không WP nào được coi là xong nếu một trong các mục này đỏ)

| # | Cổng | Kiểm ở | Nếu đỏ |
|---|---|---|---|
| K1 | MinIO trả `BadDigest` khi `Content-MD5` lệch | §2.3 C14 (`T-3.2`) | **STOP** — đổi hợp đồng E2 (ký kèm MD5 lúc presign), hỏi người dùng |
| K2 | `mc ilm import` khả dụng trên image đang dùng | §4.1 (`T-1.1`) | **STOP** — quyết cú pháp thay thế trước khi viết script |
| K3 | Lỗi nghiệp vụ trả đúng HTTP status (không còn 500 cứng) | §2.3 (`T-4.1`) | Toàn bộ bảng status của `01_api_contract.md` vô hiệu → không mở WP5 |
| K4 | Hợp đồng E7 không đổi sau rewire | §2.7 G1–G3 (`T-3.6`) | Hoàn tác `T-3.6`, báo người dùng |
| K5 | Không log presigned URL ở bất kỳ tầng nào | §4.4 | Vi phạm SEC-07 — chặn nghiệm thu |
| K6 | `T-4.8` (E1) và WP5 ra **cùng release** | `03_tasks.md` §9 | Client cũ vỡ ngay khi deploy — không được cắt release ở giữa |

### 5.2 Ghi kết quả

Khi báo cáo mỗi WP, dán vào phần tương ứng của báo cáo: **lệnh đã chạy + output thật** (rút gọn nhưng không sửa), đặc biệt cho: bảng `partSize` (§2.1), `getIndexes()` (§4.2), `ilm rule ls` (§4.1), 2 status của kịch bản `Content-MD5` (§2.3 C14), và diff schema E7 (§2.7).

### 5.3 Kết quả thật đã ghi nhận — WP1 (2026-09-05)

**Sai lệch tài liệu phát sinh (không có trong §0.3 của `03_tasks.md` tại thời điểm viết task, đã được người dùng duyệt trực tiếp khi thực thi):** bước tạo ILM lifecycle rule "abort incomplete multipart sau 7 ngày" theo `02_schema_config.md` §4.2 **không thực thi được** — MinIO server từ chối mọi rule chỉ chứa `AbortIncompleteMultipartUpload` (không kèm `Expiration`) với `400 "XML you provided was not well-formed"`; ghép chung với `Expiration` thì field bị âm thầm loại bỏ khi export lại. Đã kiểm chứng đây là hành vi cố định của MinIO (không phải lỗi cấu hình) bằng cách thử lại trên 2 image mới hơn trong môi trường cách ly (`RELEASE.2025-07-23T15-54-02Z`, `RELEASE.2025-09-07T16-13-09Z`) — cả hai lỗi y hệt; khớp GitHub issue [minio/minio#19115](https://github.com/minio/minio/issues/19115) (đóng với nhãn "working as intended").

**Quyết định thay thế đã áp dụng:** dùng `mc admin config set myminio api stale_uploads_expiry=168h stale_uploads_cleanup_interval=6h` (cơ chế nội bộ MinIO, độc lập S3 Lifecycle API) làm tầng 1 của GC 3 tầng (REL-03) thay cho ILM rule. `init-upload-hardening.sh` bước 4/5 đã cập nhật theo cơ chế này. **Hệ quả cho nghiệm thu về sau:** câu kiểm ở §4.1 (`mc ilm rule ls myminio/file-sharing`) và DoD WP1 dòng 2 (`00_guardrails.md` §6) không còn áp dụng — thay bằng `mc admin config get myminio api` phải thấy `stale_uploads_expiry=168h`.

**Output thật đã chạy:**

```
mc admin config get myminio api
→ ... stale_uploads_cleanup_interval=6h stale_uploads_expiry=168h ...

mc admin user svcacct info myminio svcuploadfsharing --json
→ Statement: MultipartWrite(PutObject,AbortMultipartUpload,ListMultipartUploadParts)
            + StatAndReconcile(GetObject) + ListIncompleteUploads(ListBucketMultipartUploads)

mc admin user svcacct info myminio svcdownloadfsharing --json
→ Statement: ReadOnly(GetObject) — chỉ đúng 1 quyền
```

| Kịch bản scope âm (T-1.5) | Kết quả thật |
|---|---|
| svc-upload `ls` bucket | `AccessDenied` ✅ |
| svc-upload `cp` object nhỏ | thành công ✅ |
| svc-download `cp` | `Insufficient permissions` (AccessDenied) ✅ |
| svc-download `cat` object có sẵn | ra đúng nội dung ✅ |

Filehandler khởi động sạch sau khi thêm 4 key vào `application.yml`/`​.env`: `Started FileSharingApplication in 5.146 seconds`, không có `Failed to bind properties under 'minio'`.

### 5.4 Kết quả thật đã ghi nhận — WP2 (2026-09-05)

**Đã tạo/sửa đúng whitelist §3 WP2 (+ delta D1, D3, D4, D5 của `03_tasks.md` §0.3):**
- `ErrorCode.java` (core): thêm đúng 7 mã dải `55xx` (`SESSION_NOT_FOUND`=5501, `UPLOAD_INCOMPLETE`=5502, `SIZE_MISMATCH`=5503, `CHECKSUM_MISMATCH`=5504, `SESSION_INVALID_STATE`=5505, `SESSION_LIMIT_EXCEEDED`=5506, `FILE_NOT_READY`=5507).
- `UploadSessionStatus.java`, `UploadMode.java` (core, mới).
- `UploadSessionEntity.java` (core, theo delta D3 — không đặt ở filehandler như whitelist gốc ghi nhầm), đúng 16 field, TTL `expireAfterSeconds=172800`.
- `UploadSessionRepo.java` (filehandler, mới) — `extends MongoRepository<UploadSessionEntity, String>`, chưa cần query method (để dành T-6.2/T-7.6).
- `UploadSessionService.java` + `UploadSessionServiceImpl.java` (filehandler, mới) — `create/get/touch/markCompleted/markAborted`, công thức `partSize`, ownership check trước mọi thao tác, ném `FileBusinessException` (không `RuntimeException`).
- `MongoIndexBootstrapConfig.java`: thêm `applyUploadSessionsIndexes()` (đúng delta D5, không tạo file initializer riêng, không bật `auto-index-creation`).
- `application.yml`: thêm block `upload:` 6 key (đúng delta D4, không tạo `UploadProperties.java`).

**Output thật đã chạy:**

```
mvn -f server/pom.xml install -pl filesharing-core -DskipTests      → BUILD SUCCESS
mvn -f server/pom.xml install -pl filesharing-filehandler -DskipTests → BUILD SUCCESS

rg -n "550[1-7]" .../exceptions/ErrorCode.java
→ đúng 7 dòng (5501..5507)

spring-boot:run -pl filesharing-filehandler
→ "Started FileSharingApplication in 4.73 seconds ..."
→ "Mongo indexes bootstrap completed."

db.upload_sessions.getIndexes()
→ [
    { key: { _id: 1 }, name: '_id_' },
    { key: { expiresAt: 1 }, name: 'idx_upload_sessions_ttl', expireAfterSeconds: 172800 },
    { key: { ownerId: 1, status: 1 }, name: 'idx_upload_sessions_owner_status' },
    { key: { status: 1, expiresAt: 1 }, name: 'idx_upload_sessions_status_expires' },
    { key: { uploadId: 1 }, name: 'idx_upload_sessions_upload_id', sparse: true }
  ]

db.upload_sessions.countDocuments({})   → 0
```

**Bảng `partSize`** (kiểm bằng `jshell` gọi trực tiếp `UploadSessionServiceImpl` đã compile, dùng `UploadSessionRepo` giả qua `Proxy` — không đụng Mongo/MinIO thật; `max-file-size` được set lớn tạm thời qua reflection chỉ để tách công thức khỏi guard size, không đổi code):

| declaredSize | partSize | partCount |
|---|---|---|
| 8 MiB (biên) | 8 MiB | 1 (`uploadId=null` → `SINGLE`) |
| 8 MiB + 1 | 8 MiB | 2 (`MULTIPART`) |
| 10 MiB | 8 MiB | 2 |
| 50 GiB | 8 MiB | 6400 |
| 100 GiB | 16 MiB | 6400 |
| 200 GiB | 32 MiB | 6400 |
| 400 GiB | 64 MiB | 6400 |

Khớp 100% công thức `01_api_contract.md` §0.5. `declaredSize <= 0` và `declaredSize > upload.max-file-size` (mặc định 50 GiB) đều bị `FileBusinessException(BAD_REQUEST)` chặn trước khi gọi `repo.save(...)` — xác nhận bằng `countDocuments({}) == 0` ở trên.

**Ghi chú kỹ thuật (không phải lỗi, không cần dừng):** vì `partSize` bị chặn trần 64 MiB, thuộc tính "`partCount ≤ 10000`" chỉ đúng khi `declaredSize` nằm trong `upload.max-file-size` mặc định (50 GiB, tối đa 6400 part quan sát được). Nếu sau này tăng `upload.max-file-size` vượt ~625 GiB thì `partCount` có thể vượt 10000 — đây là thuộc tính vốn có của đúng công thức đã chốt trong `01_api_contract.md` §0.5, không phải sai lệch cần sửa ở WP2.

### 5.5 Kết quả thật đã ghi nhận — WP3 (2026-09-05)

**Đã tạo/sửa đúng whitelist §3 WP3 (+ delta D6, D7, D11, D12 của `03_tasks.md` §0.3):**
- `server/pom.xml`: thêm property `<aws.sdk.version>2.31.78</aws.sdk.version>` + BOM `software.amazon.awssdk:bom` trong `dependencyManagement` (đúng delta D7 — property tên `aws.sdk.version`, không phải `awssdk.version`).
- `server/filesharing-filehandler/pom.xml`: thêm đúng 1 `<dependency>` `software.amazon.awssdk:s3` (không ghi version, lấy từ BOM).
- `S3Config.java` (mới, đúng delta D6 — tên lớp `S3Config` chứ không phải `S3StorageConfig`): 3 bean `s3Client`, `uploadPresigner` (`@Qualifier("uploadPresigner")`), `downloadPresigner` (`@Qualifier("downloadPresigner")`); không sửa `filesharing-core/.../MinIOConfig.java`.
- `StorageService.java` (mới) + `S3StorageServiceImpl.java` (mới): đúng 7 thao tác `createMultipartUpload / presignUploadPart / listParts / completeMultipartUpload / abortMultipartUpload / headObject / presignGetObject`; không set `contentMD5(...)` lúc presign; lỗi SDK bọc thành `FileBusinessException(FILE_ERROR)`, không `RuntimeException`; log tối đa `objectName`/`partNumber`, không log URL.
- `MinIoServiceImpl.java` (sửa, đúng phạm vi `T-3.6`): 4 method multipart (`initiateMultipartUpload`, `getPresignedUrlForPart`, `completeMultipartUpload`, `abortMultipartUpload`) rewire thành adapter gọi `StorageService` (create/complete/abort) + bean `uploadPresigner` dùng chung (presign part với TTL đồng nhất `clamp(partCount × 60s, 1h, 6h)` — thay công thức `calculateExpireTime(partNumber)` cũ ở đường này). Xoá `extractUploadIdFromXml`, `buildCompleteMultipartUploadXml`, field `OkHttpClient httpClient`. **Không thêm dependency nào khác ngoài `software.amazon.awssdk:s3`**; `io.minio:minio` giữ nguyên trong pom (còn dùng cho HLS/uploadSmallFile/deleteFile/download cũ).

**Sai lệch phát sinh khi thực thi, đã hỏi và được người dùng chốt (2026-09-05):** `calculateExpireTime(int)` là 1 trong 4 symbol bị liệt kê để xoá ở `T-3.6`, nhưng khi rà lại thấy nó **vẫn còn 1 caller ngoài phạm vi rewire**: `getPresignedUrlForPart` cũ dùng số. Xoá helper cũ theo đúng danh sách khớp hợp đồng E7. `getPresignedDownloadUrl(DownloadFileRequestDto, Double)` — method này thuộc luồng download cũ, theo `02_schema_config.md` §6.2 + task `T-7.4` chỉ đổi kiểu `Double→long` ở WP7, **chưa** bị thay thế ở WP3/WP4. Xoá `calculateExpireTime` ngay sẽ làm vỡ `getPresignedDownloadUrl`. Theo đúng `00_guardrails.md` §4 ("Nếu còn caller ngoài E7 → STOP, báo người dùng"), đã dừng và hỏi — **người dùng chọn: giữ lại `calculateExpireTime`**, chỉ ngừng gọi nó từ `getPresignedUrlForPart` (đường multipart mới dùng `uploadPresigner` + TTL clamp). `getPresignedDownloadUrl` giữ nguyên hành vi, sẽ được dọn ở WP4/WP7 khi luồng download rewire.

**Output thật đã chạy:**

```
mvn -f server/pom.xml clean install -DskipTests   → BUILD SUCCESS, 7 module
  (filesharing, -core, -filehandler, -notification, -videocodec, -imagecodec, -imagerawproccess)

mvn -f server/pom.xml dependency:tree -pl filesharing-filehandler | grep amazon
→ software.amazon.awssdk:s3:jar:2.31.78:compile (+ transitive: aws-xml-protocol, sdk-core, auth,
   regions, apache-client (runtime), netty-nio-client (runtime) — TRANSITIVE của artifact s3,
   KHÔNG khai trực tiếp — đúng tiêu chí "chỉ s3 được khai trực tiếp")

git diff --name-only -- server
→ server/filesharing-filehandler/pom.xml
  server/filesharing-filehandler/src/main/java/.../services/impl/MinIoServiceImpl.java
  server/pom.xml
git status --short -- server (thêm phần chưa track)
→ ?? .../configurations/S3Config.java
  ?? .../services/StorageService.java
  ?? .../services/impl/S3StorageServiceImpl.java
```

**Cổng K1 (T-3.2 — bắt buộc trước khi tin cậy hợp đồng E2 SEC-06):** dùng `S3Client`/`S3Presigner` (svc-upload) tạo multipart thật trên bucket `file-sharing`, presign 1 part, PUT bằng `curl.exe`:

| Kịch bản | Kết quả thật |
|---|---|
| `Content-MD5` đúng (base64 MD5 nhị phân của part) | `HTTP/1.1 200 OK` + `ETag` |
| `Content-MD5` sai cố ý | `HTTP/1.1 400 Bad Request` + `<Code>BadDigest</Code>` |

→ **MinIO CÓ validate `Content-MD5`** trên presigned PUT dù không nằm trong `SignedHeaders` lúc presign (đúng thiết kế `02_schema_config.md` §5.2 lưu ý 1). **Không cần đổi hợp đồng E2.** Multipart test đã abort, không rác lại.

**Smoke end-to-end tầng storage (T-3.5)** — 2 part thật 5 MiB mỗi part, object `smoke-storage.bin`:

```
listParts   → part=1 size=5242880 etag="80d16d4296cede6a48c0a6a467b2ea2c"
              part=2 size=5242880 etag="f54e80c026763c51009dd3ba98438c9a"
complete    → etag="94d114baebd7c3184332942b6fa6d179-2"
head        → contentLength=10485760 etag="94d114baebd7c3184332942b6fa6d179-2" contentType=binary/octet-stream
mc stat     → Size: 10 MiB, ETag: 94d114baebd7c3184332942b6fa6d179-2   (khớp headObject)
```

Presign GET (`downloadPresigner`): GET thật → `200`, tải đủ 10485760 byte đúng nội dung; PUT bằng cùng URL → `403 AccessDenied`. **Ghi chú kỹ thuật:** `curl -I` (HEAD) trên URL ký cho GET trả `403` — đây là hành vi SigV4 đúng thiết kế (chữ ký gắn với đúng HTTP method lúc presign, HEAD ≠ GET), không phải lỗi; đã xác nhận lại bằng GET thật (200). Dọn: xoá object test, `mc ls --incomplete` trống.

**Regression hợp đồng E7 (T-3.6, `00_guardrails.md` §6 DoD WP3 mục cuối + `04_verification.md` §2.7 G1–G3):** tạo 1 user test qua `/api/auth/register` + `/api/auth/login` lấy JWT thật, gọi tuần tự cả 3 endpoint legacy **trước** (baseline, code cũ) và **sau** khi rewire (code mới), có PUT part thật lên MinIO ở giữa:

| Endpoint | Baseline (trước rewire) | Sau rewire | Khớp? |
|---|---|---|---|
| `POST /api/file-metadata/upload-metadata` | `200`, `data: {uploadId, partUrl}` | `200`, `data: {uploadId, partUrl}` (URL ký bằng `svc-upload`/SDK v2, `X-Amz-Expires=3600` = đúng `clamp(1×60s,1h,6h)`) | ✅ tên field giống hệt |
| `POST /api/file-metadata/upload/complete` | `200`, `data: "complete upload"` | `200`, `data: "complete upload"` | ✅ byte-for-byte giống hệt |
| `POST /api/file-metadata/upload/stop-upload` | `500`, `"Type definition error: [simple type, class ...AbortUploadRequestDto]"` | `500`, message giống hệt | ✅ tái hiện đúng lỗi **có sẵn từ trước** (không do WP3 gây ra) |

Lỗi `500` của `stop-upload` là bug tồn tại sẵn trong `AbortUploadRequestDto` (`@Builder` không có `@NoArgsConstructor` → Jackson không dựng được object) — **ngoài phạm vi whitelist WP3** (file không nằm trong danh sách WP3 §3), không sửa; hành vi giống hệt trước/sau rewire nên không phải regression do `T-3.6`.

Dọn dẹp sau test: abort 3 multipart mồ côi (2 từ `stop-upload` lỗi + 1 từ lần gọi `upload-metadata` thất bại do `mimeType` không hỗ trợ lúc dò contract), xoá 2 object test đã complete, xoá 4 document `metadata` + 1 document `user` test — `mc ls --incomplete myminio/file-sharing` trống sau cùng.

**Kết luận WP3:** cả 5 mục DoD gốc (đọc mục cuối theo delta D11) đều xanh; cổng K1 xanh; cổng K4 (hợp đồng E7 không đổi sau rewire) xanh.

### 5.6 Kết quả thật đã ghi nhận — WP4 (2026-09-05)

**Đã tạo/sửa đúng whitelist §3 WP4 (T-4.1 → T-4.11 của `03_tasks.md`):**
- `GlobalExceptionHandler.java` (core, T-4.1): đổi đúng dòng `handleBusinessException` từ `.status(ErrorCode.INTERNAL_SERVER_ERROR.getHttpStatus())` sang `.status(errorCode.getHttpStatus())`. Không đụng handler Mongo/`MethodArgumentNotValidException`/handler chung.
- `entities/dtos/upload/*.java` (9 DTO mới, T-4.3 + T-4.4): `UploadSessionInitResponseDto`, `PartUrlBatchRequestDto`, `PartUrlBatchResponseDto`, `UploadSessionStatusResponseDto`, `ReceivedPartDto`, `CompleteUploadSessionRequestDto`, `CompletedPartDto`, `UploadResourceResponseDto`, `AbortUploadSessionResponseDto` — tên field khớp 100% `01_api_contract.md` §8. Không gắn Bean Validation annotation trên các DTO này (lý do: `MethodArgumentNotValidException` handler trong `GlobalExceptionHandler` vẫn hardcode 500 — nằm ngoài phạm vi cho phép sửa của T-4.1 — nên toàn bộ validate `partNumbers`/`parts` chuyển vào `UploadSessionServiceImpl`, ném `FileBusinessException(BAD_REQUEST)` để đi đúng đường handler đã sửa).
- `UploadSessionController.java` (mới, T-4.5/T-4.6/T-4.7): `@RequestMapping("api/uploads")`, 4 endpoint E2–E5, thin — chỉ delegate.
- `UploadSessionService.java` + `UploadSessionServiceImpl.java` (mở rộng từ WP2): thêm `buildInitResponse` (E1), `issuePartUrls` (E2), `getStatus` (E3), `complete` (E4, đúng 12 nhánh + idempotent bằng `findAndModify` atomic), `abort` (E5). Constructor chuyển từ `@RequiredArgsConstructor` sang tường minh để gắn `@Lazy` trên `MetadataService` (xem mục "Sự cố phát sinh" bên dưới).
- `AssetController.java`: không đổi (URL/chữ ký `createAsset` giữ nguyên).
- `AssetService.java`: không đổi (chữ ký không cần đổi vì `AssetCreateResponseDto` giữ nguyên tên class).
- `AssetServiceImpl.java` (T-4.8): `createAsset` + `createNewVersion` không còn gọi `minIoService.initiateMultipartUpload`; thay bằng helper `initiateUploadSession(...)` → `StorageService.createMultipartUpload` (bỏ qua khi `SINGLE`) → `UploadSessionService.create` → `UploadSessionService.buildInitResponse`. Thêm check `fileSize > upload.max-file-size` ở `validateCreateAssetRequest`/`validateCreateVersionRequest` (trước khi tạo Asset/Metadata, không phải chỉ ở tầng session). `buildMetadataVersion` convert `Long` (request) → `Double` (entity, chưa đổi ở WP4).
- `AssetCreateRequestDto.java`: `fileSize` `Double` → `Long`.
- `AssetCreateResponseDto.java`: field `upload` đổi kiểu `InitiateUploadResponseDto` → `UploadSessionInitResponseDto`; `asset`/`version` giữ nguyên kiểu entity (delta D13).
- `FileMetadataController.java`: chỉ method `/download` — bỏ toàn bộ logic cũ (`minIoService.getPresignedDownloadUrl` + try/catch `RuntimeException`), thay bằng `metadataService.getDownloadUrl(input)`. 6 endpoint khác (`/upload-metadata`, `/upload/complete`, `/upload/stop-upload`, `/direct-upload`, `/process-encode`, `/delete/{fileId}`, `/move-to-trash/{fileId}`, `/restore-file/{fileId}`, `/get-file-by-token/{token}`) **không đụng** — không gắn `@Deprecated` (đúng T-7.5, ngoài phạm vi WP4 theo `03_tasks.md`, dù dòng ghi chú whitelist ở `00_guardrails.md` §3 WP4 có nhắc tới; ưu tiên task breakdown chi tiết hơn).
- `DownloadFileResponseDto.java`: thêm `contentType`; `fileSize` `Double` → `Long`.
- `MetadataService.java` + `MetadataServiceImpl.java`: thêm `markUploadCompleted` (E4, set `COMPLETED` + `fileSize` thật + `processingStatus`, không Kafka), `publishProcessingJob` (tách riêng để Kafka luôn là bước cuối), `markUploadFailed` (E5), `getDownloadUrl` (E6 — tra metadata → kiểm quyền → kiểm `COMPLETED` → presign, đúng thứ tự E6.4). Kiểm quyền E6 tái dùng nguyên mẫu `ensureAssetPermission`/`ensureProjectPermission`/`ensureFolderPermission`/`isAdmin` đã có ở `AssetServiceImpl`/`ReviewSessionServiceImpl` (copy đúng pattern, không tạo permission service mới — `00_guardrails.md` §2.9), yêu cầu `GrantedProjectPermission.READ` (đúng chữ trong bảng lỗi E6.3, không phải `DOWNLOAD`). Thêm dependency `AssetRepo`, `ProjectRepo`, `FolderRepo`, `StorageService`.
- `client/src/api/api/**`: chỉ qua `npm run gen-api` (T-4.10).

**Sự cố phát sinh khi thực thi (đã tự xử lý, không đổi hợp đồng, không chạm file ngoài whitelist):**

1. **Circular bean dependency khi khởi động app**: `AssetServiceImpl → UploadSessionService → MetadataService → ProcessingService → AssetServiceImpl` (cạnh `ProcessingServiceImpl → AssetServiceImpl` đã có sẵn từ trước WP4). Sửa bằng `@Lazy` trên tham số `MetadataService` của constructor tường minh trong `UploadSessionServiceImpl` (đúng tiền lệ constructor tường minh đã dùng ở `MinIoServiceImpl`/`S3StorageServiceImpl` cho `@Qualifier`) — không đụng `ProcessingServiceImpl` (ngoài whitelist WP4).
2. **SEC-03 tự phát hiện và tự sửa**: bản nháp đầu của `initiateUploadSession(...)` có gọi `version.setUploadId(uploadId)` rồi `metadataRepo.save(version)` "cho nhất quán" — khiến `data.version.uploadId` (field cũ của `MetadataEntity`, vẫn còn trong `AssetCreateResponseDto.version` theo delta D13) lộ nguyên `uploadId` thật của S3 ra response E1, vi phạm SEC-03. Phát hiện qua chính smoke test A1 (`Select-String "uploadId"` có kết quả). Đã xoá đoạn set/save đó — `version.uploadId` giữ `null` ở luồng mới; chỉ luồng E7 legacy còn set field này.
3. **Đọc lại `01_api_contract.md` §E1.4 để diễn giải đúng DoD "response không chứa uploadId"**: E1.4 tự thừa nhận "uploadId chỉ nằm bên trong query string của presigned URL (bắt buộc theo giao thức S3)" — với `uploadMode = MULTIPART`, presigned PUT URL **luôn** chứa literal `uploadId=...` ở query string (yêu cầu bắt buộc của chính REST API `UploadPart` của S3/MinIO, không thể loại bỏ mà vẫn dùng multipart presigned URL). Sau khi xác nhận field `uploadId` **không tồn tại** ở cấp JSON key nào trong khối `upload` (chỉ còn `sessionId, uploadMode, partSize, partCount, declaredSize, urls, urlExpiresAt, expiresAt, hardExpiresAt`), kết luận DoD đã thoả — phần substring còn lại nằm trong giá trị URL là hành vi đã được `01_api_contract.md` ghi nhận, không phải lỗi.
4. **Hạ tầng Docker dừng ~7 giờ giữa lúc test** (máy chủ dev có thể đã sleep) — toàn bộ container (Mongo/Kafka/MinIO) exited, khiến mọi request trả `403` (JWT filter fail vì không load được `UserDetails` từ Mongo). Không liên quan code WP4. Khắc phục: `docker compose up -d` lại, đăng nhập lấy JWT mới; dữ liệu Mongo/MinIO (volume) còn nguyên sau khi container sống lại.
5. **`mc rm --incomplete` báo "Object does not exist"` dù `mc ls --incomplete` vẫn liệt kê object** — cùng loại quirk của bản `minio/mc:latest` đang dùng đã ghi nhận ở WP1 §5.3 (ILM). Còn sót đúng 1 multipart test (`wp4-e7-legacy-obj-358327164.bin`, tạo trong lúc test baseline `upload-metadata`, chưa từng PUT part nào) không dọn được qua `mc`; sẽ tự dọn bởi `stale_uploads_expiry=168h` đã cấu hình ở WP1. Không phải rác do complete/abort thật bị lỗi (mọi kịch bản A/B/C8/C9/C11 đều xác nhận `mc ls --incomplete` sạch sau khi đúng luồng complete/abort chạy).

**Output thật đã chạy:**

```
mvn -f server/pom.xml clean install -DskipTests   → BUILD SUCCESS, 7 module

spring-boot:run -pl filesharing-filehandler
→ "Started FileSharingApplication in 6.241 seconds ..."
→ "Mongo indexes bootstrap completed."
```

**Kịch bản A (happy path, E1→PUT 2 part→E4→idempotent) — 16 MiB, MULTIPART, partSize=8388608, partCount=2:**

```
E1: sessionId=9fc9068f-... uploadMode=MULTIPART partSize=8388608 partCount=2 urls keys=1,2
    $e1.data.upload | ConvertTo-Json -Compress | Select-String "uploadId" → chỉ khớp bên trong query string 2 URL (xem mục 3 ở trên); không có key "uploadId"
PUT part1 → HTTP/1.1 200 OK; PUT part2 → HTTP/1.1 200 OK
E4 complete → 200, fileSize=16777216, etag=889ad3811946d93330eb7d609db52ecf-2, uploadStatus=COMPLETED, processingStatus=READY
mc stat → Size: 16 MiB, ETag khớp
E4 gọi lần 2 (cùng body) → assetId/etag/completedAt giống hệt lần 1 (idempotent, không gọi lại MinIO)
mc ls --incomplete → trống (sau khi dọn 1 multipart mồ côi từ lần thử đầu dính bug SEC-03 ở trên)
```

**Kịch bản B (resume — REL-01):**

```
B1 initiate → partCount=2
B2 PUT chỉ part 1 → 200
B3 GET E3 → status=UPLOADING, receivedParts=1 phần tử, uploadedBytes=8388608, expiresAt trượt tiếp (mới hơn E1)
B4 missing=[2]
B5 E2 xin url part 2 → urls keys=2
B6 PUT part 2 → 200
B7 E4 complete → fileSize=16777216, uploadStatus=COMPLETED
B8 GET E3 sau complete → status=COMPLETED, receivedParts=[], resource.assetId có giá trị (không gọi lại ListParts)
```

**Kịch bản C (nhánh lỗi, chạy sau khi `T-4.1` đã fix `GlobalExceptionHandler`):**

| # | Kịch bản | HTTP | code | message |
|---|---|---|---|---|
| C1 | Không JWT | 403* | — | — |
| C2 | Session không tồn tại | 404 | 5501 | Upload session not found: khong-ton-tai |
| C3 | Sai owner (E3) | 403 | 5104 | File permission Error |
| C4 | E2 partNumber=0 | 400 | 400 | partNumber 0 out of range [1..2] |
| C5 | E2 partNumber=141>2 | 400 | 400 | partNumber 141 out of range [1..2] |
| C6 | E2 batch 51 phần tử | 400 | 400 | partNumbers batch exceeds 50 |
| C7 | E4 thiếu cả 2 part | 400 | 5502 | Missing parts: [1, 2] |
| C8 | E4 md5 sai 1 part | 400 | 5504 | Checksum mismatch at parts: [2] |
| C9 | E4 tổng size lệch (PUT part 2 ngắn) | 400 | 5503 | Expected 16777216 bytes, got 9437184 |
| C10 | E2 trên session ABORTED | 409 | 5505 | Session is ABORTED, cannot issue part urls |
| C11 | E5 trên session COMPLETED | 409 | 5505 | Session is COMPLETED, cannot abort |
| C12 | E1 fileSize > max-file-size | 400 | 400 | fileSize exceeds limit: 53687091200 bytes |

\* C1: hợp đồng ghi 401 `USER_NOT_AUTHENTICATED`, thực tế đo được **403** khi request hoàn toàn không có header `Authorization`. Đây là hành vi có sẵn của tầng Spring Security (JWT filter chain không có `AuthenticationEntryPoint` riêng trả 401) — **không phải regression của WP4**: xác nhận bằng cách gọi thử endpoint khác không thuộc luồng upload (`/api/asset/get-page`) không JWT → cùng 403. Nằm ngoài whitelist WP4 (không có file `SecurityConfig`/`JwtAuthenticationFilter` trong whitelist §3 WP4) — không sửa, ghi nhận lại đây theo đúng tinh thần "sai lệch đã biết, không cần hỏi lại".

**E5 idempotent:** gọi 2 lần liên tiếp trên session đã `ABORTED` → cả 2 lần `200`, cùng `status=ABORTED`. Lưu ý kỹ thuật: response của **lần abort đầu tiên** (vừa `Instant.now()` trong bộ nhớ) có thể hiển thị độ chính xác nano-giây khác với các lần đọc lại sau đó từ Mongo (BSON `Date` chỉ lưu tới mili-giây) — hai lần đọc lại từ DB (sau khi đã persist) cho `abortedAt` giống hệt nhau tới mili-giây. Không phải lỗi nghiệp vụ, không cần sửa.

**Kịch bản E (download, E6):**

| # | Kịch bản | HTTP | code |
|---|---|---|---|
| E-1 | Owner, file COMPLETED | 200 | — (body có đủ `url,fileSize,fileName,mimeType,contentType`; `fileSize` là số nguyên) |
| E-2 | User khác, không quyền | 403 | 5104 |
| E-3 | objectName không tồn tại | 404 | 5101 |
| E-4 | File đang UPLOADING (chưa COMPLETED) | 409 | 5507 |
| E-5 | objectName rỗng | 400 | 5103 |
| E-6 | GET thật bằng URL trả về | 200, tải đủ 16777216 byte khớp file gốc; PUT bằng cùng URL → 403 |

**Kịch bản G (regression E7, so với baseline WP3 §5.5):**

```
upload-metadata → 200, data:{uploadId, partUrl} — schema giống hệt baseline
upload/complete → 200, data:"complete upload" — giống hệt baseline (đã PUT part thật + complete thật)
upload/stop-upload → 500, "Type definition error: ...AbortUploadRequestDto" — giống hệt baseline
  (bug có sẵn từ trước WP3/WP4, không do thay đổi GlobalExceptionHandler — vì lỗi này bị bắt ở
   handler chung `Exception.class`/HttpMessageNotReadable, không phải handler FileBusinessException
   mà T-4.1 sửa, nên vẫn hardcode 500 y hệt trước)
```

**Smoke "blast radius" của T-4.1 (bắt buộc — core dùng chung):**

```
login sai mật khẩu → 500 "Bad credentials" (BadCredentialsException của Spring Security, không phải
  FileBusinessException/UserBusinessException → rơi vào handler Exception.class, vẫn hardcode 500,
  hành vi y hệt trước khi sửa — không phải regression)
GET /api/project/{id}/stats với id không tồn tại → 404, code 5101 "Cannot find project with id..."
  (TRƯỚC khi sửa: đây từng luôn là 500 — xác nhận fix hoạt động đúng, cải thiện toàn hệ thống,
   không riêng luồng upload)
GET /api/asset/get-by-id/{id} không tồn tại → 404, code 404 "Resource not found" (tương tự — trước là 500)
rg "=== *500|status *=== *500|statusCode *== *500" client/src → 0 kết quả (client không bắt cứng 500)
```

**`npm run gen-api` (T-4.10):**

```
git status --short client → chỉ 5 dòng dưới client/src/api/api/ (AnnotationsControllerService.ts,
  AssetControllerService.ts, AssetVersionControllerService.ts, PlaybackControllerService.ts,
  index.defs.ts đều " M"; UploadSessionControllerService.ts "??" mới) — không có thay đổi ngoài
  thư mục generated. Các thay đổi imageReview/mediaReview/index.css trong git status là refactor
  KHÔNG LIÊN QUAN đã tồn tại từ trước phiên làm việc này (xem memory "Image review refactor").
rg "UploadSessionInitResponseDto|PartUrlBatchRequestDto" client/src/api/api → có kết quả
Không chạy `npm run build` ở WP4 (đúng T-4.10 bước 4 — client sẽ gãy type cho tới WP5, nằm trong
  ràng buộc release §9: T-4.8 + WP5 phải cùng một release).
```

**Dọn dẹp sau smoke test:** xoá project + 8 asset + 8 metadata + 8 upload_sessions + 2 user test qua mongosh; xoá toàn bộ object test đã commit trên MinIO qua `mc rm`; 1 multipart test không PUT part nào còn sót do quirk `mc rm --incomplete` (mục 5 ở trên) — sẽ tự dọn qua `stale_uploads_expiry`. **Lưu ý cho người dùng:** việc `docker compose up -d` lại (mục 4 ở trên) khiến container `minio-mc` (one-shot) chạy lại `init-bucket.sh`, sinh ra 1 access key/secret key mới ghi vào `server/dockers/config/access.txt` (không phải service account `svc-upload`/`svc-download` — không ảnh hưởng `application.yml`); file `server/filesharing-filehandler/docs/filehandler-openapi.json` cũng bị ghi đè do `OpenApiJsonExporter` tự chạy mỗi lần khởi động app — cả hai là side-effect tự động của việc chạy hạ tầng/app cục bộ, không phải chỉnh sửa thủ công, hiện đang ở trạng thái "modified" chưa commit.

**Kết luận WP4:** cả 8 mục DoD gốc (`00_guardrails.md` §6 "DoD WP4") đều xanh. Ba điểm cần người dùng biết (không chặn nghiệm thu, đã ghi nhận ở trên): (a) HTTP 403 thay vì 401 khi thiếu JWT — hành vi Security có sẵn, ngoài whitelist WP4; (b) `uploadId` vẫn xuất hiện dạng substring bên trong URL đã ký ở nhánh MULTIPART — đúng thiết kế S3, đã acknowledge tại `01_api_contract.md` §E1.4; (c) `access.txt` và `filehandler-openapi.json` bị ghi đè do chạy lại hạ tầng/app, không phải do sửa code WP4.
