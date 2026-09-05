# 00 — Guardrails cho AI agent triển khai phase Upload/Download v2 (PA2)

> **Ngày ban hành:** 2026-09-02 · **Áp dụng cho:** mọi agent/dev thực thi WP0→WP7 của `docs/upload-download-upgrade/`.
> **Tài liệu này KHÔNG chứa spec.** Nó chỉ định nghĩa: được chạm file nào, cấm làm gì, khi nào phải dừng, và điều kiện nào coi là xong một WP.
> Spec API nằm ở `agent/01_api_contract.md`; spec schema + config key nằm ở `agent/02_schema_config.md`. Không chép lại chúng vào đây, cũng không suy diễn thay chúng.

---

## 1. Cách dùng tài liệu này

### 1.1 Thứ tự đọc bắt buộc trước khi gõ dòng code đầu tiên

| Bước | File | Lấy gì từ đó |
|---|---|---|
| 1 | `docs/upload-download-upgrade/README.md` | Quyết định nền PA2 + 8 thay đổi lớn |
| 2 | `docs/upload-download-upgrade/01_user_requirement.md` | Hiện trạng (A.1–A.5), mã điểm yếu `S1-S8`/`P1-P4`/`R1-R6`, mã yêu cầu `SEC/PERF/REL` |
| 3 | `docs/upload-download-upgrade/02_system_technical_design.md` | Pipeline 3 pha initiate → transfer → commit |
| 4 | `docs/upload-download-upgrade/03_detailed_design.md` | **Nguồn chân lý về phạm vi từng WP** |
| 5 | File này (`agent/00_guardrails.md`) | Whitelist, điều cấm, stop condition, DoD |
| 6 | `.claude/rules/upload-pipeline.md` | Rule sống của luồng upload v2 (tự nạp mỗi phiên) |

### 1.2 Đọc thêm theo loại task

| Task đang làm | Bắt buộc đọc thêm |
|---|---|
| Bất kỳ endpoint nào (E1–E7) | `agent/01_api_contract.md` — **tên field, HTTP status, mã lỗi lấy từ đây, không tự đặt** |
| Entity `upload_sessions`, index, config key `upload.*` / `minio.svc-*` | `agent/02_schema_config.md` |
| Chọn task tiếp theo / cập nhật tiến độ | `agent/03_tasks.md` |
| Chuẩn bị nghiệm thu, chạy lệnh kiểm chứng | `agent/04_verification.md` + §6 file này |
| Kiểm tra một yêu cầu `SEC-xx/PERF-xx/REL-xx` đã được phủ chưa | `agent/05_traceability.md` |
| Code backend filehandler | `.claude/rules/backend-filehandler.md` |
| Code trong `filesharing-core` | `.claude/rules/backend-core.md` |
| Code client | `.claude/rules/frontend.md` + `client/CLAUDE.md` |

Nếu một file trong `agent/` được tham chiếu ở trên **chưa tồn tại**, xem §4 — dừng và hỏi, không tự viết spec thay nó.

### 1.3 Thứ tự thực thi WP

`WP0 → WP1 → WP2 → WP3 → WP4 → WP5`; `WP6` và `WP7` chạy song song được nhưng chỉ sau khi WP2 xong. Không mở WP kế tiếp khi checklist DoD (§6) của WP hiện tại chưa xanh toàn bộ.

---

## 2. Phạm vi ÂM — CẤM tuyệt đối

Vi phạm bất kỳ mục nào dưới đây = dừng công việc, hoàn tác thay đổi, báo người dùng.

1. **Không sửa/tạo/xoá file ngoài whitelist của WP đang làm** (§3). Kể cả file "chỉ sửa 1 dòng", kể cả file "rõ ràng đang sai".
2. **Không refactor tuỳ hứng**: không đổi tên biến/method/class nằm ngoài phạm vi task, không format lại file, không sắp xếp lại import, không "dọn dẹp tiện tay" code cũ.
3. **Không đổi HỢP ĐỒNG 3 endpoint legacy E7** — `POST /api/file-metadata/upload-metadata`, `POST /api/file-metadata/upload/complete`, `POST /api/file-metadata/upload/stop-upload`. Giữ nguyên URL, request body, response schema (`InitiateUploadResponseDto{uploadId, partUrl}`), HTTP status; thêm `@Deprecated` + log warning (WP7). **ĐƯỢC PHÉP** (user duyệt 2026-09-01) chuyển implementation sang `StorageService`/AWS SDK với TTL part URL đồng nhất `clamp(partCount × 60s, 1h, 6h)` — xem `01_api_contract.md` §E7; cấm mọi thay đổi hợp đồng khác.
4. **Không thêm dependency mới** ngoài đúng một artifact `software.amazon.awssdk:s3` (khai version qua property trong `server/pom.xml`). Cấm thêm `awssdk:s3-transfer-manager`, `awssdk:netty-nio-client`, Redis, Resilience4j, MapStruct, Testcontainers... Phía client: **cấm thêm bất kỳ package npm nào** (`client/package.json` không được thêm dòng `dependencies`).
5. **Không đổi root package `org.example.filesharing`** của filehandler và không đổi `com.file.service.filesharing.core` của core. Class mới đặt đúng package hiện có, không tạo package gốc mới.
6. **Không hand-edit `client/src/api/api/**`** — chỉ tái sinh bằng `npm run gen-api` (server phải chạy ở `:5000`). Nếu generated code sai, sửa DTO phía server rồi gen lại.
7. **Không tự sáng tác định danh**: tên endpoint, tên field JSON, tên enum, tên `ErrorCode`, tên config key phải khớp 100% `agent/01_api_contract.md` / `agent/02_schema_config.md`. **Bảy** mã lỗi mới được phép thêm vào `ErrorCode` (dải `55xx`, danh sách đầy đủ tại `01_api_contract.md` §9.1 + §9.2 — đã duyệt): `SESSION_NOT_FOUND`, `UPLOAD_INCOMPLETE`, `SIZE_MISMATCH`, `CHECKSUM_MISMATCH`, `SESSION_INVALID_STATE`, `SESSION_LIMIT_EXCEEDED`, `FILE_NOT_READY` — không thêm mã thứ tám.
8. **Không đổi schema ngoài spec**: không thêm/xoá/đổi kiểu field trên `MetadataEntity`, `AssetEntity`, `FolderEntity`, `ProjectEntity` ngoài đúng những thay đổi liệt kê ở WP7; không tạo collection nào ngoài `upload_sessions`.
9. **Không tạo abstraction/layer mới ngoài thiết kế**: không thêm `@ControllerAdvice`, không thêm filter trong `filters/`, không thêm interceptor, không tạo `PermissionService`/`UploadFacade`/mapper layer, không tạo module Maven mới, không tạo service mới ngoài `UploadSessionService` + `StorageService`.
10. **Không xoá/ghi đè dữ liệu đang có**: cấm `mc rb`, `mc rm --recursive`, `db.dropDatabase()`, `db.<collection>.drop()`, xoá file dưới `server/dockers/data/minio/`, xoá document trong `metadata`/`asset`/`folder`/`projects`. Dữ liệu test tự tạo thì tự dọn đúng object/document đó.
11. **Không sửa tài liệu trong `docs/`** — toàn bộ `docs/` là READ-ONLY với agent triển khai (kể cả `docs/upload-download-upgrade/agent/*`). Muốn đổi thiết kế → §4.
12. **Không sửa file cấu hình của môi trường agent**: `.claude/rules/*`, `.claude/agents/*`, `.claude/settings*`, `CLAUDE.md`, `client/CLAUDE.md`. Ngoại lệ duy nhất: người dùng yêu cầu trực tiếp — **đã có một ngoại lệ được duyệt (2026-09-01): xoá `.claude/rules/backend-uploadservice.md` trong WP0**.
13. **Không `git commit`, `git push`, `git checkout -b`, `git reset`, `git stash`** khi người dùng chưa yêu cầu. Không tạo PR.
14. **Không chạy `mvn clean` trên toàn reactor rồi bỏ dở**, không xoá `target/` của module khác, không sửa version Spring Boot / Java 21 trong `server/pom.xml`.
15. **Không log presigned URL** ở bất kỳ tầng nào (`log.info/debug/warn`, `console.log`, comment chứa URL mẫu có chữ ký, file test fixture). Log tối đa: `sessionId`, `partNumber`, `objectName`, HTTP status.
16. **Không nhận `objectName` / `uploadId` từ request body của luồng mới** (E2–E5). Client chỉ được cầm `sessionId`.
17. **Không viết test/script tự động gọi ra MinIO hoặc Mongo production-local mà không được yêu cầu** — smoke test thủ công theo §6 là đủ; repo hiện **không có test suite** ở cả hai phía, không tự dựng framework test mới.

---

## 3. Phạm vi DƯƠNG — Whitelist file theo từng WP

Quy ước cột "Loại": `S` = sửa file có sẵn, `N` = **tạo mới**, `D` = xoá.
Mọi đường dẫn tính từ gốc repo `E:\DaiCuongBK\Project3\FileSharing\`.

### WP0 — Gỡ bỏ `filesharing-uploadservice` (CLEAN-01, làm trước tiên)

| Loại | Đường dẫn | Ghi chú |
|---|---|---|
| S | `server/pom.xml` | Xoá đúng dòng `<module>filesharing-uploadservice</module>` (hiện là dòng 37). Không đụng `<dependencyManagement>` |
| D | `server/filesharing-uploadservice/` | Xoá cả thư mục, gồm `src/`, `pom.xml`, `mvnw.cmd`, `.mvn/`, `.gitignore`, `.gitattributes`, `target/` |
| D | `.claude/rules/backend-uploadservice.md` | Rule mồ côi của module vừa gỡ — **người dùng đã duyệt xoá (2026-09-01)**, là ngoại lệ hợp lệ của §2.12 |

Không có file thứ tư trong WP0.

### WP1 — MinIO service account + ILM

| Loại | Đường dẫn | Ghi chú |
|---|---|---|
| S | `server/dockers/scripts/init-bucket.sh` | Thêm bước tạo `svc-upload`/`svc-download` kèm policy, thêm ILM rule. Giữ nguyên alias `myminio`, danh sách bucket hiện có |
| N | `server/dockers/config/policy-svc-upload.json` | Policy multipart-write, resource là bucket thật `file-sharing` |
| N | `server/dockers/config/policy-svc-download.json` | Policy chỉ `s3:GetObject` |
| S | `server/dockers/docker-compose.yml` | Chỉ được thêm biến env cho service `mc`. Cấm đổi image, port, volume, network |
| S | `server/dockers/.env` | Chỉ thêm biến mới cho 2 svc account. Cấm sửa/xoá biến đang có |
| S | `server/filesharing-filehandler/src/main/resources/application.yml` | Thêm nhánh `minio.svc-upload.*`, `minio.svc-download.*` theo `02_schema_config.md`. Cấm đổi `minio.access-key`, `minio.buckets.*` đang có |

**Bucket đích là `file-sharing`** (giá trị hiện tại của `minio.buckets.files`). Các lệnh `mc` trong `03_detailed_design.md` §WP1 ghi `local/files` — đó là tên *khoá config*, không phải tên bucket; dùng `myminio/file-sharing`. Sai lệch này đã được ghi nhận, không cần hỏi lại.

### WP2 — `upload_sessions` + `UploadSessionService`

| Loại | Đường dẫn | Ghi chú |
|---|---|---|
| N | `server/filesharing-core/src/main/java/com/file/service/filesharing/core/entity/models/UploadSessionEntity.java` | `@Document(collection = "upload_sessions")`, field theo `02_schema_config.md` |
| N | `server/filesharing-core/src/main/java/com/file/service/filesharing/core/enums/UploadSessionStatus.java` | `INITIATED, UPLOADING, COMPLETED, ABORTED, EXPIRED` |
| S | `server/filesharing-core/src/main/java/com/file/service/filesharing/core/exceptions/ErrorCode.java` | Thêm đúng **7 mã** (4 mã chốt + `SESSION_INVALID_STATE`/`SESSION_LIMIT_EXCEEDED`/`FILE_NOT_READY` — đã duyệt) theo `01_api_contract.md` §9, dải `55xx` |
| N | `server/filesharing-filehandler/src/main/java/org/example/filesharing/repositories/UploadSessionRepo.java` | `extends MongoRepository<UploadSessionEntity, String>` |
| N | `server/filesharing-filehandler/src/main/java/org/example/filesharing/services/UploadSessionService.java` | Interface: create / get / touch / markCompleted / markAborted |
| N | `server/filesharing-filehandler/src/main/java/org/example/filesharing/services/impl/UploadSessionServiceImpl.java` | Chứa công thức `partSize`; ownership check ở đây |
| S | `server/filesharing-filehandler/src/main/java/org/example/filesharing/configurations/MongoIndexBootstrapConfig.java` | Thêm `applyUploadSessionsIndexes()` + gọi trong `mongoIndexBootstrapRunner()`; TTL dùng `.expire(Duration.ofSeconds(172800))` — 48h grace theo ADR `02_schema_config.md` §1.5 (KHÔNG dùng `Duration.ZERO`) |
| S | `server/filesharing-filehandler/src/main/resources/application.yml` | Thêm `upload.max-file-size`, `upload.session-idle-ttl`, `upload.part-url-ttl` |

Sau khi chạm `filesharing-core`: bắt buộc `mvn install -pl filesharing-core` trước khi build filehandler (rule `.claude/rules/backend-core.md` §1).

### WP3 — `StorageService` trên AWS SDK v2

| Loại | Đường dẫn | Ghi chú |
|---|---|---|
| S | `server/pom.xml` | Thêm property `<awssdk.version>` + `<dependencyManagement>` cho `software.amazon.awssdk:s3`. Không thêm BOM kéo theo module khác |
| S | `server/filesharing-filehandler/pom.xml` | Thêm đúng một `<dependency>` `software.amazon.awssdk:s3` |
| N | `server/filesharing-filehandler/src/main/java/org/example/filesharing/configurations/S3Config.java` | Bean `S3Client` (`endpointOverride`, `forcePathStyle(true)`, region `us-east-1`) + `uploadPresigner` + `downloadPresigner`. **Không sửa `filesharing-core/config/MinIOConfig.java`** — bean `MinioClient` dùng chung cho codec, đụng vào là ngoài phạm vi |
| N | `server/filesharing-filehandler/src/main/java/org/example/filesharing/services/StorageService.java` | createMultipartUpload / presignUploadPart / listParts / completeMultipartUpload / abortMultipartUpload / headObject / presignGetObject |
| N | `server/filesharing-filehandler/src/main/java/org/example/filesharing/services/impl/S3StorageServiceImpl.java` | |
| S | `server/filesharing-filehandler/src/main/resources/application.yml` | Chỉ nếu cần key cho S3 client (region/endpoint) theo `02_schema_config.md` |

| S | `server/filesharing-filehandler/src/main/java/org/example/filesharing/services/MinIoService.java` | Bỏ các method multipart khỏi interface nếu không còn caller ngoài E7-adapter; giữ uploadSmallFile/deleteFile/HLS/presigned-download |
| S | `server/filesharing-filehandler/src/main/java/org/example/filesharing/services/impl/MinIoServiceImpl.java` | **User duyệt 2026-09-01**: XOÁ `calculateExpireTime`, `extractUploadIdFromXml`, `buildCompleteMultipartUploadXml`, field `OkHttpClient`; rewire các method multipart (initiate/getPresignedUrlForPart/complete/abort) thành adapter gọi `StorageService`, TTL part URL đồng nhất `clamp(partCount × 60s, 1h, 6h)`. HỢP ĐỒNG E7 giữ nguyên (§2.3) |

### WP4 — API control plane (E1–E7)

| Loại | Đường dẫn | Ghi chú |
|---|---|---|
| N | `server/filesharing-filehandler/src/main/java/org/example/filesharing/controllers/UploadSessionController.java` | `@RequestMapping("api/uploads")` — chứa E2, E3, E4, E5; thin, chỉ `@Valid` + delegate |
| N | `server/filesharing-filehandler/src/main/java/org/example/filesharing/entities/dtos/upload/*.java` | Thư mục mới; **tên class + field lấy nguyên từ `01_api_contract.md`** |
| S | `server/filesharing-filehandler/src/main/java/org/example/filesharing/controllers/AssetController.java` | E1 — giữ nguyên URL `POST /api/asset/create-new` và các endpoint asset khác |
| S | `server/filesharing-filehandler/src/main/java/org/example/filesharing/services/AssetService.java` | Chữ ký `createNew` |
| S | `server/filesharing-filehandler/src/main/java/org/example/filesharing/services/impl/AssetServiceImpl.java` | `generateObjectName` giữ nguyên vị trí sinh objectName ở server; nối vào `UploadSessionService` + `StorageService` |
| S | `server/filesharing-filehandler/src/main/java/org/example/filesharing/entities/dtos/asset/AssetCreateRequestDto.java` | |
| S | `server/filesharing-filehandler/src/main/java/org/example/filesharing/entities/dtos/asset/AssetCreateResponseDto.java` | Mở rộng theo E1; **giữ shape entity-trong-DTO hiện tại** — nợ kỹ thuật đã duyệt (2026-09-01), KHÔNG map sang DTO trong phase này |
| S | `server/filesharing-filehandler/src/main/java/org/example/filesharing/controllers/FileMetadataController.java` | E6 (`/download`) + gắn `@Deprecated` cho E7. Cấm đụng `/direct-upload`, `/process-encode`, `/delete/{fileId}`, `/move-to-trash`, `/restore-file`, `/get-file-by-token` |
| S | `server/filesharing-filehandler/src/main/java/org/example/filesharing/entities/dtos/metadata/DownloadFileResponseDto.java` | Thêm `contentType`, giữ `mimeType` |
| S | `server/filesharing-filehandler/src/main/java/org/example/filesharing/services/MetadataService.java` + `services/impl/MetadataServiceImpl.java` | Kiểm quyền download + `completeUpload` theo session |
| S | `server/filesharing-core/src/main/java/com/file/service/filesharing/core/exceptions/GlobalExceptionHandler.java` | **Điều kiện tiên quyết WP4** (`01_api_contract.md` §0.6): sửa trả `errorCode.getHttpStatus()` thay vì 500 cứng. Blast radius toàn repo — sau sửa phải `mvn install -pl filesharing-core` + smoke các flow lỗi của module khác |
| S | `client/src/api/api/**` | **Chỉ qua `npm run gen-api`** |

Kiểm quyền download dùng cấu trúc quyền sẵn có (`MetadataEntity.userPermissions`, `visibility/publicPermission`, `shareToken`, `FolderEntity.permissions`, `ProjectEntity.collaborators`) — không tạo service quyền mới (§2.9).

### WP5 — Client v2

| Loại | Đường dẫn | Ghi chú |
|---|---|---|
| S | `client/src/service/uploadService.ts` | partSize cố định từ server, hill-climbing concurrency, `Content-MD5`, resume |
| N | `client/src/service/partUrlManager.ts` | `PartUrlManager`: pool + prefetch + xin lại URL khi 403 |
| S | `client/src/service/downloadService.ts` | Đọc `contentType`; ngưỡng stream-to-disk theo `01_api_contract.md` |
| S | `client/src/service/folderUploadService.ts` | `createAssetUploadSession` đọc field mới của E1 |
| S | `client/src/api/fileApi/fileApiResource.ts` | Wrapper cho E2–E5; xoá `console.log` in URL |
| S | `client/src/utils/adaptiveBandwidth.ts` | Bỏ nhánh adaptive chunk size, giữ EWMA + CV; trần thread = 6 |
| S | `client/src/store/uploadManagerStore.ts` | Chỉ chỉnh theo kiểu dữ liệu đổi |
| S | `client/src/components/UploadButton.tsx` | Chỉ chỉnh theo kiểu dữ liệu đổi |
| S | `client/src/api/api/**` | Chỉ qua `npm run gen-api` |

Cấm chạm `client/src/page/**` (trừ khi lỗi biên dịch do đổi type — khi đó chỉ sửa đúng dòng gây lỗi), `client/src/page/Phase1/**`, `client/src/mockup/**`, `client/src/index.css`, `client/vite.config.ts`, `client/package.json`.

### WP6 — GC & reconcile

| Loại | Đường dẫn | Ghi chú |
|---|---|---|
| N | `server/filesharing-filehandler/src/main/java/org/example/filesharing/jobs/scheduled/UploadSessionGcJob.java` | `@Scheduled` chu kỳ 15 phút, đọc chu kỳ từ config |
| N | `server/filesharing-filehandler/src/main/java/org/example/filesharing/jobs/scheduled/UploadReconcileJob.java` | Chu kỳ 24h |
| S | `server/filesharing-filehandler/src/main/java/org/example/filesharing/FileSharingApplication.java` | Thêm `@EnableScheduling` (filehandler hiện **chưa** bật; imagecodec/videocodec đã bật — theo cùng cách) |
| S | `server/filesharing-filehandler/src/main/resources/application.yml` | Key chu kỳ job |
| S | `.../services/UploadSessionService.java` + `.../services/impl/UploadSessionServiceImpl.java` | Chỉ thêm method truy vấn session hết hạn |
| S | `.../repositories/UploadSessionRepo.java` | Query method cho GC |

### WP7 — Vệ sinh nền & deprecation

| Loại | Đường dẫn | Ghi chú |
|---|---|---|
| S | `server/filesharing-core/.../entity/models/MetadataEntity.java` | `Double fileSize` → `long` |
| S | `server/filesharing-filehandler/.../entities/dtos/metadata/MetadataDTO.java` | |
| S | `server/filesharing-filehandler/.../services/MinIoService.java` + `.../services/impl/MinIoServiceImpl.java` | Đổi kiểu `Double`→`long`, xoá log in URL (dòng 84, 91, 127, 191–192, 249–250 bản hiện tại). Xoá method chết chỉ khi đã hết caller |
| S | `server/filesharing-filehandler/.../controllers/FileMetadataController.java` | `@Deprecated` + warning log cho E7; `(double) file.getSize()` ở `/direct-upload` đổi theo kiểu mới |
| S | `.../services/impl/MetadataServiceImpl.java`, `.../services/impl/AssetServiceImpl.java`, `.../services/impl/DashboardServiceImpl.java`, `.../services/impl/ProcessingServiceImpl.java`, `.../controllers/ImageDataController.java` | **Chỉ** các dòng gãy vì đổi kiểu `fileSize` (đây là toàn bộ call site của `getFileSize`/`setFileSize` trong repo) |
| S | `.../services/impl/UploadSessionServiceImpl.java` + `.../repositories/UploadSessionRepo.java` | Giới hạn `upload.max-sessions-per-user` → 429 |
| S | `server/filesharing-filehandler/src/main/resources/application.yml` | `upload.max-sessions-per-user`, `upload.max-threads`, `upload.verify-etag-md5` |
| S | `client/src/api/fileApi/fileApiResource.ts` | Xoá `console.log` URL (dòng ~83 bản hiện tại) |
| S | `client/src/service/uploadService.ts` | Đường legacy tự sinh `objectName` (`uuidv4() + '_' + file.name`) chuyển sang gọi luồng asset |

---

## 4. Stop conditions — PHẢI dừng và hỏi người dùng

Dừng nghĩa là: không sửa thêm file nào, tóm tắt tình huống trong 1 câu hỏi, chờ trả lời. Không tự chọn phương án "hợp lý nhất".

1. **Tài liệu mâu thuẫn với code thực tế** ở điểm chưa được ghi nhận trong file này. Ví dụ điển hình: tên bucket, tên field entity, số dòng tham chiếu đã lệch, endpoint mô tả trong doc nhưng không tồn tại trong `controllers/`.
2. **Cần đổi hợp đồng API đã chốt** — thêm endpoint ngoài E1–E6, đổi tên/kiểu field trong `01_api_contract.md`, đổi HTTP status, thêm `ErrorCode` thứ tám (ngoài 7 mã đã duyệt ở §2.7).
3. **[ĐÃ GIẢI QUYẾT — user chốt 2026-09-01, không còn là stop condition]** Ranh giới E7 ↔ WP3: XOÁ helpers cũ ngay ở WP3, rewire method multipart của `MinIoServiceImpl` thành adapter trên `StorageService`; E7 giữ nguyên hợp đồng, chấp nhận hành vi TTL nội bộ đổi (đồng nhất `clamp(partCount × 60s, 1h, 6h)`). Chi tiết: `01_api_contract.md` §E7, whitelist WP3 §3.
4. **Cần migration dữ liệu ngoài spec**: đổi kiểu `fileSize` trên document `metadata` đã tồn tại (Mongo đang lưu `Double`, đọc ra `long` sẽ lỗi decode), backfill session cho `MetadataEntity` cũ có `uploadId`, đổi tên bucket, đổi credential mà workers đang dùng.
5. **Build/test fail vì nguyên nhân ngoài phạm vi task**: module khác không compile, `npm run gen-api` fail vì server không chạy, MinIO/Mongo/Kafka không lên, lỗi có sẵn trước khi bạn sửa.
6. **Muốn chạm file ngoài whitelist §3** — kể cả khi chỉ để sửa import hay để build chạy được.
7. **File `agent/01_api_contract.md`, `agent/02_schema_config.md`, `agent/03_tasks.md`, `agent/04_verification.md`, `agent/05_traceability.md` chưa tồn tại** nhưng task cần thông tin trong đó. Không tự sáng tác spec rồi code theo.
8. **Phát hiện sai lệch an ninh nghiêm trọng ngoài phạm vi** (ví dụ credential in trong file được commit) — báo, không tự xoay credential.
9. **Sai lệch đã ghi nhận, KHÔNG cần hỏi lại** (dùng nguyên trạng thực tế): (a) bucket thật là `file-sharing`, không phải `files`; (b) `01_user_requirement.md` §A.6 S1 nói presign ký bằng "root key", thực tế `application.yml` đang dùng access key `CE28BNCAFTPVW8RZLQXC` — một service account **không giới hạn policy** do `init-bucket.sh` sinh ra từ root user; kết luận SEC-01 không đổi (vẫn phải thay bằng `svc-upload`/`svc-download` có policy hẹp).

---

## 5. Conventions bắt buộc (tóm tắt — bản đầy đủ ở `.claude/rules/`)

Rule file là bản chuẩn. Dưới đây chỉ là những điều dễ vi phạm nhất trong phase này.

**Backend filehandler** (`.claude/rules/backend-filehandler.md`)
- Controller **thin**: validate + delegate. Business logic của E2–E5 nằm trong `UploadSessionService`, không nằm trong `UploadSessionController`.
- Ném `FileBusinessException(ErrorCode.XXX)` — **cấm `RuntimeException`/`IllegalArgumentException`** trong code mới (code cũ trong `MinIoServiceImpl` đang vi phạm; chỉ sửa khi file đó nằm trong whitelist WP đang làm).
- Không return entity trực tiếp: map sang `XxxResponseDto` rồi bọc `CommonResponse`.
- `@Valid` bắt buộc trên mọi `@RequestBody` DTO có annotation validation.
- Không thêm `@ControllerAdvice` — `GlobalExceptionHandler` ở core đã active.
- Kafka: chỉ `ack.acknowledge()` sau khi xử lý thành công; message là DTO strongly-typed, không `HashMap`.
- Interface `XxxService` ở `services/`, impl ở `services/impl/`; repo ở `repositories/`; DTO ở `entities/dtos/<domain>/`.

**Core** (`.claude/rules/backend-core.md`)
- Sau mỗi thay đổi trong core: `mvn install -pl filesharing-core` trước khi build module phụ thuộc.
- `ErrorCode` mới **chỉ** khai trong enum ở core, không định nghĩa chuỗi lỗi rời ở filehandler.
- Không thêm dependency mới vào core (AWS SDK thuộc filehandler, không thuộc core).

**Frontend** (`.claude/rules/frontend.md` + `client/CLAUDE.md`)
- `src/api/api/` là generated — chỉ `npm run gen-api`.
- Component đọc observable phải bọc `observer()`; store MobX ở `src/store/`.
- Axios chỉ dùng cho upload/download có progress event; logic mới khác dùng `baseApi.ts`.
- Màu: chỉ `var(--color-*)` từ `src/index.css`, không hex/hsl cứng.
- `subscribeToFolderSSE` phải cleanup trong `useEffect` return.
- Không tạo/mở rộng `src/page/Phase1/`, `src/mockup/`; dùng `folderAssetStore`, không dùng `assetStore`.

**Rule riêng của phase**: `.claude/rules/upload-pipeline.md` (10 anti-pattern của luồng upload v2). Đọc trước mọi task WP2–WP7.

---

## 6. Definition of Done theo từng WP

Lệnh viết cho **PowerShell**, đường dẫn tuyệt đối. Mọi mục phải quan sát được kết quả cụ thể; ghi kết quả thật vào `agent/04_verification.md` khi báo cáo.

### DoD WP0
- [ ] `Test-Path E:\DaiCuongBK\Project3\FileSharing\server\filesharing-uploadservice` → `False`
- [ ] `Select-String -Path E:\DaiCuongBK\Project3\FileSharing\server\pom.xml -Pattern "uploadservice"` → không có dòng nào
- [ ] `mvn -f E:\DaiCuongBK\Project3\FileSharing\server\pom.xml clean install -DskipTests` → `BUILD SUCCESS`, Reactor Summary liệt kê đúng **6** module: core, filehandler, notification, videocodec, imagecodec, imagerawproccess
- [ ] `rg -n "filesharing-uploadservice|filesharinguploadservice" E:\DaiCuongBK\Project3\FileSharing --glob "!docs/**" --glob "!.claude/**"` → 0 kết quả

### DoD WP1
- [ ] Chạy lại init: `docker compose -f E:\DaiCuongBK\Project3\FileSharing\server\dockers\docker-compose.yml up mc` → log in ra dòng tạo `svc-upload` và `svc-download`, exit code 0
- [ ] `mc ilm rule ls myminio/file-sharing` → có rule `AbortIncompleteMultipartUpload` = **7 days**
- [ ] Kiểm chứng scope âm: đặt alias bằng key `svc-upload` rồi `mc ls <alias>/file-sharing` → **AccessDenied**; `mc cp` một object nhỏ lên `file-sharing` → thành công
- [ ] Kiểm chứng scope âm 2: alias bằng key `svc-download` rồi `mc cp` lên bucket → **AccessDenied**; `mc cat` một object đã có → ra nội dung
- [ ] `application.yml` có đủ 4 key `minio.svc-upload.access-key/secret-key`, `minio.svc-download.access-key/secret-key`; filehandler khởi động không lỗi bind property

### DoD WP2
- [ ] Filehandler khởi động, log có `Mongo indexes bootstrap completed.`
- [ ] `docker exec filesharing-mongodb mongosh "mongodb://admin:admin123456@localhost:27017/metadata?authSource=admin" --quiet --eval "db.upload_sessions.getIndexes()"` → có index TTL trên `expiresAt` (`expireAfterSeconds: 172800` — ADR `02_schema_config.md` §1.5) và index trên `ownerId`
- [ ] Bảng giá trị `partSize` đúng với công thức (kiểm bằng log hoặc một session thật): `10 MiB → 8 MiB`; `50 GiB → 8 MiB`; `100 GiB → 16 MiB`; `200 GiB → 32 MiB`; `400 GiB → 64 MiB`; mọi trường hợp `partCount ≤ 10000`
- [ ] `declaredSize` vượt `upload.max-file-size` → tạo session bị từ chối, không có document nào được insert
- [ ] `ErrorCode` có đúng **7 mã mới** dải 55xx (danh sách §2.7), không dư; `mvn install -pl filesharing-core` chạy trước khi build filehandler

### DoD WP3
- [ ] `mvn -f E:\DaiCuongBK\Project3\FileSharing\server\pom.xml dependency:tree -pl filesharing-filehandler | Select-String "software.amazon.awssdk"` → có `s3`, **không** có artifact awssdk nào khác được khai báo trực tiếp
- [ ] Smoke test một object thật: `createMultipartUpload` → presign 2 part → `curl -X PUT --upload-file` cả 2 → `listParts` trả đúng 2 part kèm size/etag → `completeMultipartUpload` → `mc stat myminio/file-sharing/<objectName>` cho size == tổng 2 part
- [ ] `headObject` trả `contentLength` khớp `mc stat`
- [ ] Presign download bằng `downloadPresigner` → `curl -I <url>` trả `200`; cùng URL đó dùng để `PUT` → `403`
- [ ] `MinIoServiceImpl` **đã được rewire** trong WP3 (`git diff --name-only` CÓ chứa file đó): grep xác nhận file không còn `calculateExpireTime`/`extractUploadIdFromXml`/`buildCompleteMultipartUploadXml`/`OkHttpClient`; 4 method multipart delegate sang `StorageService`; smoke E7 theo baseline `T-3.6` pass

### DoD WP4
- [ ] E1: `POST /api/asset/create-new` trả `sessionId`, `partSize`, `partCount`, `urls`, `expiresAt`; response **không chứa** chuỗi `uploadId` (kiểm bằng `Select-String "uploadId"` trên body) 
- [ ] E2: `partNumbers` chứa số `0`, số `> partCount`, hoặc batch `> 50` → `400`; batch hợp lệ → trả đủ URL, `expiresAt` mới lớn hơn lần trước (sliding TTL hoạt động)
- [ ] E3/E4/E5 với `sessionId` không tồn tại → `404` + `SESSION_NOT_FOUND`; với JWT của user khác → `403` + `FILE_PERMISSION_ERROR`, và **MinIO không nhận request nào** trong tình huống này
- [ ] E4 thiếu part → `400 UPLOAD_INCOMPLETE` kèm danh sách part thiếu; sửa 1 md5 sai → `400 CHECKSUM_MISMATCH`; tổng size lệch → `400 SIZE_MISMATCH`
- [ ] E4 idempotent: gọi 2 lần liên tiếp → cả 2 lần `200` với cùng `assetId` + cùng `etag`; `mc ls --incomplete myminio/file-sharing` trống
- [ ] E6: user không có quyền → `403`; owner → `200`, body chứa **cả** `mimeType` và `contentType`
- [ ] E7 regression: 3 endpoint legacy trả cùng schema như trước khi sửa (so response JSON với bản lưu trước WP4), HTTP status không đổi
- [ ] `npm run gen-api` chạy xong, `git status` chỉ hiện thay đổi trong `client/src/api/api/`

### DoD WP5
- [ ] `cd E:\DaiCuongBK\Project3\FileSharing\client; npm run build` → exit 0; `npm run lint` không phát sinh lỗi mới so với trước WP5
- [ ] DevTools Network khi upload file ≥ 100 MiB: mọi request `PUT` tới MinIO có header `Content-MD5`; số PUT đang chạy đồng thời **không vượt 6**; kích thước mọi part == `partSize` server trả (part cuối được phép nhỏ hơn)
- [ ] Không request nào tới MinIO mang `objectName`/`uploadId` do client tự sinh; mọi lời gọi control-plane đi qua `/api/uploads/{sessionId}/...`
- [ ] Resume: ngắt mạng ở ~50%, reload tab, upload tiếp → tổng bytes PUT của lần 2 nhỏ hơn kích thước file; `mc stat` sau complete cho size == size file gốc
- [ ] Part URL hết hạn (chờ quá `upload.part-url-ttl` hoặc sửa TTL xuống 1 phút để test): client tự xin URL mới và upload xong, không hiện lỗi cho người dùng
- [ ] `rg -n "console\.log" E:\DaiCuongBK\Project3\FileSharing\client\src\api\fileApi\fileApiResource.ts E:\DaiCuongBK\Project3\FileSharing\client\src\service` → không dòng nào in URL

### DoD WP6
- [ ] `FileSharingApplication.java` có `@EnableScheduling`; log khởi động có tên 2 job
- [ ] Test GC: tạo session thật, upload 1 part, rồi dùng mongosh set `expiresAt` về quá khứ → trong ≤ 1 chu kỳ job: `mc ls --incomplete myminio/file-sharing` không còn multipart đó, `upload_sessions` document có `status: "EXPIRED"`, metadata tương ứng `FAILED`
- [ ] Test reconcile: tạo multipart trực tiếp bằng SDK/curl (không qua session) → sau khi job chạy: multipart bị abort, log ghi rõ số lượng mồ côi đã dọn
- [ ] Session của dữ liệu cũ (metadata có `uploadId` nhưng không có document trong `upload_sessions`) **không** bị job đụng tới — kiểm bằng đếm document `metadata` trước/sau khi job chạy: không đổi

### DoD WP7
- [ ] `rg -n "Double fileSize|fileSize\.intValue\(\)|\(double\) file\.getSize\(\)" E:\DaiCuongBK\Project3\FileSharing\server --glob "!**/target/**"` → 0 kết quả
- [ ] `rg -n "log\.(info|debug|warn).*(Url|url)" E:\DaiCuongBK\Project3\FileSharing\server\filesharing-filehandler\src\main\java\org\example\filesharing\services\impl\MinIoServiceImpl.java` → 0 kết quả
- [ ] Upload file > 2 GiB đi trọn vòng E1→E4 thành công (chứng minh R2 đã hết)
- [ ] Mở session thứ `upload.max-sessions-per-user + 1` cho cùng một user → HTTP `429`; sau khi abort 1 session, tạo lại → `200`
- [ ] 3 endpoint E7 có annotation `@Deprecated`, gọi vào sinh đúng 1 dòng log warning, response schema không đổi
- [ ] `mvn -f E:\DaiCuongBK\Project3\FileSharing\server\pom.xml clean install -DskipTests` → `BUILD SUCCESS`; `npm run build` phía client → exit 0
