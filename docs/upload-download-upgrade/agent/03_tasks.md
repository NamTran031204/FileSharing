# 03 — Task Breakdown: Upload/Download Pipeline v2 (WP0 → WP7)

> **Vai trò tài liệu:** danh sách công việc THỰC THI được cho agent/dev. Mỗi task đủ nhỏ cho một phiên làm việc (≤ ~5 file).
> **Tài liệu này KHÔNG chứa spec.** Tên endpoint/field/DTO/ErrorCode → `01_api_contract.md`. Schema/index/config/script/bean → `02_schema_config.md`. Whitelist file, điều cấm, stop condition, DoD → `00_guardrails.md`. Bối cảnh WP + sơ đồ → `../03_detailed_design.md`.
> Không chép lại nội dung 3 file trên vào đây; task chỉ **tham chiếu mục**.
>
> Ngày chốt: 2026-09-02 · Nhánh cơ sở: `web-flux` · Đường dẫn tuyệt đối gốc repo: `E:\DaiCuongBK\Project3\FileSharing\`

---

## 0. Cách dùng

### 0.1 Khuôn của một task

```
### T-x.y — <mục tiêu 1 câu>
- Đọc trước: <file + mục cụ thể>
- Sửa/tạo: <danh sách file, khớp whitelist WP tương ứng §3 của 00_guardrails.md>
- Các bước: <đánh số>
- Acceptance: <tiêu chí quan sát được>
- Verify: <lệnh PowerShell/mvn/mongosh/mc/curl + kết quả mong đợi>
- Phụ thuộc: <task id | không>
```

### 0.2 Quy tắc chung áp cho MỌI task

1. Trước khi gõ dòng đầu tiên: đọc `00_guardrails.md` §1.2 (đọc thêm theo loại task) và `.claude/rules/upload-pipeline.md`.
2. Chạm file ngoài mục "Sửa/tạo" của task → **STOP**, hỏi người dùng (`00_guardrails.md` §4.6).
3. Sau mỗi thay đổi trong `filesharing-core`: `mvn -f E:\DaiCuongBK\Project3\FileSharing\server\pom.xml install -pl filesharing-core -DskipTests` **trước** khi build filehandler.
4. Không `git commit`/`push` (`00_guardrails.md` §2.13). Kết thúc task chỉ báo cáo `git status --short`.
5. Không log presigned URL ở bất kỳ tầng nào (`00_guardrails.md` §2.15).
6. Lệnh trong file này viết cho **PowerShell trên Windows 11**; `mc` chạy qua container (§0.5) vì host không cần cài `mc`.

### 0.3 Whitelist delta — sai lệch giữa các file nguồn ĐÃ ĐƯỢC TRỌNG TÀI CHỐT

Bảng này để agent **không phải dừng hỏi lại**. Mọi dòng dưới đây là quyết định đã chốt ngày 2026-09-02; ngoài bảng này thì §4 của `00_guardrails.md` vẫn có hiệu lực đầy đủ.

| # | Điểm lệch | Nguồn A | Nguồn B | **Quyết định dùng** |
|---|---|---|---|---|
| D1 | Số `ErrorCode` mới | `00_guardrails.md` §6 "DoD WP2" (dòng còn sót): **4 mã** | `00_guardrails.md` §2.7 + §3 WP2 + `01_api_contract.md` §9.1+§9.2: **7 mã** | **7 mã** dải `55xx`. Dòng "đúng 4 mã" trong DoD WP2 đọc là "đúng 7 mã" |
| D2 | Script hạ tầng WP1 | `00_guardrails.md` §3 WP1: sửa `init-bucket.sh` | `02_schema_config.md` §4.2/§4.4: tạo mới `init-upload-hardening.sh`, **không đụng** `init-bucket.sh` | **Tạo `server/dockers/scripts/init-upload-hardening.sh`**; `init-bucket.sh` giữ nguyên |
| D3 | Vị trí `UploadSessionEntity` | `00_guardrails.md` §3 WP2: `filesharing-core/.../entity/models/` | `02_schema_config.md` §1.1: `filesharing-filehandler/.../entities/models/` | **Theo whitelist: `filesharing-core/.../entity/models/UploadSessionEntity.java`** (whitelist là văn bản ràng buộc phạm vi). Field/annotation vẫn lấy 100% từ `02_schema_config.md` §1.3–§1.4 |
| D4 | Lớp bind config `upload.*` | `02_schema_config.md` §3.1: `UploadProperties.java` | Không có trong whitelist WP nào | **KHÔNG tạo `UploadProperties.java`**; đọc bằng `@Value` trong service impl như §3.1 làm với `minio.*` |
| D5 | Nơi tạo index | `02_schema_config.md` §2.3: file mới `UploadSessionIndexInitializer.java` | `00_guardrails.md` §3 WP2: thêm `applyUploadSessionsIndexes()` vào `MongoIndexBootstrapConfig.java` (file này **đã tồn tại**, có sẵn 12 method `applyXxxIndexes()`) | **Theo whitelist: mở rộng `MongoIndexBootstrapConfig.java`** |
| D6 | Tên file bean S3 | `00_guardrails.md` §3 WP3: `S3Config.java` | `02_schema_config.md` §5.2: `S3StorageConfig.java` | **`S3Config.java`**; nội dung bean copy nguyên từ `02_schema_config.md` §5.2 |
| D7 | Property version AWS SDK | `00_guardrails.md` §3 WP3: `<awssdk.version>` | `02_schema_config.md` §5.1: `<aws.sdk.version>` + BOM import | **`<aws.sdk.version>` + BOM import** (đúng cách repo đang quản version); BOM chỉ nằm ở `dependencyManagement` nên không kéo dependency sang module khác |
| D8 | `fileSize` dữ liệu cũ | `02_schema_config.md` §6.2 gợi ý script `$toLong` | `../03_detailed_design.md` §WP7: `@Field(targetType = FieldType.INT64)`, **không migration** | **`@Field(targetType = FieldType.INT64)` + kiểu `Long`, KHÔNG chạy migration**. `00_guardrails.md` §4.4 coi như đã được trả lời cho riêng điểm này |
| D9 | Rule mồ côi `.claude/rules/backend-uploadservice.md` | — | `00_guardrails.md` §2.12 + §3 WP0 (row `D`) + `../03_detailed_design.md` §WP0 bước 3 | **Xoá** — người dùng đã duyệt (2026-09-01), là ngoại lệ hợp lệ của §2.12. Không còn là điểm lệch |
| D10 | PERF-04 (stream-to-disk khi download) | `00_guardrails.md` §3 WP5 nhắc "ngưỡng stream-to-disk theo `01_api_contract.md`" | `01_api_contract.md` **không định nghĩa** ngưỡng; DoD WP5 không có mục kiểm | **Ngoài phạm vi phase** (P2 — xem `05_traceability.md`). WP5 chỉ vá `contentType` (R4). Muốn làm ngay → STOP, hỏi người dùng |
| D11 | WP3 có được sửa `MinIoServiceImpl` không | `00_guardrails.md` §6 "DoD WP3" dòng cuối (còn sót): "`MinIoServiceImpl` **không bị sửa** trong WP3" | `00_guardrails.md` §2.3 + §3 WP3 (2 row mới) + §4.3 (ĐÃ GIẢI QUYẾT) + `01_api_contract.md` §E7 + `../03_detailed_design.md` §WP3 — **user chốt 2026-09-01** | **ĐƯỢC sửa trong WP3** theo đúng phạm vi `T-3.6`: xoá 4 helper cũ + rewire method multipart thành adapter gọi `StorageService`, TTL đồng nhất `clamp(partCount × 60s, 1h, 6h)`. Dòng DoD WP3 cũ đọc lại thành: "`MinIoServiceImpl` chỉ đổi đúng phạm vi `T-3.6`, hợp đồng E7 không đổi" |
| D12 | Thời điểm xoá helper cũ của `MinIoServiceImpl` | `02_schema_config.md` §5.3: "phase này E7 vẫn sống → **giữ nguyên** các method đó", xoá ở phase gỡ E7 | `00_guardrails.md` §3 WP3 + `01_api_contract.md` §E7 (bản duyệt 2026-09-01): xoá **ngay ở WP3** | **Xoá ngay ở WP3** (`T-3.6`). §5.3 của `02_schema_config.md` là bản trước quyết định — bỏ qua đoạn "giữ nguyên", phần còn lại (danh sách symbol cần xoá) vẫn dùng được |
| D13 | `AssetCreateResponseDto` bọc entity trực tiếp | `.claude/rules/backend-filehandler.md` #1 + `00_guardrails.md` §5: "không return entity trực tiếp" | `00_guardrails.md` §3 WP4 row `AssetCreateResponseDto` + `01_api_contract.md` §8 dòng cuối — **user duyệt 2026-09-01** | **Giữ shape entity-trong-DTO** (`asset: AssetEntity`, `version: MetadataEntity`) — nợ kỹ thuật đã duyệt, KHÔNG map sang DTO trong phase này (map lại sẽ phá client đang đọc `data.asset.assetId` / `data.version.objectName`). Ghi trong `05_traceability.md` §"khoảng trống đã biết" |

### 0.4 Thứ tự & song song

`WP0 → WP1 → WP2 → WP3 → WP4 → WP5`; `WP6`, `WP7` mở được sau khi WP2 xong nhưng **các task WP7 đụng DTO/E7 phải đợi WP4**. Không mở WP kế khi DoD WP hiện tại (`00_guardrails.md` §6) chưa xanh hết.

**Ràng buộc release (bắt buộc):** `T-4.8` (E1) và **toàn bộ WP5** phải ra **cùng một release** — chi tiết ở §9 cuối file.

### 0.5 Chạy `mc` mà không cài mc trên host

Container `minio-mc` là one-shot (chạy `init-bucket.sh` rồi thoát) → **không** `docker exec` được. Dùng container tạm trên mạng của MinIO:

```powershell
# Lấy tên network thật (thường là dockers_minio-network)
docker network ls --filter name=minio

# Hàm tiện dụng cho cả phiên (thay <root-user>/<root-pass> bằng giá trị trong server\dockers\.env)
function mcx {
  docker run --rm --network dockers_minio-network `
    -e MC_HOST_myminio="http://<root-user>:<root-pass>@minio:9000" `
    --entrypoint mc minio/mc:latest @args
}

mcx ls myminio/file-sharing
```

> Nếu mật khẩu root chứa ký tự đặc biệt (`@ : / #`) phải URL-encode trong `MC_HOST_myminio`.
> **Không** thêm volume/entry mới cho service `mc` trong `docker-compose.yml` để mount script — whitelist WP1 chỉ cho thêm **biến env** cho service `mc` (`00_guardrails.md` §3 WP1). Script chạy bằng `docker run -v` như ở `T-1.3`.

---

## WP0 — Gỡ `filesharing-uploadservice` (CLEAN-01)

DoD: `00_guardrails.md` §6 → "DoD WP0". Whitelist: §3 WP0 + delta D9.

### T-0.1 — Gỡ module `filesharing-uploadservice` khỏi reactor và khỏi đĩa
- Đọc trước: `00_guardrails.md` §3 WP0; `../03_detailed_design.md` §WP0; `01_user_requirement.md` §B.0 (CLEAN-01)
- Sửa/tạo:
  - `server/pom.xml` (S — xoá đúng 1 dòng `<module>filesharing-uploadservice</module>`, hiện là dòng 37)
  - `server/filesharing-uploadservice/` (D — xoá cả thư mục)
- Các bước:
  1. Xác nhận không module nào phụ thuộc: `rg -n "filesharing-uploadservice" E:\DaiCuongBK\Project3\FileSharing\server --glob "!**/target/**"` — chỉ được ra đúng `server/pom.xml`.
  2. Xoá dòng `<module>` trong `<modules>` của `server/pom.xml`. **Không** đụng `<dependencyManagement>`, `<properties>`, version Spring Boot.
  3. Xoá thư mục `server/filesharing-uploadservice/` (gồm `src/`, `pom.xml`, `mvnw.cmd`, `.mvn/`, `.gitignore`, `.gitattributes`, `target/`).
- Acceptance: `<modules>` còn đúng 6 module (core, filehandler, notification, videocodec, imagecodec, imagerawproccess); thư mục không còn tồn tại.
- Verify:
  ```powershell
  Test-Path E:\DaiCuongBK\Project3\FileSharing\server\filesharing-uploadservice   # -> False
  Select-String -Path E:\DaiCuongBK\Project3\FileSharing\server\pom.xml -Pattern "uploadservice"  # -> không dòng nào
  Select-String -Path E:\DaiCuongBK\Project3\FileSharing\server\pom.xml -Pattern "<module>"       # -> đúng 6 dòng
  ```
- Phụ thuộc: không

### T-0.2 — Xoá rule mồ côi `backend-uploadservice.md`
- Đọc trước: `00_guardrails.md` §2.12 (ngoại lệ đã duyệt) + §3 WP0 (row `D` cho chính file này); `../03_detailed_design.md` §WP0 bước 3
- Sửa/tạo: `.claude/rules/backend-uploadservice.md` (D — nằm trong whitelist WP0)
- Các bước:
  1. Xác nhận file chỉ mô tả module vừa gỡ (đọc lướt, không sửa).
  2. Kiểm tra không rule/agent nào tham chiếu tới nó: `rg -n "backend-uploadservice" E:\DaiCuongBK\Project3\FileSharing\.claude E:\DaiCuongBK\Project3\FileSharing\CLAUDE.md`.
  3. Xoá file. Không đụng bất kỳ file nào khác trong `.claude/`.
- Acceptance: file không còn; không còn tham chiếu trong `.claude/` và `CLAUDE.md`.
- Verify:
  ```powershell
  Test-Path E:\DaiCuongBK\Project3\FileSharing\.claude\rules\backend-uploadservice.md   # -> False
  rg -n "backend-uploadservice" E:\DaiCuongBK\Project3\FileSharing\.claude              # -> 0 kết quả
  ```
- Phụ thuộc: T-0.1

### T-0.3 — Build verify toàn reactor sau khi gỡ module
- Đọc trước: `00_guardrails.md` §6 "DoD WP0"
- Sửa/tạo: không sửa file nào (task kiểm chứng)
- Các bước:
  1. Build sạch toàn reactor.
  2. Đối chiếu Reactor Summary đủ 6 module.
  3. Quét tham chiếu còn sót ngoài `docs/` và `.claude/`.
- Acceptance: `BUILD SUCCESS`, Reactor Summary có đúng 6 dòng module, 0 tham chiếu còn sót.
- Verify:
  ```powershell
  mvn -f E:\DaiCuongBK\Project3\FileSharing\server\pom.xml clean install -DskipTests
  # -> BUILD SUCCESS; Reactor Summary: filesharing-core, -filehandler, -notification, -videocodec, -imagecodec, -imagerawproccess

  rg -n "filesharing-uploadservice|filesharinguploadservice" E:\DaiCuongBK\Project3\FileSharing `
     --glob "!docs/**" --glob "!.claude/**" --glob "!**/target/**"    # -> 0 kết quả
  ```
- Phụ thuộc: T-0.1, T-0.2

---

## WP1 — MinIO: service account scope hẹp + ILM (SEC-01, SEC-02, REL-03 tầng 1)

DoD: `00_guardrails.md` §6 → "DoD WP1". Whitelist: §3 WP1 + delta D2.

### T-1.1 — [RỦI RO] Xác minh cú pháp `mc ilm` và `mc admin user svcacct` trên image đang dùng
- Đọc trước: `02_schema_config.md` §4.3(b); `../03_detailed_design.md` bảng Rủi ro dòng "Cú pháp `mc ilm` khác nhau giữa các bản mc"
- Sửa/tạo: không sửa file nào (task khảo sát, phải chạy TRƯỚC khi viết script)
- Các bước:
  1. Dựng hàm `mcx` theo §0.5 file này.
  2. Kiểm tra `mc ilm import` và `mc ilm rule add` có tồn tại và nhận flag nào.
  3. Kiểm tra `mc admin user svcacct add|edit|info|ls` có nhận `--policy <file>`.
  4. Ghi kết luận vào báo cáo task: dùng **đường chính** `mc ilm import` (JSON) hay flag shorthand.
- Acceptance: biết chắc 2 điều — (a) `mc ilm import` nhận JSON chuẩn S3 trên image `minio/mc:latest` hiện tại; (b) `svcacct add --policy <file>` hợp lệ. Nếu (a) **không** tồn tại → STOP, hỏi người dùng trước khi đổi sang shorthand.
- Verify:
  ```powershell
  mcx ilm --help
  mcx ilm import --help
  mcx ilm rule add --help          # tìm --expire-abort-incomplete-multipart-upload
  mcx admin user svcacct add --help
  # -> ghi lại nguyên văn phần USAGE/FLAGS vào báo cáo task
  ```
- Phụ thuộc: T-0.3

### T-1.2 — Tạo 2 file policy JSON cho service account
- Đọc trước: `02_schema_config.md` §4.2 (nội dung 2 policy) + §4.3(a) (lý do có `StatAndReconcile` + `ListIncompleteUploads`); `00_guardrails.md` §3 WP1
- Sửa/tạo:
  - `server/dockers/config/policy-svc-upload.json` (N)
  - `server/dockers/config/policy-svc-download.json` (N)
- Các bước:
  1. Copy nguyên văn 2 khối JSON policy trong `02_schema_config.md` §4.2, thay `${BUCKET_FILES}` bằng **`file-sharing`** (bucket thật — `00_guardrails.md` §3 WP1 ghi chú và §4.9a).
  2. Giữ đủ 3 statement của `svc-upload` (`MultipartWrite`, `StatAndReconcile`, `ListIncompleteUploads`) — thiếu 2 statement sau thì E4 (`HeadObject`) và `UploadReconcileJob` sẽ nhận `AccessDenied`.
  3. Không thêm action nào ngoài danh sách trong §4.2.
- Acceptance: 2 file JSON parse được, ARN trỏ đúng `arn:aws:s3:::file-sharing/*` (và `arn:aws:s3:::file-sharing` cho statement list).
- Verify:
  ```powershell
  Get-Content E:\DaiCuongBK\Project3\FileSharing\server\dockers\config\policy-svc-upload.json   | ConvertFrom-Json
  Get-Content E:\DaiCuongBK\Project3\FileSharing\server\dockers\config\policy-svc-download.json | ConvertFrom-Json
  # -> không lỗi parse; Statement[].Resource chứa "arn:aws:s3:::file-sharing/*"
  ```
- Phụ thuộc: T-1.1

### T-1.3 — Viết và chạy `init-upload-hardening.sh` (2 service account + ILM 7 ngày)
- Đọc trước: `02_schema_config.md` §4.1, §4.2 (script nguyên văn), §4.4 (điều KHÔNG làm); delta **D2** §0.3
- Sửa/tạo: `server/dockers/scripts/init-upload-hardening.sh` (N)
- Các bước:
  1. Copy **nguyên văn** script ở `02_schema_config.md` §4.2. Giữ nguyên biến mặc định (`ALIAS_NAME=myminio`, `BUCKET_FILES=file-sharing`).
  2. Nếu `T-1.1` kết luận `mc ilm import` khả dụng → giữ bước 4 của script; nếu không → STOP (không tự đổi sang shorthand).
  3. **Không** sửa `init-bucket.sh`, không thêm volume vào `docker-compose.yml` (§0.5).
  4. Chạy script bằng container tạm có mount thư mục `scripts`.
  5. Đọc output bước `[5/5] Verify`, ghi 4 giá trị key vào báo cáo (secret chỉ ghi "đã set").
- Acceptance: script chạy exit code 0; output in ra dòng tạo `svc-upload` và `svc-download`; `mc ilm rule ls` hiện rule `abort-incomplete-multipart-7d` với `AbortIncompleteMultipartUpload = 7 days`.
- Verify:
  ```powershell
  docker run --rm --network dockers_minio-network `
    -v "E:\DaiCuongBK\Project3\FileSharing\server\dockers\scripts:/scripts:ro" `
    -e MINIO_HOST=http://minio:9000 `
    -e MINIO_ROOT_USER=<root-user> -e MINIO_ROOT_PASSWORD=<root-pass> `
    --entrypoint sh minio/mc:latest /scripts/init-upload-hardening.sh
  # -> exit 0, in "[3/5] Tạo service account svc-upload" ... "[5/5] Verify"

  mcx ilm rule ls myminio/file-sharing        # -> 1 rule, AbortIncompleteMultipartUpload = 7 days
  mcx admin user svcacct ls myminio <root-user>   # -> có svcuploadfsharing và svcdownloadfsharing
  ```
- Phụ thuộc: T-1.2

### T-1.4 — Nạp 4 key service account vào `.env` + `application.yml`
- Đọc trước: `02_schema_config.md` §3 (khối YAML `minio.svc-*`) + ghi chú `ignoreUnknownFields`; `00_guardrails.md` §3 WP1
- Sửa/tạo:
  - `server/dockers/.env` (S — chỉ **thêm** 4 biến mới, cấm sửa/xoá biến đang có)
  - `server/filesharing-filehandler/src/main/resources/application.yml` (S — chỉ thêm nhánh `minio.svc-upload.*`, `minio.svc-download.*`)
- Các bước:
  1. Thêm `MINIO_SVC_UPLOAD_ACCESS_KEY`, `MINIO_SVC_UPLOAD_SECRET_KEY`, `MINIO_SVC_DOWNLOAD_ACCESS_KEY`, `MINIO_SVC_DOWNLOAD_SECRET_KEY` vào `.env` với đúng giá trị `T-1.3` đã tạo.
  2. Chèn khối `minio.svc-upload` / `minio.svc-download` (copy nguyên văn `02_schema_config.md` §3) vào **trong** block `minio:` sẵn có. **Không** đụng `minio.access-key`, `minio.secret-key`, `minio.endpoint`, `minio.buckets.*`.
  3. Khởi động filehandler, xác nhận không lỗi bind property.
- Acceptance: 4 key có mặt trong `application.yml`; filehandler khởi động bình thường; `minio.buckets.files` vẫn là `file-sharing`.
- Verify:
  ```powershell
  Select-String -Path E:\DaiCuongBK\Project3\FileSharing\server\filesharing-filehandler\src\main\resources\application.yml `
    -Pattern "svc-upload|svc-download"        # -> 6 dòng (2 nhánh + 4 key)
  mvn -f E:\DaiCuongBK\Project3\FileSharing\server\pom.xml spring-boot:run -pl filesharing-filehandler
  # -> app UP, không có "Failed to bind properties under 'minio'"
  ```
- Phụ thuộc: T-1.3

### T-1.5 — Kiểm chứng scope ÂM của 2 service account
- Đọc trước: `00_guardrails.md` §6 "DoD WP1" (2 mục kiểm chứng scope âm); `01_user_requirement.md` §B.1 SEC-01
- Sửa/tạo: không sửa file nào (task kiểm chứng)
- Các bước:
  1. Tạo alias tạm bằng key `svc-upload`, thử `ls` bucket (phải bị từ chối) và `cp` một file nhỏ (phải thành công).
  2. Tạo alias tạm bằng key `svc-download`, thử `cp` (phải bị từ chối) và `cat` một object đã có (phải ra nội dung).
  3. Dọn đúng object test vừa tạo (`00_guardrails.md` §2.10 — chỉ xoá object mình tạo).
- Acceptance: `svc-upload`: `ls` → `AccessDenied`, `cp` → OK. `svc-download`: `cp` → `AccessDenied`, `cat` → OK.
- Verify:
  ```powershell
  "scope-test" | Out-File -Encoding ascii E:\tmp\scope-test.txt

  function mcu { docker run --rm -v "E:\tmp:/data" --network dockers_minio-network `
    -e MC_HOST_up="http://svcuploadfsharing:<upload-secret>@minio:9000" --entrypoint mc minio/mc:latest @args }
  mcu ls up/file-sharing                                  # -> AccessDenied
  mcu cp /data/scope-test.txt up/file-sharing/scope-test.txt   # -> thành công

  function mcd { docker run --rm -v "E:\tmp:/data" --network dockers_minio-network `
    -e MC_HOST_dn="http://svcdownloadfsharing:<download-secret>@minio:9000" --entrypoint mc minio/mc:latest @args }
  mcd cp /data/scope-test.txt dn/file-sharing/scope-test2.txt   # -> AccessDenied
  mcd cat dn/file-sharing/scope-test.txt                        # -> "scope-test"

  mcx rm myminio/file-sharing/scope-test.txt              # dọn đúng object test
  ```
- Phụ thuộc: T-1.4

---

## WP2 — `upload_sessions` + `UploadSessionService` (SEC-02/03/08, PERF-02, REL-05)

DoD: `00_guardrails.md` §6 → "DoD WP2" (đọc "4 mã mới" thành "7 mã" — delta D1). Whitelist: §3 WP2 + delta D1, D3, D4, D5.

### T-2.1 — Thêm 7 `ErrorCode` mới (dải 55xx) vào core
- Đọc trước: `01_api_contract.md` §9.1 (4 mã), §9.2 (3 mã đã duyệt), §9.3 (mã tái sử dụng — **không** thêm mới); `.claude/rules/backend-core.md`
- Sửa/tạo: `server/filesharing-core/src/main/java/com/file/service/filesharing/core/exceptions/ErrorCode.java` (S)
- Các bước:
  1. Thêm đúng 7 constant ở cuối enum, trước dấu `;`, theo format hiện có `NAME("code", "message", HttpStatus.XXX)` — giá trị `code`/`message`/`httpStatus` copy nguyên bảng §9.1 + §9.2.
  2. Không đổi/không xoá mã cũ; không thêm mã thứ 8.
  3. `mvn install -pl filesharing-core`.
- Acceptance: enum có `SESSION_NOT_FOUND`, `UPLOAD_INCOMPLETE`, `SIZE_MISMATCH`, `CHECKSUM_MISMATCH`, `SESSION_INVALID_STATE`, `SESSION_LIMIT_EXCEEDED`, `FILE_NOT_READY`; mã 5501–5507; build core PASS.
- Verify:
  ```powershell
  rg -n "550[1-7]" E:\DaiCuongBK\Project3\FileSharing\server\filesharing-core\src\main\java\com\file\service\filesharing\core\exceptions\ErrorCode.java
  # -> đúng 7 dòng
  mvn -f E:\DaiCuongBK\Project3\FileSharing\server\pom.xml install -pl filesharing-core -DskipTests   # -> BUILD SUCCESS
  ```
- Phụ thuộc: T-1.5

### T-2.2 — Thêm 2 enum `UploadSessionStatus` và `UploadMode` vào core
- Đọc trước: `02_schema_config.md` §1.1 (vị trí) + §1.2 (nội dung 2 enum); `01_api_contract.md` §0.3 (enum serialize dạng string uppercase)
- Sửa/tạo:
  - `server/filesharing-core/src/main/java/com/file/service/filesharing/core/enums/UploadSessionStatus.java` (N)
  - `server/filesharing-core/src/main/java/com/file/service/filesharing/core/enums/UploadMode.java` (N)
- Các bước:
  1. Tạo 2 enum đúng nguyên văn §1.2 (không thêm field, không thêm constructor, không thêm hằng số nào khác).
  2. `mvn install -pl filesharing-core`.
  > `UploadMode.java` là delta so với whitelist WP2 (whitelist chỉ liệt kê `UploadSessionStatus`) — đã chốt vì `01_api_contract.md` E1.2/E3.2 bắt buộc có enum này. Không cần hỏi lại.
- Acceptance: 2 enum tồn tại đúng package `com.file.service.filesharing.core.enums`; `UploadSessionStatus` có đúng 5 constant, `UploadMode` có đúng 2.
- Verify:
  ```powershell
  rg -n "INITIATED|UPLOADING|COMPLETED|ABORTED|EXPIRED" E:\DaiCuongBK\Project3\FileSharing\server\filesharing-core\src\main\java\com\file\service\filesharing\core\enums\UploadSessionStatus.java
  mvn -f E:\DaiCuongBK\Project3\FileSharing\server\pom.xml install -pl filesharing-core -DskipTests   # -> BUILD SUCCESS
  ```
- Phụ thuộc: T-2.1

### T-2.3 — Thêm block `upload:` vào `application.yml`
- Đọc trước: `02_schema_config.md` §3 (khối YAML + bảng ý nghĩa key + cảnh báo hậu tố `s` của `Duration`), §3.2 (hằng số KHÔNG đưa vào config); delta **D4** §0.3
- Sửa/tạo: `server/filesharing-filehandler/src/main/resources/application.yml` (S)
- Các bước:
  1. Thêm block top-level `upload:` (ngang hàng `minio:`) với đủ 6 key ở §3. Giữ hậu tố `s` cho `part-url-ttl` và `session-idle-ttl`.
  2. **Không** tạo `UploadProperties.java` (delta D4) — service impl đọc bằng `@Value("${upload.xxx}")`.
  3. Khởi động filehandler xác nhận không lỗi bind.
- Acceptance: 6 key có mặt; app khởi động OK; giá trị mặc định đúng bảng §3 (`max-file-size: 53687091200`, `part-url-ttl: 900s`, `max-threads: 6`, `session-idle-ttl: 86400s`, `max-sessions-per-user: 20`, `verify-etag-md5: true`).
- Verify:
  ```powershell
  Select-String -Path E:\DaiCuongBK\Project3\FileSharing\server\filesharing-filehandler\src\main\resources\application.yml `
    -Pattern "max-file-size|part-url-ttl|max-threads|session-idle-ttl|max-sessions-per-user|verify-etag-md5"
  # -> đúng 6 dòng
  ```
- Phụ thuộc: T-2.2

### T-2.4 — Tạo `UploadSessionEntity` + `UploadSessionRepo`
- Đọc trước: `02_schema_config.md` §1.3 (bảng 16 field), §1.4 (khung entity), §1.5 (ADR TTL 172800), ghi chú `Map<Integer,String>`; delta **D3** §0.3
- Sửa/tạo:
  - `server/filesharing-core/src/main/java/com/file/service/filesharing/core/entity/models/UploadSessionEntity.java` (N — theo whitelist, delta D3)
  - `server/filesharing-filehandler/src/main/java/org/example/filesharing/repositories/UploadSessionRepo.java` (N)
- Các bước:
  1. Tạo entity với **đúng 16 field** §1.3, đúng kiểu, đúng annotation (`@Document(collection = "upload_sessions")`, `@Id`, 2 `@Indexed` có `name`). Không thêm field thứ 17 (`abortedAt` suy từ `completedAt` — §1.3 bảng "giá trị API").
  2. Entity **không** extend `EntityAuditBase` và không dùng `@CreatedDate` (§1.3 dòng `createdAt`).
  3. `UploadSessionRepo extends MongoRepository<UploadSessionEntity, String>` — phase này chưa cần query method nào (query cho GC thêm ở `T-6.2`, cho giới hạn session ở `T-7.6`).
  4. `mvn install -pl filesharing-core` rồi build filehandler.
- Acceptance: entity compile, 16 field, đúng package theo D3; repo compile; chưa có method thừa.
- Verify:
  ```powershell
  rg -c "private " E:\DaiCuongBK\Project3\FileSharing\server\filesharing-core\src\main\java\com\file\service\filesharing\core\entity\models\UploadSessionEntity.java
  # -> 16
  mvn -f E:\DaiCuongBK\Project3\FileSharing\server\pom.xml install -pl filesharing-core -DskipTests
  mvn -f E:\DaiCuongBK\Project3\FileSharing\server\pom.xml install -pl filesharing-filehandler -DskipTests   # -> BUILD SUCCESS
  ```
- Phụ thuộc: T-2.3

### T-2.5 — Tạo `UploadSessionService` + `UploadSessionServiceImpl` (create/get/touch/markCompleted/markAborted + công thức partSize)
- Đọc trước: `01_api_contract.md` §0.5 (hằng số + công thức partSize), §0.7 (nguyên tắc get + ownership), E2.4 (sliding TTL); `02_schema_config.md` §1.3 (`uploadMode` suy ra từ `uploadId`), §3.2 (hằng số là `static final`); `.claude/rules/backend-filehandler.md`
- Sửa/tạo:
  - `server/filesharing-filehandler/src/main/java/org/example/filesharing/services/UploadSessionService.java` (N)
  - `server/filesharing-filehandler/src/main/java/org/example/filesharing/services/impl/UploadSessionServiceImpl.java` (N)
- Các bước:
  1. Interface: `create(...)`, `get(sessionId, currentUserId)`, `touch(session)`, `markCompleted(...)`, `markAborted(...)` — chữ ký nhận `sessionId`-centric, **không** nhận `objectName`/`uploadId` từ tầng trên (`02_schema_config.md` §5.2 lưu ý 2).
  2. Impl: khai `PART_SIZE_STEPS`, `SMALL_FILE_THRESHOLD`, `S3_MAX_PARTS`, trần cứng 7 ngày là `private static final` (§3.2); đọc `upload.*` bằng `@Value`.
  3. `computePartSize(declaredSize)` theo đúng công thức `01_api_contract.md` §0.5, làm tròn LÊN nấc {8,16,32,64} MiB; `partCount = ceil(declaredSize / partSize)`; `declaredSize <= SMALL_FILE_THRESHOLD` → `uploadMode = SINGLE`, `partSize = declaredSize`, `partCount = 1`.
  4. `get(...)`: không thấy / `EXPIRED` / `expiresAt < now` → `FileBusinessException(ErrorCode.SESSION_NOT_FOUND)`; `ownerId != currentUserId` → `FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR)` — **trước** mọi thao tác storage.
  5. `touch(...)`: `expiresAt = min(now + session-idle-ttl, hardExpiresAt)`, `INITIATED → UPLOADING`. Không touch khi `COMPLETED`/`ABORTED`.
  6. `create(...)`: validate `0 < declaredSize <= upload.max-file-size` → vượt thì `BAD_REQUEST` kèm giới hạn (message mẫu `01_api_contract.md` E1.3); set `createdAt`, `expiresAt`, `hardExpiresAt = createdAt + 7d`, `status = INITIATED`. Việc gọi `CreateMultipartUpload` để lấy `uploadId` nối ở `T-4.8` (WP3/WP4).
  7. Cấm `RuntimeException`/`IllegalArgumentException` (`.claude/rules/backend-filehandler.md` #4).
- Acceptance: bảng partSize đúng — `10 MiB → 8 MiB`; `8 MiB → SINGLE`; `50 GiB → 8 MiB`; `100 GiB → 16 MiB`; `200 GiB → 32 MiB`; `400 GiB → 64 MiB`; mọi trường hợp `partCount ≤ 10000`. `declaredSize` vượt `max-file-size` → không insert document nào.
- Verify:
  ```powershell
  mvn -f E:\DaiCuongBK\Project3\FileSharing\server\pom.xml install -pl filesharing-filehandler -DskipTests  # -> BUILD SUCCESS
  # Kiểm bảng partSize: tạm log DEBUG trong create(...) HOẶC kiểm qua E1 sau T-4.8; ghi kết quả thật vào 04_verification.md §2
  docker exec filesharing-mongodb mongosh "mongodb://admin:admin123456@localhost:27017/metadata?authSource=admin" `
    --quiet --eval "db.upload_sessions.countDocuments({})"   # -> 0 khi test vượt max-file-size
  ```
- Phụ thuộc: T-2.4

### T-2.6 — Thêm `applyUploadSessionsIndexes()` vào `MongoIndexBootstrapConfig`
- Đọc trước: `02_schema_config.md` §2.1 (4 index chốt), §2.2 (mongosh kiểm tra), §2.3 (cảnh báo `auto-index-creation` — **không bật**); delta **D5** §0.3
- Sửa/tạo: `server/filesharing-filehandler/src/main/java/org/example/filesharing/configurations/MongoIndexBootstrapConfig.java` (S)
- Các bước:
  1. Thêm method `applyUploadSessionsIndexes()` theo đúng style 12 method `applyXxxIndexes()` đang có (`mongoTemplate.indexOps("upload_sessions")` + `ops.createIndex(new Index()...)`).
  2. Tạo đúng 4 index §2.1 với đúng tên: `idx_upload_sessions_ttl` (`.expire(Duration.ofSeconds(172800))` — **không** `Duration.ZERO`), `idx_upload_sessions_owner_status`, `idx_upload_sessions_status_expires`, `idx_upload_sessions_upload_id` (`.sparse()`).
  3. Gọi method mới trong `mongoIndexBootstrapRunner()`, đặt trước dòng `log.info("Mongo indexes bootstrap completed.")`.
  4. **Không** bật `spring.data.mongodb.auto-index-creation`, **không** tạo file initializer riêng (D5).
- Acceptance: app khởi động log `Mongo indexes bootstrap completed.`; `getIndexes()` trả 4 index mới + `_id_`; TTL index có `expireAfterSeconds: 172800`.
- Verify:
  ```powershell
  docker exec filesharing-mongodb mongosh "mongodb://admin:admin123456@localhost:27017/metadata?authSource=admin" `
    --quiet --eval "db.upload_sessions.getIndexes()"
  # -> có idx_upload_sessions_ttl { expiresAt: 1 }, expireAfterSeconds: 172800
  #    idx_upload_sessions_owner_status, idx_upload_sessions_status_expires, idx_upload_sessions_upload_id (sparse: true)
  ```
- Phụ thuộc: T-2.5

---

## WP3 — `StorageService` trên AWS SDK v2 (PERF-05, SEC-06)

DoD: `00_guardrails.md` §6 → "DoD WP3" (đọc dòng cuối theo delta **D11**). Whitelist: §3 WP3 + delta D6, D7, D11, D12.

**Quyết định 2026-09-01 (đảo quyết định cũ):** `MinIoService.java` / `MinIoServiceImpl.java` **NẰM TRONG whitelist WP3**. Xoá 4 helper cũ và rewire method multipart thành adapter trên `StorageService` — làm ở `T-3.6`, **sau** khi `StorageService` chạy được và **sau** khi đã chụp baseline E7. Ba task `T-3.3`–`T-3.5` vẫn không chạm 2 file này (xây song song trước, rewire sau).

### T-3.1 — Thêm dependency `software.amazon.awssdk:s3`
- Đọc trước: `02_schema_config.md` §5.1; `00_guardrails.md` §2.4 (cấm thêm dependency khác); delta **D7** §0.3
- Sửa/tạo:
  - `server/pom.xml` (S — property `<aws.sdk.version>` + BOM import trong `dependencyManagement`)
  - `server/filesharing-filehandler/pom.xml` (S — đúng 1 `<dependency>` `s3`, không ghi version)
- Các bước:
  1. Thêm `<aws.sdk.version>` vào `<properties>` của `server/pom.xml`; chốt version cụ thể tại thời điểm build (mốc tham chiếu §5.1) và ghim vào property.
  2. Thêm BOM `software.amazon.awssdk:bom` `<type>pom</type><scope>import</scope>` vào `dependencyManagement`.
  3. Thêm dependency `s3` vào `filesharing-filehandler/pom.xml`. **Không** thêm `s3-transfer-manager`, `netty-nio-client`, hay bất kỳ artifact awssdk nào khác.
  4. Giữ nguyên `io.minio:minio` (`02_schema_config.md` §5.1 — `MinIoServiceImpl` còn dùng).
- Acceptance: chỉ đúng 1 artifact awssdk được khai báo trực tiếp ở filehandler; các module khác không kéo thêm dependency mới.
- Verify:
  ```powershell
  mvn -f E:\DaiCuongBK\Project3\FileSharing\server\pom.xml dependency:tree -pl filesharing-filehandler | Select-String "software.amazon.awssdk"
  # -> có :s3:; KHÔNG có s3-transfer-manager / netty-nio-client khai báo trực tiếp
  mvn -f E:\DaiCuongBK\Project3\FileSharing\server\pom.xml clean install -DskipTests   # -> BUILD SUCCESS
  ```
- Phụ thuộc: T-2.6

### T-3.2 — [RỦI RO — CHẶN WP5] Smoke test: MinIO có validate `Content-MD5` trên presigned PUT không?
- Đọc trước: `01_api_contract.md` mục "Hợp đồng PUT part" (dòng `MD5 sai → 400 BadDigest`); `02_schema_config.md` §5.2 lưu ý 1 (không set `contentMD5` lúc presign); `../03_detailed_design.md` bảng Rủi ro dòng `Content-MD5`
- Sửa/tạo: **không sửa file nào trong repo**. Script tạm đặt ngoài repo: `E:\tmp\upload-v2-smoke\md5-probe.jsh`
- Các bước:
  1. Xuất classpath của filehandler: `mvn ... dependency:build-classpath -Dmdep.outputFile=E:\tmp\upload-v2-smoke\cp.txt`.
  2. Viết snippet `jshell` (Java 21 có sẵn) dùng `S3Client` + `S3Presigner` với key `svc-upload` (endpoint `http://localhost:9000`, `forcePathStyle(true)`, region `us-east-1` — cấu hình y hệt `02_schema_config.md` §5.2): `createMultipartUpload` cho object test `smoke-md5-probe.bin` → `presignUploadPart(partNumber=1)`.
  3. Tạo 1 part ≥ 5 MiB ở `E:\tmp\upload-v2-smoke\part1.bin`, tính MD5 base64.
  4. `curl.exe` PUT part với `Content-MD5` **đúng** → kỳ vọng `200` + header `ETag`.
  5. `curl.exe` PUT lại part đó với `Content-MD5` **sai cố ý** → kỳ vọng `400` và body chứa `BadDigest`.
  6. `abortMultipartUpload` để dọn; xoá file tạm ở `E:\tmp`.
  7. **Nếu bước 5 trả 200 (MinIO KHÔNG validate) → STOP ngay**, báo người dùng: SEC-06 phải chuyển sang ký kèm MD5 lúc presign, tức **đổi hợp đồng E2** (client khai md5 trước khi xin URL).
- Acceptance: có bằng chứng nguyên văn 2 status code (200 và 400 `BadDigest`) dán vào báo cáo task và vào `04_verification.md` §2.
- Verify:
  ```powershell
  mvn -f E:\DaiCuongBK\Project3\FileSharing\server\pom.xml dependency:build-classpath -pl filesharing-filehandler `
      -Dmdep.outputFile=E:\tmp\upload-v2-smoke\cp.txt -q
  jshell --class-path (Get-Content E:\tmp\upload-v2-smoke\cp.txt) E:\tmp\upload-v2-smoke\md5-probe.jsh

  # MD5 base64 của part
  $b = [IO.File]::ReadAllBytes("E:\tmp\upload-v2-smoke\part1.bin")
  $b64 = [Convert]::ToBase64String([Security.Cryptography.MD5]::Create().ComputeHash($b))

  curl.exe -s -D - -o NUL -X PUT --upload-file E:\tmp\upload-v2-smoke\part1.bin -H "Content-MD5: $b64" "<presigned-url>"
  # -> HTTP/1.1 200 OK + ETag
  curl.exe -s -D - -X PUT --upload-file E:\tmp\upload-v2-smoke\part1.bin -H "Content-MD5: AAAAAAAAAAAAAAAAAAAAAA==" "<presigned-url>"
  # -> HTTP/1.1 400 + <Code>BadDigest</Code>
  ```
- Phụ thuộc: T-3.1

### T-3.3 — Tạo bean config `S3Config` (S3Client + uploadPresigner + downloadPresigner)
- Đọc trước: `02_schema_config.md` §5.2 (code bean nguyên văn + danh sách import + ràng buộc `@Qualifier`), §3.1 (đọc key bằng `@Value`); delta **D6** §0.3
- Sửa/tạo: `server/filesharing-filehandler/src/main/java/org/example/filesharing/configurations/S3Config.java` (N)
- Các bước:
  1. Copy nguyên nội dung lớp ở §5.2, đổi **tên lớp** thành `S3Config` (D6). Giữ nguyên tên 3 bean: `s3Client`, `uploadPresigner`, `downloadPresigner`.
  2. Đọc endpoint/key bằng `@Value` đúng 6 dòng ở §3.1.
  3. **Không** sửa `filesharing-core/.../config/MinIOConfig.java` (bean `MinioClient` dùng chung với codec — `00_guardrails.md` §3 WP3).
  4. **Không** set `contentMD5(...)` khi presign (§5.2 lưu ý 1).
- Acceptance: app khởi động, 3 bean được tạo, không `NoUniqueBeanDefinitionException`.
- Verify:
  ```powershell
  mvn -f E:\DaiCuongBK\Project3\FileSharing\server\pom.xml spring-boot:run -pl filesharing-filehandler
  # -> app UP; log không có NoUniqueBeanDefinitionException / UnsatisfiedDependencyException
  rg -n "contentMD5" E:\DaiCuongBK\Project3\FileSharing\server\filesharing-filehandler\src\main\java   # -> 0 kết quả
  ```
- Phụ thuộc: T-3.2

### T-3.4 — Tạo `StorageService` + `S3StorageServiceImpl` (7 thao tác)
- Đọc trước: `00_guardrails.md` §3 WP3 (danh sách 7 method); `../03_detailed_design.md` §WP3 bảng "Thao tác"; `01_api_contract.md` E6.4 (TTL download `clamp(fileSize/1_000_000, 900, 14400)`), §0.5; `02_schema_config.md` §5.2 lưu ý 2
- Sửa/tạo:
  - `server/filesharing-filehandler/src/main/java/org/example/filesharing/services/StorageService.java` (N)
  - `server/filesharing-filehandler/src/main/java/org/example/filesharing/services/impl/S3StorageServiceImpl.java` (N)
- Các bước:
  1. Interface đúng 7 thao tác: `createMultipartUpload`, `presignUploadPart`, `listParts`, `completeMultipartUpload`, `abortMultipartUpload`, `headObject`, `presignGetObject`.
  2. Impl inject `S3Client` + `@Qualifier("uploadPresigner")` / `@Qualifier("downloadPresigner")` (bắt buộc — §5.2).
  3. Bucket lấy từ `@Value("${minio.buckets.files}")`; TTL part URL từ `upload.part-url-ttl`; TTL download theo công thức `01_api_contract.md` E6.4.
  4. Mọi lỗi SDK (`S3Exception`, `SdkException`) → bọc thành `FileBusinessException(ErrorCode.FILE_ERROR, "<message theo bảng lỗi contract>")`. Cấm `RuntimeException`.
  5. Log tối đa `objectName` + `partNumber` + status; **cấm log URL** (`00_guardrails.md` §2.15).
  6. **Chưa** chạm `MinIoService`/`MinIoServiceImpl` ở task này — `StorageService` phải chạy độc lập trước; việc rewire E7 nằm ở `T-3.6`.
- Acceptance: build PASS; `git diff --name-only` của **riêng task này** không chứa `MinIoService*.java` (2 file đó chỉ đổi ở `T-3.6`).
- Verify:
  ```powershell
  mvn -f E:\DaiCuongBK\Project3\FileSharing\server\pom.xml install -pl filesharing-filehandler -DskipTests  # -> BUILD SUCCESS
  git -C E:\DaiCuongBK\Project3\FileSharing diff --name-only | Select-String "MinIoService"   # -> 0 kết quả
  rg -n "log\.(info|debug|warn).*[Uu]rl" E:\DaiCuongBK\Project3\FileSharing\server\filesharing-filehandler\src\main\java\org\example\filesharing\services\impl\S3StorageServiceImpl.java  # -> 0
  ```
- Phụ thuộc: T-3.3

### T-3.5 — Smoke end-to-end tầng storage (2 part thật + listParts + complete + headObject + presign GET)
- Đọc trước: `00_guardrails.md` §6 "DoD WP3" (5 mục)
- Sửa/tạo: không sửa file repo (script tạm ở `E:\tmp\upload-v2-smoke\`)
- Các bước:
  1. Dùng lại cách chạy `jshell` của `T-3.2`, nhưng gọi qua các method của `S3StorageServiceImpl` (hoặc SDK trực tiếp với cùng cấu hình) trên object test `smoke-storage.bin`.
  2. `createMultipartUpload` → presign part 1 & 2 → `curl.exe --upload-file` cả 2 (kèm `Content-MD5`) → `listParts` → `completeMultipartUpload` → `headObject`.
  3. Presign GET bằng `downloadPresigner`, thử `curl -I` (kỳ vọng 200) và thử PUT bằng chính URL đó (kỳ vọng 403).
  4. Dọn: xoá object test.
- Acceptance: `listParts` trả đúng 2 part kèm size/etag; `mc stat` size == tổng 2 part; `headObject.contentLength` khớp `mc stat`; URL download GET 200 / PUT 403.
- Verify:
  ```powershell
  mcx stat myminio/file-sharing/smoke-storage.bin      # -> Size khớp tổng 2 part
  curl.exe -s -o NUL -w "%{http_code}`n" -I "<presigned-get-url>"                 # -> 200
  curl.exe -s -o NUL -w "%{http_code}`n" -X PUT --upload-file E:\tmp\upload-v2-smoke\part1.bin "<presigned-get-url>"  # -> 403
  mcx rm myminio/file-sharing/smoke-storage.bin
  mcx ls --incomplete myminio/file-sharing             # -> trống
  ```
- Phụ thuộc: T-3.4

### T-3.6 — Rewire `MinIoServiceImpl` thành adapter trên `StorageService` + xoá 4 helper cũ (E7 giữ nguyên hợp đồng)
- Đọc trước: `00_guardrails.md` §2.3 (điều được phép / bị cấm với E7), §3 WP3 (2 row `MinIoService*`), §4.3 (đã giải quyết); `01_api_contract.md` §E7 (đoạn "Thay đổi được duyệt" + bảng 3 endpoint); `../03_detailed_design.md` §WP3 dòng "Quyết định (user chốt 2026-09-01)"; `02_schema_config.md` §5.3 (danh sách symbol — **bỏ qua** câu "giữ nguyên", xem delta D12); `01_user_requirement.md` §A.3 bước 1–2 + §A.6 P4, R2
- Sửa/tạo:
  - `server/filesharing-filehandler/src/main/java/org/example/filesharing/services/MinIoService.java` (S)
  - `server/filesharing-filehandler/src/main/java/org/example/filesharing/services/impl/MinIoServiceImpl.java` (S)
- Các bước:
  1. **Chụp baseline E7 TRƯỚC khi sửa** (nếu chưa có): 3 lời gọi legacy → lưu body + HTTP status vào `E:\tmp\upload-v2-smoke\e7-baseline\` (dùng lại ở `T-4.2`/`T-4.11`).
  2. Rewire 4 method multipart của `MinIoServiceImpl` (`initiateMultipartUpload`, `getPresignedUrlForPart`, `completeMultipartUpload`, `abortMultipartUpload`) thành **adapter mỏng** gọi `StorageService` (`T-3.4`). Không đổi chữ ký public nào mà controller E7 đang gọi ngoài kiểu `Double`→`long` (đổi kiểu làm ở `T-7.4` để tách rủi ro — task này giữ nguyên chữ ký).
  3. TTL part URL: **đồng nhất** `clamp(partCount × 60s, 1h, 6h)` cho cả lô, thay công thức theo `partNumber`. Vẫn sinh trước toàn bộ part URL như cũ (đó là phần **hợp đồng** với client cũ).
  4. Xoá `calculateExpireTime`, `extractUploadIdFromXml`, `buildCompleteMultipartUploadXml`, field `OkHttpClient httpClient` (và hằng `CHUNK_SIZE` nếu đã hết caller). Nếu còn caller ngoài E7 → **STOP**, báo người dùng.
  5. `MinIoService.java`: bỏ khỏi interface những method multipart không còn caller ngoài adapter E7; **giữ** `uploadSmallFile`, `deleteFile`, HLS, presigned-download.
  6. **Không** đổi URL / request body / response schema / HTTP status của 3 endpoint E7 (§2.3). Không thêm kiểm quyền.
  7. Log: chỉ `objectName`/`uploadId`/`partCount`; **cấm log URL** (dòng log URL cũ có thể xoá luôn ở đây, phần còn lại dọn ở `T-7.4`).
- Acceptance: 4 symbol cũ biến mất khỏi repo; `OkHttpClient` không còn được dùng trong `MinIoServiceImpl`; 3 endpoint E7 trả **đúng schema + đúng HTTP status** như baseline bước 1; upload legacy file > 2 GiB không còn sinh thiếu part URL (R2 khép ở đường legacy).
- Verify:
  ```powershell
  rg -n "calculateExpireTime|extractUploadIdFromXml|buildCompleteMultipartUploadXml|OkHttpClient" `
     E:\DaiCuongBK\Project3\FileSharing\server\filesharing-filehandler\src\main\java   # -> 0 kết quả

  mvn -f E:\DaiCuongBK\Project3\FileSharing\server\pom.xml clean install -DskipTests   # -> BUILD SUCCESS

  # Regression hợp đồng E7 (so tên field + status với baseline bước 1)
  Compare-Object (Get-Content E:\tmp\upload-v2-smoke\e7-baseline\upload-metadata.json | ConvertFrom-Json).data.PSObject.Properties.Name `
                 (Get-Content E:\tmp\upload-v2-smoke\e7-wp3\upload-metadata.json      | ConvertFrom-Json).data.PSObject.Properties.Name
  # -> không có dòng khác biệt (vẫn đủ uploadId + partUrl)
  mcx ls --incomplete myminio/file-sharing     # -> dọn sạch multipart test sau khi stop-upload
  ```
- Phụ thuộc: T-3.5

---

## WP4 — API control plane E1–E6 (SEC-03/04/05, PERF-01/03, REL-01/02, R4, R7)

DoD: `00_guardrails.md` §6 → "DoD WP4". Whitelist: §3 WP4.
Mọi tên endpoint/field/DTO/status/ErrorCode lấy 100% từ `01_api_contract.md` — **cấm tự đặt** (`00_guardrails.md` §2.7).

### T-4.1 — [RỦI RO — ĐIỀU KIỆN TIÊN QUYẾT] Sửa `GlobalExceptionHandler` trả đúng `errorCode.getHttpStatus()`
- Đọc trước: `01_api_contract.md` §0.6; `01_user_requirement.md` §A.6 R7; `../03_detailed_design.md` §WP4 "Điều kiện tiên quyết" + bảng Rủi ro dòng `GlobalExceptionHandler`; `.claude/rules/backend-core.md`
- Sửa/tạo: `server/filesharing-core/src/main/java/com/file/service/filesharing/core/exceptions/GlobalExceptionHandler.java` (S — đúng dòng 42-44)
- Các bước:
  1. Đổi `ResponseEntity.status(ErrorCode.INTERNAL_SERVER_ERROR.getHttpStatus())` → `ResponseEntity.status(errorCode.getHttpStatus())` trong handler `FileBusinessException`/`UserBusinessException`. **Không** đụng handler Mongo bên dưới, không thêm handler mới, không đổi `CommonResponse.fail(...)`.
  2. `mvn install -pl filesharing-core` rồi build toàn reactor.
  3. **Smoke blast radius** (bắt buộc — core là thư viện dùng chung): liệt kê module có controller `rg -l "@RestController" E:\...\server --glob "!**/target/**"`, rồi gọi thử 3 luồng lỗi tiêu biểu: đăng nhập sai mật khẩu, `projectId` không tồn tại, `objectName` không tồn tại. Ghi HTTP status **trước** và **sau** khi sửa vào báo cáo.
  4. Kiểm tra client không bắt cứng 500: `rg -n "=== *500|status *=== *500|statusCode *== *500" E:\DaiCuongBK\Project3\FileSharing\client\src` — nếu có, ghi vào báo cáo (sửa ở WP5, không sửa ở task này).
  5. Chạy lại regression E7 (baseline `T-3.6`) — đổi HTTP status của lỗi nghiệp vụ **không được** làm đổi status của 3 endpoint legacy ở đường thành công.
- Acceptance: lỗi nghiệp vụ trả đúng status của `ErrorCode` (401/403/404/409/429), không còn 500 cứng; `CommonResponse.code` giữ nguyên giá trị như trước; build toàn reactor PASS.
- Verify:
  ```powershell
  mvn -f E:\DaiCuongBK\Project3\FileSharing\server\pom.xml install -pl filesharing-core -DskipTests
  mvn -f E:\DaiCuongBK\Project3\FileSharing\server\pom.xml clean install -DskipTests     # -> BUILD SUCCESS

  # Ví dụ smoke (JWT hợp lệ): file không tồn tại
  curl.exe -s -o NUL -w "%{http_code}`n" -X POST http://localhost:5000/api/file-metadata/download `
    -H "Authorization: Bearer $env:JWT" -H "Content-Type: application/json" `
    -d '{\"objectName\":\"khong-ton-tai.bin\"}'
  # -> 404 (trước khi sửa là 500)
  ```
- Phụ thuộc: T-3.5

### T-4.2 — Làm mới baseline E7 sau WP3 (bản chuẩn để regression WP4)
- Đọc trước: `01_api_contract.md` §E7; `00_guardrails.md` §2.3 (cấm đổi **hợp đồng** E7) + §6 "DoD WP4" mục E7 regression
- Sửa/tạo: không sửa file repo. Baseline lưu ở `E:\tmp\upload-v2-smoke\e7-baseline\*.json` (ghi đè bản của `T-3.6` sau khi đã xác nhận `T-3.6` không đổi schema)
- Các bước:
  0. Đối chiếu trước: baseline `T-3.6` (trước rewire) và output hiện tại (sau rewire) phải **cùng schema + cùng status**; khác → STOP.
  1. Gọi `POST /api/file-metadata/upload-metadata` với `MetadataDTO` hợp lệ → lưu nguyên body JSON + HTTP status.
  2. Gọi `POST /api/file-metadata/upload/stop-upload` cho chính upload vừa tạo → lưu body + status.
  3. Lặp lại kịch bản complete tối thiểu (upload 1 part rồi `POST /api/file-metadata/upload/complete`) → lưu body + status.
  4. Dọn object/multipart test.
- Acceptance: có 3 file JSON baseline + 3 HTTP status ghi lại, dùng để so ở `T-4.11`.
- Verify:
  ```powershell
  Get-ChildItem E:\tmp\upload-v2-smoke\e7-baseline\   # -> 3 file json
  Get-Content E:\tmp\upload-v2-smoke\e7-baseline\upload-metadata.json | ConvertFrom-Json
  # -> data có uploadId và partUrl (schema InitiateUploadResponseDto)
  ```
- Phụ thuộc: T-4.1

### T-4.3 — Tạo nhóm DTO session/status/resource
- Đọc trước: `01_api_contract.md` §8 (bảng tên DTO + field), E1.2, E3.2, E4.2; `.claude/rules/backend-filehandler.md` (quy ước DTO)
- Sửa/tạo (package mới `org.example.filesharing.entities.dtos.upload`):
  - `UploadSessionInitResponseDto.java` (N)
  - `UploadSessionStatusResponseDto.java` (N)
  - `ReceivedPartDto.java` (N)
  - `UploadResourceResponseDto.java` (N)
- Các bước:
  1. Tạo 4 DTO với **đúng** tên field trong `01_api_contract.md` §8 — không đổi chính tả, không thêm/bớt field.
  2. Kiểu: `long` cho byte size, `int` cho `partNumber`/`partCount`/`versionNumber`, `Instant` cho mốc thời gian, `Map<Integer,String>` cho `urls` (§0.3).
  3. Không đặt `uploadId`/`objectName` vào DTO của E1/E2 (SEC-03 — E1.2 bảng "field bị BỎ").
- Acceptance: 4 class compile; `rg "uploadId"` trong package `dtos/upload` → chỉ được xuất hiện ở nơi contract cho phép (không có trong `UploadSessionInitResponseDto`).
- Verify:
  ```powershell
  mvn -f E:\DaiCuongBK\Project3\FileSharing\server\pom.xml install -pl filesharing-filehandler -DskipTests  # -> BUILD SUCCESS
  rg -n "uploadId" E:\DaiCuongBK\Project3\FileSharing\server\filesharing-filehandler\src\main\java\org\example\filesharing\entities\dtos\upload   # -> 0 kết quả
  ```
- Phụ thuộc: T-4.2

### T-4.4 — Tạo nhóm DTO part-url / complete / abort
- Đọc trước: `01_api_contract.md` §8, E2.1, E2.2, E4.1, E5.2
- Sửa/tạo (cùng package `...dtos.upload`):
  - `PartUrlBatchRequestDto.java` (N)
  - `PartUrlBatchResponseDto.java` (N)
  - `CompleteUploadSessionRequestDto.java` (N)
  - `CompletedPartDto.java` (N)
  - `AbortUploadSessionResponseDto.java` (N)
- Các bước:
  1. Tạo 5 DTO đúng field §8.
  2. Gắn annotation validation cho request DTO theo ràng buộc E2.1/E4.1 (`partNumbers` không rỗng, `size() <= 50`; `parts` không rỗng; `etag` not blank; `md5` 32 ký tự hex lowercase). Ràng buộc phụ thuộc `partCount` (ngoài `[1..partCount]`) kiểm ở service, không kiểm bằng annotation.
  3. `md5` là **hex**, khác header `Content-MD5` base64 lúc PUT (E4.1 ghi chú) — không đổi tên field.
- Acceptance: 5 class compile; request DTO có annotation validation; tên field khớp §8 tuyệt đối.
- Verify:
  ```powershell
  mvn -f E:\DaiCuongBK\Project3\FileSharing\server\pom.xml install -pl filesharing-filehandler -DskipTests  # -> BUILD SUCCESS
  rg -n "partNumbers|partNumber|etag|md5|abortedAt" E:\DaiCuongBK\Project3\FileSharing\server\filesharing-filehandler\src\main\java\org\example\filesharing\entities\dtos\upload
  ```
- Phụ thuộc: T-4.3

### T-4.5 — Dựng `UploadSessionController` + E2 (part-urls) + E3 (status/resume)
- Đọc trước: `01_api_contract.md` §0.7, E2 (toàn mục), E3 (toàn mục); `../03_detailed_design.md` §WP4 sơ đồ "Luồng E2" và "Luồng E3"; `.claude/rules/backend-filehandler.md` (controller thin)
- Sửa/tạo:
  - `server/filesharing-filehandler/src/main/java/org/example/filesharing/controllers/UploadSessionController.java` (N)
  - `.../services/UploadSessionService.java` (S)
  - `.../services/impl/UploadSessionServiceImpl.java` (S)
- Các bước:
  1. Controller `@RequestMapping("api/uploads")`, thin: `@Valid` + delegate, trả `CommonResponse<T>`; không chứa business logic.
  2. E2 `POST /{sessionId}/part-urls`: get(+owner) → chặn `COMPLETED`/`ABORTED` (409 `SESSION_INVALID_STATE`) → validate batch (≤ 50, `1..partCount`, không trùng) → presign qua `StorageService` → touch TTL → trả `urls`, `urlExpiresAt`, `expiresAt` (E2.2). Nhánh `SINGLE`: chỉ chấp nhận `[1]` (E2.4).
  3. E3 `GET /{sessionId}`: `COMPLETED` → **không** gọi `ListParts`, trả `receivedParts: []` + `resource` (E3.4); `ABORTED` → 200 với `receivedParts: []`; còn sống → `ListParts` (nguồn chân lý) + touch TTL. Nhánh `SINGLE` dùng `HeadObject` (E3.4).
  4. Bảng lỗi đúng E2.3 / E3.3, ném `FileBusinessException`.
- Acceptance: đúng bảng DoD WP4 mục E2 và E3 (`00_guardrails.md` §6).
- Verify:
  ```powershell
  # E2 sai batch
  curl.exe -s -o NUL -w "%{http_code}`n" -X POST "http://localhost:5000/api/uploads/$sid/part-urls" `
    -H "Authorization: Bearer $env:JWT" -H "Content-Type: application/json" -d '{\"partNumbers\":[0]}'   # -> 400
  # E3 session lạ
  curl.exe -s -X GET "http://localhost:5000/api/uploads/khong-ton-tai" -H "Authorization: Bearer $env:JWT"
  # -> HTTP 404, body code "5501" (SESSION_NOT_FOUND)
  ```
- Phụ thuộc: T-4.4

### T-4.6 — E4 complete: verify đủ part + size + checksum, commit, idempotent
- Đọc trước: `01_api_contract.md` E4 (toàn mục, đặc biệt E4.3 **thứ tự kiểm tra bắt buộc** và E4.4 idempotency); `../03_detailed_design.md` §WP4 sơ đồ "Luồng E4"; `01_user_requirement.md` SEC-04, REL-02
- Sửa/tạo:
  - `.../controllers/UploadSessionController.java` (S)
  - `.../services/impl/UploadSessionServiceImpl.java` (S)
  - `.../services/MetadataService.java` (S)
  - `.../services/impl/MetadataServiceImpl.java` (S)
- Các bước:
  1. Cài đúng **thứ tự 12 nhánh** của E4.3 — không đảo, không gộp. Owner check nằm trước mọi call storage.
  2. Ghi `session.partMd5` từ `parts` **trước** khi verify (E4.4 mục 5).
  3. Chuyển trạng thái bằng `findAndModify` có điều kiện `status IN (INITIATED, UPLOADING)` (E4.4 mục 2) — hai request song song chỉ một thắng.
  4. Thứ tự tác dụng phụ đúng E4.4 mục 3: `CompleteMultipartUpload` → `HeadObject` → cập nhật `MetadataEntity` (`status`, `fileSize` **size thật**, `processingStatus`) → cập nhật session (`COMPLETED`, `completedAt`, `resultEtag`) → **Kafka cuối cùng**.
  5. Nhánh `SINGLE` theo E4.4 mục 4.
  6. Message lỗi nhánh 7 và 10 **phải** liệt kê danh sách part (E4.3 ghi chú) để client tự bù.
  7. Giữ nguyên hợp đồng Kafka hiện hành (video → encode, image → transcode).
- Acceptance: đúng 4 mục E4 trong DoD WP4 (`00_guardrails.md` §6): thiếu part → 400 `UPLOAD_INCOMPLETE` + danh sách; md5 sai → 400 `CHECKSUM_MISMATCH`; size lệch → 400 `SIZE_MISMATCH`; gọi 2 lần → cả 2 lần 200 cùng `assetId` + cùng `etag`, `mc ls --incomplete` trống.
- Verify: xem kịch bản `04_verification.md` §2.3 (lỗi) và §2.4 (idempotent).
  ```powershell
  mcx ls --incomplete myminio/file-sharing    # -> trống sau khi complete
  ```
- Phụ thuộc: T-4.5

### T-4.7 — E5 abort session
- Đọc trước: `01_api_contract.md` E5 (toàn mục, đặc biệt E5.4 thứ tự tác dụng phụ + nhánh `SINGLE`)
- Sửa/tạo:
  - `.../controllers/UploadSessionController.java` (S)
  - `.../services/impl/UploadSessionServiceImpl.java` (S)
- Các bước:
  1. `DELETE /api/uploads/{sessionId}`: get(+owner) → `COMPLETED` → 409 `SESSION_INVALID_STATE`.
  2. Tác dụng phụ đúng E5.4: `AbortMultipartUpload` (nuốt `NoSuchUpload`) → `session.status = ABORTED` + `completedAt` → `MetadataEntity.status = FAILED`, `isActive = false`.
  3. Idempotent: gọi lại trên session `ABORTED` → 200 với `abortedAt` **của lần đầu** (lấy từ `completedAt` — `02_schema_config.md` §1.3).
  4. Không touch sliding TTL.
- Acceptance: gọi 2 lần liên tiếp cùng trả 200 và cùng `abortedAt`; `mc ls --incomplete` không còn multipart của session đó; metadata `FAILED`.
- Verify:
  ```powershell
  curl.exe -s -X DELETE "http://localhost:5000/api/uploads/$sid" -H "Authorization: Bearer $env:JWT"   # lần 1 -> 200 ABORTED
  curl.exe -s -X DELETE "http://localhost:5000/api/uploads/$sid" -H "Authorization: Bearer $env:JWT"   # lần 2 -> 200, abortedAt giống hệt
  mcx ls --incomplete myminio/file-sharing
  ```
- Phụ thuộc: T-4.6

### T-4.8 — E1 `POST /api/asset/create-new`: trả `sessionId` + lô URL đầu (BREAKING — cùng release với WP5)
- Đọc trước: `01_api_contract.md` E1 (toàn mục, đặc biệt E1.2 bảng field bị BỎ + E1.4), §0.5; `../03_detailed_design.md` §WP4 sơ đồ "Luồng E1" + mục "Rollout" (ràng buộc release)
- Sửa/tạo:
  - `.../controllers/AssetController.java` (S — giữ nguyên URL `POST /api/asset/create-new`)
  - `.../services/AssetService.java` (S — chữ ký `createNew`)
  - `.../services/impl/AssetServiceImpl.java` (S — giữ nguyên `generateObjectName`, nối `UploadSessionService` + `StorageService`)
  - `.../entities/dtos/asset/AssetCreateRequestDto.java` (S — `Double fileSize` → `Long`)
  - `.../entities/dtos/asset/AssetCreateResponseDto.java` (S — kiểu field `upload` → `UploadSessionInitResponseDto`)
- Các bước:
  1. `AssetCreateRequestDto.fileSize`: `Double` → `Long` (§8 bảng "DTO hiện có bị thay đổi"); validate theo E1.3.
  2. Trong `createNew`: giữ nguyên vị trí sinh `objectName` ở server (`generateObjectName`), tạo `AssetEntity` + `MetadataEntity` version như hiện tại; **thêm**: chọn `partSize`/`partCount` (T-2.5) → `CreateMultipartUpload` (bỏ qua khi `SINGLE`) → insert `UploadSession` → presign lô đầu `K = min(partCount, 20)`.
  3. `AssetCreateResponseDto.upload` đổi sang `UploadSessionInitResponseDto`; **bỏ hẳn** `uploadId` và `partUrl` khỏi khối `upload`. `asset` và `version` **giữ nguyên kiểu entity** (`AssetEntity` / `MetadataEntity`) — nợ kỹ thuật đã duyệt, **cấm map sang DTO** trong phase này (delta **D13**); client đang đọc `data.asset.assetId`, `data.version.objectName`.
  4. Nhánh `SINGLE` theo E1.4: không gọi `CreateMultipartUpload`, `session.uploadId = null`, `urls["1"]` là presigned PUT thẳng.
  5. Nhánh 429 `SESSION_LIMIT_EXCEEDED` (E1.3) chỉ nối ở `T-7.6` — task này để đúng chỗ gọi, chưa bật giới hạn.
  6. **Không** đổi các endpoint asset khác trong `AssetController`.
- Acceptance: response E1 chứa `sessionId`, `uploadMode`, `partSize`, `partCount`, `declaredSize`, `urls`, `urlExpiresAt`, `expiresAt`, `hardExpiresAt`; body **không chứa chuỗi** `uploadId`; `urls` có đúng `min(partCount, 20)` key.
- Verify:
  ```powershell
  $r = curl.exe -s -X POST http://localhost:5000/api/asset/create-new -H "Authorization: Bearer $env:JWT" `
       -H "Content-Type: application/json" -d (Get-Content E:\tmp\upload-v2-smoke\e1-request.json -Raw)
  $r | Select-String "uploadId"          # -> 0 kết quả
  ($r | ConvertFrom-Json).data.upload.urls.PSObject.Properties.Count   # -> min(partCount, 20)
  ```
- Phụ thuộc: T-4.7

### T-4.9 — E6 download: kiểm quyền trước khi presign + thêm `contentType`
- Đọc trước: `01_api_contract.md` E6 (toàn mục, đặc biệt E6.4 thứ tự bắt buộc + TTL + cấm log URL); `01_user_requirement.md` §A.6 S2, R4; `00_guardrails.md` §3 WP4 ghi chú (dùng cấu trúc quyền sẵn có, **không** tạo service quyền mới)
- Sửa/tạo:
  - `.../controllers/FileMetadataController.java` (S — chỉ method `/download`; cấm đụng `/direct-upload`, `/process-encode`, `/delete/{fileId}`, `/move-to-trash`, `/restore-file`, `/get-file-by-token`)
  - `.../entities/dtos/metadata/DownloadFileResponseDto.java` (S — thêm `contentType`, `Double fileSize` → `Long`)
  - `.../services/MetadataService.java` (S)
  - `.../services/impl/MetadataServiceImpl.java` (S)
- Các bước:
  1. Thứ tự đúng E6.4: tra metadata → **kiểm quyền** → kiểm `status == COMPLETED` → presign. Không presign trước.
  2. Quyền dùng cấu trúc sẵn có: `MetadataEntity.userPermissions`, `visibility`/`publicPermission`, `shareToken`, `FolderEntity.permissions`, `ProjectEntity.collaborators`.
  3. Presign bằng `StorageService.presignGetObject` (key `svc-download`), TTL `clamp(fileSize/1_000_000, 900, 14400)` giây; giữ `response-content-disposition: attachment`.
  4. Response trả **cả** `mimeType` (tương thích ngược) và `contentType` (giá trị bằng nhau).
  5. Metadata thiếu `fileSize` (null) → lấy size thật bằng `HeadObject` (`02_schema_config.md` §6.2 mục 5).
  6. Xoá mọi log in URL trong nhánh này.
- Acceptance: user không có quyền → 403 `FILE_PERMISSION_ERROR`; `status != COMPLETED` → 409 `FILE_NOT_READY`; owner → 200 body có cả `mimeType` và `contentType`.
- Verify:
  ```powershell
  curl.exe -s -X POST http://localhost:5000/api/file-metadata/download -H "Authorization: Bearer $env:JWT_OWNER" `
    -H "Content-Type: application/json" -d '{\"objectName\":\"<obj>\"}' | ConvertFrom-Json | Select-Object -ExpandProperty data
  # -> có url, fileSize, fileName, mimeType, contentType
  curl.exe -s -o NUL -w "%{http_code}`n" -X POST http://localhost:5000/api/file-metadata/download `
    -H "Authorization: Bearer $env:JWT_OTHER" -H "Content-Type: application/json" -d '{\"objectName\":\"<obj>\"}'   # -> 403
  ```
- Phụ thuộc: T-4.8

### T-4.10 — Tái sinh client API bằng `npm run gen-api`
- Đọc trước: `00_guardrails.md` §2.6 + §3 WP4 dòng cuối; `01_api_contract.md` §8 dòng cuối; `client/CLAUDE.md`
- Sửa/tạo: `client/src/api/api/**` (S — **chỉ** qua `npm run gen-api`)
- Các bước:
  1. Chạy filehandler ở `:5000`.
  2. `cd E:\DaiCuongBK\Project3\FileSharing\client; npm run gen-api`.
  3. Kiểm `git status` chỉ hiện thay đổi dưới `client/src/api/api/`. Nếu generated code sai → sửa DTO **phía server** rồi gen lại; **cấm** hand-edit.
  4. Không chạy `npm run build` ở task này (client sẽ gãy type cho tới WP5 — đúng kỳ vọng của ràng buộc release §9).
- Acceptance: generated code có DTO mới (`UploadSessionInitResponseDto`, `PartUrlBatchRequestDto`, ...); `git status` sạch ngoài thư mục generated.
- Verify:
  ```powershell
  cd E:\DaiCuongBK\Project3\FileSharing\client; npm run gen-api
  git -C E:\DaiCuongBK\Project3\FileSharing status --short client   # -> chỉ dòng dưới client/src/api/api/
  rg -n "UploadSessionInitResponseDto|PartUrlBatchRequestDto" E:\DaiCuongBK\Project3\FileSharing\client\src\api\api   # -> có kết quả
  ```
- Phụ thuộc: T-4.9

### T-4.11 — Regression E7: 3 endpoint legacy không đổi hành vi
- Đọc trước: `01_api_contract.md` §E7; `00_guardrails.md` §2.3 + §6 "DoD WP4" mục E7
- Sửa/tạo: không sửa file repo (task kiểm chứng)
- Các bước:
  1. Lặp lại đúng 3 lời gọi của `T-4.2`.
  2. So từng response với baseline `E:\tmp\upload-v2-smoke\e7-baseline\*.json`: schema, tên field, HTTP status.
  3. Khác biệt duy nhất được chấp nhận: giá trị động (`uploadId`, URL, timestamp). Khác schema hoặc khác status → **STOP**, hoàn tác phần gây khác biệt.
- Acceptance: 3 response cùng schema + cùng HTTP status với baseline; `InitiateUploadResponseDto` vẫn có `uploadId` + `partUrl`.
- Verify:
  ```powershell
  Compare-Object (Get-Content E:\tmp\upload-v2-smoke\e7-baseline\upload-metadata.json | ConvertFrom-Json).data.PSObject.Properties.Name `
                 (Get-Content E:\tmp\upload-v2-smoke\e7-after\upload-metadata.json    | ConvertFrom-Json).data.PSObject.Properties.Name
  # -> không có dòng khác biệt
  ```
- Phụ thuộc: T-4.10

---

## WP5 — Client v2 (PERF-01/02/03/06, SEC-06/07, REL-01/02, R4)

DoD: `00_guardrails.md` §6 → "DoD WP5". Whitelist: §3 WP5 + delta D10.
**Cấm** thêm package npm (`00_guardrails.md` §2.4) và cấm chạm `client/src/page/**` trừ đúng dòng gãy type.

### T-5.1 — `adaptiveBandwidth.ts`: bỏ adaptive chunk size, đổi sang hill-climbing, trần 6 thread
- Đọc trước: `../03_detailed_design.md` §WP5 mục 1 (pseudo-code hill-climbing + lý do `MAX_THREADS = 6`); `01_user_requirement.md` §A.5.1 (thuật toán cũ), PERF-06; `.claude/rules/frontend.md`
- Sửa/tạo: `client/src/utils/adaptiveBandwidth.ts` (S)
- Các bước:
  1. Xoá nhánh điều chỉnh **chunk size** (giữ nguyên phần EWMA alpha 0.3, CV/network stability, `Semaphore.updateMaxPermits`).
  2. Cài hill-climbing theo pseudo-code §WP5: probe `threads++` → sau K part nếu `aggregate` tăng < 10% thì lùi 1 và giữ ổn định; panic (lỗi liên tiếp) chỉ còn vế `threads--` (floor 1).
  3. Trần thread = 6, đọc từ giá trị server công bố (`upload.max-threads`) nếu có, mặc định 6.
  4. Không thêm dependency; không đổi màu/UI.
- Acceptance: không còn hàm/nhánh nào thay đổi chunk size; trần thread = 6; `npm run build` PASS.
- Verify:
  ```powershell
  rg -n "chunkSize *\*=|chunkSize *\/=|calculateNextChunkSize" E:\DaiCuongBK\Project3\FileSharing\client\src\utils\adaptiveBandwidth.ts  # -> 0 kết quả
  cd E:\DaiCuongBK\Project3\FileSharing\client; npm run build    # -> exit 0
  ```
- Phụ thuộc: T-4.11

### T-5.2 — `PartUrlManager` + wrapper E2–E5 trong `fileApiResource.ts`
- Đọc trước: `01_api_contract.md` E2, E3, E4, E5 + mục "Hợp đồng PUT part"; `../03_detailed_design.md` §WP5 mục 1 (PartUrlManager); `00_guardrails.md` §2.15/§2.16
- Sửa/tạo:
  - `client/src/service/partUrlManager.ts` (N)
  - `client/src/api/fileApi/fileApiResource.ts` (S)
- Các bước:
  1. `PartUrlManager`: giữ pool URL + `urlExpiresAt`; prefetch lô kế khi pool còn < ngưỡng (ví dụ 5); PUT trả 403 → xin lại URL cho **đúng part đó** và retry, **không** tính vào 3 lần retry lỗi mạng.
  2. Wrapper cho E2–E5 gọi đúng URL/method/DTO của contract; client chỉ cầm `sessionId` (§0.7 + §2.16 — cấm gửi `objectName`/`uploadId`).
  3. Xoá `console.log` in URL (dòng ~83 bản hiện tại).
  4. Trước khi `GlobalExceptionHandler` được deploy, client phân nhánh theo `CommonResponse.code` (`01_api_contract.md` §0.6) — sau `T-4.1` thì dùng được HTTP status; giữ cả hai đường cho an toàn.
- Acceptance: không còn `console.log` in URL; mọi lời gọi control-plane đi qua `/api/uploads/{sessionId}/...`.
- Verify:
  ```powershell
  rg -n "console\.log" E:\DaiCuongBK\Project3\FileSharing\client\src\api\fileApi\fileApiResource.ts   # -> không dòng nào in URL
  rg -n "objectName|uploadId" E:\DaiCuongBK\Project3\FileSharing\client\src\service\partUrlManager.ts # -> 0 kết quả
  ```
- Phụ thuộc: T-5.1

### T-5.3 — `folderUploadService.createAssetUploadSession` đọc field E1 mới
- Đọc trước: `01_api_contract.md` E1.2 (bảng field + ghi chú `folderUploadService.ts:160-167`)
- Sửa/tạo: `client/src/service/folderUploadService.ts` (S)
- Các bước:
  1. Bỏ điều kiện bắt buộc `upload.uploadId` và `upload.partUrl` (đang throw `Error('Upload session is missing from create asset response')`).
  2. Đổi sang yêu cầu `upload.sessionId`, `upload.partSize`, `upload.partCount`, `upload.urls`.
  3. Giữ nguyên phần đọc `data.asset.assetId` và `data.version.objectName`.
- Acceptance: tạo asset → không throw; nhận đủ `sessionId`/`partSize`/`partCount`/`urls`.
- Verify:
  ```powershell
  rg -n "uploadId|partUrl" E:\DaiCuongBK\Project3\FileSharing\client\src\service\folderUploadService.ts   # -> 0 kết quả
  cd E:\DaiCuongBK\Project3\FileSharing\client; npm run build   # -> exit 0
  ```
- Phụ thuộc: T-5.2

### T-5.4 — `uploadService.ts` v2: partSize cố định, `Content-MD5`, resume, complete/abort theo session
- Đọc trước: `01_api_contract.md` mục "Hợp đồng PUT part", E3.4 (tính part thiếu), E4.1/E4.3; `../03_detailed_design.md` §WP5 mục 1
- Sửa/tạo:
  - `client/src/service/uploadService.ts` (S)
  - `client/src/store/uploadManagerStore.ts` (S — chỉ chỉnh theo kiểu dữ liệu đổi)
  - `client/src/components/UploadButton.tsx` (S — chỉ chỉnh theo kiểu dữ liệu đổi)
- Các bước:
  1. Chunk = `partSize` server trả, offset part n = `(n-1) * partSize`; part cuối được nhỏ hơn.
  2. Mỗi PUT gửi header `Content-MD5` (base64, SparkMD5 đã có sẵn), **không** đặt `Content-Type`.
  3. So ETag sau PUT: từ `console.warn` → **fail part + retry** (SEC-06).
  4. `BadDigest` (400) → tính lại MD5 và upload lại chính part đó; 403 → xin URL mới qua `PartUrlManager` (T-5.2).
  5. Complete gửi `{partNumber, etag, md5}` (md5 **hex**) cho E4; nhận `UPLOAD_INCOMPLETE`/`CHECKSUM_MISMATCH` → đọc danh sách part trong message, bù rồi complete lại.
  6. Resume: persist `sessionId` vào `localStorage`; trước khi bắt đầu → E3, tính `[1..partCount] − receivedParts`, xin URL cho phần thiếu.
  7. Abort → `DELETE /api/uploads/{sessionId}`.
  8. Không đổi `objectName` do client sinh ở **đường legacy** trong task này (chuyển ở `T-7.7`).
- Acceptance: DevTools — mọi PUT có `Content-MD5`; ≤ 6 PUT đồng thời; kích thước part == `partSize` server trả; không request nào mang `objectName`/`uploadId` client tự sinh.
- Verify: xem `04_verification.md` §2.6 (kịch bản DevTools) + §2.2 (resume).
  ```powershell
  cd E:\DaiCuongBK\Project3\FileSharing\client; npm run build; npm run lint   # -> exit 0, không lỗi mới
  ```
- Phụ thuộc: T-5.3

### T-5.5 — `downloadService.ts`: đọc `contentType` (vá R4)
- Đọc trước: `01_api_contract.md` E6.2 (field `contentType`); `01_user_requirement.md` §A.6 R4; delta **D10** §0.3
- Sửa/tạo: `client/src/service/downloadService.ts` (S)
- Các bước:
  1. Đọc `contentType` từ response E6 (fallback `mimeType` nếu thiếu — server trả cả hai).
  2. Dùng đúng `contentType` khi tạo `Blob`.
  3. **Không** triển khai stream-to-disk trong phase này (delta D10 — PERF-04 là P2, không có mục DoD). Muốn làm → STOP, hỏi người dùng.
- Acceptance: Blob tải về có đúng content type; không thêm nhánh File System Access API mới.
- Verify:
  ```powershell
  rg -n "contentType" E:\DaiCuongBK\Project3\FileSharing\client\src\service\downloadService.ts   # -> có đọc field contentType
  cd E:\DaiCuongBK\Project3\FileSharing\client; npm run build    # -> exit 0
  ```
- Phụ thuộc: T-5.4

### T-5.6 — Nghiệm thu WP5 trên trình duyệt (build + lint + DevTools + resume + URL hết hạn)
- Đọc trước: `00_guardrails.md` §6 "DoD WP5" (6 mục)
- Sửa/tạo: không sửa file repo (task kiểm chứng; nếu phải hạ `upload.part-url-ttl` xuống `60s` để test thì **trả lại `900s`** sau khi xong)
- Các bước:
  1. `npm run build` + `npm run lint`, so số lỗi lint với trước WP5.
  2. Upload file ≥ 100 MiB, quan sát Network: header `Content-MD5`, số PUT đồng thời ≤ 6, kích thước part.
  3. Resume: ngắt mạng ~50%, reload tab, upload tiếp → tổng bytes PUT lần 2 < kích thước file; `mc stat` sau complete == size gốc.
  4. Hạ `upload.part-url-ttl` xuống `60s`, upload file lớn → client tự xin URL mới, người dùng không thấy lỗi; trả TTL về `900s`.
  5. Quét `console.log` in URL trong `service/` và `fileApiResource.ts`.
- Acceptance: đủ 6 mục DoD WP5.
- Verify:
  ```powershell
  cd E:\DaiCuongBK\Project3\FileSharing\client; npm run build; npm run lint
  rg -n "console\.log" E:\DaiCuongBK\Project3\FileSharing\client\src\api\fileApi\fileApiResource.ts E:\DaiCuongBK\Project3\FileSharing\client\src\service
  mcx stat myminio/file-sharing/<objectName>    # -> Size == size file gốc
  ```
- Phụ thuộc: T-5.5

---

## WP6 — GC & reconcile (REL-03, S7, R3)

DoD: `00_guardrails.md` §6 → "DoD WP6". Whitelist: §3 WP6. Mở được sau WP2, nhưng test end-to-end cần WP4.

### T-6.1 — Bật `@EnableScheduling` + khai chu kỳ 2 job trong `application.yml`
- Đọc trước: `../03_detailed_design.md` §WP7 dòng "Bật scheduling cho filehandler"; `00_guardrails.md` §3 WP6
- Sửa/tạo:
  - `server/filesharing-filehandler/src/main/java/org/example/filesharing/FileSharingApplication.java` (S)
  - `server/filesharing-filehandler/src/main/resources/application.yml` (S — 2 key chu kỳ job)
- Các bước:
  1. Thêm `@EnableScheduling` đúng theo cách imagecodec/videocodec đang làm (đọc 1 trong 2 file đó để copy style). Không thêm annotation nào khác.
  2. Thêm 2 key chu kỳ dưới nhánh `upload:` (GC 15 phút, reconcile 24h) — đặt tên theo style key hiện có ở `02_schema_config.md` §3.
- Acceptance: app khởi động, log có scheduler; không job nào chạy sai chu kỳ.
- Verify:
  ```powershell
  rg -n "EnableScheduling" E:\DaiCuongBK\Project3\FileSharing\server\filesharing-filehandler\src\main\java\org\example\filesharing\FileSharingApplication.java  # -> 1 dòng
  mvn -f E:\DaiCuongBK\Project3\FileSharing\server\pom.xml install -pl filesharing-filehandler -DskipTests   # -> BUILD SUCCESS
  ```
- Phụ thuộc: T-2.6 (và T-4.11 nếu chạy test end-to-end)

### T-6.2 — Query method cho GC/reconcile trong repo + service
- Đọc trước: `02_schema_config.md` §2.1 (index `idx_upload_sessions_status_expires`, `idx_upload_sessions_upload_id`), §1.5 (ngữ nghĩa `expiresAt`); `00_guardrails.md` §3 WP6
- Sửa/tạo:
  - `.../repositories/UploadSessionRepo.java` (S)
  - `.../services/UploadSessionService.java` (S)
  - `.../services/impl/UploadSessionServiceImpl.java` (S)
- Các bước:
  1. Repo: query session hết hạn còn sống (`expiresAt < now` hoặc `hardExpiresAt < now`, `status IN (INITIATED, UPLOADING)`) — dùng đúng thứ tự field của `idx_upload_sessions_status_expires`; query theo `uploadId` (dùng index sparse) cho reconcile.
  2. Service: chỉ thêm method **truy vấn** (không thêm logic abort ở đây).
  3. Không thêm method thừa ngoài nhu cầu 2 job.
- Acceptance: build PASS; `explain()` cho thấy query dùng index chứ không COLLSCAN.
- Verify:
  ```powershell
  docker exec filesharing-mongodb mongosh "mongodb://admin:admin123456@localhost:27017/metadata?authSource=admin" --quiet --eval `
    "db.upload_sessions.find({status:{`$in:['INITIATED','UPLOADING']}, expiresAt:{`$lt:new Date()}}).explain('queryPlanner').queryPlanner.winningPlan"
  # -> IXSCAN idx_upload_sessions_status_expires
  ```
- Phụ thuộc: T-6.1

### T-6.3 — `UploadSessionGcJob` (15 phút): abort multipart + đánh dấu EXPIRED/FAILED
- Đọc trước: `../03_detailed_design.md` §WP6 bảng 3 tầng (tầng 2) + sơ đồ; `02_schema_config.md` §1.5 (bảng mốc), §6.1 (**không** quét collection `metadata`)
- Sửa/tạo: `server/filesharing-filehandler/src/main/java/org/example/filesharing/jobs/scheduled/UploadSessionGcJob.java` (N)
- Các bước:
  1. `@Scheduled` đọc chu kỳ từ config (T-6.1), mặc định 15 phút.
  2. Với mỗi session hết hạn còn sống: `abortMultipartUpload` (nuốt `NoSuchUpload`) → `status = EXPIRED` → `MetadataEntity.status = FAILED`.
  3. **Chỉ** quét `upload_sessions`; tuyệt đối không quét/không sửa document `metadata` không có session (§6.1 — dữ liệu cũ).
  4. Log: số session xử lý, `sessionId`, `objectName`. Cấm log URL.
- Acceptance: đúng mục "Test GC" của DoD WP6 — set `expiresAt` về quá khứ bằng mongosh → trong ≤ 1 chu kỳ: `mc ls --incomplete` không còn multipart đó, session `EXPIRED`, metadata `FAILED`.
- Verify:
  ```powershell
  docker exec filesharing-mongodb mongosh "mongodb://admin:admin123456@localhost:27017/metadata?authSource=admin" --quiet --eval `
    "db.upload_sessions.updateOne({_id:'<sessionId>'}, {`$set:{expiresAt:new Date(Date.now()-3600000)}})"
  # chờ 1 chu kỳ
  mcx ls --incomplete myminio/file-sharing        # -> không còn multipart của object đó
  docker exec filesharing-mongodb mongosh "..." --quiet --eval "db.upload_sessions.findOne({_id:'<sessionId>'}).status"  # -> EXPIRED
  ```
- Phụ thuộc: T-6.2

### T-6.4 — `UploadReconcileJob` (24h): đối soát 2 chiều Mongo ↔ MinIO
- Đọc trước: `../03_detailed_design.md` §WP6 tầng 3; `02_schema_config.md` §6.1 (quy tắc "mồ côi" + ngưỡng `Initiated < now − 24h` + log WARN)
- Sửa/tạo: `server/filesharing-filehandler/src/main/java/org/example/filesharing/jobs/scheduled/UploadReconcileJob.java` (N)
- Các bước:
  1. `ListMultipartUploads` trên bucket `file-sharing` → multipart không có session tương ứng **và** `Initiated < now − 24h` → abort, log `WARN` kèm `uploadId` + `objectName`.
  2. Chiều ngược: session `COMPLETED` mà `HeadObject` 404 → log alert + `MetadataEntity.status = FAILED`.
  3. Không đụng metadata legacy không có session.
- Acceptance: đúng 2 mục cuối DoD WP6 — multipart tạo ngoài session bị abort sau khi job chạy; số document `metadata` **không đổi** trước/sau khi job chạy.
- Verify:
  ```powershell
  # đếm metadata trước/sau
  docker exec filesharing-mongodb mongosh "mongodb://admin:admin123456@localhost:27017/metadata?authSource=admin" --quiet --eval "db.metadata.countDocuments({})"
  mcx ls --incomplete myminio/file-sharing      # -> multipart mồ côi biến mất sau khi job chạy
  ```
- Phụ thuộc: T-6.3

---

## WP7 — Vệ sinh nền & deprecation (REL-04/R5/R2, SEC-07, SEC-08, S3)

DoD: `00_guardrails.md` §6 → "DoD WP7". Whitelist: §3 WP7 + delta D8.

### T-7.1 — `fileSize`: `Double` → `Long` trên entity + DTO metadata
- Đọc trước: `02_schema_config.md` §6.2 (bảng "quy tắc chốt" + rủi ro chính xác); `../03_detailed_design.md` §WP7 dòng `fileSize`; delta **D8** §0.3
- Sửa/tạo:
  - `server/filesharing-core/src/main/java/com/file/service/filesharing/core/entity/models/MetadataEntity.java` (S)
  - `server/filesharing-filehandler/src/main/java/org/example/filesharing/entities/dtos/metadata/MetadataDTO.java` (S)
- Các bước:
  1. `MetadataEntity.fileSize`: `Double` → **`Long`** (wrapper — document cũ có thể null) + `@Field(targetType = FieldType.INT64)` (D8).
  2. `MetadataDTO.fileSize` → `Long`.
  3. **Không** chạy script migration (D8). Đọc dữ liệu cũ dựa vào `ConversionService` (§6.2 mục 1).
  4. `mvn install -pl filesharing-core`. Build filehandler sẽ gãy ở call site → sửa ở T-7.2/T-7.3.
- Acceptance: `MetadataEntity` không còn `Double fileSize`; đọc document cũ (BSON double) không lỗi decode.
- Verify:
  ```powershell
  rg -n "Double fileSize" E:\DaiCuongBK\Project3\FileSharing\server --glob "!**/target/**"    # -> 0 kết quả
  mvn -f E:\DaiCuongBK\Project3\FileSharing\server\pom.xml install -pl filesharing-core -DskipTests   # -> BUILD SUCCESS
  # sau khi T-7.3 xong: gọi 1 API đọc metadata cũ -> 200, fileSize là số nguyên
  ```
- Phụ thuộc: T-4.11 (DTO/E6 đã ổn định), T-6.4 nếu WP6 chạy trước

### T-7.2 — Sửa call site `fileSize` nhóm 1 (Metadata / Asset / Dashboard)
- Đọc trước: `../03_detailed_design.md` §WP7 (danh sách 6 file call site); `00_guardrails.md` §3 WP7 ("**Chỉ** các dòng gãy vì đổi kiểu")
- Sửa/tạo:
  - `.../services/impl/MetadataServiceImpl.java` (S)
  - `.../services/impl/AssetServiceImpl.java` (S)
  - `.../services/impl/DashboardServiceImpl.java` (S)
- Các bước:
  1. Sửa **chỉ** dòng gãy compile do đổi kiểu; cấm refactor/format/sắp xếp import (`00_guardrails.md` §2.2).
  2. Xoá mọi `.intValue()` trên `fileSize` (vá R2); tính toán dùng `long`.
  3. Cộng dồn dung lượng ở dashboard dùng `long`, không `double`.
- Acceptance: 3 file compile; không còn `fileSize.intValue()`.
- Verify:
  ```powershell
  rg -n "fileSize\.intValue\(\)" E:\DaiCuongBK\Project3\FileSharing\server --glob "!**/target/**"   # -> 0 kết quả
  mvn -f E:\DaiCuongBK\Project3\FileSharing\server\pom.xml install -pl filesharing-filehandler -DskipTests
  ```
- Phụ thuộc: T-7.1

### T-7.3 — Sửa call site `fileSize` nhóm 2 (Processing / ImageData / FileMetadata)
- Đọc trước: như T-7.2
- Sửa/tạo:
  - `.../services/impl/ProcessingServiceImpl.java` (S)
  - `.../controllers/ImageDataController.java` (S)
  - `.../controllers/FileMetadataController.java` (S — chỉ dòng `(double) file.getSize()` ở `/direct-upload`)
- Các bước:
  1. Sửa đúng các dòng gãy.
  2. `(double) file.getSize()` → `file.getSize()` (kiểu `long`).
  3. Không đổi hành vi `/direct-upload` (vẫn trần 5 MiB, vẫn proxy).
- Acceptance: build toàn reactor PASS; `/direct-upload` vẫn hoạt động như trước.
- Verify:
  ```powershell
  rg -n "\(double\) file\.getSize\(\)" E:\DaiCuongBK\Project3\FileSharing\server --glob "!**/target/**"   # -> 0 kết quả
  mvn -f E:\DaiCuongBK\Project3\FileSharing\server\pom.xml clean install -DskipTests    # -> BUILD SUCCESS
  ```
- Phụ thuộc: T-7.2

### T-7.4 — `MinIoService`/`MinIoServiceImpl`: đổi kiểu `Double`→`long` + dọn nốt log in URL
- Đọc trước: `00_guardrails.md` §3 WP7 (danh sách dòng log) + §2.3 (cấm đổi **hợp đồng** E7) + §2.15; `02_schema_config.md` §6.2 (phạm vi đổi kiểu); delta **D12** §0.3
- Sửa/tạo:
  - `.../services/MinIoService.java` (S)
  - `.../services/impl/MinIoServiceImpl.java` (S)
- Các bước:
  1. Đổi chữ ký `initiateMultipartUpload(String, Double)` và `getPresignedDownloadUrl(DownloadFileRequestDto, Double)` sang `long` (`02_schema_config.md` §6.2 phạm vi).
  2. Xoá mọi log in presigned URL còn sót (dòng 84, 91, 127, 191–192, 249–250 của bản **trước** `T-3.6`; sau rewire số dòng đã đổi — quét bằng `rg`, không tin số dòng).
  3. 4 helper cũ (`calculateExpireTime`, `extractUploadIdFromXml`, `buildCompleteMultipartUploadXml`, `OkHttpClient`) **đã bị xoá ở `T-3.6`** — task này chỉ xác nhận chúng không quay lại, không xoá lại.
  4. Kiểm E7 vẫn trả đúng schema + status (chạy lại `T-4.11`).
- Acceptance: 0 dòng log URL trong `MinIoServiceImpl`; 0 tham chiếu tới 4 helper cũ; E7 regression PASS.
- Verify:
  ```powershell
  rg -n "log\.(info|debug|warn).*(Url|url)" E:\DaiCuongBK\Project3\FileSharing\server\filesharing-filehandler\src\main\java\org\example\filesharing\services\impl\MinIoServiceImpl.java  # -> 0 kết quả
  rg -n "calculateExpireTime|extractUploadIdFromXml|buildCompleteMultipartUploadXml|OkHttpClient" `
     E:\DaiCuongBK\Project3\FileSharing\server\filesharing-filehandler\src\main\java   # -> 0 kết quả
  ```
- Phụ thuộc: T-7.3, T-3.6

### T-7.5 — Gắn `@Deprecated` + log warning cho 3 endpoint E7
- Đọc trước: `01_api_contract.md` §E7 (message log warning chuẩn); `00_guardrails.md` §2.3
- Sửa/tạo: `.../controllers/FileMetadataController.java` (S — chỉ 3 method E7)
- Các bước:
  1. Thêm `@Deprecated` trên đúng 3 method: `upload-metadata`, `upload/complete`, `upload/stop-upload`.
  2. Mỗi method thêm **đúng 1 dòng** `log.warn` theo mẫu ở `01_api_contract.md` §E7.
  3. **Không** thêm kiểm quyền, **không** đổi URL/request/response/status.
  4. `POST /api/file-metadata/direct-upload` không thuộc E7 — không đụng.
- Acceptance: gọi mỗi endpoint sinh đúng 1 dòng warning; response schema + status không đổi so với baseline `T-4.2`.
- Verify:
  ```powershell
  rg -n "@Deprecated" E:\DaiCuongBK\Project3\FileSharing\server\filesharing-filehandler\src\main\java\org\example\filesharing\controllers\FileMetadataController.java  # -> 3 dòng
  # gọi 1 lần rồi soi log app: đúng 1 dòng "DEPRECATED endpoint called: ..."
  ```
- Phụ thuộc: T-7.4

### T-7.6 — SEC-08: giới hạn số session mở đồng thời / user → 429
- Đọc trước: `01_api_contract.md` E1.3 (dòng 429) + §9.2 (`SESSION_LIMIT_EXCEEDED`); `02_schema_config.md` §2.1 (index `idx_upload_sessions_owner_status`), §3 (key `upload.max-sessions-per-user`)
- Sửa/tạo:
  - `.../services/impl/UploadSessionServiceImpl.java` (S)
  - `.../repositories/UploadSessionRepo.java` (S)
  - `server/filesharing-filehandler/src/main/resources/application.yml` (S — xác nhận `max-sessions-per-user`, `max-threads`, `verify-etag-md5`; nếu `T-2.3` đã thêm thì **chỉ kiểm**, không thêm trùng)
- Các bước:
  1. Repo: `countByOwnerIdAndStatusIn(ownerId, [INITIATED, UPLOADING])` — dùng index `idx_upload_sessions_owner_status`.
  2. Trong `create(...)`: vượt ngưỡng → `FileBusinessException(ErrorCode.SESSION_LIMIT_EXCEEDED)` với message mẫu E1.3, **trước** khi gọi `CreateMultipartUpload` (không tạo rác trên MinIO).
  3. Abort/complete 1 session phải làm giảm bộ đếm ngay (do đổi `status`).
- Acceptance: mở session thứ `max-sessions-per-user + 1` → HTTP 429 code `5506`; abort 1 session rồi tạo lại → 200.
- Verify:
  ```powershell
  # lặp tạo session tới ngưỡng rồi thêm 1
  curl.exe -s -o NUL -w "%{http_code}`n" -X POST http://localhost:5000/api/asset/create-new -H "Authorization: Bearer $env:JWT" `
    -H "Content-Type: application/json" -d (Get-Content E:\tmp\upload-v2-smoke\e1-request.json -Raw)   # -> 429 ở lần thứ 21
  mcx ls --incomplete myminio/file-sharing    # -> KHÔNG phát sinh multipart mới ở lần bị 429
  ```
- Phụ thuộc: T-7.5

### T-7.7 — Client: xoá `console.log` URL còn sót + đưa đường legacy về luồng asset
- Đọc trước: `../03_detailed_design.md` §WP7 dòng "Deprecate legacy"; `01_user_requirement.md` §A.6 S3, S6; `00_guardrails.md` §3 WP7 (2 dòng client)
- Sửa/tạo:
  - `client/src/api/fileApi/fileApiResource.ts` (S)
  - `client/src/service/uploadService.ts` (S)
- Các bước:
  1. Quét và xoá mọi `console.log` in URL còn sót.
  2. Đường legacy `uploadService.uploadFile()` đang tự sinh `objectName` (`uuidv4() + '_' + file.name`) → chuyển sang gọi luồng asset (E1 → E2 → E4), bỏ hẳn việc client sinh `objectName`.
  3. Không chạm `client/src/page/**` trừ đúng dòng gãy type.
- Acceptance: `rg "uuidv4\(\) *\+ *'_'"` trong `client/src/service` → 0; không còn request nào gửi `objectName` do client sinh; `npm run build` PASS.
- Verify:
  ```powershell
  rg -n "uuidv4\(\)" E:\DaiCuongBK\Project3\FileSharing\client\src\service\uploadService.ts     # -> 0 kết quả liên quan objectName
  rg -n "console\.log" E:\DaiCuongBK\Project3\FileSharing\client\src\service E:\DaiCuongBK\Project3\FileSharing\client\src\api\fileApi  # -> không dòng nào in URL
  cd E:\DaiCuongBK\Project3\FileSharing\client; npm run build   # -> exit 0
  ```
- Phụ thuộc: T-7.6

### T-7.8 — Nghiệm thu toàn phase (build + file lớn > 2 GiB + quét sạch)
- Đọc trước: `00_guardrails.md` §6 (DoD toàn bộ WP0–WP7); `04_verification.md` §5
- Sửa/tạo: không sửa file repo (task kiểm chứng)
- Các bước:
  1. Build server + client.
  2. Upload file > 2 GiB đi trọn vòng E1 → E2 → E4 (chứng minh R2 đã hết).
  3. Chạy toàn bộ mục quét của DoD WP7 và checklist `04_verification.md` §5.
  4. Ghi kết quả thật (không phải kết quả kỳ vọng) vào báo cáo cuối.
- Acceptance: toàn bộ checklist DoD của 8 WP xanh; file > 2 GiB upload xong, `mc stat` size khớp.
- Verify:
  ```powershell
  mvn -f E:\DaiCuongBK\Project3\FileSharing\server\pom.xml clean install -DskipTests    # -> BUILD SUCCESS
  cd E:\DaiCuongBK\Project3\FileSharing\client; npm run build                            # -> exit 0
  rg -n "Double fileSize|fileSize\.intValue\(\)|\(double\) file\.getSize\(\)" E:\DaiCuongBK\Project3\FileSharing\server --glob "!**/target/**"  # -> 0
  mcx stat myminio/file-sharing/<obj-2gb>       # -> Size khớp file gốc
  ```
- Phụ thuộc: T-7.7, T-6.4, T-5.6

---

## 8. Bảng tổng hợp task

| Task | Tên | WP | Phụ thuộc |
|---|---|---|---|
| T-0.1 | Gỡ module `filesharing-uploadservice` khỏi reactor + đĩa | WP0 | — |
| T-0.2 | Xoá rule mồ côi `backend-uploadservice.md` | WP0 | T-0.1 |
| T-0.3 | Build verify toàn reactor | WP0 | T-0.1, T-0.2 |
| T-1.1 | **[RỦI RO]** Xác minh cú pháp `mc ilm` / `svcacct` | WP1 | T-0.3 |
| T-1.2 | 2 file policy JSON | WP1 | T-1.1 |
| T-1.3 | `init-upload-hardening.sh` + chạy (svcacct + ILM 7d) | WP1 | T-1.2 |
| T-1.4 | Nạp 4 key vào `.env` + `application.yml` | WP1 | T-1.3 |
| T-1.5 | Kiểm chứng scope âm 2 service account | WP1 | T-1.4 |
| T-2.1 | 7 `ErrorCode` mới (55xx) | WP2 | T-1.5 |
| T-2.2 | Enum `UploadSessionStatus` + `UploadMode` | WP2 | T-2.1 |
| T-2.3 | Block `upload:` trong `application.yml` | WP2 | T-2.2 |
| T-2.4 | `UploadSessionEntity` + `UploadSessionRepo` | WP2 | T-2.3 |
| T-2.5 | `UploadSessionService` + Impl (partSize, get, touch) | WP2 | T-2.4 |
| T-2.6 | `applyUploadSessionsIndexes()` (4 index, TTL 172800) | WP2 | T-2.5 |
| T-3.1 | Dependency `software.amazon.awssdk:s3` | WP3 | T-2.6 |
| T-3.2 | **[RỦI RO — chặn WP5]** Smoke `Content-MD5` → `BadDigest` | WP3 | T-3.1 |
| T-3.3 | `S3Config` (S3Client + 2 presigner) | WP3 | T-3.2 |
| T-3.4 | `StorageService` + `S3StorageServiceImpl` | WP3 | T-3.3 |
| T-3.5 | Smoke end-to-end tầng storage | WP3 | T-3.4 |
| T-3.6 | **Rewire `MinIoServiceImpl` → adapter `StorageService`** + xoá 4 helper cũ (E7 giữ hợp đồng) | WP3 | T-3.5 |
| T-4.1 | **[RỦI RO — tiên quyết]** `GlobalExceptionHandler` + blast radius | WP4 | T-3.6 |
| T-4.2 | Làm mới baseline E7 sau WP3 | WP4 | T-4.1 |
| T-4.3 | DTO nhóm session/status/resource (4 file) | WP4 | T-4.2 |
| T-4.4 | DTO nhóm part-url/complete/abort (5 file) | WP4 | T-4.3 |
| T-4.5 | `UploadSessionController` + E2 + E3 | WP4 | T-4.4 |
| T-4.6 | E4 complete (verify + idempotent) | WP4 | T-4.5 |
| T-4.7 | E5 abort | WP4 | T-4.6 |
| T-4.8 | **E1 create-new (BREAKING)** | WP4 | T-4.7 |
| T-4.9 | E6 download (kiểm quyền + `contentType`) | WP4 | T-4.8 |
| T-4.10 | `npm run gen-api` | WP4 | T-4.9 |
| T-4.11 | Regression E7 so baseline | WP4 | T-4.10 |
| T-5.1 | `adaptiveBandwidth.ts` hill-climbing, trần 6 | WP5 | T-4.11 |
| T-5.2 | `PartUrlManager` + wrapper E2–E5 | WP5 | T-5.1 |
| T-5.3 | `folderUploadService` đọc field E1 mới | WP5 | T-5.2 |
| T-5.4 | `uploadService` v2 (MD5, resume, complete/abort) | WP5 | T-5.3 |
| T-5.5 | `downloadService` đọc `contentType` | WP5 | T-5.4 |
| T-5.6 | Nghiệm thu WP5 trên trình duyệt | WP5 | T-5.5 |
| T-6.1 | `@EnableScheduling` + key chu kỳ job | WP6 | T-2.6 |
| T-6.2 | Query method GC/reconcile | WP6 | T-6.1 |
| T-6.3 | `UploadSessionGcJob` (15 phút) | WP6 | T-6.2 |
| T-6.4 | `UploadReconcileJob` (24h) | WP6 | T-6.3 |
| T-7.1 | `fileSize` `Double`→`Long` (entity + DTO) | WP7 | T-4.11 |
| T-7.2 | Call site nhóm 1 (Metadata/Asset/Dashboard) | WP7 | T-7.1 |
| T-7.3 | Call site nhóm 2 (Processing/ImageData/FileMetadata) | WP7 | T-7.2 |
| T-7.4 | `MinIoService*`: kiểu `long` + dọn nốt log URL | WP7 | T-7.3, T-3.6 |
| T-7.5 | `@Deprecated` + log warning cho E7 | WP7 | T-7.4 |
| T-7.6 | Giới hạn session/user → 429 | WP7 | T-7.5 |
| T-7.7 | Client: xoá log URL + bỏ đường legacy tự sinh `objectName` | WP7 | T-7.6 |
| T-7.8 | Nghiệm thu toàn phase | WP7 | T-7.7, T-6.4, T-5.6 |

**Tổng: 49 task** — WP0: 3 · WP1: 5 · WP2: 6 · WP3: 6 · WP4: 11 · WP5: 6 · WP6: 4 · WP7: 8.

Task rủi ro đứng sớm trong WP của mình: `T-1.1` (cú pháp `mc ilm`), `T-3.2` (Content-MD5 → `BadDigest`), `T-4.1` (`GlobalExceptionHandler` — blast radius toàn repo). Task rủi ro **cuối WP3**: `T-3.6` (rewire E7 — rủi ro nằm ở hợp đồng legacy, nên phải có baseline trước và regression sau).

---

## 9. Ràng buộc release: `T-4.8` (E1) + toàn bộ WP5

Nguồn: `../03_detailed_design.md` mục "Rollout & tương thích ngược"; `01_api_contract.md` E1.2 ghi chú `folderUploadService.ts:160-167`.

| Nhóm | Deploy độc lập được? | Lý do |
|---|---|---|
| WP0, WP1 | **Có** | Thuần hạ tầng/cấu hình, không đổi API |
| WP2, WP3 (gồm `T-3.6`) | **Có** | Chưa lộ ra API công khai. `T-3.6` đổi implementation E7 nhưng **giữ nguyên hợp đồng** → client cũ không cần đổi; chỉ TTL nội bộ của part URL legacy đổi (client cũ không đọc TTL) |
| `T-4.1` (`GlobalExceptionHandler`) | **Có, nhưng đổi hành vi lỗi toàn hệ** | Phải smoke các module khác cùng lúc (bước 3 của task) |
| E2, E3, E4, E5 (`T-4.5`–`T-4.7`) | **Có** | Namespace mới `/api/uploads/*`, client cũ không gọi tới |
| **`T-4.8` (E1)** | **KHÔNG** | Response `create-new` bỏ `upload.uploadId` + `upload.partUrl`; client hiện tại **throw** `Error('Upload session is missing from create asset response')` nếu thiếu |
| **WP5 (`T-5.1`–`T-5.6`)** | **KHÔNG** | Phụ thuộc field mới của E1 |
| WP6, WP7 | **Có** (sau khi WP4/WP5 ổn định) | Job nền + vệ sinh; `T-7.7` phụ thuộc client v2 |

**Quy tắc:** `T-4.8` và WP5 **phải nằm trong cùng một release artifact**. Nếu phải cắt release sớm, cắt **trước** `T-4.8` (giữ E1 nguyên trạng, deploy E2–E5) — không bao giờ cắt giữa `T-4.8` và WP5.

`T-4.10` (`gen-api`) làm client tạm gãy type cho tới `T-5.3`/`T-5.4` — đây là trạng thái trung gian **có chủ đích**, không phải lỗi; không được "sửa nhanh" bằng cách hand-edit `client/src/api/api/` (`00_guardrails.md` §2.6).
