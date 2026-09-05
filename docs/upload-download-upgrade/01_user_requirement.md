# User Requirement — Nâng cấp pipeline Upload/Download (PA2: Presigned Direct, Hardened)

> **Phạm vi tài liệu:** Phần A mô tả **toàn bộ hiện trạng** của luồng upload/download hiện tại (kiến trúc, từng bước, và các thuật toán đang dùng), kèm danh sách điểm yếu đã xác minh trực tiếp trên mã nguồn. Phần B là **yêu cầu nâng cấp** của người dùng.
>
> **Cơ sở:** đọc trực tiếp mã nguồn nhánh `web-flux` (ngày 2026-08-31) + bộ research `docs/research/` (Google Drive/GCS, OneDrive/Azure Blob, bản tổng hợp upload-pipeline-research.md).

---

# PHẦN A — HIỆN TRẠNG

## A.1 Kiến trúc các thành phần liên quan

| Thành phần | Công nghệ | Vai trò trong upload/download |
|---|---|---|
| `client` | React 19 + MobX, axios (chỉ cho upload/download) | Chunking, adaptive bandwidth, gọi presigned URL |
| `filesharing-filehandler` (:5000) | Spring Boot 3.5 MVC (blocking), JWT, MongoDB, Kafka | **Control plane duy nhất**: initiate/complete/abort upload, phát presigned URL, metadata |
| `filesharing-uploadservice` (:8080) | Spring WebFlux | **Stub — chưa hoạt động** (`UploadController.uploadChunks` throw `UnsupportedOperationException`) |
| MinIO (`:9000`) | `minio/minio:RELEASE.2025-06-13` | Blob storage; buckets: `files` (gốc), `thumbnails`, `image-preview`, `hls` |
| MongoDB | mongo 7.0 | `MetadataEntity` (version/file), `AssetEntity`, processing jobs |
| Kafka | cp-kafka 7.5 | Đẩy job encode video / transcode image sau complete |
| `filesharing-imagecodec` / `-videocodec` | Spring Boot workers | Đọc object từ MinIO, tạo thumbnail/preview/HLS |

**Không có** trong stack hiện tại: Redis, nginx/reverse-proxy trước MinIO, lifecycle rule trên bucket, audit log MinIO.

**Điểm quan trọng:** mọi presigned URL đều được ký bằng **credential root của MinIO** (`MINIO_ROOT_USER`/`MINIO_ROOT_PASSWORD` từ `.env` của docker-compose) — không có service account scope hẹp.

## A.2 Hai luồng upload đang song song tồn tại

Cả hai đều hội tụ về `MinIoServiceImpl` (filehandler):

1. **Luồng legacy (file-metadata)** — `uploadService.uploadFile()` phía client:
   - `POST /api/file-metadata/upload-metadata` với `MetadataDTO` — trong đó **`objectName` do CLIENT tự sinh** (`uuidv4() + '_' + file.name`, `uploadService.ts:317`) và server chỉ check not-blank rồi dùng nguyên xi.
2. **Luồng asset (đang là luồng chính)** — `folderUploadService.createAssetUploadSession()`:
   - `POST /api/asset/create-new` → `AssetServiceImpl.createNew`: tạo Asset, **server tự sinh `objectName`** (`generateObjectName`: `UUID + "_" + fileName`, loop tới khi unique — `AssetServiceImpl.java:636-643`), tạo `MetadataEntity` version 1, gọi `initiateMultipartUpload`.

Cả hai luồng dùng chung: PUT part presigned → `POST /api/file-metadata/upload/complete` → `POST /api/file-metadata/upload/stop-upload` (abort).

## A.3 Luồng upload hiện tại — từng bước

### Bước 1 — Initiate (`MinIoServiceImpl.initiateMultipartUpload`, dòng 45-108)

1. Presign một URL `POST ?uploads` (TTL 10 phút) rồi **tự gọi HTTP bằng OkHttp** vào MinIO để tạo multipart upload; parse `UploadId` từ XML response **bằng regex** (`extractUploadIdFromXml`, dòng 336-343).
   - Lý do tồn tại của đoạn hack này: minio-java SDK **giấu** (protected) các API multipart cấp thấp, nên code phải tự presign + tự gọi S3 API thô.
2. Tính số part: `numberOfPart = fileSize.intValue() / CHUNK_SIZE + 1` với `CHUNK_SIZE = 5MiB` và `fileSize` kiểu **`Double`**.
3. **Sinh trước TOÀN BỘ presigned part URL** (vòng for 1..numberOfPart, mỗi URL một chữ ký SigV4) và trả hết về client trong một response.

### Bước 2 — TTL của từng part URL (`calculateExpireTime`, dòng 359-372)

Thuật toán TTL hiện tại (nguyên văn logic, `n = partNumber + 1`):

```
if n < 10:    ttl = n * 300 giây        (5 phút / part cho 10 part đầu)
elif n < 100: ttl = n * 60 giây         (1 phút / part)
else:         ttl = 3000 + 5400 + n*10  (10 giây / part, cộng dồn hằng số)
```

Comment trong code ghi rõ căn cứ: *"chat gpt bao la voi toc do 4G o Viet Nam thi upload 1 chunk 5Mb mat 3s"* — tức TTL tăng dần theo `partNumber` để part sau (upload muộn hơn) không hết hạn trước khi tới lượt. File 4GB → part cuối có TTL ≈ 4h30m.

### Bước 3 — Client upload part (thuật toán chi tiết tại A.5)

Client PUT từng chunk thẳng lên MinIO qua presigned URL, header duy nhất `Content-Type: application/octet-stream`, đọc `ETag` từ response header (`fileApiResource.uploadChunk`).

### Bước 4 — Complete (`FileMetadataController.uploadComplete`, dòng 51-68)

1. Validate not-blank cho `objectName`, `uploadId`, `parts` (tất cả **do client gửi lên**).
2. `minIoService.completeMultipartUpload(...)`: sort parts, presign URL `POST ?uploadId` rồi tự build **XML `<CompleteMultipartUpload>` bằng StringBuilder** với ETag do client cung cấp, gọi qua OkHttp; check response chứa `<ETag>`.
3. `metadataService.completeUpload(...)`: tìm entity theo `objectName + uploadId`, **check owner Ở ĐÂY** (sau khi storage đã commit), set `UploadStatus.COMPLETED`, set `ProcessingStatus` (VIDEO → PENDING, khác → READY), rồi bắn Kafka (video) hoặc tạo processing job (image).

### Bước 5 — Abort (`stopUpload`)

Client chủ động gọi `POST /upload/stop-upload` → presign DELETE `?uploadId` → OkHttp gọi AbortMultipartUpload → metadata set `FAILED`, `isActive=false`. **Nếu client không gọi (đóng tab, mất mạng), không có cơ chế nào dọn** — multipart dở dang nằm vô hình trong MinIO vĩnh viễn.

### Đường phụ — file nhỏ

`< 5MiB`: client gửi `multipart/form-data` qua `POST /api/file-metadata/direct-upload` → filehandler proxy byte vào MinIO (`uploadSmallFile`, chặn >5MB).

## A.4 Luồng download hiện tại — từng bước

1. Client `POST /api/file-metadata/download {objectName, downloadFileName?}`.
2. Server (`FileMetadataController.downloadFile`, dòng 78-100): `findByObjectName` → presign GET với `response-content-disposition: attachment` — **KHÔNG có bất kỳ kiểm tra quyền nào** (không check owner, không check quyền project/folder). TTL = `calculateExpireTime(fileSize / 5MiB)` — tái dùng công thức TTL của upload cho download.
3. Client (`downloadService.downloadFile`): tải song song bằng **Range request** trên cùng một presigned URL (thuật toán tại A.5), ghép toàn bộ `ArrayBuffer` thành một `Blob` **trong RAM**, rồi trigger browser save qua `URL.createObjectURL`.

Đường phụ liên quan:
- **HLS streaming**: filehandler **proxy** manifest + segment từ bucket `hls` (`getHlsObjectContent` / `getHlsSegmentStream`) — không dùng presigned.
- **Thumbnail**: URL public dạng `minioEndpoint/thumbnails/objectKey` (`MinioStorageClient.buildThumbnailPublicUrl`) — bucket thumbnails đang được truy cập không cần chữ ký.

## A.5 Thuật toán phía client (dùng chung upload & download)

### A.5.1 Adaptive chunking + adaptive concurrency (`AdaptiveBandwidthManager`)

Tham số:

| Tham số | Upload | Download |
|---|---|---|
| Chunk min / max / khởi tạo | 5 / 50 / 5 MiB | 1 / 50 / 2 MiB |
| Threads min / max / khởi tạo | 1 / 5 / 1 | 1 / 5 / 1 |
| Vùng thời gian mục tiêu 1 chunk | 1s – 5s | như upload |
| EWMA alpha | 0.3 | như upload |
| Bandwidth utilization target | 70% (chỉ áp cho pacing download) | 70% |

Thuật toán điều chỉnh sau mỗi chunk thành công (`calculateNextChunkSizeAndThreads`):

```
throughput_tức_thời = chunkSize / uploadTime
EWMA: avg = 0.3 * tức_thời + 0.7 * avg

if uploadTime < 1s:            # quá nhanh → tăng công suất
    if threads < 5: threads++
    else: chunkSize *= 1.5
elif uploadTime > 5s:          # quá chậm → giảm công suất
    if chunkSize > min: chunkSize /= 1.2
    elif threads > 1: threads--
else:                          # vùng lý tưởng
    if uploadTime < 3s and threads < 5: threads++
clamp về [min, max]
```

Panic mode khi lỗi (`recordFailure`): lần 1-2 → chunkSize giảm một nửa, threads giảm 1; **3 lỗi liên tiếp** → reset chunkSize về min, threads về 1.

Độ ổn định mạng: hệ số biến thiên (CV = stdDev/avg) trên 20 mẫu throughput gần nhất; CV < 0.3 = stable, > 0.5 = unstable.

### A.5.2 Điều phối song song

- `Semaphore` tự viết (permits = threads hiện tại, có `updateMaxPermits` động).
- Vòng lặp chính cắt file tuần tự theo `chunkSize` hiện hành của bandwidth manager, mỗi chunk acquire 1 permit rồi chạy `uploadChunkInThread` bất đồng bộ; `Promise.all` chờ tất cả.
- Retry mỗi chunk: tối đa 3 lần, backoff `1000 * 2^(attempt-1) + rand(0..500)ms`; abort (user cancel) không retry.

### A.5.3 Integrity phía client (hiện tại chỉ mang tính cảnh báo)

- Mỗi chunk: tính **MD5 bằng SparkMD5** trước khi upload; sau khi PUT xong, so ETag (MinIO trả) với MD5 — **nếu lệch chỉ `console.warn`, KHÔNG fail, KHÔNG retry** (`uploadService.ts:242-246`).
- Không gửi `Content-MD5` header → MinIO không tự verify part nào cả.

### A.5.4 Download song song

- Lấy 1 presigned GET URL duy nhất + `fileSize` từ server; cắt Range `bytes=start-end` theo adaptive chunk; tải song song qua semaphore giống upload; có **pacing delay** để giữ ~70% bandwidth; ghép chunks (sort theo `startByte`) thành Blob RAM.

## A.6 Điểm yếu đã xác minh (theo mã nguồn)

### Bảo mật

| # | Vấn đề | Vị trí | Hệ quả |
|---|---|---|---|
| S1 | Presigned URL ký bằng **service account KHÔNG giới hạn policy** (sinh từ root user tại `init-bucket.sh:61`, kế thừa toàn quyền — key trong `application.yml`) | docker-compose + `MinioClient` config | Hệ quả tương đương root key: mọi URL rò rỉ mang chữ ký credential toàn quyền; không thu hẹp/thu hồi được theo scope |
| S2 | **Download không kiểm quyền** | `FileMetadataController.downloadFile:78-100` | Bất kỳ user đăng nhập nào biết/đoán `objectName` đều lấy được presigned GET của file người khác |
| S3 | Luồng legacy cho **client tự đặt `objectName`** | `uploadService.ts:317` + `startUpload:39-43` | Client kiểm soát object key trên bucket gốc; nguy cơ ghi đè/định danh chéo |
| S4 | Complete: **storage commit trước, check owner sau**; `objectName`/`uploadId`/`parts` đều do client cung cấp | `FileMetadataController.uploadComplete:65-66` | Người không sở hữu có thể kích hoạt commit object; ETag không được đối chiếu độc lập |
| S5 | Không giới hạn/đối chiếu **size thực tế** — `fileSize` client khai chỉ dùng để đếm part | `initiateMultipartUpload` | Kẻ xấu khai 10MB nhưng đẩy part 5GiB/each; không quota, không chặn chi phí |
| S6 | Presigned URL bị **log** (`log.info` URL complete/abort, `console.log` URL part phía client) | `MinIoServiceImpl:192,249-250`, `fileApiResource.ts:83` | URL là bearer credential — log URL = log credential |
| S7 | Không TTL dọn rác: session/multipart dở tồn tại vô hạn; `MetadataEntity.timeToLive` mặc định `Integer.MAX_VALUE` và **không có job nào enforce** | `MetadataServiceImpl.saveMetadata:70-72` | Rác vô hình chiếm dung lượng; TTL chỉ là field chết |
| S8 | Bucket `thumbnails` truy cập public không chữ ký | `MinioStorageClient.buildThumbnailPublicUrl` | Lộ nội dung thumbnail của mọi file cho ai có endpoint |

### Hiệu năng

| # | Vấn đề | Vị trí | Hệ quả |
|---|---|---|---|
| P1 | Sinh trước toàn bộ part URL tại initiate | `MinIoServiceImpl:88-96` | File lớn → hàng nghìn chữ ký + response phình to; TTL part phải "đoán" tương lai bằng công thức |
| P2 | `CHUNK_SIZE` server cố định 5MiB nhưng client adaptive 5-50MiB | 2 phía không thoả thuận | Số URL sinh thừa; partNumber ↔ offset không xác định được (xem R1) |
| P3 | Download ghép toàn bộ file trong **RAM** | `downloadService.assembleChunks` | File vài GB làm tràn bộ nhớ tab trình duyệt |
| P4 | Hand-rolled S3 call (OkHttp + regex XML) không retry, không typed error | `MinIoServiceImpl` | Mong manh, khó bảo trì, chậm hơn SDK chuẩn |

### Độ tin cậy / lỗi tiềm ẩn

| # | Vấn đề | Vị trí | Hệ quả |
|---|---|---|---|
| R1 | **Resume không thể hoạt động**: `resumeUpload` trả `List.of()` (stub); và về nguyên lý cũng không resume được vì chunk size adaptive → không suy được offset từ partNumber | `MetadataServiceImpl:137-140` | Đứt mạng ở GB thứ 9 của file 10GB = upload lại từ đầu |
| R2 | **Tràn số với file > 2GiB**: `fileSize.intValue()` bão hoà tại `Integer.MAX_VALUE` → file 4GiB chỉ được sinh ~410 part URL; nếu mạng yếu giữ chunk 5MiB thì cần 820 part → `partUrls.get(n)` = `undefined` → crash giữa chừng | `MinIoServiceImpl:89` | Upload file lớn thất bại ngẫu nhiên tuỳ điều kiện mạng |
| R3 | Abort phụ thuộc hoàn toàn client gọi; không lifecycle rule, không GC job | toàn hệ | Rác multipart tích luỹ vô hạn |
| R4 | Client đọc `downloadInfo.contentType` nhưng server trả field `mimeType` | `downloadService.ts:305` vs `downloadFile:95` | Blob sinh ra không có content type |
| R5 | `fileSize` kiểu `Double` xuyên suốt server | nhiều nơi | Sai số + lỗi convert; nên là `long` |
| R6 | Complete không idempotent: mất response → client gọi lại → chuỗi hành vi không xác định | `uploadComplete` | Nguy cơ trạng thái lệch giữa MinIO và Mongo |
| R7 | `GlobalExceptionHandler` (core) trả HTTP **500 cho mọi lỗi nghiệp vụ**, bỏ qua `errorCode.getHttpStatus()` | `filesharing-core/.../GlobalExceptionHandler.java:42-44` | Client không phân biệt được 403/404/409 với lỗi hệ thống; mọi hợp đồng mã lỗi mới đều vô hiệu nếu không sửa |

---

# PHẦN B — YÊU CẦU NÂNG CẤP (User Requirements)

## B.0 Quyết định phương hướng (đã chốt)

Giữ nguyên kiến trúc **upload/download trực tiếp qua presigned URL** (client ↔ MinIO, control plane ở filehandler). **Không** xây proxy service. Mục tiêu kép: luồng presigned **nhanh nhất** và **an toàn nhất** có thể, theo các bài học trong `docs/research/upload-pipeline-research.md` (mô hình 3 pha initiate → transfer → commit; TTL trượt + trần cứng + GC; credential scope hẹp; verify tại commit).

**Yêu cầu mở màn — CLEAN-01 (P0):** gỡ bỏ hoàn toàn module **`filesharing-uploadservice`** (WebFlux stub — `UploadController.uploadChunks` throw `UnsupportedOperationException`, không có traffic, không module nào phụ thuộc). Với quyết định PA2, service này không còn lý do tồn tại. Phạm vi gỡ: xoá thư mục `server/filesharing-uploadservice/` + dòng `<module>filesharing-uploadservice</module>` trong `server/pom.xml:37`. Đây là bước đầu tiên của phase, thực hiện trước mọi WP khác.

## B.1 Yêu cầu Bảo mật (SEC)

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| SEC-01 | Presigned URL (upload lẫn download) phải được ký bằng **service account MinIO scope hẹp** (upload: chỉ write multipart trên bucket `files`; download: chỉ read), không dùng root key | P0 |
| SEC-02 | **TTL nhiều tầng**: part URL TTL ngắn đồng nhất (~15 phút, cấp lại được); upload session TTL **trượt** (gia hạn khi còn hoạt động) + **trần cứng 7 ngày**; lifecycle rule MinIO tự abort multipart dở sau 7 ngày | P0 |
| SEC-03 | Mọi định danh phía server: client chỉ được cầm `sessionId`; `objectName`, `uploadId` do server sinh và tra từ session — **loại bỏ hoàn toàn việc client truyền `objectName` tuỳ ý** vào initiate/complete/abort | P0 |
| SEC-04 | Complete phải **kiểm quyền TRƯỚC** mọi thao tác storage, và **verify trước khi commit**: đủ part (đối chiếu `ListParts` từ MinIO — nguồn chân lý), tổng size == size khai báo, ETag khớp checksum client gửi | P0 |
| SEC-05 | Download phải **kiểm quyền** (owner / quyền project-folder / share token) trước khi phát presigned GET | P0 |
| SEC-06 | Integrity enforce tại storage: client gửi `Content-MD5` từng part để MinIO tự từ chối part hỏng (`BadDigest`); nâng check ETag phía client từ warn → fail-and-retry | P1 |
| SEC-07 | Không log presigned URL đầy đủ ở bất kỳ tầng nào (server log, client console, APM) | P1 |
| SEC-08 | Giới hạn: max file size cấu hình được; số session mở đồng thời / user; (về sau) ingress bytes / user / giờ | P1 |
| SEC-09 | Bật MinIO audit log (webhook) để truy vết mọi request presigned | P2 |
| SEC-10 | Thumbnail/preview chuyển sang presigned GET TTL dài hoặc route có kiểm quyền (không public bucket) | P2 |

## B.2 Yêu cầu Hiệu năng (PERF)

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| PERF-01 | Bỏ sinh trước toàn bộ part URL; cấp **theo batch** (client xin khi cần, server trả nhóm URL TTL đồng nhất) — xoá công thức `calculateExpireTime` | P0 |
| PERF-02 | **Part size do server công bố** tại initiate theo công thức `clamp(max(8MiB, size/10000), 8MiB, 64MiB)` — mặc định 8MiB, chỉ nở khi trần 10.000 part bắt buộc; client dùng đúng part size này (bỏ adaptive chunk size, giữ adaptive concurrency) | P0 |
| PERF-03 | File nhỏ (≤ ngưỡng cấu hình) đi đường 1 request duy nhất, không multipart | P1 |
| PERF-04 | Download file lớn không ghép trong RAM: stream xuống đĩa (File System Access API) trên ngưỡng cấu hình | P2 |
| PERF-05 | Thay OkHttp + XML tự chế bằng SDK chuẩn (AWS SDK v2) cho các call control-plane | P1 |
| PERF-06 | Adaptive concurrency kiểu **hill-climbing trên tổng throughput** (mô hình AzCopy auto-tuner): probe tăng thread → lùi khi throughput chạm plateau; trần mặc định **6 thread** gắn với giới hạn ~6 kết nối/host của trình duyệt trên HTTP/1.1, cấu hình được | P1 |

## B.3 Yêu cầu Độ tin cậy (REL)

| ID | Yêu cầu | Ưu tiên |
|---|---|---|
| REL-01 | **Resume upload**: `GET session` trả danh sách part đã nhận (từ `ListParts`) + trạng thái session, kể cả "đã COMPLETED" (chống double-commit khi mất response); client resume theo part còn thiếu | P0 |
| REL-02 | Complete **idempotent**: gọi lần 2 trên session đã hoàn tất trả kết quả cũ, không lỗi, không tác dụng phụ | P0 |
| REL-03 | GC 3 tầng: lifecycle rule MinIO + scheduled job quét session hết hạn (abort + đánh dấu FAILED) + job đối soát định kỳ Mongo ↔ MinIO | P1 |
| REL-04 | Sửa các lỗi nền: tràn `intValue()` (R2), `fileSize` → `long` (R5), mismatch `contentType`/`mimeType` (R4) | P0 |
| REL-05 | Trạng thái session tường minh: `INITIATED → UPLOADING → COMPLETED / ABORTED / EXPIRED`, phân biệt với `ProcessingStatus` của pipeline xử lý sau | P1 |

## B.4 Ngoài phạm vi phase này

- Go upload proxy / thay đổi data plane (đã loại ở quyết định PA2).
- Malware scanning (ghi nhận thiết kế chỗ cắm: status trên metadata + enforce ở download; không triển khai).
- Rate limit ingress bytes chính xác theo thời gian thực (phase này chỉ giới hạn theo size khai báo + số session).
- CDN / edge TLS termination.
- Gộp/loại bỏ luồng legacy `upload-metadata` (chỉ **deprecate**, không xoá trong phase này).
