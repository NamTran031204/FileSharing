# 01 — API Contract: Upload/Download Pipeline v2

> **Vai trò tài liệu:** NGUỒN DUY NHẤT về tên endpoint, tên field JSON, kiểu dữ liệu, mã lỗi và HTTP status của phase nâng cấp upload/download.
> Agent triển khai **copy nguyên văn** tên field/DTO từ đây, không suy diễn, không tự đổi chính tả.
>
> **Phạm vi:** E1–E7 theo bảng WP4 của `../03_detailed_design.md`.
> **Không thuộc phạm vi file này:** schema MongoDB, key `application.yml`, script `mc`, bean config, dependency Maven → xem `02_schema_config.md`.
>
> Ngày chốt: 2026-09-02. Nhánh cơ sở: `web-flux`.

---

## 0. Quy ước chung (áp dụng cho mọi endpoint)

### 0.1 Base URL & auth

| Mục | Giá trị |
|---|---|
| Base URL | `http://localhost:5000` (service `filesharing-filehandler`, port 5000) |
| Auth | Header `Authorization: Bearer <JWT>` — **bắt buộc trên toàn bộ E1–E7** |
| Content-Type request | `application/json` (trừ `POST /api/file-metadata/direct-upload`) |
| Content-Type response | `application/json` |

> Không có endpoint nào của phase này chạy trên port 8080. Module `filesharing-uploadservice` đã bị gỡ ở WP0 — mọi tham chiếu tới service `:8080` là sai.

### 0.2 Envelope response

Mọi response (thành công lẫn lỗi) bọc trong `CommonResponse<T>` của core (`com.file.service.filesharing.core.entity.CommonResponse`):

| Field | Kiểu | Mô tả |
|---|---|---|
| `isSuccessful` | boolean | `true` khi thành công, `false` khi lỗi |
| `data` | T \| null | Payload; `null` khi lỗi |
| `code` | String | `"200"` khi thành công; `ErrorCode.getCode()` khi lỗi |
| `message` | String | Thông điệp người-đọc-được |

```json
{
  "isSuccessful": true,
  "data": {},
  "code": "200",
  "message": "Successful"
}
```

### 0.3 Kiểu dữ liệu và serialize

| Kiểu Java | JSON | Ghi chú |
|---|---|---|
| `long` / `Long` | number | Kích thước byte (`fileSize`, `declaredSize`, `partSize`) — **không bao giờ dùng `Double`** trong API mới (REL-04) |
| `int` | number | `partCount`, `partNumber`, `versionNumber` |
| `Instant` | string ISO-8601 UTC, ví dụ `"2026-09-02T08:15:00Z"` | `JacksonConfig` đã `disable(WRITE_DATES_AS_TIMESTAMPS)` |
| `Map<Integer, String>` | object với key là chuỗi số, ví dụ `{"1": "http://..."}` | Client parse key bằng `Number(key)` |
| enum | string uppercase | `UploadSessionStatus`, `UploadStatus`, `ProcessingStatus`, `MediaType`, `UploadMode` |

Deserialize phía server bật `FAIL_ON_UNKNOWN_PROPERTIES = false` → **thêm field vào request/response là thay đổi tương thích ngược**; đổi tên hoặc xoá field thì không.

### 0.4 Ngữ nghĩa hai field thời hạn (đọc kỹ — dễ nhầm)

| Field | Ý nghĩa | Xuất hiện ở |
|---|---|---|
| `expiresAt` | Thời điểm hết hạn **logic của UploadSession** (sliding TTL). Sau mốc này session coi như chết, GC job sẽ abort multipart. | E1, E2, E3 |
| `urlExpiresAt` | Thời điểm hết hạn của **lô presigned URL vừa được cấp trong chính response này** (= `now + upload.part-url-ttl`). | E1, E2 |

> **Khác biệt có chủ đích so với `03_detailed_design.md`:** WP4 chỉ liệt kê một field `expiresAt` cho E1/E2/E3. Contract này tách thành hai field vì client cần đồng thời (a) biết khi nào phải xin lô URL mới và (b) biết khi nào session chết để dừng resume. `expiresAt` giữ nguyên một ý nghĩa duy nhất (session) trên cả ba endpoint.

### 0.5 Hằng số cố định trong code (KHÔNG phải config)

| Hằng số | Giá trị | Dùng ở |
|---|---|---|
| `INITIAL_URL_BATCH_SIZE` | `20` | E1 — `K = min(partCount, 20)` |
| `MAX_URL_BATCH_SIZE` | `50` | E2 — `partNumbers.size() <= 50` |
| `SMALL_FILE_THRESHOLD` | `8388608` (8 MiB) | E1 — `declaredSize <= 8 MiB` → `uploadMode = SINGLE` |
| `PART_SIZE_STEPS` | `{8388608, 16777216, 33554432, 67108864}` | E1 — nấc partSize {8,16,32,64} MiB |
| `S3_MAX_PARTS` | `10000` | Công thức partSize |
| `DOWNLOAD_TTL_MIN` / `DOWNLOAD_TTL_MAX` | `900s` / `14400s` | E6 — `clamp(fileSize / 1_000_000, 900, 14400)` giây |

Công thức partSize (E1, PERF-02):

```
partSize = làm_tròn_lên_nấc( clamp( max(8MiB, ceil(declaredSize / 10000)), 8MiB, 64MiB ) )
partCount = (int) ceil(declaredSize / (double) partSize)
```

### 0.6 Điều kiện tiên quyết bắt buộc — HTTP status

`GlobalExceptionHandler` hiện tại (`filesharing-core/.../exceptions/GlobalExceptionHandler.java:42-44`) **luôn** trả `ResponseEntity.status(ErrorCode.INTERNAL_SERVER_ERROR.getHttpStatus())` (= 500) cho `FileBusinessException`/`UserBusinessException`, bỏ qua `errorCode.getHttpStatus()`.

Toàn bộ cột "HTTP status" trong tài liệu này **chỉ đúng sau khi** handler được sửa thành `ResponseEntity.status(errorCode.getHttpStatus())`. Đây là điều kiện tiên quyết của phase (thuộc WP4), phải làm trước khi client dựa vào HTTP status để phân nhánh. Trước khi sửa, client **chỉ được** phân nhánh theo `CommonResponse.code`.

### 0.7 Nguyên tắc chung của E2–E5

Bước đầu tiên của mọi endpoint E2–E5 là `UploadSessionService.get(sessionId, currentUserId)`:

1. Không tìm thấy document, hoặc `status == EXPIRED`, hoặc `expiresAt < now` → **404 `SESSION_NOT_FOUND`**.
2. `session.ownerId != currentUserId` → **403 `FILE_PERMISSION_ERROR`** (kiểm tra owner luôn đứng **trước** mọi thao tác chạm storage).
3. Ném lỗi bằng `FileBusinessException(ErrorCode.XXX, "message")` — **không** `RuntimeException`, **không** `CommonResponse.fail(...)` trong controller.

Không endpoint nào nhận `objectName` hoặc `uploadId` từ client nữa (SEC-03). Riêng E6 (download) vẫn nhận `objectName` vì đây là định danh của object **đã commit**, không phải định danh phiên upload.

---

## E1 — Khởi tạo upload (initiate)

```
POST /api/asset/create-new
```

| Mục | Giá trị |
|---|---|
| Controller | `AssetController.createNew` (`@RequestMapping("api/asset")` + `@PostMapping("/create-new")`) — giữ nguyên |
| Auth | JWT bắt buộc |
| Request DTO | `AssetCreateRequestDto` (giữ nguyên tên class, đổi kiểu `fileSize`) |
| Response DTO | `CommonResponse<AssetCreateResponseDto>` (giữ nguyên tên class, đổi kiểu field `upload`) |
| Idempotent | Không |

### E1.1 Request

| Field JSON | Kiểu | Bắt buộc | Ràng buộc | Mô tả |
|---|---|---|---|---|
| `projectId` | String | Có | not blank | Project chứa asset |
| `folderId` | String | Không | not blank nếu có | `null` → asset nằm ở gốc project |
| `description` | String | Không | — | Mô tả asset |
| `fileName` | String | Có | not blank sau trim | Tên file gốc; server dùng để sinh `objectName` |
| `mimeType` | String | Có | not blank | Dùng để suy `MediaType` |
| `fileSize` | long | Có | `0 < fileSize <= upload.max-file-size` | **Đổi từ `Double` → `long`** (REL-04/R5). Là `declaredSize` của session |
| `mediaType` | enum `MediaType` | Có | `IMAGE` \| `VIDEO` \| `AUDIO` \| `DOCUMENT` \| `OTHER` | Giữ để tương thích; server vẫn tự tính lại từ `mimeType` |
| `compressionAlgo` | String | Không | — | `ZIP` / `RAR` / `GZIP` / `7Z` / `TAR` / `null` |
| `timeToLive` | Integer | Không | — | Giữ nguyên field hiện có |
| `assetId` | String | Không | — | Chỉ dùng cho `POST /api/asset/create-version` |
| `changeNote` | String | Không | — | Chỉ dùng cho tạo version mới |
| `assetStatus` | enum `AssetStatus` | Không | — | Chỉ dùng cho tạo version mới |

```json
{
  "projectId": "68b3e9c21c4d2e0a7c9b0001",
  "folderId": "68b3e9c21c4d2e0a7c9b0042",
  "description": "Bản render cuối",
  "fileName": "render_final.mp4",
  "mimeType": "video/mp4",
  "fileSize": 1073741824,
  "mediaType": "VIDEO",
  "compressionAlgo": null,
  "timeToLive": null
}
```

### E1.2 Response thành công (200)

`AssetCreateResponseDto`:

| Field | Kiểu | Trạng thái | Mô tả |
|---|---|---|---|
| `asset` | `AssetEntity` | **GIỮ NGUYÊN** | Client đang đọc `data.asset.assetId` |
| `version` | `MetadataEntity` | **GIỮ NGUYÊN** | Client đang đọc `data.version.objectName`; `version.fileSize` đổi kiểu sang số nguyên |
| `upload` | `UploadSessionInitResponseDto` | **ĐỔI KIỂU** | Thay cho `InitiateUploadResponseDto` |

`UploadSessionInitResponseDto`:

| Field JSON | Kiểu | Luôn có | Mô tả |
|---|---|---|---|
| `sessionId` | String (UUID) | Có | Khoá **duy nhất** client được cầm cho E2–E5 |
| `uploadMode` | enum `UploadMode` | Có | `SINGLE` (file ≤ 8 MiB, 1 request, không multipart) \| `MULTIPART` |
| `partSize` | long | Có | Kích thước part **cố định** cho cả session. `uploadMode = SINGLE` → `partSize = declaredSize` |
| `partCount` | int | Có | Tổng số part. `uploadMode = SINGLE` → `1` |
| `declaredSize` | long | Có | Đúng bằng `fileSize` của request; server lưu để verify tại E4 |
| `urls` | `Map<Integer, String>` | Có | Lô presigned URL đầu tiên, key = `partNumber`, `K = min(partCount, 20)`. `SINGLE` → đúng một key `"1"` |
| `urlExpiresAt` | Instant | Có | Hết hạn của lô `urls` này |
| `expiresAt` | Instant | Có | Hết hạn logic của session (sliding) |
| `hardExpiresAt` | Instant | Có | Trần cứng = `createdAt + 7 ngày`; sliding không bao giờ vượt mốc này |

**Field bị BỎ khỏi khối `upload` (breaking đối với client hiện tại):**

| Field cũ | Xử lý |
|---|---|
| `uploadId` | **BỎ** — `uploadId` của S3 không bao giờ rời khỏi server (SEC-03) |
| `partUrl` | **BỎ** — thay bằng `urls` (chỉ lô đầu, không phải toàn bộ part) |

> `client/src/service/folderUploadService.ts:160-167` đang bắt buộc `upload.uploadId` và `upload.partUrl` khác rỗng, ném `Error('Upload session is missing from create asset response')` nếu thiếu. WP5 phải cập nhật hàm `createAssetUploadSession` sang `sessionId`/`urls` **trong cùng đợt release với E1**; `assetId` và `version.objectName` giữ nguyên nên phần còn lại của client không đổi.

```json
{
  "isSuccessful": true,
  "data": {
    "asset": {
      "assetId": "68b3f0a51c4d2e0a7c9b1234",
      "assetName": "render_final.mp4",
      "projectId": "68b3e9c21c4d2e0a7c9b0001",
      "folderId": "68b3e9c21c4d2e0a7c9b0042",
      "ownerId": "68b3e0001c4d2e0a7c9b0777",
      "ownerEmail": "tpnam1w3@gmail.com",
      "versionCount": 1,
      "mediaType": "VIDEO",
      "assetStatus": "DRAFT",
      "isActive": true
    },
    "version": {
      "fileId": "68b3f0a51c4d2e0a7c9b5678",
      "fileName": "render_final.mp4",
      "objectName": "3f8a1c2e-7b64-4d5e-9a10-2c6f0b7d1e93_render_final.mp4",
      "assetId": "68b3f0a51c4d2e0a7c9b1234",
      "projectId": "68b3e9c21c4d2e0a7c9b0001",
      "downloadFileName": "render_final.mp4v1",
      "versionNumber": 1,
      "mediaType": "VIDEO",
      "mimeType": "video/mp4",
      "fileSize": 1073741824,
      "status": "UPLOADING",
      "processingStatus": "PENDING",
      "ownerId": "68b3e0001c4d2e0a7c9b0777",
      "isActive": true
    },
    "upload": {
      "sessionId": "9d1f0a3c-5e42-4b18-8f77-0a2b6c9d4e51",
      "uploadMode": "MULTIPART",
      "partSize": 8388608,
      "partCount": 128,
      "declaredSize": 1073741824,
      "urls": {
        "1": "http://localhost:9000/file-sharing/3f8a1c2e-7b64-4d5e-9a10-2c6f0b7d1e93_render_final.mp4?uploadId=...&partNumber=1&X-Amz-Signature=...",
        "2": "http://localhost:9000/file-sharing/3f8a1c2e-7b64-4d5e-9a10-2c6f0b7d1e93_render_final.mp4?uploadId=...&partNumber=2&X-Amz-Signature=...",
        "3": "http://localhost:9000/file-sharing/3f8a1c2e-7b64-4d5e-9a10-2c6f0b7d1e93_render_final.mp4?uploadId=...&partNumber=3&X-Amz-Signature=..."
      },
      "urlExpiresAt": "2026-09-02T08:15:00Z",
      "expiresAt": "2026-09-03T08:00:00Z",
      "hardExpiresAt": "2026-09-09T08:00:00Z"
    }
  },
  "code": "200",
  "message": "Successful"
}
```

(Ví dụ rút gọn `urls` còn 3 key; response thật chứa đủ `K = min(partCount, 20)` key liên tiếp từ `"1"`.)

### E1.3 Bảng lỗi

| Điều kiện | HTTP | ErrorCode | Message mẫu |
|---|---|---|---|
| Thiếu/hỏng JWT | 401 | `USER_NOT_AUTHENTICATED` | `User not authenticated` |
| `projectId` rỗng | 400 | `BAD_REQUEST` | `projectId is required` |
| `fileName` rỗng | 400 | `BAD_REQUEST` | `fileName is required` |
| `fileSize` null hoặc `<= 0` | 400 | `BAD_REQUEST` | `fileSize is required` |
| `fileSize > upload.max-file-size` | 400 | `BAD_REQUEST` | `fileSize exceeds limit: 53687091200 bytes` |
| `mediaType` null | 400 | `BAD_REQUEST` | `mediaType is required` |
| `mimeType` không khớp mediaType của asset đã có (tạo version) | 400 | `BAD_REQUEST` | `mediaType must match original version` |
| Project không tồn tại | 404 | `PROJECT_NOT_FOUND` | `Project not found` |
| Folder không tồn tại / không thuộc project | 404 | `FOLDER_NOT_FOUND` | `Folder not found` |
| Không có quyền `CREATE_FOLDER_ASSET` trên folder/project | 403 | `FILE_PERMISSION_ERROR` | `File permission Error` |
| Số session đang mở của user ≥ `upload.max-sessions-per-user` | 429 | `SESSION_LIMIT_EXCEEDED` | `Too many concurrent upload sessions: 20` |
| `CreateMultipartUpload` lỗi ở MinIO | 500 | `FILE_ERROR` | `Failed to initiate multipart upload` |

### E1.4 Ghi chú hành vi

- Nhánh `SINGLE` (`declaredSize <= 8388608`): server **không** gọi `CreateMultipartUpload`; `session.uploadId = null`; `urls["1"]` là presigned PUT thẳng vào object (không có query `uploadId`/`partNumber`). Session vẫn được tạo để E3/E4/E5 dùng chung một giao diện.
- Server sinh `objectName` bằng `AssetServiceImpl.generateObjectName` (`UUID + "_" + fileName`, lặp tới khi unique) — client **không** được gửi lên.
- Response không chứa `uploadId` ở bất kỳ field nào; `uploadId` chỉ nằm bên trong query string của presigned URL (bắt buộc theo giao thức S3).

---

## Hợp đồng PUT part (client ↔ MinIO, không qua filehandler)

Không phải endpoint của filehandler nhưng là một phần bắt buộc của contract.

| Mục | Giá trị |
|---|---|
| Method | `PUT <url lấy từ E1/E2>` |
| Header bắt buộc | `Content-MD5: <base64 của MD5 nhị phân của chính part đó>` (SEC-06) |
| Header khác | `Content-Type` **không** được đặt (không nằm trong SignedHeaders) |
| Body | Byte range `[(n-1) * partSize, min(n * partSize, declaredSize))` |
| Thành công | `200` + response header `ETag` (chuỗi có dấu `"`; client giữ nguyên hoặc bỏ dấu nháy — E4 chấp nhận cả hai) |
| MD5 sai | `400 BadDigest` → client tính lại và upload lại chính part đó |
| URL hết hạn | `403 SignatureDoesNotMatch` / `AccessDenied` → client gọi E2 xin URL mới cho đúng part đó, **không** tính vào 3 lần retry lỗi mạng |

`Content-MD5` là header **không được ký** trong presigned URL (server không biết MD5 lúc presign) — MinIO vẫn verify và trả `BadDigest` khi lệch.

---

## E2 — Cấp presigned URL theo lô

```
POST /api/uploads/{sessionId}/part-urls
```

| Mục | Giá trị |
|---|---|
| Controller | `UploadSessionController` (`@RequestMapping("api/uploads")`) — **mới** |
| Auth | JWT bắt buộc |
| Path variable | `sessionId` — String UUID |
| Request DTO | `PartUrlBatchRequestDto` |
| Response DTO | `CommonResponse<PartUrlBatchResponseDto>` |
| Idempotent | Có (cấp lại URL cho cùng part là hợp lệ, URL cũ vẫn sống tới `urlExpiresAt` của nó) |

### E2.1 Request

| Field JSON | Kiểu | Bắt buộc | Ràng buộc | Mô tả |
|---|---|---|---|---|
| `partNumbers` | `List<Integer>` | Có | không rỗng; `size() <= 50`; mọi phần tử `1 <= n <= session.partCount`; không trùng lặp | Danh sách part cần URL |

```json
{
  "partNumbers": [21, 22, 23, 24, 25]
}
```

### E2.2 Response thành công (200)

`PartUrlBatchResponseDto`:

| Field JSON | Kiểu | Mô tả |
|---|---|---|
| `sessionId` | String | Echo lại để client đối chiếu |
| `urls` | `Map<Integer, String>` | Key = `partNumber` đúng thứ tự yêu cầu; giá trị = presigned PUT URL |
| `urlExpiresAt` | Instant | Hết hạn của lô URL này (`now + upload.part-url-ttl`) |
| `expiresAt` | Instant | Session `expiresAt` **sau khi** đã trượt |

```json
{
  "isSuccessful": true,
  "data": {
    "sessionId": "9d1f0a3c-5e42-4b18-8f77-0a2b6c9d4e51",
    "urls": {
      "21": "http://localhost:9000/file-sharing/3f8a1c2e-7b64-4d5e-9a10-2c6f0b7d1e93_render_final.mp4?uploadId=...&partNumber=21&X-Amz-Signature=...",
      "22": "http://localhost:9000/file-sharing/3f8a1c2e-7b64-4d5e-9a10-2c6f0b7d1e93_render_final.mp4?uploadId=...&partNumber=22&X-Amz-Signature=..."
    },
    "urlExpiresAt": "2026-09-02T09:05:00Z",
    "expiresAt": "2026-09-03T08:50:00Z"
  },
  "code": "200",
  "message": "Successful"
}
```

### E2.3 Bảng lỗi

| Điều kiện | HTTP | ErrorCode | Message mẫu |
|---|---|---|---|
| Thiếu/hỏng JWT | 401 | `USER_NOT_AUTHENTICATED` | `User not authenticated` |
| Session không tồn tại / đã EXPIRED / `expiresAt < now` | 404 | `SESSION_NOT_FOUND` | `Upload session not found: 9d1f0a3c-...` |
| `session.ownerId != currentUserId` | 403 | `FILE_PERMISSION_ERROR` | `File permission Error` |
| `status == COMPLETED` hoặc `ABORTED` | 409 | `SESSION_INVALID_STATE` | `Session is COMPLETED, cannot issue part urls` |
| `partNumbers` null / rỗng | 400 | `BAD_REQUEST` | `partNumbers is required` |
| `partNumbers.size() > 50` | 400 | `BAD_REQUEST` | `partNumbers batch exceeds 50` |
| Có phần tử ngoài `[1..partCount]` | 400 | `BAD_REQUEST` | `partNumber 141 out of range [1..128]` |
| Lỗi presign ở tầng storage | 500 | `FILE_ERROR` | `Failed to presign part url` |

### E2.4 Ghi chú hành vi

- **Sliding TTL:** mỗi lần gọi thành công → `expiresAt = min(now + upload.session-idle-ttl, hardExpiresAt)` và `status: INITIATED → UPLOADING`.
- **Không bao giờ** cấp URL cho `partNumber > partCount` — đây là chốt chặn khai gian size (SEC-04/S5) ở tầng cấp URL.
- `uploadMode = SINGLE`: chỉ chấp nhận `partNumbers: [1]`; giá trị khác → 400 `BAD_REQUEST`.

---

## E3 — Trạng thái session / resume

```
GET /api/uploads/{sessionId}
```

| Mục | Giá trị |
|---|---|
| Controller | `UploadSessionController` |
| Auth | JWT bắt buộc |
| Request body | Không có |
| Response DTO | `CommonResponse<UploadSessionStatusResponseDto>` |
| Idempotent | Có (chỉ đọc + touch TTL) |

### E3.1 Request

Không có body. Chỉ path variable `sessionId`.

```
GET /api/uploads/9d1f0a3c-5e42-4b18-8f77-0a2b6c9d4e51
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

### E3.2 Response thành công (200)

`UploadSessionStatusResponseDto`:

| Field JSON | Kiểu | Luôn có | Mô tả |
|---|---|---|---|
| `sessionId` | String | Có | |
| `status` | enum `UploadSessionStatus` | Có | `INITIATED` \| `UPLOADING` \| `COMPLETED` \| `ABORTED` \| `EXPIRED` |
| `uploadMode` | enum `UploadMode` | Có | Cần cho client resume đúng nhánh |
| `partSize` | long | Có | Client suy offset part n = `(n - 1) * partSize` |
| `partCount` | int | Có | |
| `declaredSize` | long | Có | |
| `receivedParts` | `List<ReceivedPartDto>` | Có (rỗng nếu chưa có part nào) | Lấy từ `ListParts` của MinIO — **nguồn chân lý**, không lấy từ Mongo |
| `uploadedBytes` | long | Có | `Σ receivedParts[].size` |
| `expiresAt` | Instant | Có | Session expiry sau khi đã trượt |
| `hardExpiresAt` | Instant | Có | |
| `resource` | `UploadResourceResponseDto` \| null | Chỉ khi `status == COMPLETED` | Xem E4.2 |

`ReceivedPartDto`:

| Field JSON | Kiểu | Mô tả |
|---|---|---|
| `partNumber` | int | Số hiệu part (1-based) |
| `size` | long | Số byte MinIO đã nhận cho part đó |
| `etag` | String | ETag MinIO trả (không có dấu nháy) |

```json
{
  "isSuccessful": true,
  "data": {
    "sessionId": "9d1f0a3c-5e42-4b18-8f77-0a2b6c9d4e51",
    "status": "UPLOADING",
    "uploadMode": "MULTIPART",
    "partSize": 8388608,
    "partCount": 128,
    "declaredSize": 1073741824,
    "receivedParts": [
      {"partNumber": 1, "size": 8388608, "etag": "9b2cf5a1d3e04f7a8c6b1e2d3f405a6b"},
      {"partNumber": 2, "size": 8388608, "etag": "1c7e4a02b95d4f31a8c0d6e5f4b3a2c1"},
      {"partNumber": 3, "size": 8388608, "etag": "44f0b1c2d3e4f5a60718293a4b5c6d7e"}
    ],
    "uploadedBytes": 25165824,
    "expiresAt": "2026-09-03T09:10:00Z",
    "hardExpiresAt": "2026-09-09T08:00:00Z",
    "resource": null
  },
  "code": "200",
  "message": "Successful"
}
```

Khi `status == COMPLETED` (chống double-commit):

```json
{
  "isSuccessful": true,
  "data": {
    "sessionId": "9d1f0a3c-5e42-4b18-8f77-0a2b6c9d4e51",
    "status": "COMPLETED",
    "uploadMode": "MULTIPART",
    "partSize": 8388608,
    "partCount": 128,
    "declaredSize": 1073741824,
    "receivedParts": [],
    "uploadedBytes": 1073741824,
    "expiresAt": "2026-09-03T09:10:00Z",
    "hardExpiresAt": "2026-09-09T08:00:00Z",
    "resource": {
      "sessionId": "9d1f0a3c-5e42-4b18-8f77-0a2b6c9d4e51",
      "assetId": "68b3f0a51c4d2e0a7c9b1234",
      "fileId": "68b3f0a51c4d2e0a7c9b5678",
      "versionNumber": 1,
      "objectName": "3f8a1c2e-7b64-4d5e-9a10-2c6f0b7d1e93_render_final.mp4",
      "fileName": "render_final.mp4",
      "fileSize": 1073741824,
      "etag": "8a1f2b3c4d5e6f708192a3b4c5d6e7f8-128",
      "mimeType": "video/mp4",
      "mediaType": "VIDEO",
      "uploadStatus": "COMPLETED",
      "processingStatus": "PENDING",
      "completedAt": "2026-09-02T09:12:31Z"
    }
  },
  "code": "200",
  "message": "Successful"
}
```

### E3.3 Bảng lỗi

| Điều kiện | HTTP | ErrorCode | Message mẫu |
|---|---|---|---|
| Thiếu/hỏng JWT | 401 | `USER_NOT_AUTHENTICATED` | `User not authenticated` |
| Session không tồn tại / EXPIRED / `expiresAt < now` | 404 | `SESSION_NOT_FOUND` | `Upload session not found: 9d1f0a3c-...` |
| `session.ownerId != currentUserId` | 403 | `FILE_PERMISSION_ERROR` | `File permission Error` |
| `ListParts` lỗi ở MinIO | 500 | `FILE_ERROR` | `Failed to list uploaded parts` |

`status == ABORTED` **không** phải lỗi ở E3: trả 200 với `status: "ABORTED"`, `receivedParts: []` để client biết phải khởi tạo upload mới.

### E3.4 Ghi chú hành vi

- **Sliding TTL:** gọi thành công trên session còn sống (`INITIATED`/`UPLOADING`) → touch `expiresAt` giống E2. Session `COMPLETED`/`ABORTED` không touch.
- `status == COMPLETED` → **không gọi `ListParts`** (multipart đã đóng, MinIO trả `NoSuchUpload`); trả `receivedParts: []` và `resource` đầy đủ.
- Client tính danh sách part thiếu: `[1..partCount] − receivedParts[].partNumber`, rồi gọi E2 cho phần thiếu.
- `uploadMode = SINGLE`: `receivedParts` rỗng khi chưa PUT xong; server dùng `HeadObject` để biết object đã tồn tại chưa → nếu có, trả `receivedParts: [{partNumber: 1, size: <size thật>, etag: <etag thật>}]`.

---

## E4 — Commit (complete) có verify

```
POST /api/uploads/{sessionId}/complete
```

| Mục | Giá trị |
|---|---|
| Controller | `UploadSessionController` |
| Auth | JWT bắt buộc |
| Request DTO | `CompleteUploadSessionRequestDto` |
| Response DTO | `CommonResponse<UploadResourceResponseDto>` |
| Idempotent | **Có** — xem E4.4 |
| Thay cho | `POST /api/file-metadata/upload/complete` (E7, deprecated) |

### E4.1 Request

| Field JSON | Kiểu | Bắt buộc | Ràng buộc | Mô tả |
|---|---|---|---|---|
| `parts` | `List<CompletedPartDto>` | Có | không rỗng | Danh sách part client đã upload |

`CompletedPartDto`:

| Field JSON | Kiểu | Bắt buộc | Ràng buộc | Mô tả |
|---|---|---|---|---|
| `partNumber` | int | Có | `1 <= n <= partCount` | Số hiệu part |
| `etag` | String | Có | not blank | ETag MinIO trả khi PUT part (chấp nhận có hoặc không có dấu `"` bao ngoài; server tự strip) |
| `md5` | String | Có | 32 ký tự hex, lowercase | MD5 **hex** của part — dùng làm precondition so với ETag |

> `md5` gửi ở đây là dạng **hex**, khác với header `Content-MD5` lúc PUT (dạng **base64**). Client tính một lần bằng SparkMD5 rồi encode hai kiểu.

```json
{
  "parts": [
    {"partNumber": 1, "etag": "9b2cf5a1d3e04f7a8c6b1e2d3f405a6b", "md5": "9b2cf5a1d3e04f7a8c6b1e2d3f405a6b"},
    {"partNumber": 2, "etag": "1c7e4a02b95d4f31a8c0d6e5f4b3a2c1", "md5": "1c7e4a02b95d4f31a8c0d6e5f4b3a2c1"}
  ]
}
```

### E4.2 Response thành công (200)

`UploadResourceResponseDto`:

| Field JSON | Kiểu | Mô tả |
|---|---|---|
| `sessionId` | String | |
| `assetId` | String | `AssetEntity.assetId` |
| `fileId` | String | `MetadataEntity.fileId` (chính là `session.metadataId`) |
| `versionNumber` | int | Số hiệu version của file |
| `objectName` | String | Object key thật trên bucket |
| `fileName` | String | Tên file gốc |
| `fileSize` | long | **Size thật** đọc từ `HeadObject` sau commit (không phải size client khai) |
| `etag` | String | ETag của object sau `CompleteMultipartUpload` (dạng `<hex>-<số part>` với multipart) |
| `mimeType` | String | |
| `mediaType` | enum `MediaType` | |
| `uploadStatus` | enum `UploadStatus` | Luôn `COMPLETED` |
| `processingStatus` | enum `ProcessingStatus` | `PENDING` với video, `READY` với loại khác — giữ nguyên quy tắc hiện hành |
| `completedAt` | Instant | |

> **Khác biệt tên field so với `03_detailed_design.md`:** WP4 mô tả prose `{assetId, objectName, size, etag, processingStatus}`. Contract chốt tên `fileSize` (thay `size`) và `uploadStatus` (thay `status`) để nhất quán với `MetadataEntity.fileSize`/`DownloadFileResponseDto.fileSize` và để `status` không đụng nghĩa với `UploadSessionStatus` ở E3.

```json
{
  "isSuccessful": true,
  "data": {
    "sessionId": "9d1f0a3c-5e42-4b18-8f77-0a2b6c9d4e51",
    "assetId": "68b3f0a51c4d2e0a7c9b1234",
    "fileId": "68b3f0a51c4d2e0a7c9b5678",
    "versionNumber": 1,
    "objectName": "3f8a1c2e-7b64-4d5e-9a10-2c6f0b7d1e93_render_final.mp4",
    "fileName": "render_final.mp4",
    "fileSize": 1073741824,
    "etag": "8a1f2b3c4d5e6f708192a3b4c5d6e7f8-128",
    "mimeType": "video/mp4",
    "mediaType": "VIDEO",
    "uploadStatus": "COMPLETED",
    "processingStatus": "PENDING",
    "completedAt": "2026-09-02T09:12:31Z"
  },
  "code": "200",
  "message": "Successful"
}
```

### E4.3 Bảng lỗi

Thứ tự kiểm tra là **bắt buộc** (mỗi nhánh trong sơ đồ WP4 §"Luồng E4"):

| # | Điều kiện | HTTP | ErrorCode | Message mẫu |
|---|---|---|---|---|
| 1 | Thiếu/hỏng JWT | 401 | `USER_NOT_AUTHENTICATED` | `User not authenticated` |
| 2 | Session không tồn tại / EXPIRED / `expiresAt < now` | 404 | `SESSION_NOT_FOUND` | `Upload session not found: 9d1f0a3c-...` |
| 3 | `session.ownerId != currentUserId` (kiểm **trước** mọi call storage) | 403 | `FILE_PERMISSION_ERROR` | `File permission Error` |
| 4 | `status == COMPLETED` | **200** | — | Trả `resource` cũ, không tác dụng phụ (idempotent) |
| 5 | `status == ABORTED` hoặc `EXPIRED` | 409 | `SESSION_INVALID_STATE` | `Session is ABORTED, please start a new upload` |
| 6 | `parts` null / rỗng | 400 | `BAD_REQUEST` | `parts list is required` |
| 7 | `ListParts` trả ít hơn `partCount` part | 400 | `UPLOAD_INCOMPLETE` | `Missing parts: [37, 38, 91]` |
| 8 | `Σ ListParts[].size != declaredSize` | 400 | `SIZE_MISMATCH` | `Expected 1073741824 bytes, got 1069547520` |
| 9 | Thiếu entry `md5` cho một part có trong `ListParts` | 400 | `CHECKSUM_MISMATCH` | `Missing md5 for part 12` |
| 10 | `ListParts[n].etag != parts[n].md5` (khi `upload.verify-etag-md5 = true`) | 400 | `CHECKSUM_MISMATCH` | `Checksum mismatch at parts: [12, 44]` |
| 11 | `CompleteMultipartUpload` lỗi ở MinIO | 500 | `FILE_ERROR` | `Failed to complete multipart upload` |
| 12 | `HeadObject` sau commit không thấy object | 500 | `FILE_ERROR` | `Object not found after commit` |

Message của nhánh 7 và 10 **phải** liệt kê danh sách part để client tự bù rồi gọi lại E4 (REL-01).

### E4.4 Ghi chú hành vi — idempotency (bắt buộc)

1. Gọi lần 2 trên session đã `COMPLETED` → **200** với đúng `resource` của lần 1 (dựng lại từ `session.resultEtag` + `MetadataEntity`), **không** gọi lại MinIO, **không** bắn lại Kafka.
2. Chuyển trạng thái phải là thao tác **atomic có điều kiện** trên Mongo (`findAndModify` với filter `status IN (INITIATED, UPLOADING)`) để hai request complete song song chỉ có một request thắng; request thua đọc lại session và rơi vào nhánh (4).
3. Thứ tự tác dụng phụ sau khi `CompleteMultipartUpload` thành công: `HeadObject` → cập nhật `MetadataEntity` (`status = COMPLETED`, `fileSize` = size thật, `processingStatus`) → cập nhật session (`status = COMPLETED`, `completedAt`, `resultEtag`) → publish Kafka. Kafka là bước **cuối**, sau khi Mongo đã ghi.
4. Nhánh `uploadMode = SINGLE`: bỏ qua `ListParts`/`CompleteMultipartUpload`; dùng `HeadObject` → verify `size == declaredSize` (lỗi → `SIZE_MISMATCH`) và `etag == parts[0].md5` khi `upload.verify-etag-md5 = true` (lỗi → `CHECKSUM_MISMATCH`).
5. `session.partMd5` được ghi lại từ `parts` trước khi verify, phục vụ đối soát về sau.

---

## E5 — Huỷ session (abort)

```
DELETE /api/uploads/{sessionId}
```

| Mục | Giá trị |
|---|---|
| Controller | `UploadSessionController` |
| Auth | JWT bắt buộc |
| Request body | Không có |
| Response DTO | `CommonResponse<AbortUploadSessionResponseDto>` |
| Idempotent | Có (gọi lại trên session đã `ABORTED` → 200) |
| Thay cho | `POST /api/file-metadata/upload/stop-upload` (E7, deprecated) |

### E5.1 Request

```
DELETE /api/uploads/9d1f0a3c-5e42-4b18-8f77-0a2b6c9d4e51
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

### E5.2 Response thành công (200)

`AbortUploadSessionResponseDto`:

| Field JSON | Kiểu | Mô tả |
|---|---|---|
| `sessionId` | String | |
| `status` | enum `UploadSessionStatus` | Luôn `ABORTED` |
| `abortedAt` | Instant | Thời điểm abort (lần đầu tiên) |

```json
{
  "isSuccessful": true,
  "data": {
    "sessionId": "9d1f0a3c-5e42-4b18-8f77-0a2b6c9d4e51",
    "status": "ABORTED",
    "abortedAt": "2026-09-02T09:20:04Z"
  },
  "code": "200",
  "message": "Successful"
}
```

### E5.3 Bảng lỗi

| Điều kiện | HTTP | ErrorCode | Message mẫu |
|---|---|---|---|
| Thiếu/hỏng JWT | 401 | `USER_NOT_AUTHENTICATED` | `User not authenticated` |
| Session không tồn tại / EXPIRED / `expiresAt < now` | 404 | `SESSION_NOT_FOUND` | `Upload session not found: 9d1f0a3c-...` |
| `session.ownerId != currentUserId` | 403 | `FILE_PERMISSION_ERROR` | `File permission Error` |
| `status == COMPLETED` | 409 | `SESSION_INVALID_STATE` | `Session is COMPLETED, cannot abort` |
| `AbortMultipartUpload` lỗi ở MinIO (khác `NoSuchUpload`) | 500 | `FILE_ERROR` | `Failed to abort multipart upload` |

### E5.4 Ghi chú hành vi

- Tác dụng phụ theo thứ tự: `AbortMultipartUpload` (bỏ qua lỗi `NoSuchUpload` — coi như đã dọn) → `session.status = ABORTED` → `MetadataEntity.status = FAILED`, `isActive = false`.
- `uploadMode = SINGLE`: bỏ qua `AbortMultipartUpload`; nếu object đã tồn tại thì xoá object rồi mới đánh dấu FAILED.
- Không touch sliding TTL.

---

## E6 — Lấy presigned URL download

```
POST /api/file-metadata/download
```

| Mục | Giá trị |
|---|---|
| Controller | `FileMetadataController.downloadFile` — giữ URL, **thêm kiểm quyền** |
| Auth | JWT bắt buộc |
| Request DTO | `DownloadFileRequestDto` (giữ nguyên) |
| Response DTO | `CommonResponse<DownloadFileResponseDto>` (thêm `contentType`, đổi kiểu `fileSize`) |
| Idempotent | Có |

### E6.1 Request

| Field JSON | Kiểu | Bắt buộc | Ràng buộc | Mô tả |
|---|---|---|---|---|
| `objectName` | String | Có | not blank | Object key của version cần tải |
| `downloadFileName` | String | Không | not blank nếu có | Tên file client muốn nhận; bỏ trống → server dùng `MetadataEntity.fileName` |

```json
{
  "objectName": "3f8a1c2e-7b64-4d5e-9a10-2c6f0b7d1e93_render_final.mp4",
  "downloadFileName": "render_final.mp4"
}
```

### E6.2 Response thành công (200)

`DownloadFileResponseDto`:

| Field JSON | Kiểu | Trạng thái | Mô tả |
|---|---|---|---|
| `url` | String | Giữ | Presigned GET ký bằng `svc-download`, có `response-content-disposition: attachment` |
| `fileSize` | long | **Đổi kiểu** `Double` → `long` | Dùng để cắt Range request |
| `fileName` | String | Giữ | |
| `mimeType` | String | **Giữ** (tương thích ngược) | Bằng đúng `contentType` |
| `contentType` | String | **THÊM MỚI** | Field mà `client/src/service/downloadService.ts:305` đang đọc (vá R4) |

```json
{
  "isSuccessful": true,
  "data": {
    "url": "http://localhost:9000/file-sharing/3f8a1c2e-7b64-4d5e-9a10-2c6f0b7d1e93_render_final.mp4?response-content-disposition=attachment%3B%20filename%3D%22render_final.mp4%22&X-Amz-Signature=...",
    "fileSize": 1073741824,
    "fileName": "render_final.mp4",
    "mimeType": "video/mp4",
    "contentType": "video/mp4"
  },
  "code": "200",
  "message": "Successful"
}
```

### E6.3 Bảng lỗi

| Điều kiện | HTTP | ErrorCode | Message mẫu |
|---|---|---|---|
| Thiếu/hỏng JWT | 401 | `USER_NOT_AUTHENTICATED` | `User not authenticated` |
| `objectName` rỗng | 400 | `FILE_OBJECT_NAME_CANNOT_BE_EMPTY` | `File name cannot be empty` |
| Không có metadata khớp `objectName` | 404 | `FILE_NOT_FOUND` | `File not found` |
| Không phải owner, không có quyền `READ` trên project/folder, không có share token hợp lệ (vá S2) | 403 | `FILE_PERMISSION_ERROR` | `File permission Error` |
| `metadata.status != COMPLETED` | 409 | `FILE_NOT_READY` | `File is not ready for download` |
| Lỗi presign | 500 | `FILE_ERROR` | `Failed to presign download url` |

### E6.4 Ghi chú hành vi

- Thứ tự bắt buộc: tra metadata → **kiểm quyền** → kiểm `status == COMPLETED` → presign. Không presign trước rồi kiểm sau.
- TTL URL = `clamp(fileSize / 1_000_000, 900, 14400)` giây (15 phút – 4 giờ). Công thức `calculateExpireTime` cũ bị xoá.
- **Không log URL** ở bất kỳ mức nào (SEC-07). Log tối đa `objectName` + `fileId`.
- Client tiếp tục dùng Range request song song trên cùng một URL — hành vi này không đổi.

---

## E7 — Endpoint legacy (deprecated, giữ nguyên HỢP ĐỒNG; implementation chuyển sang SDK — user duyệt 2026-09-01)

Ba endpoint dưới đây **giữ nguyên hợp đồng** (URL, request body, response schema, HTTP status) trong phase này, kèm `@Deprecated` + một dòng `log.warn` mỗi lần được gọi. **Không** thêm kiểm quyền, **không** đổi shape request/response — làm vậy sẽ phá client cũ đang chạy song song trong bước rollout 3–4.

**Thay đổi được duyệt (khác bản trước của mục này):** implementation bên dưới **chuyển sang `StorageService` (AWS SDK v2)** — các helper cũ (`calculateExpireTime`, `extractUploadIdFromXml`, `buildCompleteMultipartUploadXml`, field `OkHttpClient`) bị xoá ngay ở WP3. Hành vi nội bộ đổi và được chấp nhận: part URL vẫn sinh trước toàn bộ như cũ nhưng TTL **đồng nhất** theo `clamp(partCount × 60s, 1h, 6h)` thay cho công thức theo partNumber; complete/abort đi qua SDK. Client cũ không đọc TTL từ response nên hợp đồng không vỡ.

| Endpoint | Request DTO | Response | Ghi chú |
|---|---|---|---|
| `POST /api/file-metadata/upload-metadata` | `MetadataDTO` (client tự gửi `objectName`) | `CommonResponse<InitiateUploadResponseDto>` (`uploadId` + `partUrl`) | Luồng legacy, sẽ xoá ở phase sau (S3) |
| `POST /api/file-metadata/upload/complete` | `CompleteUploadRequest` (`objectName`, `uploadId`, `assetId`, `parts`) | `CommonResponse<String>` = `"complete upload"` | Thay bằng E4 |
| `POST /api/file-metadata/upload/stop-upload` | `AbortUploadRequestDto` | `CommonResponse<String>` = `"stopped upload"` | Thay bằng E5 |

Message log warning chuẩn: `log.warn("DEPRECATED endpoint called: {} — migrate to {}", "/api/file-metadata/upload/complete", "/api/uploads/{sessionId}/complete")`.

`POST /api/file-metadata/direct-upload` **không** nằm trong E7 và không đổi ở phase này (đường proxy file < 5 MiB hiện có).

---

## 8. Danh sách DTO Java (tên chốt)

Package mới: `org.example.filesharing.entities.dtos.upload`.

| DTO | Vai trò | Field |
|---|---|---|
| `UploadSessionInitResponseDto` | E1 — khối `upload` trong `AssetCreateResponseDto` | `sessionId`, `uploadMode`, `partSize`, `partCount`, `declaredSize`, `urls`, `urlExpiresAt`, `expiresAt`, `hardExpiresAt` |
| `PartUrlBatchRequestDto` | E2 request | `partNumbers` |
| `PartUrlBatchResponseDto` | E2 response | `sessionId`, `urls`, `urlExpiresAt`, `expiresAt` |
| `UploadSessionStatusResponseDto` | E3 response | `sessionId`, `status`, `uploadMode`, `partSize`, `partCount`, `declaredSize`, `receivedParts`, `uploadedBytes`, `expiresAt`, `hardExpiresAt`, `resource` |
| `ReceivedPartDto` | E3 — phần tử `receivedParts` | `partNumber`, `size`, `etag` |
| `CompleteUploadSessionRequestDto` | E4 request | `parts` |
| `CompletedPartDto` | E4 — phần tử `parts` | `partNumber`, `etag`, `md5` |
| `UploadResourceResponseDto` | E4 response + `E3.resource` | `sessionId`, `assetId`, `fileId`, `versionNumber`, `objectName`, `fileName`, `fileSize`, `etag`, `mimeType`, `mediaType`, `uploadStatus`, `processingStatus`, `completedAt` |
| `AbortUploadSessionResponseDto` | E5 response | `sessionId`, `status`, `abortedAt` |

DTO hiện có bị thay đổi:

| DTO | Package | Thay đổi |
|---|---|---|
| `AssetCreateRequestDto` | `...dtos.asset` | `Double fileSize` → `Long fileSize` |
| `AssetCreateResponseDto` | `...dtos.asset` | Kiểu field `upload`: `InitiateUploadResponseDto` → `UploadSessionInitResponseDto` |
| `DownloadFileResponseDto` | `...dtos.metadata` | Thêm `contentType`; `Double fileSize` → `Long fileSize` |
| `InitiateUploadResponseDto` | `...dtos.metadata` | **Giữ nguyên** — chỉ còn E7 dùng |
| `CompleteUploadRequest`, `AbortUploadRequestDto` | `...dtos.chunk` | **Giữ nguyên** — chỉ còn E7 dùng |

Quy ước tuân thủ `.claude/rules/backend-filehandler.md`: DTO mới đặt tên `XxxRequestDto`/`XxxResponseDto`; controller không trả entity trực tiếp (ngoại lệ đã tồn tại: `AssetCreateResponseDto` bọc `AssetEntity`/`MetadataEntity` — giữ nguyên để không phá client).

Sau khi đổi DTO: chạy `npm run gen-api` ở `client/` (server phải đang chạy ở `:5000`) — **không** hand-edit `client/src/api/api/`.

---

## 9. ErrorCode cần thêm vào `com.file.service.filesharing.core.exceptions.ErrorCode`

### 9.1 Bốn mã đã chốt

Thêm vào cuối enum, trước dấu `;`, theo đúng format hiện có `NAME("code", "message", HttpStatus.XXX)`:

| Enum constant | code | message | httpStatus | Dùng ở |
|---|---|---|---|---|
| `SESSION_NOT_FOUND` | `"5501"` | `Upload session not found` | `HttpStatus.NOT_FOUND` (404) | E2, E3, E4, E5 |
| `UPLOAD_INCOMPLETE` | `"5502"` | `Upload is incomplete` | `HttpStatus.BAD_REQUEST` (400) | E4 |
| `SIZE_MISMATCH` | `"5503"` | `Uploaded size does not match declared size` | `HttpStatus.BAD_REQUEST` (400) | E4 |
| `CHECKSUM_MISMATCH` | `"5504"` | `Part checksum mismatch` | `HttpStatus.BAD_REQUEST` (400) | E4 |

Dải `55xx` là dải mới dành riêng cho upload session (dải đang dùng: `50xx` docker, `51xx` file, `52xx` user, `53xx` project, `54xx` folder, `61xx` mongo/mail).

### 9.2 Ba mã phát sinh — ĐÃ DUYỆT (lead, 2026-09-01; user có thể phủ quyết trước khi implement WP2)

Ba nhánh dưới đây được vẽ trong sơ đồ WP4/WP7 nhưng **không có** mã lỗi nào trong enum hiện tại map sang HTTP 409/429. Không thể phủ hết contract nếu thiếu chúng — vì vậy đã duyệt gộp vào WP2 cùng 4 mã ở §9.1 (tổng **7 mã mới**, đã phản ánh vào `00_guardrails.md` whitelist WP2 và `03_detailed_design.md` §WP4):

| Enum constant | code | message | httpStatus | Nhánh bắt buộc phủ |
|---|---|---|---|---|
| `SESSION_INVALID_STATE` | `"5505"` | `Upload session is not in a valid state` | `HttpStatus.CONFLICT` (409) | E2/E4 khi `ABORTED`/`EXPIRED`; E5 khi `COMPLETED` (WP4 §Luồng E4 nhánh C2) |
| `SESSION_LIMIT_EXCEEDED` | `"5506"` | `Too many concurrent upload sessions` | `HttpStatus.TOO_MANY_REQUESTS` (429) | E1 khi vượt `upload.max-sessions-per-user` (WP7 — SEC-08) |
| `FILE_NOT_READY` | `"5507"` | `File is not ready for download` | `HttpStatus.CONFLICT` (409) | E6 khi `status != COMPLETED` (WP4 §Luồng E6 nhánh D1) |

Nếu user không duyệt thêm ba mã này, phải quay lại quyết định HTTP status cho ba nhánh trên trước khi implement — **không** được tự ý map về `BAD_REQUEST`/`INTERNAL_SERVER_ERROR`.

### 9.3 Mã có sẵn được tái sử dụng (không thêm mới)

| Enum constant | code | httpStatus | Dùng cho |
|---|---|---|---|
| `FILE_PERMISSION_ERROR` | `"5104"` | 403 | Sai owner session (E2–E5); không đủ quyền folder/project (E1); không đủ quyền download (E6) |
| `BAD_REQUEST` | `"400"` | 400 | Validate input (E1, E2, E4) |
| `USER_NOT_AUTHENTICATED` | `"5205"` | 401 | Thiếu/hỏng JWT |
| `FILE_NOT_FOUND` | `"5101"` | 404 | E6 không có metadata |
| `FILE_OBJECT_NAME_CANNOT_BE_EMPTY` | `"5103"` | 400 | E6 `objectName` rỗng |
| `PROJECT_NOT_FOUND` | `"5301"` | 404 | E1 |
| `FOLDER_NOT_FOUND` | `"5401"` | 404 | E1 |
| `FILE_ERROR` | `"5100"` | 500 | Mọi lỗi tầng storage |

---

## 10. Truy vết yêu cầu

| Yêu cầu | Endpoint / mục trong file này |
|---|---|
| SEC-03 (server giữ định danh) | E1.2 (bỏ `uploadId`/`partUrl`), §0.7 |
| SEC-04 (verify tại commit) | E4.3 nhánh 2→10, E4.4 |
| SEC-05 (quyền download) | E6.3 dòng 403, E6.4 |
| SEC-06 (integrity) | Mục "Hợp đồng PUT part", E4.1 field `md5` |
| SEC-07 (không log URL) | E6.4 |
| SEC-08 (giới hạn session) | E1.3 dòng 429 |
| PERF-01 (batch URL) | E1.2 `urls` (K=20), E2 |
| PERF-02 (partSize server công bố) | §0.5, E1.2 `partSize` |
| PERF-03 (file nhỏ 1 request) | E1.4, `uploadMode = SINGLE` |
| REL-01 (resume) | E3 |
| REL-02 (idempotent) | E4.4 |
| REL-04 (long / contentType) | §0.3, E6.2 |
| R4 (contentType mismatch) | E6.2 |
