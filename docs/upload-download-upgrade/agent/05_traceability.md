# 05 — Traceability: Upload/Download Pipeline v2

> **Vai trò tài liệu:** ma trận truy vết 2 chiều — (1) **yêu cầu → triển khai**, (2) **điểm yếu hiện trạng → cách vá**. Dùng để trả lời một câu hỏi duy nhất: *"Yêu cầu X đã được phủ chưa, ở đâu, kiểm bằng gì?"*
> Mã yêu cầu (`CLEAN-01`, `SEC-xx`, `PERF-xx`, `REL-xx`) và mã điểm yếu (`S1-S8`, `P1-P4`, `R1-R7`) lấy từ `../01_user_requirement.md`. Task id từ `03_tasks.md`. Mục verify từ `04_verification.md`. File này **không định nghĩa** yêu cầu mới.
>
> Ngày chốt: 2026-09-02 · Nhánh cơ sở: `web-flux`

---

## 1. Quy ước trạng thái

| Ký hiệu | Nghĩa |
|---|---|
| **Đủ** | Phase này phủ trọn yêu cầu |
| **Một phần** | Phủ luồng mới (E1–E6); phần còn lại gắn với legacy E7 hoặc hạng mục P2 — có lý do ghi kèm |
| **Phase sau** | Không nằm trong phạm vi phase (theo `../01_user_requirement.md` §B.4 hoặc ưu tiên P2) |

---

## 2. Ma trận 1 — Yêu cầu → triển khai

### 2.1 CLEAN

| Mã | Yêu cầu (rút gọn) | Ưu tiên | WP | Task | File chính | Verify | Trạng thái |
|---|---|---|---|---|---|---|---|
| CLEAN-01 | Gỡ hoàn toàn module `filesharing-uploadservice` | P0 | WP0 | `T-0.1`, `T-0.2`, `T-0.3` | `server/pom.xml`; xoá `server/filesharing-uploadservice/`; xoá `.claude/rules/backend-uploadservice.md` | `04_verification.md` §4.5 | **Đủ** |

### 2.2 SEC — Bảo mật

| Mã | Yêu cầu (rút gọn) | Ưu tiên | WP | Task | File chính | Verify | Trạng thái |
|---|---|---|---|---|---|---|---|
| SEC-01 | Presigned ký bằng service account scope hẹp, không dùng key toàn quyền | P0 | WP1, WP3 | `T-1.2`, `T-1.3`, `T-1.4`, `T-1.5`, `T-3.3` | `server/dockers/config/policy-svc-*.json`; `server/dockers/scripts/init-upload-hardening.sh`; `configurations/S3Config.java`; `application.yml` | §4.1 (svcacct + scope âm), §1.4 | **Một phần** — luồng mới (E1–E6) và **cả E7 sau `T-3.6`** đều ký bằng `svc-upload`/`svc-download`; nhưng bean `MinioClient` của core + 2 worker codec **vẫn giữ key cũ toàn quyền** (`../03_detailed_design.md` §WP1 mục 2; `02_schema_config.md` §4.4) → S1 chỉ khép hoàn toàn ở phase tách credential worker |
| SEC-02 | TTL nhiều tầng: part URL ngắn + session TTL trượt + trần cứng 7 ngày + abort multipart dở 7 ngày (tầng MinIO) | P0 | WP1, WP2 | `T-1.3` (tầng MinIO — **đổi từ ILM sang `stale_uploads_expiry=168h`, xem `04_verification.md` §5.3**), `T-2.3` (`part-url-ttl`, `session-idle-ttl`), `T-2.5` (sliding + `hardExpiresAt`), `T-2.6` (TTL index) | `init-upload-hardening.sh`; `application.yml`; `UploadSessionServiceImpl`; `MongoIndexBootstrapConfig` | §5.3 (`stale_uploads_expiry`), §4.2 (TTL index 172800), §2.2 B3/B5 (sliding) | **Đủ** |
| SEC-03 | Client chỉ cầm `sessionId`; `objectName`/`uploadId` do server giữ | P0 | WP2, WP4, WP5 | `T-2.4`, `T-4.5`, `T-4.8`, `T-5.2`, `T-5.4`, `T-7.7` | `UploadSessionEntity`; `UploadSessionController`; `AssetCreateResponseDto`; `partUrlManager.ts`; `uploadService.ts` | §2.1 A1 (body không chứa `uploadId`), §2.6 F4 | **Một phần** — E1–E5 khép kín; **E7 vẫn nhận `objectName` từ client** (hợp đồng legacy giữ nguyên có chủ đích — `00_guardrails.md` §2.3). Đường legacy phía client bị gỡ ở `T-7.7`, endpoint gỡ ở phase sau |
| SEC-04 | Complete: kiểm quyền TRƯỚC storage + verify đủ part/size/ETag trước commit | P0 | WP4 | `T-4.6` | `UploadSessionServiceImpl` (E4), `MetadataServiceImpl` | §2.3 C3/C7/C8/C9, §2.4 | **Đủ** |
| SEC-05 | Download kiểm quyền (owner / project-folder / share token) trước khi presign | P0 | WP4 | `T-4.9` | `FileMetadataController`, `MetadataServiceImpl` | §2.5 E-1..E-5 | **Đủ** |
| SEC-06 | Integrity: `Content-MD5` từng part (MinIO trả `BadDigest`); ETag check từ warn → fail-retry | P1 | WP3, WP4, WP5 | `T-3.2` (**cổng chặn K1**), `T-4.6` (`verify-etag-md5`), `T-5.4` | `S3StorageServiceImpl`; `UploadSessionServiceImpl`; `uploadService.ts` | §2.3 C8/C14, §2.6 F1 | **Đủ** (điều kiện: `T-3.2` xác nhận MinIO validate; nếu không → đổi hợp đồng E2, xem `04_verification.md` §5.1 K1) |
| SEC-07 | Không log presigned URL ở bất kỳ tầng nào | P1 | WP3, WP5, WP7 | `T-3.4`, `T-3.6`, `T-5.2`, `T-7.4`, `T-7.7` | `S3StorageServiceImpl`; `MinIoServiceImpl`; `fileApiResource.ts`; `uploadService.ts` | §4.4 (quét source + log runtime), §2.6 F7 | **Đủ** |
| SEC-08 | Giới hạn: max file size + số session mở đồng thời/user | P1 | WP2, WP7 | `T-2.3`, `T-2.5` (max-file-size), `T-7.6` (max-sessions-per-user → 429) | `application.yml`; `UploadSessionServiceImpl`; `UploadSessionRepo` | §2.3 C12, C13 | **Đủ** (phần "ingress bytes/user/giờ" của SEC-08 là vế "về sau" — xem §4) |
| SEC-09 | Bật MinIO audit log (webhook) | P2 | — | — | — | — | **Phase sau** (`../01_user_requirement.md` §B.1 ghi P2; `../03_detailed_design.md` §WP1 mục 4 + mục Rollout "Phase sau") |
| SEC-10 | Thumbnail/preview bỏ public bucket → presigned hoặc route có kiểm quyền | P2 | — | — | — | — | **Phase sau** (`02_schema_config.md` §4.4 ghi rõ không đổi policy `thumbnail-bucket` trong phase này) |

### 2.3 PERF — Hiệu năng

| Mã | Yêu cầu (rút gọn) | Ưu tiên | WP | Task | File chính | Verify | Trạng thái |
|---|---|---|---|---|---|---|---|
| PERF-01 | Bỏ sinh trước toàn bộ part URL; cấp theo batch TTL đồng nhất; xoá `calculateExpireTime` | P0 | WP3, WP4, WP5 | `T-4.5` (E2), `T-4.8` (lô đầu K=20), `T-5.2` (PartUrlManager), `T-3.6` (xoá `calculateExpireTime`) | `UploadSessionController`; `AssetServiceImpl`; `partUrlManager.ts`; `MinIoServiceImpl` | §2.1 A1, §2.2 B5, §4.4 | **Một phần** — luồng mới cấp batch (K=20, ≤50/lần); **E7 vẫn sinh trước toàn bộ part URL** (phần hợp đồng legacy), nhưng TTL đã đồng nhất `clamp(partCount × 60s, 1h, 6h)` và `calculateExpireTime` **đã bị xoá** ở `T-3.6` |
| PERF-02 | Part size do server công bố `clamp(max(8MiB, size/10000), 8MiB, 64MiB)`; client bỏ adaptive chunk size | P0 | WP2, WP4, WP5 | `T-2.5` (công thức), `T-4.8` (công bố ở E1), `T-5.1` (bỏ adaptive size), `T-5.4` (dùng partSize server) | `UploadSessionServiceImpl`; `adaptiveBandwidth.ts`; `uploadService.ts` | §2.1 A1, §2.6 F3, §3.1 `UploadSessionPartSizeTest` | **Đủ** |
| PERF-03 | File nhỏ (≤ 8 MiB) đi 1 request, không multipart | P1 | WP2, WP4, WP5 | `T-2.5` (`SMALL_FILE_THRESHOLD`), `T-4.8` (nhánh `SINGLE` ở E1), `T-4.5`/`T-4.6` (nhánh `SINGLE` ở E3/E4), `T-5.4` | `UploadSessionServiceImpl`; `AssetServiceImpl`; `uploadService.ts` | §3.1 `partSize_8MiBFile_returnsSingleMode`, §2.1 (biến thể file ≤ 8 MiB) | **Đủ** |
| PERF-04 | Download file lớn stream xuống đĩa (File System Access API), không ghép RAM | P2 | — | — | — | — | **Phase sau** — P2; `01_api_contract.md` không định nghĩa ngưỡng và `00_guardrails.md` §6 "DoD WP5" **không có** mục kiểm nào cho nó (quyết định **D10** ở `03_tasks.md` §0.3) |
| PERF-05 | Thay OkHttp + XML tự chế bằng AWS SDK v2 cho call control-plane | P1 | WP3 | `T-3.1`, `T-3.3`, `T-3.4`, `T-3.6` | `S3Config.java`; `StorageService`; `S3StorageServiceImpl`; `MinIoServiceImpl` (adapter) | §4.5 (dependency tree), §2.1, §2.7 | **Đủ** — sau `T-3.6` không còn call S3 thủ công nào trong repo (`OkHttpClient` + regex XML bị xoá) |
| PERF-06 | Adaptive concurrency hill-climbing trên tổng throughput, trần 6 thread cấu hình được | P1 | WP2, WP5 | `T-2.3` (`upload.max-threads`), `T-5.1` | `application.yml`; `adaptiveBandwidth.ts` | §2.6 F2, §3.2 `AdaptiveBandwidthHillClimbTest` | **Đủ** (test tự động phụ thuộc user duyệt test runner — §3.2 của `04_verification.md`) |

### 2.4 REL — Độ tin cậy

| Mã | Yêu cầu (rút gọn) | Ưu tiên | WP | Task | File chính | Verify | Trạng thái |
|---|---|---|---|---|---|---|---|
| REL-01 | Resume: `GET session` trả part đã nhận (từ `ListParts`) + trạng thái, kể cả `COMPLETED` | P0 | WP4, WP5 | `T-4.5` (E3), `T-5.4` (resume + persist `sessionId`) | `UploadSessionController`; `uploadService.ts` | §2.2 (toàn kịch bản B), §2.6 F5 | **Đủ** |
| REL-02 | Complete idempotent: gọi lần 2 trả kết quả cũ, không tác dụng phụ | P0 | WP4 | `T-4.6` | `UploadSessionServiceImpl` | §2.4 D1–D3, §3.1 `complete_alreadyCompleted_...` | **Đủ** |
| REL-03 | GC 3 tầng: tầng MinIO (đổi từ ILM sang `stale_uploads_expiry`) + job quét session hết hạn + job đối soát Mongo ↔ MinIO | P1 | WP1, WP6 | `T-1.3` (tầng 1 — xem `04_verification.md` §5.3), `T-6.1`–`T-6.3` (tầng 2), `T-6.4` (tầng 3) | `init-upload-hardening.sh`; `FileSharingApplication`; `UploadSessionGcJob`; `UploadReconcileJob` | §5.3, §4.3 | **Đủ** |
| REL-04 | Sửa lỗi nền: tràn `intValue()` (R2), `fileSize` → số nguyên (R5), `contentType` (R4) | P0 | WP4, WP7 | `T-4.9` (contentType), `T-7.1`–`T-7.4` (fileSize/R2) | `DownloadFileResponseDto`; `MetadataEntity`; `MetadataDTO`; 6 call site; `MinIoService*` | §2.5 E-1 (`Int64`), §4.5, DoD WP7 | **Đủ** |
| REL-05 | Trạng thái session tường minh `INITIATED → UPLOADING → COMPLETED/ABORTED/EXPIRED`, tách khỏi `ProcessingStatus` | P1 | WP2, WP4, WP6 | `T-2.2`, `T-2.4`, `T-4.5`–`T-4.7`, `T-6.3` | `UploadSessionStatus`; `UploadSessionEntity`; `UploadSessionController` | §2.2 B3/B8, §2.3 C10/C11, §4.3 | **Đủ** |

---

## 3. Ma trận 2 — Điểm yếu hiện trạng → cách vá

Nguồn điểm yếu: `../01_user_requirement.md` §A.6.

### 3.1 Bảo mật (S1–S8)

| # | Điểm yếu | Task vá | Trạng thái sau phase |
|---|---|---|---|
| S1 | Presigned ký bằng service account **không giới hạn policy** (tương đương root) | `T-1.2`, `T-1.3`, `T-1.4`, `T-1.5`, `T-3.3` | **Một phần — chấp nhận có chủ đích.** Toàn bộ presign của filehandler (E1–E6 **và** E7 sau `T-3.6`) chuyển sang `svc-upload`/`svc-download`. Nhưng bean `MinioClient` legacy (core `MinIOConfig`) dùng cho `uploadSmallFile`/`deleteFile`/HLS và 2 worker `imagecodec`/`videocodec` **vẫn giữ key cũ** — tách credential worker nằm ngoài phạm vi (`02_schema_config.md` §4.4). Khép hoàn toàn ở phase gỡ E7 + tách credential worker |
| S2 | Download **không kiểm quyền** | `T-4.9` | **Vá đủ** — thứ tự bắt buộc: metadata → quyền → `status` → presign (`01_api_contract.md` E6.4) |
| S3 | Luồng legacy cho **client tự đặt `objectName`** | `T-7.7` (client), `T-4.8` (luồng asset là đường chính) | **Một phần — chấp nhận có chủ đích.** Client không còn sinh `objectName`; nhưng endpoint `upload-metadata` **vẫn nhận** `objectName` từ body vì hợp đồng E7 phải giữ nguyên (`00_guardrails.md` §2.3). Đóng hẳn khi xoá E7 ở phase sau |
| S4 | Complete: commit trước, kiểm owner sau; `objectName`/`uploadId`/`parts` do client gửi | `T-4.6` | **Vá đủ cho luồng mới** — E4 kiểm owner trước mọi call storage, mọi định danh tra từ session. E7 giữ hành vi cũ (deprecated, có log warning để theo dõi traffic) |
| S5 | Không đối chiếu **size thực tế**; khai gian size | `T-2.5` (`declaredSize` + `max-file-size`), `T-4.5` (không cấp URL ngoài `partCount`), `T-4.6` (verify `Σ size == declaredSize`) | **Vá đủ** — chặn ở 3 tầng: khai báo, cấp URL, commit |
| S6 | Presigned URL bị **log** ở server và client | `T-3.4`, `T-3.6`, `T-5.2`, `T-7.4`, `T-7.7` | **Vá đủ** — kiểm bằng `04_verification.md` §4.4 (quét cả source lẫn log runtime) |
| S7 | Không TTL dọn rác; `timeToLive` là field chết | `T-1.3`, `T-2.5`, `T-2.6`, `T-6.3`, `T-6.4` | **Vá đủ về vòng đời** (session TTL trượt + trần cứng + GC 3 tầng). **Field `MetadataEntity.timeToLive` vẫn là field chết** — cố ý không đụng trong phase này (`02_schema_config.md` §6.2 mục 6); gỡ ở phase dọn legacy |
| S8 | Bucket thumbnail truy cập public không chữ ký | — | **KHÔNG vá** — thuộc SEC-10 (P2), phase sau |

### 3.2 Hiệu năng (P1–P4)

| # | Điểm yếu | Task vá | Trạng thái sau phase |
|---|---|---|---|
| P1 | Sinh trước toàn bộ part URL tại initiate | `T-4.5`, `T-4.8`, `T-5.2` | **Một phần — chấp nhận có chủ đích.** Luồng mới cấp batch (lô đầu K = min(partCount,20), sau đó ≤ 50/lần). E7 **vẫn sinh trước toàn bộ** vì đó là hợp đồng client cũ đang đọc; đổi lại TTL không còn "đoán tương lai" mà đồng nhất `clamp(partCount × 60s, 1h, 6h)` (`T-3.6`) |
| P2 | `CHUNK_SIZE` server 5 MiB vs client adaptive 5–50 MiB (2 phía không thoả thuận) | `T-2.5`, `T-4.8`, `T-5.1`, `T-5.4` | **Vá đủ** — server công bố `partSize` cố định cho cả session, client dùng đúng giá trị đó; nhờ vậy `offset = (n-1) × partSize` xác định được (điều kiện của resume) |
| P3 | Download ghép toàn bộ file trong RAM | — | **KHÔNG vá** — thuộc PERF-04 (P2), phase sau. Phase này chỉ sửa `contentType` (R4) |
| P4 | Hand-rolled S3 call (OkHttp + regex XML), không retry, không typed error | `T-3.1`, `T-3.4`, `T-3.6` | **Vá đủ** — sau `T-3.6`, `OkHttpClient`, `extractUploadIdFromXml`, `buildCompleteMultipartUploadXml` bị xoá; **mọi** call control-plane (kể cả E7) đi qua AWS SDK v2 có retry/typed error |

### 3.3 Độ tin cậy (R1–R7)

| # | Điểm yếu | Task vá | Trạng thái sau phase |
|---|---|---|---|
| R1 | Resume không thể hoạt động (`resumeUpload` là stub; chunk adaptive → không suy được offset) | `T-2.5` (partSize cố định), `T-4.5` (E3 + `ListParts`), `T-5.4` (client resume + persist `sessionId`) | **Vá đủ** |
| R2 | Tràn số file > 2 GiB (`fileSize.intValue()`) | `T-2.4`/`T-2.5` (`long` từ đầu ở luồng mới), `T-3.6` (adapter SDK cho E7), `T-7.1`–`T-7.3` (xoá `.intValue()`), `T-7.8` (test file > 2 GiB) | **Vá đủ** — cả luồng mới lẫn luồng legacy |
| R3 | Abort phụ thuộc hoàn toàn client; không lifecycle, không GC | `T-1.3`, `T-6.3`, `T-6.4` | **Vá đủ** — 3 tầng độc lập, dư thừa có chủ đích |
| R4 | Client đọc `contentType`, server trả `mimeType` | `T-4.9` (server trả cả hai), `T-5.5` (client đọc `contentType`) | **Vá đủ** |
| R5 | `fileSize` kiểu `Double` xuyên suốt server | `T-7.1`–`T-7.4` (+ `T-4.8` cho `AssetCreateRequestDto`, `T-4.9` cho `DownloadFileResponseDto`) | **Vá đủ về kiểu.** Dữ liệu cũ **không migration** — dùng `@Field(targetType = FieldType.INT64)` + `Long` wrapper, đọc BSON `double` cũ qua `ConversionService` (quyết định **D8**, `03_tasks.md` §0.3). Document `metadata` cũ vẫn lưu BSON `double` cho tới khi được ghi lại |
| R6 | Complete không idempotent | `T-4.6` | **Một phần — chấp nhận có chủ đích.** E4 idempotent hoàn toàn (`findAndModify` có điều kiện + trả `resource` cũ). **E7 `upload/complete` vẫn không idempotent** — giữ nguyên hành vi legacy theo `00_guardrails.md` §2.3 |
| R7 | `GlobalExceptionHandler` trả 500 cho mọi lỗi nghiệp vụ | `T-4.1` | **Vá đủ** — nhưng là thay đổi hành vi **toàn hệ thống**: mọi module bắt đầu trả mã lỗi thật thay vì 500. Bắt buộc smoke blast radius trong chính task đó |

---

## 4. Khoảng trống đã biết — những gì phase này KHÔNG vá

Liệt kê trung thực để không ai hiểu nhầm là đã xong.

### 4.1 Yêu cầu bị hoãn sang phase sau

| Mã | Nội dung | Lý do hoãn |
|---|---|---|
| SEC-09 | MinIO audit log (webhook) để truy vết request presigned | P2; `../03_detailed_design.md` mục Rollout xếp vào "Phase sau" |
| SEC-10 | Thumbnail/preview bỏ public bucket | P2; đụng cả `imagecodec`/`videocodec` và `MinioStorageClient.buildThumbnailPublicUrl` — vượt whitelist phase này |
| PERF-04 | Download stream-to-disk (File System Access API) cho file lớn | P2; contract không định nghĩa ngưỡng, DoD WP5 không có mục kiểm (delta **D10**) |
| SEC-08 (vế 2) | Rate limit **ingress bytes / user / giờ** theo thời gian thực | `../01_user_requirement.md` §B.4 ghi rõ ngoài phạm vi; phase này chỉ giới hạn theo size khai báo + số session |
| — | Malware scanning | §B.4 — chỉ ghi nhận chỗ cắm (status trên metadata + enforce ở download), không triển khai |
| — | CDN / edge TLS termination; đặt MinIO sau reverse proxy HTTP/2 | §B.4. Hệ quả trực tiếp: `MAX_THREADS` không thể nâng quá 6 trong phase này (giới hạn ~6 kết nối/host của HTTP/1.1) |
| — | Go upload proxy / đổi data plane | Đã loại ở quyết định PA2 (§B.0) |

### 4.2 Nợ kỹ thuật ĐÃ DUYỆT (cố ý mang sang phase sau)

| # | Nợ | Người duyệt / nguồn | Hệ quả nếu quên |
|---|---|---|---|
| N1 | **`AssetCreateResponseDto` trả entity trực tiếp** (`asset: AssetEntity`, `version: MetadataEntity`) thay vì map sang DTO — vi phạm `.claude/rules/backend-filehandler.md` #1 | User duyệt 2026-09-01; `00_guardrails.md` §3 WP4 (row `AssetCreateResponseDto`), `01_api_contract.md` §8 dòng cuối, delta **D13** | Mọi field thêm vào `AssetEntity`/`MetadataEntity` bị **rò ra API công khai** mà không qua review contract; client cũng bị buộc dính vào shape entity. Trả nợ cùng phase gỡ E7 (khi đằng nào cũng phải phá client cũ) |
| N2 | **3 endpoint legacy E7 vẫn sống** với hợp đồng cũ (client tự gửi `objectName`, complete không idempotent, không kiểm quyền) | `../01_user_requirement.md` §B.4; `00_guardrails.md` §2.3 | Giữ nguyên các lỗ S3/S4/R6 ở đường legacy. Theo dõi bằng `log.warn` của `T-7.5` để biết khi nào hết traffic → xoá |
| N3 | **Bean `MinioClient` legacy + 2 worker codec giữ key toàn quyền** | `../03_detailed_design.md` §WP1 mục 2; `02_schema_config.md` §4.4 | SEC-01/S1 chỉ khép một phần; key cũ vẫn nằm trong `application.yml` |
| N4 | **`MetadataEntity.timeToLive`** vẫn là field chết (mặc định `Integer.MAX_VALUE`, không job nào enforce) | `02_schema_config.md` §6.2 mục 6 | Trường gây hiểu nhầm là có TTL trên metadata; vòng đời thật do `upload_sessions` quản |
| N5 | **Không migration `fileSize`** trên document `metadata` cũ (vẫn là BSON `double`) | Delta **D8** (`03_tasks.md` §0.3); `../03_detailed_design.md` §WP7 | Collection có 2 kiểu số cùng lúc → aggregation/index theo `fileSize` phải chịu kiểu hỗn hợp. Script `$toLong` đã có sẵn ở `02_schema_config.md` §6.2 nếu sau này muốn chạy |
| N6 | **Không có test suite tự động** ở cả hai phía; toàn bộ nghiệm thu là smoke test thủ công | `00_guardrails.md` §2.17 + §2.4 (cấm thêm package npm) | Không có lưới an toàn hồi quy; kế hoạch test đã đặc tả sẵn ở `04_verification.md` §3, chờ user duyệt mở test suite |
| N7 | **`uploadMode` không được persist** — suy ra từ `session.uploadId == null` | `02_schema_config.md` §1.3 | Nếu sau này có nhánh multipart với `uploadId = null` thì suy luận này sai |
| N8 | **`abortedAt` dùng chung field `completedAt`** (không có field thứ 17) | `02_schema_config.md` §1.3 — mục "CẦN USER DUYỆT" | Truy vấn phân tích phải đọc kèm `status` mới biết `completedAt` nghĩa là hoàn tất hay huỷ |

### 4.3 Rủi ro còn mở (không phải nợ, nhưng phải theo dõi)

| # | Rủi ro | Điều kiện kích hoạt | Nơi xử lý |
|---|---|---|---|
| M1 | MinIO **không** validate `Content-MD5` trên presigned PUT | `T-3.2` fail | Cổng chặn K1 (`04_verification.md` §5.1) → STOP, đổi hợp đồng E2 |
| M2 | `mc ilm import` không có trên image `minio/mc` đang dùng | `T-1.1` fail | Cổng chặn K2 → quyết cú pháp thay thế trước khi viết script |
| M3 | Sửa `GlobalExceptionHandler` làm gãy client/integration đang bắt cứng 500 | Sau `T-4.1` | Smoke blast radius trong `T-4.1` bước 3–4; cổng chặn K3 |
| M4 | `T-4.8` (E1) deploy lệch nhịp với WP5 → client cũ throw ngay lập tức | Cắt release ở giữa | Cổng chặn K6 + `03_tasks.md` §9 |
| M5 | ETag ≠ MD5 nếu MinIO bật SSE-KMS về sau | Bật mã hoá phía server | Đã có cờ `upload.verify-etag-md5` (tắt được mà không mất check tổng size) |
| M6 | Batch URL 15 phút quá ngắn cho mạng rất chậm | Part 64 MiB trên đường truyền < 1 Mbps | Client xin lại URL là hành vi chuẩn (không tính lỗi); nâng qua `upload.part-url-ttl` |
