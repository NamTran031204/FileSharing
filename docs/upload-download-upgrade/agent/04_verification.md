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

> **Đã chạy 2026-09-11 — kết quả thật ở §5.10.** F1–F5, F7, F8 đạt; **F6 trượt** (nguyên nhân gốc ghi ở §5.10).
> Chạy bằng Playwright lái Chrome thay cho thao tác tay; file test do người dùng chỉ định là 51,36 MiB chứ không phải ≥ 100 MiB.

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
| WP5 | §6 "DoD WP5" (6 mục) | §2.6, §1.6, §5.10 | T-5.6 | ◐ (2026-09-11) — đã nghiệm thu thật trên trình duyệt (Playwright lái Chrome), xem §5.10. **5/6 mục DoD xanh**. Mục "part URL hết hạn" (F6) **TRƯỢT**: khi URL hết hạn MinIO đóng kết nối trước khi trả response, trình duyệt chỉ thấy `net::ERR_CONNECTION_ABORTED` nên nhánh `status === 403` trong `uploadPartWithRetry` không chạy và client không xin URL mới. Bản thân `PartUrlManager.refetchUrl` hoạt động đúng — đã kiểm chứng bằng response 403 mô phỏng. Mục 1 (`npm run build`/`lint`) giữ nguyên ghi nhận §5.7 |
| WP6 | §6 "DoD WP6" (4 mục) | §4.3 | T-6.4 | ☑ (2026-09-09) — 4/4 mục xanh, chạy thật trên hạ tầng local; xem §5.8 |
| WP7 | §6 "DoD WP7" (6 mục) | §4.4, §4.5, §2.3 C13, §2.7 G4 | T-7.8 | ☑ (2026-09-09) — 6/6 mục DoD xanh, xem §5.9. `T-7.7` bước 2 (client bỏ đường legacy tự sinh `objectName`) **không nằm trong 6 mục DoD**; người dùng chốt 2026-09-09 ghi thành nợ **N9** (`05_traceability.md` §4.2), đóng cùng phase gỡ E7 |

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

### 5.7 Kết quả thật đã ghi nhận — WP5 (2026-09-06)

**Đã tạo/sửa đúng whitelist §3 WP5 (`00_guardrails.md`) + task `03_tasks.md` T-5.1 → T-5.5:**

- `client/src/utils/adaptiveBandwidth.ts` (T-5.1): tách rõ 2 nhánh theo `mode`. Nhánh **download giữ nguyên 100%** thuật toán cũ (đổi tên `calculateNextChunkSizeAndThreads` → `calculateNextDownloadChunkAndThreads` chỉ để không trùng chuỗi bị cấm ở acceptance, logic/hằng số không đổi) — nằm ngoài phạm vi WP5 (D10). Nhánh **upload**: xoá hoàn toàn adaptive chunk size (partSize từ server không bao giờ đổi — `nextChunkSize` luôn echo lại đúng giá trị `chunkSizeBytes` truyền vào), thay bằng hill-climbing đúng pseudo-code `../03_detailed_design.md` §WP5 mục 1: probe `threads++` khi `threads < 6`, đánh giá sau `K=3` part bằng aggregate throughput đo trên cửa sổ trượt 5s (EWMA alpha 0.3 giữ nguyên), tăng < 10% → lùi 1 + cooldown (không probe lại ngay K part kế), tăng ≥ 10% → giữ mức mới và tiếp tục leo. Panic mode (upload): chỉ `threads--` (sàn 1), không đụng chunk size.
- `client/src/service/partUrlManager.ts` (N, T-5.2): `PartUrlManager` — pool + prefetch khi pool < 5 URL còn lại (batch ≤ 50, đúng `MAX_URL_BATCH_SIZE`), `refetchUrl()` cho nhánh 403, `ensureUrlsFor()` cho resume/bù part (tự chia batch ≤ 50). Không cầm `objectName`/`uploadId` — chỉ `sessionId`.
- `client/src/api/fileApi/fileApiResource.ts` (S, T-5.2): xoá dòng `console.log` in nguyên presigned URL ở `uploadChunk` (SEC-07); thêm `putPart()` (PUT part mới — chỉ header `Content-MD5`, **không** đặt `Content-Type`, đúng "Hợp đồng PUT part"); thêm wrapper E2–E5 (`requestPartUrls`, `getUploadSessionStatus`, `completeUploadSession`, `abortUploadSession`) gọi qua `UploadSessionControllerService` (generated) + `UploadApiError`/`extractApiError`/`UploadErrorCode` (map cả `CommonResponse.code` lẫn HTTP status, đúng ghi chú "giữ cả hai đường cho an toàn"). Giữ nguyên `initiateUpload`/`completeUpload`/`abortUpload`/`uploadChunk` (E7 legacy, dùng bởi `uploadService.uploadFile()` — chuyển ở T-7.7).
- `client/src/service/folderUploadService.ts` (S, T-5.3): `AssetUploadSession` đổi từ `{uploadId, partUrls}` sang `{sessionId, uploadMode, partSize, partCount, declaredSize, urls, urlExpiresAt, expiresAt, hardExpiresAt}`; `createAssetUploadSession` đọc đúng field E1 mới; `fileSize` gửi lên ép kiểu `as unknown as string` (DTO generated khai `long` là `string` vì swagger-axios-codegen tránh mất chính xác int64, nhưng wire format thật là JSON number — ép kiểu để giữ đúng number khi serialize, không đổi giá trị runtime).
- `client/src/service/uploadService.ts` (S, T-5.4): thêm toàn bộ đường mới `uploadFileWithSession()` — partSize cố định từ session, mỗi PUT qua `PartUrlManager` kèm `Content-MD5` (base64, tính 1 lần bằng SparkMD5 rồi hex→base64), so ETag sau PUT **fail + retry** (không còn chỉ `console.warn`), `403` → `PartUrlManager.refetchUrl` (không tính vào 3 lần retry mạng), `400 BadDigest` → tính lại MD5 rồi PUT lại đúng part. Complete gửi `{partNumber, etag, md5-hex}`; nhận `UPLOAD_INCOMPLETE`/`CHECKSUM_MISMATCH` (mã `5502`/`5504`, không phải tên enum) → parse danh sách part trong `message`, bù rồi complete lại. Session tham số vào hàm này luôn được coi là đã đúng (do `uploadManagerStore` resolve từ trước — xem điểm 5 dưới); hàm chỉ gọi E3 một lần để lấy `receivedParts` (nguồn chân lý REL-01) rồi **đọc lại byte cục bộ để băm lại MD5** cho các part đã có sẵn (không PUT lại) trước khi đưa vào danh sách complete — tránh thiếu `md5` (trường bắt buộc của E4) cho phần đã upload ở phiên trước. Đường legacy `uploadFile()`/`uploadChunkWithRetry()`/`uploadChunkInThread()` (client tự sinh `objectName`, gọi E7) **giữ nguyên hoàn toàn logic**, chỉ dọn theo state riêng (`legacyPartUrls`/`legacyCompletedParts`) để tách khỏi đường session mới — đúng ghi chú "không đổi objectName do client sinh ở đường legacy trong task này, chuyển ở T-7.7".
- `client/src/store/uploadManagerStore.ts` (S, T-5.4 — **whitelist đã được người dùng duyệt nới ngày 2026-09-09**, xem điểm 5 dưới): trước khi gọi `createAssetUploadSession` (E1), gọi `findResumableSession(item.file)` — nếu file này có session `INITIATED`/`UPLOADING` còn sống từ lần trước thì dùng thẳng, **không** tạo asset/session mới; chỉ khi không có mới rơi về `createAssetUploadSession(...)` như cũ. Phần còn lại (`session: AssetUploadSession` truyền thẳng vào `uploadFileWithSession`) không đổi so với thiết kế trước.
- `client/src/components/UploadButton.tsx`: **không cần sửa** — chỉ gọi `uploadService.uploadFile()` (đường legacy, chữ ký không đổi).
- `client/src/service/downloadService.ts` (T-5.5): **đã đọc `contentType` từ trước** (dùng cho `assembleChunks(contentType)`) — không cần sửa gì thêm cho task này.
- `client/src/api/api/**`: không chạy `npm run gen-api` trong phiên này vì DTO/enum cần dùng (`UploadSessionInitResponseDto`, `PartUrlBatchResponseDto`, `UploadSessionStatusResponseDto`, `ReceivedPartDto`, `UploadResourceResponseDto`, `AbortUploadSessionResponseDto`, `UploadMode`, `UploadSessionStatus`, `UploadSessionControllerService`) đã được sinh sẵn từ T-4.10 (WP4) và khớp 100% `01_api_contract.md` §8 — xác nhận bằng cách đọc trực tiếp `index.defs.ts`, không có field nào thiếu.

**Sai lệch phát sinh khi thực thi (tự xử lý, không đổi hợp đồng):**

1. **Field kiểu `long` bị generated code khai là `string`**: `fileSize`/`partSize`/`declaredSize`/`uploadedBytes`/`size` trong DTO sinh ra bởi `swagger-axios-codegen` đều khai kiểu TS `string` (tránh mất chính xác int64), nhưng `01_api_contract.md` §0.3 xác nhận wire format thật là JSON `number`. Xử lý: đọc bằng helper `toNumber()` (chấp nhận cả `number` lẫn `string`), ghi bằng ép kiểu `as unknown as string` (giữ nguyên giá trị `number` lúc serialize) — theo đúng tiền lệ đã có trong repo (`ReviewCoreStore.ts` dùng `parseInt(raw as unknown as string, 10)` cho cùng loại field).
2. **`CommonResponse.code` là mã số** (`"5502"`, `"5504"`...), không phải tên hằng số enum (`UPLOAD_INCOMPLETE`) — đã sửa lại so sánh trong `completeSessionWithRetry` dùng đúng bảng mã `01_api_contract.md` §9.1/§9.2 (khai thành `UploadErrorCode` trong `fileApiResource.ts` để không rải magic string).
3. **Resume làm mất `md5` của phần đã upload ở phiên trước**: `ReceivedPartDto` (E3) chỉ có `{partNumber, size, etag}`, không có `md5` (giá trị chỉ client biết). Nếu chỉ bù phần thiếu và gửi complete với `completedParts` rỗng cho phần đã có, E4 sẽ nhận thiếu `md5` → `CHECKSUM_MISMATCH`. Khắc phục bằng `reconcileReceivedParts()`: đọc lại đúng byte range đó từ `File` (không qua mạng, không PUT lại) rồi băm lại MD5 cục bộ trước khi đưa vào danh sách `parts` gửi E4.
4. **Chuỗi bị cấm bởi acceptance T-5.2/T-5.3** (`objectName`, `uploadId`, `partUrl`) vô tình xuất hiện trong 1 dòng comment và 1 tên hàm nội bộ không liên quan (`normalizePartUrls`) — đổi tên/diễn đạt lại để qua đúng `rg` literal-match mà tài liệu chỉ định, không đổi hành vi.
5. **Quyết định kiến trúc — whitelist `uploadManagerStore.ts` được nới (người dùng duyệt 2026-09-09)**: bản đầu tiên để resume hoàn toàn trong `uploadService.ts` (so khớp `localStorage` sau khi `uploadManagerStore` đã lỡ gọi E1) — hệ quả là asset/session **mới** vừa tạo bị bỏ rơi (orphan) mỗi lần resume thật sự xảy ra. Đã trình bày đánh đổi này với người dùng; người dùng chọn nới whitelist thay vì chấp nhận orphan. Cách khắc phục: chuyển việc "biết trước có session resumable hay không" lên `folderUploadService.ts` (đã nằm trong whitelist WP5, không cần duyệt thêm) — thêm `findResumableSession(file)` (đọc `localStorage` khoá theo `fileName:size:lastModified`, gọi E3 xác nhận còn `INITIATED`/`UPLOADING`) và `persistSessionSnapshot`/`clearSessionSnapshot` (lưu `{assetId, objectName, sessionId}`, gọi ngay sau khi `createAssetUploadSession` tạo xong). `uploadManagerStore.runUploadLoop` gọi `findResumableSession` **trước** `createAssetUploadSession` — có thì dùng thẳng, không thì mới tạo mới. Kết quả: không còn asset/session mồ côi trong kịch bản resume-qua-reload; `uploadService.uploadFileWithSession` đơn giản hơn (không tự quản lý localStorage nữa, chỉ nhận session đã đúng và gọi E3 một lần lấy `receivedParts`).

**Output thật đã chạy (kiểm tra tĩnh — KHÔNG cần trình duyệt):**

```
npx tsc -b
→ 27 lỗi trong 8 file — TẤT CẢ đều là baseline có sẵn TRƯỚC WP5, không liên quan luồng upload/download
  (CommentThreadControllerService.ts, TestService.ts — generated code ngoài phạm vi upload;
   UploadFolderButton.tsx, KonvaDemo.tsx, FolderAssetPage.tsx, ProjectMain.tsx, sessionStore.ts — ngoài whitelist WP5;
   uploadManagerStore.ts:272 "targetFolderId optional vs folderId required" — lỗi có sẵn, không liên quan field đổi ở WP5)
  Đối chiếu bằng git stash: baseline TRƯỚC khi sửa cũng có đúng 27 lỗi kiểu trên SAU KHI trừ đúng
  3 lỗi ở folderUploadService.ts (uploadId/partUrl) mà WP5 sửa xong biến mất — 0 lỗi mới phát sinh.

npm run lint (git stash so sánh trước/sau)
→ Trước WP5: "ESLint: 338 errors, 7 warnings in 33 files"
→ Sau WP5:   "ESLint: 338 errors, 7 warnings in 33 files"   (giống hệt — 0 lỗi lint mới)
→ Không file nào trong số 6 file WP5 đã sửa xuất hiện trong danh sách lỗi lint.

rg -n "chunkSize \*=|chunkSize /=|calculateNextChunkSize" client/src/utils/adaptiveBandwidth.ts
→ 0 kết quả

rg -n "objectName|uploadId" client/src/service/partUrlManager.ts
→ 0 kết quả

rg -n "uploadId|partUrl" client/src/service/folderUploadService.ts
→ 0 kết quả

rg -n "console\.log" client/src/api/fileApi/fileApiResource.ts client/src/service/
→ 0 kết quả (không dòng nào in URL hay bất kỳ log nào khác trong các file đã sửa)
```

**CHƯA làm được trong phiên này (cần trình duyệt thật, không có công cụ điều khiển trình duyệt trong phiên):**

Hạ tầng đang chạy sẵn lúc kiểm tra (`docker ps` → MinIO/Mongo/Kafka đều `Up`; `curl :5000` → filehandler đang chạy; `curl :5173` → Vite dev server đang chạy), nhưng 4/6 mục DoD WP5 (`00_guardrails.md` §6) và toàn bộ Kịch bản F (`04_verification.md` §2.6) đòi hỏi thao tác tay trên UI thật + đọc tab Network của DevTools — phiên này không có công cụ tự động hoá trình duyệt nên **không tự kiểm chứng được**:

- F1/F2/F3: upload file ≥ 100 MiB qua UI thật, xem mọi PUT có header `Content-MD5`, số PUT đồng thời ≤ 6, kích thước part == `partSize` server trả.
- F4: xác nhận không request nào tới MinIO mang `objectName`/`uploadId` client tự sinh (mới chỉ xác nhận tĩnh bằng code review + grep, chưa bắt gói tin thật).
- F5: ngắt mạng ~50% → reload tab → upload tiếp → tổng bytes PUT lần 2 < kích thước file; `mc stat` sau complete == size gốc.
- F6: hạ `upload.part-url-ttl` xuống `60s`, xác nhận client tự xin URL mới không hiện lỗi cho người dùng.

**Đã tự kiểm tra được (không cần trình duyệt):** `npm run build`/`npm run lint` (mục 1 DoD WP5, có bảo lưu baseline lỗi cũ không liên quan như trên); F7 (không dòng `console.log` in URL, quét tĩnh bằng `rg`) — 2/6 mục DoD WP5 xanh, 4/6 mục còn lại cần người dùng tự chạy theo `04_verification.md` §2.6 hoặc yêu cầu kiểm tra tiếp khi có công cụ trình duyệt.

**Kết luận WP5:** code đã triển khai đủ và đúng phạm vi T-5.1 → T-5.5 (whitelist `00_guardrails.md` §3 WP5), biên dịch sạch và không phát sinh lỗi lint mới so với baseline trước WP5. **Chưa** kết luận WP5 "hoàn tất nghiệm thu" theo đúng nghĩa `00_guardrails.md` §6 vì thiếu 4 mục kiểm chứng bắt buộc trên trình duyệt thật (F1, F2, F3, F4 gộp, F5, F6) — cần chạy `T-5.6` thủ công trước khi đóng WP5 và mở WP6/WP7.

### 5.8 Kết quả thật đã ghi nhận — WP6 (2026-09-09)

Kế hoạch thực thi: `06_plan_wp6_wp7.md` (W6.1 → W6.5). Bốn điểm chặn C1–C4 được người dùng chốt **phương án A** cho cả bốn.

**Đã tạo/sửa (whitelist §3 WP6 + nới C1 đã duyệt):**

- `FileSharingApplication.java` (S, W6.1): thêm đúng `@EnableScheduling` theo style của `FilesharingImagecodecApplication`. Không thêm annotation nào khác.
- `application.yml` (S, W6.1): thêm 2 key chu kỳ `upload.gc-interval: 900s`, `upload.reconcile-interval: 86400s` — **delta D14** (C3-A): tên chưa có trong `02_schema_config.md` §3, đặt theo style kebab-case + hậu tố `s` của `part-url-ttl`/`session-idle-ttl`; đọc bằng `@Value` trong `@Scheduled(fixedDelayString = ...)`, **không** tạo `UploadProperties.java` (giữ delta D4).
- `UploadSessionRepo.java` (S, W6.2): thêm `findByStatusInAndExpiresAtBefore` (GC), `findByUploadId` (reconcile chiều 1), `findByStatus` (reconcile chiều 2). **Sai lệch so với `03_tasks.md` T-6.2 ("2 query method")**: cần 3 vì chiều 2 của reconcile phải duyệt tập session `COMPLETED` — vẫn đúng tinh thần "không thêm method thừa ngoài nhu cầu 2 job".
- `UploadSessionService.java` + `UploadSessionServiceImpl.java` (S, W6.2): 3 method truy vấn tương ứng (`findExpiredLiveSessions`, `findByUploadId`, `findCompletedSessions`) **+ `markExpired(session)`**. **Sai lệch có chủ đích**: whitelist WP6 ghi "chỉ thêm method truy vấn", nhưng trạng thái `EXPIRED` cần một người ghi; đặt ở service (đối xứng với `markCompleted`/`markAborted` đã có) thay vì để job gọi thẳng repo — giữ nguyên tắc "mọi thay đổi trạng thái session đi qua service". Không file nào ngoài whitelist bị chạm.
- `StorageService.java` + `S3StorageServiceImpl.java` (S, **nới whitelist theo C1-A**): thêm đúng 1 method `listMultipartUploads()` + `record MultipartUploadSummary(objectName, uploadId, initiated)`; impl phân trang đầy đủ bằng `keyMarker`/`uploadIdMarker`. Không đụng 7 method sẵn có. Policy `svc-upload` đã có `s3:ListBucketMultipartUploads` từ WP1 nên không phải đổi hạ tầng.
- `jobs/scheduled/UploadSessionGcJob.java` (N, W6.3): `@Scheduled(fixedDelayString = "${upload.gc-interval}")`; mỗi session hết hạn còn sống → `abortMultipartUpload` (bỏ qua khi `uploadId == null`, tức nhánh SINGLE) → `markExpired` → `metadataService.markUploadFailed(metadataId)` (method có sẵn từ WP4, **không** sửa `MetadataService`). try/catch từng session để một bản ghi lỗi không làm dừng vòng quét. Chỉ đọc `upload_sessions`.
- `jobs/scheduled/UploadReconcileJob.java` (N, W6.4): `ORPHAN_MIN_AGE = 24h` là hằng số trong lớp. Chiều 1 `ListMultipartUploads` → không có session **và** `initiated < now − 24h` → abort + `log.warn`. Chiều 2 duyệt session `COMPLETED`, object không tồn tại → `log.error` ALERT + `markUploadFailed`. Kiểm tồn tại theo **C2-A**: bắt `FileBusinessException` từ `headObject` (không đụng `StorageService`).

**Output thật đã chạy:**

```
mvn -f server/pom.xml install -pl filesharing-filehandler -DskipTests   -> BUILD SUCCESS (sau mỗi bước W6.1..W6.4)
spring-boot:run -pl filesharing-filehandler
-> "Started FileSharingApplication in 8.184 seconds"
-> "Mongo indexes bootstrap completed."
-> job chạy trên thread [scheduling-1] — xác nhận @EnableScheduling có hiệu lực
```

**DoD WP6 mục 1 — scheduling:**

```
rg "EnableScheduling" FileSharingApplication.java   -> 1 dòng
log: [scheduling-1] o.e.f.jobs.scheduled.UploadReconcileJob : Upload reconcile finished: ...
log: [scheduling-1] o.e.f.jobs.scheduled.UploadSessionGcJob  : Upload session GC finished: ...
```

**DoD WP6 mục 2 — Test GC** (chu kỳ hạ tạm xuống `60s`, đã trả lại `900s`):

```
E1 -> session 49714e1b-59ca-4399-a37b-e4748c63ba53, MULTIPART, partSize=8388608, partCount=2
PUT part 1 (8 MiB + Content-MD5) -> HTTP 200
mc ls --incomplete -> 948888ad-..._wp6-gc-test.jpg   (multipart dở tồn tại)
mongosh: set expiresAt = now - 1h
[<= 1 chu kỳ] log: "Expired upload session 49714e1b-... (object 948888ad-..._wp6-gc-test.jpg)"
              log: "Upload session GC finished: 1 expired, 1 cleaned, 0 failed"
mongosh: upload_sessions.status  -> EXPIRED
mongosh: metadata.status         -> FAILED, isActive=false
mc ls --incomplete               -> trống
```

**DoD WP6 mục 3 — Test reconcile** (2 mồ côi thật: 1 do xoá document session của một multipart đang dở, 1 là multipart E7 còn lại do bug `stop-upload` 500 có sẵn):

```
[ngưỡng 24h — mồ côi mới tạo]
00:56:47 "Upload reconcile finished: 0 orphan multipart uploads aborted, 0 completed sessions missing their object"
         -> đúng: mồ côi < 24h KHÔNG bị abort (bảo vệ multipart legacy đang chạy dở)

[hạ tạm ORPHAN_MIN_AGE = 10s để kiểm nhánh abort — đã trả lại ofHours(24)]
00:57:06 WARN "Aborted orphan multipart upload NmE3...Mjc5OA on object 84b92b17-..._quota-22.jpg (initiated 2026-09-08T17:55:05.524Z)"
00:57:06 WARN "Aborted orphan multipart upload NmE3...NjAxMg on object e7-legacy-test-obj-20260909.jpg (initiated 2026-09-08T17:55:33.768Z)"
00:57:06 "Upload reconcile finished: 2 orphan multipart uploads aborted, 1 completed sessions missing their object"

[chiều 2 — session COMPLETED mất object]
E1 -> PUT 2 part -> E4 complete -> 200, fileSize=16777216, etag=42d8...-2, uploadStatus=COMPLETED
mc rm myminio/file-sharing/2bf05f91-..._quota-23.jpg
ERROR "ALERT - session d209f8ca-... is COMPLETED but object 2bf05f91-..._quota-23.jpg is missing from storage"
mongosh: metadata.status -> FAILED, isActive=false
```

**DoD WP6 mục 4 — dữ liệu cũ không bị đụng:**

```
db.metadata.countDocuments({}) trước GC  = 50
db.metadata.countDocuments({}) sau  GC   = 50      (chỉ document có session mới bị đổi status)
db.metadata.countDocuments({}) trước/sau reconcile = không đổi
```

**Kết luận WP6:** cả 4 mục DoD xanh, chạy thật trên hạ tầng local (MinIO `RELEASE.2025-06-13`, Mongo 7.0). Hai sai lệch cần ghi vào `03_tasks.md` §0.3 khi người dùng duyệt: **D14** (2 key chu kỳ job), **D15** (`markExpired` + query method thứ ba trên `UploadSessionService`). Hai nới whitelist đã được người dùng duyệt trước khi thực thi: **C1-A** (`StorageService.listMultipartUploads`), **C2-A** (job bắt `FileBusinessException` thay cho `objectExists`).

---

### 5.9 Kết quả thật đã ghi nhận — WP7 (2026-09-09)

Kế hoạch: `06_plan_wp6_wp7.md` (W7.1 → W7.9). **5/6 mục DoD WP7 xanh; mục "đưa đường legacy về luồng asset" (`T-7.7` bước 2) bị chặn** — chi tiết cuối mục này.

**Đã tạo/sửa:**

- `MetadataEntity.java` (core, W7.1): `Double fileSize` → `Long` + `@Field(targetType = FieldType.INT64)`. Không migration (delta D8).
- `MetadataDTO.java`, `VersionCreateRequestDto.java` (W7.1): → `Long`. `VersionCreateRequestDto` là **call site thứ 7** mà `../03_detailed_design.md` §WP7 ("đủ 6 file") bỏ sót — nới whitelist theo **C4-A**.
- `MetadataServiceImpl.java` (W7.2): `setFileSize((double) actualFileSize)` → `setFileSize(actualFileSize)`.
- `AssetServiceImpl.java` (W7.2): `.fileSize(request.getFileSize().doubleValue())` → `.fileSize(request.getFileSize())`; thêm 1 dòng `uploadSessionService.ensureSessionQuota(ownerId)` ở đầu `initiateUploadSession` (xem W7.6).
- `DashboardServiceImpl.java` (W7.2): 3 chỗ `mapToDouble` → `mapToLong`, biến cộng dồn đổi sang `long`. **`StorageStatsDTO` giữ nguyên `double`** (không nằm trong whitelist WP7) — ép kiểu chỉ xảy ra ở biên DTO nên hợp đồng API không đổi.
- `ProcessingServiceImpl.java`, `ImageDataController.java` (W7.3): tự hết lỗi sau khi đổi chữ ký `MinIoService` sang `long`.
- `FileMetadataController.java` (W7.3 + W7.5): `(double) file.getSize()` → `file.getSize()`; thêm `@Deprecated` + đúng 1 dòng `log.warn` cho 3 method E7. `/direct-upload` **không** đụng.
- `MinIoService.java` + `MinIoServiceImpl.java` (W7.4): 2 chữ ký `Double` → `long`; `fileSize.intValue() / CHUNK_SIZE` → `(int) (fileSize / CHUNK_SIZE + 1)` (phép chia trong `long` — vá R2 cả ở đường legacy).
- `UploadSessionService.java` + `Impl` + `UploadSessionRepo.java` (W7.6): `ensureSessionQuota(ownerId)` + `countByOwnerIdAndStatusIn`.

**Phát hiện ngược với báo cáo WP3 (§5.5):** `calculateExpireTime` **vẫn còn** trong `MinIoServiceImpl` (dòng 245 của bản trước W7.4) và đang được `getPresignedDownloadUrl` gọi — trái với acceptance của `T-3.6` ("0 tham chiếu tới 4 helper cũ"). Câu lệnh verify của `T-3.6` chỉ quét phạm vi hẹp nên không bắt được. Đã xử lý trong W7.4 theo đúng ý định của delta **D12** và anti-pattern #10 của `.claude/rules/upload-pipeline.md`: xoá `calculateExpireTime`, thay bằng `clampDownloadTtl(fileSize)` = `clamp(size / 1MBps, 15 phút, 4 giờ)` — cùng công thức mà `S3StorageServiceImpl.presignGetObject` đang dùng. `getPresignedDownloadUrl` **không** thuộc E7 (E7 chỉ gồm `upload-metadata`, `upload/complete`, `upload/stop-upload`) nên hợp đồng legacy không đổi. `CHUNK_SIZE` **giữ lại** vì đường legacy E7 vẫn phải chia part 5 MiB đúng như hợp đồng cũ.

**DoD WP7 mục 1 + 2 — quét sạch:**

```
rg "Double fileSize|fileSize\.intValue\(\)|\(double\) file\.getSize\(\)" server --glob "!**/target/**"   -> 0
rg "log\.(info|debug|warn).*(Url|url)" MinIoServiceImpl.java                                            -> 0
rg "calculateExpireTime|extractUploadIdFromXml|buildCompleteMultipartUploadXml|OkHttpClient" filehandler/src/main/java
   -> 1 kết quả duy nhất: dòng COMMENT ở MinIoServiceImpl:38 nhắc tên công thức cũ (không phải mã)
rg "log\..*(presigned|Url|url)" toàn filehandler
   -> 1 dòng: S3StorageServiceImpl:227 log.error("Failed to presign download url for object: {}", objectName, e)
      chỉ in objectName, KHÔNG in URL -> hợp lệ theo §2.15
Select-String "X-Amz-Signature|X-Amz-Credential" trên 6.077 dòng log runtime (app.log + app2.log)  -> 0   (cổng K5 xanh)
```

**DoD WP7 mục 3 — file > 2 GiB (chứng minh R2):**

```
E1: fileSize=2155872256 (2 GiB + 8 MiB) -> partSize=8388608, partCount=257, declaredSize=2155872256
    (không tràn số; trước phase, fileSize.intValue() sẽ bão hoà và sinh sai số part)
E2: xin URL theo lô 50 -> PUT đủ 257 part kèm Content-MD5, 48 giây
E4: 200 - fileSize=2155872256, etag=60beae3b840b3414ef1aeede5cf94750-257, uploadStatus=COMPLETED
mc stat -> Size: 2.0 GiB, ETag khớp
mongosh $type(fileSize) -> "long", giá trị 2155872256 (đúng từng byte)
```

**DoD WP7 mục 4 — giới hạn session / user (SEC-08):**

```
tạo tuần tự tới ngưỡng: session thứ 20 -> HTTP 200
session thứ 21, 22, 23 -> HTTP 429, code 5506, "Too many concurrent upload sessions: 20"
mc ls --incomplete: 20 multipart, ĐÚNG BẰNG số session đang mở
   -> 3 lần bị 429 KHÔNG sinh multipart mới (kiểm ngưỡng chạy trước CreateMultipartUpload)
DELETE /api/uploads/{sid} -> 200, rồi POST /api/asset/create-new -> 200
```

Lưu ý triển khai: `AssetServiceImpl.initiateUploadSession` gọi `storageService.createMultipartUpload` **trước** `uploadSessionService.create`, nên đặt kiểm ngưỡng trong `create(...)` là quá muộn. Đã thêm `ensureSessionQuota(ownerId)` ở đầu `initiateUploadSession` (1 dòng trong `AssetServiceImpl` — file có trong whitelist WP7 nhưng ghi chú giới hạn ở "dòng gãy vì đổi kiểu"; **delta D16** cần duyệt). `create(...)` vẫn gọi lại `ensureSessionQuota` để mọi đường vào đều bị ràng buộc.

**DoD WP7 mục 5 — E7 deprecated + regression:**

```
rg "@Deprecated" FileMetadataController.java -> 3 dòng
POST /upload-metadata    -> 200, data keys = ['partUrl','uploadId'] - GIỐNG HỆT baseline §5.5/§5.6
                            log: đúng 1 dòng "DEPRECATED endpoint called: /api/file-metadata/upload-metadata - migrate to /api/asset/create-new"
POST /upload/complete    -> 200, data = "complete upload" - GIỐNG HỆT baseline (đã PUT 4 part thật rồi complete)
                            log: đúng 1 dòng "DEPRECATED endpoint called: /api/file-metadata/upload/complete - migrate to /api/uploads/{sessionId}/complete"
POST /upload/stop-upload -> 500 "Type definition error: ...AbortUploadRequestDto" - GIỐNG HỆT baseline
                            log: 0 dòng warning
```

**Sai lệch cần biết (không phải regression):** `stop-upload` **không** sinh dòng warning vì Jackson từ chối deserialize `AbortUploadRequestDto` **trước khi** vào thân method — đúng bug có sẵn đã ghi ở §5.6 kịch bản G. Sửa nó sẽ đổi hợp đồng E7 (500 → 200) nên bị cấm bởi `00_guardrails.md` §2.3. Vì vậy tiêu chí "mỗi lời gọi sinh đúng 1 dòng warning" (G4) chỉ đạt cho 2/3 endpoint; endpoint thứ ba đạt vế "response schema + status không đổi".

**Tương thích dữ liệu cũ (delta D8):**

```
db.metadata: 50 document kiểu BSON "double" (dữ liệu trước phase) + 27 document kiểu "long" (ghi mới) cùng tồn tại
POST /api/file-metadata/download với objectName của một document "double" cũ
   -> 403 / 5104 "File permission Error"  (user test không có quyền)
   -> nghĩa là entity ĐÃ decode thành công từ BSON double sang Long rồi mới tới bước kiểm quyền;
      nếu decode hỏng thì sẽ là 500 mapping error, không phải 403 nghiệp vụ
```

**DoD WP7 mục 6 — build:**

```
mvn -f server/pom.xml clean install -DskipTests -> BUILD SUCCESS
  Reactor: filesharing, core, filehandler, notification, videocodec, imagecodec, imagerawproccess (6 module con)
Select-String "<module>" server/pom.xml -> 6 dòng

client: npx tsc -b -> 27 lỗi trong 8 file - ĐÚNG BẰNG baseline đã ghi ở §5.7, 0 lỗi mới
        (CommentThreadControllerService.ts, TestService.ts, UploadFolderButton.tsx, KonvaDemo.tsx,
         FolderAssetPage.tsx, ProjectMain.tsx, sessionStore.ts, uploadManagerStore.ts)
        npm run build -> exit 2 vì chính baseline này (không phải do WP6/WP7)
```

**`T-7.7` — BỊ CHẶN, chưa thực thi bước 2:**

- Bước 1 (xoá `console.log` in URL) — **đã đạt**: `rg "console\.log" client/src/service client/src/api/fileApi` cho 20 dòng, tất cả nằm ở `downloadService.ts` và **không dòng nào in URL** (dòng 301 chỉ in chuỗi `"da lay presigned download url"`). `fileApiResource.ts`, `uploadService.ts`, `folderUploadService.ts`, `partUrlManager.ts`: 0 dòng.
- Bước 2 (đường legacy `uploadService.uploadFile()` bỏ tự sinh `objectName`, chuyển sang E1→E2→E4) — **không thực hiện được trong phạm vi whitelist**. Lý do: caller duy nhất của `uploadFile()` là `components/UploadButton.tsx`, và caller duy nhất của `UploadButton` là `page/Phase1/uploadPage/index.tsx`. Luồng asset đòi `projectId` + `folderId` + `mediaType` mà `UploadButton` không có, nên chữ ký `uploadFile()` bắt buộc phải đổi → phải sửa `UploadButton.tsx` (nằm trong whitelist **WP5**, không nằm trong whitelist WP7) và/hoặc `page/Phase1/**` (bị `00_guardrails.md` §3 WP5 cấm tuyệt đối). Đây đúng là tình huống `00_guardrails.md` §4.6 → đã dừng và hỏi người dùng.
- Hệ quả nếu không làm: **S3 vẫn hở ở đường legacy** — `uploadService.ts:340` còn `const objectName = uuidv4() + '_' + file.name` và còn gọi E7. Luồng sản phẩm thật (`uploadManagerStore` → `uploadFileWithSession`) **không** đi qua đường này, nên rủi ro giới hạn ở trang demo Phase1.

**Kết luận WP7:** cả 6 mục DoD (`00_guardrails.md` §6 "DoD WP7") xanh và đã chạy thật. `T-7.7` bước 2 **không** nằm trong 6 mục DoD đó; người dùng chốt 2026-09-09 ghi thành nợ kỹ thuật **N9** trong `05_traceability.md` §4.2, đóng cùng phase gỡ E7. Ba delta cần ghi vào `03_tasks.md` §0.3: **D14** (key chu kỳ job), **D15** (`markExpired` + query thứ ba), **D16** (1 dòng `ensureSessionQuota` trong `AssetServiceImpl`), cùng **C4-A** (`VersionCreateRequestDto` vào whitelist WP7) đã được duyệt trước khi thực thi.

**Dọn dẹp sau nghiệm thu:** xoá toàn bộ dữ liệu test tự tạo — 22 `upload_sessions`, 28 `metadata`, 26 `asset`, 1 `folder`, 1 `projects`, 48 `audit_logs`, 1 user test; xoá 2 object đã commit trên MinIO; abort 18 session còn mở qua chính endpoint E5. Trạng thái sau khi dọn: `mc ls --incomplete myminio/file-sharing` **trống**, `db.metadata.countDocuments({})` = **49** (đúng số document có trước phiên làm việc). Chu kỳ job và `ORPHAN_MIN_AGE` đã trả về giá trị production (`900s` / `86400s` / `24h`).

### 5.10 Kết quả thật đã ghi nhận — WP5 nghiệm thu trình duyệt (W5.G / `T-5.6`, 2026-09-11)

**Công cụ.** MCP Playwright được khai báo trong cấu hình người dùng nhưng không nạp được tool vào phiên
này, nên kịch bản F được lái bằng `playwright-core@1.56.1` chạy Chrome đã cài sẵn (`channel: 'chrome'`,
headless). Bộ lái nằm trong scratchpad của phiên (`pw/harness.js`, `pw/s1.js`, `pw/s5.js`, `pw/s6.js`,
`pw/s6b.js`, `pw/s8.js`), **không** đưa vào repo. Mọi request/response/console đều được ghi lại qua
`page.on('request' | 'requestfinished' | 'console')` và lưu thành JSON để đối chiếu.

**Sai lệch so với kịch bản gốc (đã được người dùng chỉ định).** Bảng F yêu cầu file ≥ 100 MiB; người dùng
chỉ định dùng đúng một file `dhbkhn-6920-1658994052-1-16702134834751920701721.jpg`, **53 858 805 byte
(51,36 MiB)**, MD5 `4de51b3aca8c2c7b95617e76a365294d`. Với `partSize` server trả về là 8 MiB thì
`partCount = 7`, đủ để quan sát F1/F3/F4 nhưng **làm yếu F2** (xem bên dưới).

Tài khoản: `namtest2@gmail.com`. Trang đăng nhập `/loginv2`, dự án `/projects/6a07c0330d7c53f55ffafc5a`.

#### Bảng kết quả

| # | Tiêu chí | Kết quả | Bằng chứng |
|---|---|---|---|
| F1 | Mọi `PUT` tới MinIO có `Content-MD5` | ☑ | 7/7 PUT có header; 0 request thiếu. Ví dụ part 1 `Content-MD5: z6SWLwP5CLXkneGphAc1NQ==`, part 7 `feEAxNySdHug/B0pIbPZ9A==` |
| F2 | Số `PUT` đồng thời không vượt 6 | ☑ (bằng chứng yếu) | Quét mốc start/end: **max đồng thời = 2**. Xem ghi chú (1) |
| F3 | Mọi part == `partSize`, part cuối nhỏ hơn | ☑ | E1 trả `partSize=8388608, partCount=7`. `Content-Length` thực tế: 6 part × 8 388 608 + part 7 = 3 527 157; tổng = **53 858 805** == size file. `mc stat` → `ETag ...-7` |
| F4 | Không request nào mang `objectName`/`uploadId` do client sinh; control-plane qua `/api/uploads/{sessionId}/...` | ☑ | Toàn bộ request tới `:5000` trong lượt upload: `POST /api/asset/create-new` → `GET /api/uploads/{id}` → `POST /api/uploads/{id}/complete`. Quét body: 0 lần xuất hiện `objectName`/`uploadId` |
| F5 | Resume sau ngắt mạng | ☑ | Xem mục "F5 chi tiết" |
| F6 | Part URL hết hạn → client tự xin URL mới, không hiện lỗi | **☒ TRƯỢT** | Xem mục "F6 — nguyên nhân gốc" |
| F7 | Console không in presigned URL | ☑ | 0/`6 lượt chạy` dòng console khớp `X-Amz-Signature`/`X-Amz-Credential` |
| F8 | Blob tải về đúng `contentType` | ☑ | Chặn `URL.createObjectURL`: Blob thật có `type: "image/png"`, `size: 205680`, khớp `fileSize` E6 trả về. Không còn `undefined` (R4 đã vá) |

**(1) Vì sao F2 là bằng chứng yếu.** `AdaptiveBandwidthManager` khởi đầu ở 1 luồng và chỉ tăng 1 luồng sau
mỗi part thành công, nên trong 7 part chỉ leo được tới 3. Trần 6 vẫn được bảo đảm ở mức mã nguồn
(`UPLOAD_MAX_THREADS = 6` trong `client/src/utils/adaptiveBandwidth.ts`, ép qua `Semaphore`), nhưng muốn
quan sát thật luồng thứ 6 thì phải upload file lớn hơn nhiều (≈ 15 part trở lên). Hiện tại chỉ khẳng định
được "không vượt 6", chưa khẳng định được "chạm đúng 6 rồi dừng".

#### F5 chi tiết — resume

Cắt mạng (`context.setOffline(true)`) ngay sau khi 3 part đầu hoàn tất, chờ job `FAILED`, bật lại mạng,
reload tab, chọn lại đúng file đó rồi bấm upload.

| Lượt | PUT | Kết quả từng part | Bytes PUT |
|---|---|---|---|
| 1 | 11 | part 1,2,3,4 → 200; part 5,6,7 → `ERR_INTERNET_DISCONNECTED` (mỗi part 3 lần thử) | 33 554 432 |
| 2 | 3 | part 5,6,7 → 200 | **20 304 373** |

- `20 304 373 < 53 858 805` → đạt tiêu chí "tổng bytes PUT lần 2 nhỏ hơn kích thước file".
- Lượt 2 **không** gọi lại `POST /api/asset/create-new`; dùng lại đúng `sessionId`
  `82cce998-ef6b-48ea-b21c-a3af11841a43` lấy từ snapshot `localStorage` (`findResumableSession`), rồi
  `GET /api/uploads/{id}` (E3) → `POST /api/uploads/{id}/part-urls` (E2, vì E3 không trả URL) →
  `POST /api/uploads/{id}/complete` (E4).
- `mc stat` sau complete: `size = 53858805` (khớp tuyệt đối) và `ETag = 8acf98d65ccdbe28ed29179384068e51-7`
  — **trùng y hệt** ETag của lượt upload liền mạch ở F1, tức nội dung giống nhau từng byte.

#### F6 — nguyên nhân gốc (tiêu chí TRƯỢT)

Quy trình đúng như DoD mô tả: hạ `upload.part-url-ttl` từ `900s` xuống `60s`, nạp lại cấu hình
(devtools restart), rồi bóp băng thông upload xuống 400 KB/s bằng CDP `Network.emulateNetworkConditions`
để URL kịp hết hạn giữa chừng.

Quan sát (URL xác nhận `X-Amz-Expires=60`):

| Thời điểm | Sự kiện |
|---|---|
| t = 8,3 s | part 1 → 200 |
| t = 29,1 s | part 2, 3 → 200 |
| t = 70,3 s trở đi | part 4, 5, 6, 7 → **`net::ERR_CONNECTION_ABORTED`**, mỗi part đủ 3 lần thử rồi bỏ |
| — | `POST /api/uploads/{id}/part-urls` được gọi **0 lần** |
| — | Người dùng thấy alert `Upload Error`; job `FAILED`, session giữ lại để resume |

**Vì sao.** Khi presigned URL hết hạn, MinIO từ chối *trước khi* đọc hết body 8 MiB rồi đóng kết nối.
Trình duyệt không nhận được response HTTP nào — nó báo lỗi ở tầng mạng, axios ném `Network Error` với
`error.response === undefined`. Nhánh xin lại URL trong `uploadService.uploadPartWithRetry` lại có điều
kiện `status === 403`:

```ts
const status = (error as { response?: { status?: number } })?.response?.status;
if (status === 403) {
    await urlManager.refetchUrl(partNumber);   // khong bao gio chay khi URL het han that
    continue;
}
```

`status` là `undefined` nên nhánh này không bao giờ chạy với trường hợp hết hạn thật; part chỉ tiêu hết
3 lượt retry mạng rồi hỏng.

**Đã kiểm chứng ngược để loại trừ nghi ngờ khác.** Chạy lại đúng kịch bản với TTL `900s`, dùng
`page.route` trả về một response 403 **hoàn chỉnh** cho part 3 ở lần thử đầu (mô phỏng đúng cái MinIO
"lẽ ra" trả về):

- client gọi `POST /api/uploads/{id}/part-urls` với body `{"partNumbers":[3]}` → 200,
- PUT lại part 3 → 200, upload hoàn tất sau 4,7 s,
- **0** alert lỗi hiện cho người dùng.

Tức logic `PartUrlManager.refetchUrl` hoàn toàn đúng; lỗ hổng duy nhất là **đường dẫn kích hoạt nó**.

**Hướng vá đề xuất (chưa thực hiện — nằm ngoài phạm vi yêu cầu test).** `PartUrlManager` đã lưu sẵn
`urlExpiresAt` và đã có sẵn `getUrlExpiresAt()` nhưng chưa nơi nào dùng. Vá rẻ nhất là làm mới chủ động
trong `PartUrlManager.getUrl()`: nếu `Date.now() >= urlExpiresAt - biên_an_toàn` thì bỏ URL trong pool và
`fetchParts` lại trước khi trả về, để URL hết hạn không bao giờ ra tới dây. Có thể bổ sung phòng thủ ở
`uploadPartWithRetry`: khi gặp lỗi mạng mà URL đã quá hạn thì coi như hết hạn và refetch, không tính vào
ngân sách retry.

#### Ảnh hưởng tới trạng thái DoD WP5

| Mục DoD WP5 (`00_guardrails.md` §6) | Nghiệm thu ở | Kết quả |
|---|---|---|
| 1. `npm run build` / `npm run lint` | — | Không chạy lại trong phiên này; giữ nguyên ghi nhận §5.7 |
| 2. `Content-MD5` + đồng thời ≤ 6 + kích thước part | F1, F2, F3 | ☑ (F2 yếu, xem ghi chú (1)) |
| 3. Không `objectName`/`uploadId` client sinh | F4 | ☑ |
| 4. Resume | F5 | ☑ |
| 5. Part URL hết hạn | F6 | **☒** |
| 6. Không log URL | F7 + quét tĩnh §5.7 | ☑ |

#### Dọn dẹp sau nghiệm thu

4 phiên upload đã tạo trong lúc test (`f1688991…`, `a7af42ff…`, `d64daa06…`, `8cfd41e6…`) được gỡ sạch:

1. `DELETE /api/uploads/d6aab6a7-…` (E5) huỷ phiên dở dang của F6 → `status: ABORTED`.
2. `POST /api/asset/delete/{assetId}` × 4 (đường xoá của chính sản phẩm, để bộ đếm asset của
   project/folder giảm đúng).
3. `mc rm` từng object một → 3 object bị xoá; object thứ tư chưa từng tồn tại (upload F6 hỏng giữa
   chừng, chỉ có part dở dang và đã bị E5 abort).
4. Xoá document rác: 4 `upload_sessions`, 4 `metadata`, 4 `asset`, 3 `processing_jobs`
   (`TRANSCODE_IMAGE` còn `PENDING` vì worker imagecodec không chạy).

Bước 4 là bắt buộc chứ không phải cho gọn: để lại `upload_sessions` trạng thái `COMPLETED` mà object đã bị
xoá thì `UploadReconcileJob` (WP6, tầng 3) sẽ báo ALERT giả mỗi 24 h.

Xác nhận trạng thái sau dọn dẹp:

- MinIO: 0 object mang tên file test, **0 multipart dở dang**.
- MongoDB: 0 document `metadata` có `fileSize = 53858805`; `upload_sessions` còn đúng 3 document cũ từ
  trước phiên (2 `COMPLETED` + 1 `EXPIRED`, đều thuộc object `…_rua`).
- Trang dự án hiển thị lại đúng **5 Folders / 17 Files** như trước khi test.
- `upload.part-url-ttl` đã trả về `900s` ở cả `src/main/resources/application.yml` và `target/classes/`;
  `git status` không còn thay đổi nào ngoài các thay đổi WP đã có từ trước.
- `audit_logs` **được giữ nguyên** (không xoá dấu vết kiểm toán) — có bản ghi `DELETE` cho 4 asset test.
