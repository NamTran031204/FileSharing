# 02 — Schema & Config: Upload/Download Pipeline v2

> **Vai trò tài liệu:** NGUỒN DUY NHẤT về schema MongoDB, index, key `application.yml`, script hạ tầng MinIO, dependency Maven và bean config của phase nâng cấp upload/download.
> Agent triển khai **copy nguyên văn** tên field/lệnh/khối YAML từ đây.
>
> **Không thuộc phạm vi file này:** tên endpoint, tên field JSON của API, mã lỗi HTTP → xem `01_api_contract.md`.
>
> Ngày chốt: 2026-09-02. Nhánh cơ sở: `web-flux`.

---

## 1. `UploadSessionEntity`

### 1.1 Vị trí file (quyết định + lý do)

| Thành phần | Đường dẫn | Lý do |
|---|---|---|
| `UploadSessionEntity` | `server/filesharing-filehandler/src/main/java/org/example/filesharing/entities/models/UploadSessionEntity.java` | Chỉ filehandler đọc/ghi collection này (controller E1–E5, `UploadSessionGcJob`, `UploadReconcileJob`); không module worker nào cần. Có tiền lệ trong repo: `UserEntity` cũng là entity module-local đặt ở `entities/models/` |
| `UploadSessionRepo` | `server/filesharing-filehandler/src/main/java/org/example/filesharing/repositories/UploadSessionRepo.java` | `extends MongoRepository<UploadSessionEntity, String>` theo convention `repositories/` |
| `UploadSessionStatus` | `server/filesharing-core/src/main/java/com/file/service/filesharing/core/enums/UploadSessionStatus.java` | **Enum dùng chung đặt ở core** theo `.claude/rules/backend-core.md`; giống `UploadStatus`, `ProcessingStatus` |
| `UploadMode` | `server/filesharing-core/src/main/java/com/file/service/filesharing/core/enums/UploadMode.java` | Enum lộ ra API (E1/E3) → cùng chỗ với các enum công khai khác |
| `UploadSessionService` / `UploadSessionServiceImpl` | `.../services/UploadSessionService.java` + `.../services/impl/UploadSessionServiceImpl.java` | Convention `services/` + `services/impl/`; mọi controller đi qua service, **không** đụng repo trực tiếp |

> Sau khi thêm enum vào core: bắt buộc `mvn install -pl filesharing-core` trước khi build filehandler (`.claude/rules/backend-core.md`).

### 1.2 Hai enum

```java
package com.file.service.filesharing.core.enums;

public enum UploadSessionStatus {
    INITIATED, UPLOADING, COMPLETED, ABORTED, EXPIRED
}
```

```java
package com.file.service.filesharing.core.enums;

public enum UploadMode {
    SINGLE, MULTIPART
}
```

### 1.3 Entity — bảng field

Collection: **`upload_sessions`**.

| Field Java | Kiểu Java chính xác | Nullable | Annotation | Mô tả |
|---|---|---|---|---|
| `sessionId` | `String` | Không | `@Id` | UUID v4 sinh bằng `UUID.randomUUID().toString()`; là `_id` của document |
| `ownerId` | `String` | Không | `@Indexed` | `UserEntity.userId` của người khởi tạo; nguồn chân lý cho kiểm quyền E2–E5 |
| `assetId` | `String` | Không | — | `AssetEntity.assetId` |
| `metadataId` | `String` | Không | — | `MetadataEntity.fileId` của version tương ứng |
| `objectName` | `String` | Không | — | Object key server sinh (`AssetServiceImpl.generateObjectName`); **client không bao giờ gửi lên** |
| `uploadId` | `String` | **Có** | — | S3 multipart uploadId; `null` khi `uploadMode = SINGLE`; **không bao giờ trả về client** |
| `declaredSize` | `long` | Không | — | Size client khai tại E1; `> 0` và `<= upload.max-file-size` |
| `partSize` | `long` | Không | — | Cố định cho cả session, một trong `{8388608, 16777216, 33554432, 67108864}`; `uploadMode = SINGLE` → `= declaredSize` |
| `partCount` | `int` | Không | — | `= ceil(declaredSize / partSize)`; `uploadMode = SINGLE` → `1` |
| `partMd5` | `Map<Integer, String>` | Có | — | MD5 hex client khai tại E4, key = `partNumber`; ghi trước khi verify, giữ để đối soát |
| `status` | `UploadSessionStatus` | Không | — | `INITIATED` \| `UPLOADING` \| `COMPLETED` \| `ABORTED` \| `EXPIRED` |
| `createdAt` | `Instant` | Không | — | Set thủ công trong service (**không** dùng `@CreatedDate` — entity này không nằm trong luồng audit) |
| `expiresAt` | `Instant` | Không | `@Indexed(name = "idx_upload_sessions_ttl", expireAfterSeconds = 172800)` | **Hết hạn logic** (sliding). Xem §1.5 về ngữ nghĩa TTL index |
| `hardExpiresAt` | `Instant` | Không | — | `= createdAt + 7 ngày`; sliding không bao giờ vượt mốc này |
| `completedAt` | `Instant` | Có | — | Thời điểm session chuyển sang **trạng thái kết thúc**: `COMPLETED` (E4) hoặc `ABORTED` (E5) |
| `resultEtag` | `String` | Có | — | ETag object sau `CompleteMultipartUpload`; phục vụ response idempotent của E4 |

Danh sách field trên là **đóng** — đúng 16 field theo WP2 của `../03_detailed_design.md`. Hai giá trị mà API cần nhưng **không** phải field mới:

| Giá trị API | Cách suy ra | Ghi ở |
|---|---|---|
| `uploadMode` (E1, E3) | `session.uploadId == null ? UploadMode.SINGLE : UploadMode.MULTIPART` | Tính trong `UploadSessionServiceImpl`, không persist |
| `abortedAt` (E5) | `session.completedAt` (đã set khi chuyển sang `ABORTED`) | Nhờ vậy gọi E5 lần 2 trả đúng timestamp lần đầu |

> **CẦN USER DUYỆT:** cách hiểu "`completedAt` = mốc kết thúc chung (COMPLETED hoặc ABORTED)" là suy diễn của tài liệu này. Phương án thay thế nếu user không đồng ý: thêm field thứ 17 `abortedAt: Instant`. Không được để E5 trả `Instant.now()` không persist — sẽ phá tính idempotent của timestamp.

### 1.4 Khung entity (chỉ cấu trúc, không logic)

```java
package org.example.filesharing.entities.models;

import com.file.service.filesharing.core.enums.UploadSessionStatus;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

@Document(collection = "upload_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class UploadSessionEntity {

    @Id
    private String sessionId;

    @Indexed(name = "idx_upload_sessions_owner")
    private String ownerId;

    private String assetId;
    private String metadataId;
    private String objectName;
    private String uploadId;

    private long declaredSize;
    private long partSize;
    private int partCount;

    private Map<Integer, String> partMd5;

    private UploadSessionStatus status;

    private Instant createdAt;

    @Indexed(name = "idx_upload_sessions_ttl", expireAfterSeconds = 172800)
    private Instant expiresAt;

    private Instant hardExpiresAt;
    private Instant completedAt;
    private String resultEtag;
}
```

Lưu ý kỹ thuật về `Map<Integer, String> partMd5`: MongoDB chỉ nhận field name kiểu chuỗi. Spring Data ghi key `1` thành `"1"` và đọc ngược lại thành `Integer` vì kiểu generic đã khai báo — không cần converter thủ công. Document lưu trên đĩa có dạng `"partMd5": {"1": "9b2cf5...", "2": "1c7e4a..."}`.

### 1.5 ADR — TTL index đặt trên `expiresAt` với 48h grace

`../03_detailed_design.md` mô tả hai điều tưởng như mâu thuẫn: WP2 nói "TTL index trên `expiresAt`, `expireAfterSeconds = 0`", còn bảng Rủi ro nói "`expiresAt` (TTL index) đặt = thời điểm hết hạn **+ 48h grace**; GC job dùng field hết hạn logic riêng".

**Quyết định:** giữ đúng 16 field (không thêm field hết hạn thứ hai), đặt TTL index trên `expiresAt` với **`expireAfterSeconds = 172800`** (48 giờ).

Hệ quả:

| Mốc | Việc xảy ra |
|---|---|
| `expiresAt` | Session **chết logic**. E2–E5 trả 404 `SESSION_NOT_FOUND`. `UploadSessionGcJob` (chu kỳ 15 phút) quét `expiresAt < now AND status IN (INITIATED, UPLOADING)` → `AbortMultipartUpload` + `status = EXPIRED` + `MetadataEntity.status = FAILED` |
| `expiresAt + 48h` | MongoDB **xoá document vật lý** bằng TTL monitor |

Cửa sổ 48 giờ đủ để GC job (15 phút/lần) dọn multipart trên MinIO trước khi mất dấu vết session — vá đúng rủi ro "TTL index xoá session trước khi GC job kịp abort".

---

## 2. Index

### 2.1 Danh sách index chốt

| Tên index | Key | Tuỳ chọn | Phục vụ |
|---|---|---|---|
| `idx_upload_sessions_ttl` | `{ expiresAt: 1 }` | `expireAfterSeconds: 172800` | Xoá vật lý sau 48h grace (§1.5) |
| `idx_upload_sessions_owner_status` | `{ ownerId: 1, status: 1 }` | — | Đếm session đang mở/user (SEC-08, nhánh 429 của E1); liệt kê session của user |
| `idx_upload_sessions_status_expires` | `{ status: 1, expiresAt: 1 }` | — | `UploadSessionGcJob` quét session hết hạn còn sống |
| `idx_upload_sessions_upload_id` | `{ uploadId: 1 }` | `sparse: true` | `UploadReconcileJob` đối chiếu `ListMultipartUploads` ↔ session (bỏ qua session `SINGLE` có `uploadId = null`) |

`idx_upload_sessions_owner` do `@Indexed` trên `ownerId` sinh ra là **thừa** khi đã có `idx_upload_sessions_owner_status` (prefix trùng). Giữ annotation `@Indexed` trên `ownerId` chỉ để tài liệu hoá; **không** tạo index rời này ở tầng vận hành.

### 2.2 mongosh — lệnh nguyên văn

Chạy một lần trên môi trường đích (`mongosh "mongodb://admin:admin123456@localhost:27017/metadata?authSource=admin"`):

```javascript
db.upload_sessions.createIndex(
  { expiresAt: 1 },
  { name: "idx_upload_sessions_ttl", expireAfterSeconds: 172800 }
);

db.upload_sessions.createIndex(
  { ownerId: 1, status: 1 },
  { name: "idx_upload_sessions_owner_status" }
);

db.upload_sessions.createIndex(
  { status: 1, expiresAt: 1 },
  { name: "idx_upload_sessions_status_expires" }
);

db.upload_sessions.createIndex(
  { uploadId: 1 },
  { name: "idx_upload_sessions_upload_id", sparse: true }
);
```

Kiểm tra:

```javascript
db.upload_sessions.getIndexes();
```

Đổi thời gian grace về sau (không cần drop index):

```javascript
db.runCommand({
  collMod: "upload_sessions",
  index: { name: "idx_upload_sessions_ttl", expireAfterSeconds: 172800 }
});
```

### 2.3 Tạo index từ code — cách bắt buộc dùng

**Cảnh báo:** repo hiện **không** set `spring.data.mongodb.auto-index-creation`, mà Spring Boot 3 mặc định `false`. Do đó `@Indexed`/`@Document` **KHÔNG** tự tạo index nào. Toàn repo hiện chưa có bất kỳ `@Indexed` nào — bật `auto-index-creation: true` sẽ áp dụng cho **mọi** entity trong core lẫn filehandler và tạo ra index ngoài dự tính. **Không bật flag này.**

Thay vào đó, tạo index tường minh khi ứng dụng khởi động, đặt tại `server/filesharing-filehandler/src/main/java/org/example/filesharing/configurations/UploadSessionIndexInitializer.java`:

```java
@Configuration
@RequiredArgsConstructor
public class UploadSessionIndexInitializer {

    private final MongoTemplate mongoTemplate;

    @PostConstruct
    public void ensureIndexes() {
        IndexOperations ops = mongoTemplate.indexOps(UploadSessionEntity.class);

        ops.ensureIndex(new Index()
                .on("expiresAt", Sort.Direction.ASC)
                .named("idx_upload_sessions_ttl")
                .expire(172800, TimeUnit.SECONDS));

        ops.ensureIndex(new Index()
                .on("ownerId", Sort.Direction.ASC)
                .on("status", Sort.Direction.ASC)
                .named("idx_upload_sessions_owner_status"));

        ops.ensureIndex(new Index()
                .on("status", Sort.Direction.ASC)
                .on("expiresAt", Sort.Direction.ASC)
                .named("idx_upload_sessions_status_expires"));

        ops.ensureIndex(new Index()
                .on("uploadId", Sort.Direction.ASC)
                .named("idx_upload_sessions_upload_id")
                .sparse());
    }
}
```

Import cần dùng: `org.springframework.data.mongodb.core.MongoTemplate`, `org.springframework.data.mongodb.core.index.Index`, `org.springframework.data.mongodb.core.index.IndexOperations`, `org.springframework.data.domain.Sort`, `jakarta.annotation.PostConstruct`, `java.util.concurrent.TimeUnit`.

`ensureIndex` là thao tác idempotent — chạy lại khi app restart không gây lỗi, miễn là định nghĩa không đổi. Khi cần đổi `expireAfterSeconds`, dùng `collMod` ở §2.2 (tạo lại với cùng tên nhưng khác option sẽ lỗi `IndexOptionsConflict`).

---

## 3. `application.yml` — toàn bộ key mới

Dán nguyên khối dưới đây vào `server/filesharing-filehandler/src/main/resources/application.yml`, đặt **sau** block `minio:` hiện có (block `upload:` là top-level, ngang hàng `minio:`):

```yaml
minio:
  svc-upload:
    access-key: ${MINIO_SVC_UPLOAD_ACCESS_KEY:svcuploadfsharing}
    secret-key: ${MINIO_SVC_UPLOAD_SECRET_KEY:ChangeMe_UploadSecret_2026}
  svc-download:
    access-key: ${MINIO_SVC_DOWNLOAD_ACCESS_KEY:svcdownloadfsharing}
    secret-key: ${MINIO_SVC_DOWNLOAD_SECRET_KEY:ChangeMe_DownloadSecret_2026}

upload:
  max-file-size: 53687091200
  part-url-ttl: 900s
  max-threads: 6
  session-idle-ttl: 86400s
  max-sessions-per-user: 20
  verify-etag-md5: true
```

> `minio.svc-upload.*` và `minio.svc-download.*` nằm dưới prefix `minio` nhưng **không** phá `MinIOProperties` (core, `@ConfigurationProperties(prefix = "minio")`): Spring Boot mặc định `ignoreUnknownFields = true` nên key lạ dưới prefix bị bỏ qua. `minio.endpoint` và `minio.buckets.files` hiện có được tái sử dụng cho `S3Client`/`S3Presigner`, **không** khai lại.

| Key | Kiểu bind | Mặc định | Giải thích (1 dòng) |
|---|---|---|---|
| `minio.svc-upload.access-key` | `String` | `svcuploadfsharing` | Access key service account chỉ có quyền multipart-write bucket files (SEC-01) |
| `minio.svc-upload.secret-key` | `String` | `ChangeMe_UploadSecret_2026` | Secret tương ứng — ký presigned PUT part và mọi call control-plane multipart |
| `minio.svc-download.access-key` | `String` | `svcdownloadfsharing` | Access key service account chỉ có quyền `s3:GetObject` |
| `minio.svc-download.secret-key` | `String` | `ChangeMe_DownloadSecret_2026` | Secret tương ứng — ký presigned GET của E6 |
| `upload.max-file-size` | `long` | `53687091200` (50 GiB) | Trần size khai báo tại E1; vượt → 400 kèm giới hạn |
| `upload.part-url-ttl` | `Duration` | `900s` (15 phút) | TTL đồng nhất của mọi presigned part URL; là `urlExpiresAt` trả về client |
| `upload.max-threads` | `int` | `6` | Trần luồng upload song song client dùng (HTTP/1.1 ~6 kết nối/host) — server công bố, client tuân theo |
| `upload.session-idle-ttl` | `Duration` | `86400s` (24 giờ) | Bước trượt TTL: `expiresAt = min(now + idleTtl, hardExpiresAt)` mỗi lần E2/E3 |
| `upload.max-sessions-per-user` | `int` | `20` | Số session `INITIATED`/`UPLOADING` tối đa mỗi user; vượt → 429 tại E1 (SEC-08) |
| `upload.verify-etag-md5` | `boolean` | `true` | Bật so `ETag == md5` tại E4; tắt khi MinIO bật SSE-KMS (khi đó ETag ≠ MD5) |

Giá trị `Duration` **phải** giữ hậu tố `s`. Viết `900` trần trụi sẽ được Spring hiểu là 900 **mili giây**.

### 3.1 Lớp binding

`server/filesharing-filehandler/src/main/java/org/example/filesharing/configurations/UploadProperties.java`:

```java
@ConfigurationProperties(prefix = "upload")
@Data
public class UploadProperties {
    private long maxFileSize = 53687091200L;
    private Duration partUrlTtl = Duration.ofSeconds(900);
    private int maxThreads = 6;
    private Duration sessionIdleTtl = Duration.ofSeconds(86400);
    private int maxSessionsPerUser = 20;
    private boolean verifyEtagMd5 = true;
}
```

Kích hoạt bằng `@EnableConfigurationProperties(UploadProperties.class)` trên lớp config của filehandler.

Hai bộ key MinIO đọc bằng `@Value` (đúng cách `MinIoServiceImpl` đang đọc `minio.buckets.files`), không tạo thêm `@ConfigurationProperties` dưới prefix `minio` để tránh đụng `MinIOProperties` của core:

```java
@Value("${minio.endpoint}")            private String minioEndpoint;
@Value("${minio.buckets.files}")       private String filesBucket;
@Value("${minio.svc-upload.access-key}")     private String svcUploadAccessKey;
@Value("${minio.svc-upload.secret-key}")     private String svcUploadSecretKey;
@Value("${minio.svc-download.access-key}")   private String svcDownloadAccessKey;
@Value("${minio.svc-download.secret-key}")   private String svcDownloadSecretKey;
```

### 3.2 Hằng số KHÔNG đưa vào config

`INITIAL_URL_BATCH_SIZE = 20`, `MAX_URL_BATCH_SIZE = 50`, `SMALL_FILE_THRESHOLD = 8388608`, trần cứng session `7 ngày`, grace TTL `48 giờ`, `PART_SIZE_STEPS`, TTL download `900..14400s` — khai báo là `private static final` trong lớp service tương ứng. Giá trị chuẩn xem `01_api_contract.md` §0.5.

---

## 4. Script hạ tầng MinIO

### 4.1 Bối cảnh thật (đã đọc từ repo)

| Mục | Giá trị thật | Nguồn |
|---|---|---|
| Bucket gốc | **`file-sharing`** | `application.yml` → `minio.buckets.files`; `init-bucket.sh` → `BUCKET_NAMES` |
| Bucket khác | `thumbnail-bucket`, `image-preview-bucket`, `hls-bucket` | `init-bucket.sh` |
| Alias mc | `myminio` | `init-bucket.sh` → `ALIAS_NAME` |
| Endpoint trong container | `http://minio:9000` | `init-bucket.sh` → `MINIO_HOST` |
| Endpoint từ host | `http://localhost:9000` | `docker-compose.yml` port mapping |
| Credential root | `${MINIO_ROOT_USER}` / `${MINIO_ROOT_PASSWORD}` từ `.env` | `docker-compose.yml` service `minio` và `mc` |
| Container chạy mc | `minio-mc` (image `minio/mc:latest`), mount `./scripts` | `docker-compose.yml` service `mc` |

> **Khác biệt tài liệu ↔ hệ thống thật:** `../03_detailed_design.md` gọi bucket là `files` và viết ARN `arn:aws:s3:::files/*`. Bucket thật tên **`file-sharing`**. Script dưới đây dùng biến `BUCKET_FILES` mặc định `file-sharing` để chạy được ngay; nếu đổi tên bucket phải đổi cả `minio.buckets.files` trong `application.yml`.

### 4.2 File script

Đặt tại: **`server/dockers/scripts/init-upload-hardening.sh`** (cùng thư mục `init-bucket.sh` đã được mount vào container `minio-mc`).

Chạy từ host (cần `mc` cài sẵn):

```bash
MINIO_HOST=http://localhost:9000 \
MINIO_ROOT_USER=<root-user> \
MINIO_ROOT_PASSWORD=<root-password> \
sh server/dockers/scripts/init-upload-hardening.sh
```

Chạy trong container:

```bash
docker exec -e MINIO_HOST=http://minio:9000 minio-mc sh /scripts/init-upload-hardening.sh
```

```sh
#!/bin/sh
set -e

MINIO_HOST="${MINIO_HOST:-http://minio:9000}"
ALIAS_NAME="${ALIAS_NAME:-myminio}"
BUCKET_FILES="${BUCKET_FILES:-file-sharing}"

SVC_UPLOAD_ACCESS_KEY="${MINIO_SVC_UPLOAD_ACCESS_KEY:-svcuploadfsharing}"
SVC_UPLOAD_SECRET_KEY="${MINIO_SVC_UPLOAD_SECRET_KEY:-ChangeMe_UploadSecret_2026}"
SVC_DOWNLOAD_ACCESS_KEY="${MINIO_SVC_DOWNLOAD_ACCESS_KEY:-svcdownloadfsharing}"
SVC_DOWNLOAD_SECRET_KEY="${MINIO_SVC_DOWNLOAD_SECRET_KEY:-ChangeMe_DownloadSecret_2026}"

echo "============================================"
echo "  MinIO Upload Hardening (WP1)"
echo "  host=${MINIO_HOST} bucket=${BUCKET_FILES}"
echo "============================================"

# ---------- 1. Alias ----------
echo "[1/5] mc alias set"
mc alias set "${ALIAS_NAME}" "${MINIO_HOST}" "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}"

# ---------- 2. Policy JSON ----------
echo "[2/5] Sinh policy JSON"

cat > /tmp/svc-upload-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "MultipartWrite",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:AbortMultipartUpload",
        "s3:ListMultipartUploadParts"
      ],
      "Resource": ["arn:aws:s3:::${BUCKET_FILES}/*"]
    },
    {
      "Sid": "StatAndReconcile",
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::${BUCKET_FILES}/*"]
    },
    {
      "Sid": "ListIncompleteUploads",
      "Effect": "Allow",
      "Action": ["s3:ListBucketMultipartUploads"],
      "Resource": ["arn:aws:s3:::${BUCKET_FILES}"]
    }
  ]
}
EOF

cat > /tmp/svc-download-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ReadOnly",
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::${BUCKET_FILES}/*"]
    }
  ]
}
EOF

# ---------- 3. Service accounts ----------
echo "[3/5] Tạo service account svc-upload"
if mc admin user svcacct info "${ALIAS_NAME}" "${SVC_UPLOAD_ACCESS_KEY}" >/dev/null 2>&1; then
    echo "      svc-upload đã tồn tại — cập nhật policy"
    mc admin user svcacct edit "${ALIAS_NAME}" "${SVC_UPLOAD_ACCESS_KEY}" \
        --policy /tmp/svc-upload-policy.json
else
    mc admin user svcacct add "${ALIAS_NAME}" "${MINIO_ROOT_USER}" \
        --access-key "${SVC_UPLOAD_ACCESS_KEY}" \
        --secret-key "${SVC_UPLOAD_SECRET_KEY}" \
        --policy /tmp/svc-upload-policy.json
fi

echo "      Tạo service account svc-download"
if mc admin user svcacct info "${ALIAS_NAME}" "${SVC_DOWNLOAD_ACCESS_KEY}" >/dev/null 2>&1; then
    echo "      svc-download đã tồn tại — cập nhật policy"
    mc admin user svcacct edit "${ALIAS_NAME}" "${SVC_DOWNLOAD_ACCESS_KEY}" \
        --policy /tmp/svc-download-policy.json
else
    mc admin user svcacct add "${ALIAS_NAME}" "${MINIO_ROOT_USER}" \
        --access-key "${SVC_DOWNLOAD_ACCESS_KEY}" \
        --secret-key "${SVC_DOWNLOAD_SECRET_KEY}" \
        --policy /tmp/svc-download-policy.json
fi

# ---------- 4. Lifecycle rule ----------
echo "[4/5] Lifecycle: abort incomplete multipart sau 7 ngày"

cat > /tmp/lifecycle-files.json <<EOF
{
  "Rules": [
    {
      "ID": "abort-incomplete-multipart-7d",
      "Status": "Enabled",
      "Filter": { "Prefix": "" },
      "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 7 }
    }
  ]
}
EOF

mc ilm import "${ALIAS_NAME}/${BUCKET_FILES}" < /tmp/lifecycle-files.json

# ---------- 5. Verify ----------
echo "[5/5] Verify"
echo "--- ilm rule ls ---"
mc ilm rule ls "${ALIAS_NAME}/${BUCKET_FILES}"
echo "--- svcacct ls ---"
mc admin user svcacct ls "${ALIAS_NAME}" "${MINIO_ROOT_USER}"

rm -f /tmp/svc-upload-policy.json /tmp/svc-download-policy.json /tmp/lifecycle-files.json

echo "============================================"
echo "  Hoàn tất. Ghi 4 giá trị sau vào .env / application.yml:"
echo "    MINIO_SVC_UPLOAD_ACCESS_KEY=${SVC_UPLOAD_ACCESS_KEY}"
echo "    MINIO_SVC_UPLOAD_SECRET_KEY=<đã set>"
echo "    MINIO_SVC_DOWNLOAD_ACCESS_KEY=${SVC_DOWNLOAD_ACCESS_KEY}"
echo "    MINIO_SVC_DOWNLOAD_SECRET_KEY=<đã set>"
echo "============================================"

exit 0
```

### 4.3 Hai điểm PHÁT SINH cần user duyệt

**(a) Statement `StatAndReconcile` + `ListIncompleteUploads` trong policy `svc-upload`.** WP1 của `../03_detailed_design.md` chỉ liệt kê 3 action (`s3:PutObject`, `s3:AbortMultipartUpload`, `s3:ListMultipartUploadParts`). Nhưng WP3 yêu cầu `HeadObject` sau commit (cần `s3:GetObject`) và WP6 tầng 3 yêu cầu `ListMultipartUploads` trên bucket (cần `s3:ListBucketMultipartUploads`). Thiếu hai action này thì E4 và `UploadReconcileJob` sẽ nhận `AccessDenied` lúc chạy thật.
Phương án thay thế nếu user muốn giữ policy tối thiểu đúng WP1: xoá hai statement đó và giao `HeadObject` cho `downloadPresigner`/`S3Client` ký bằng key `svc-download`, còn `ListMultipartUploads` cho một client dùng root key chỉ dành riêng cho job đối soát. Quyết định phải được ghi lại trước khi implement.

**(b) Cú pháp lifecycle rule.** Yêu cầu gốc ghi `mc ilm rule add ... --expire-abort-incomplete-multipart-upload 7d`. Script trên dùng `mc ilm import` với JSON `AbortIncompleteMultipartUpload.DaysAfterInitiation = 7` vì đây là dạng chuẩn S3, độc lập phiên bản `mc`. Trước khi chốt, chạy `mc ilm rule add --help` trên image `minio/mc:latest` đang dùng: nếu flag `--expire-abort-incomplete-multipart-upload` tồn tại thì có thể thay bước 4 bằng một dòng
`mc ilm rule add "${ALIAS_NAME}/${BUCKET_FILES}" --expire-abort-incomplete-multipart-upload 7d`
— kết quả tương đương, `mc ilm rule ls` verify được cả hai cách.

Lưới an toàn bổ sung ở tầng server (không thay thế lifecycle rule):
`mc admin config set "${ALIAS_NAME}" api stale_uploads_expiry=168h stale_uploads_cleanup_interval=6h`

### 4.4 Điều KHÔNG làm trong script này

- Không đụng `init-bucket.sh` (tạo bucket + set public `thumbnail-bucket`) — hai script chạy độc lập, `init-upload-hardening.sh` chạy **sau**.
- Không thu hồi root key: workers (`imagecodec`, `videocodec`) vẫn dùng key hiện có; tách credential cho worker nằm ngoài phạm vi phase.
- Không đổi policy `thumbnail-bucket` (SEC-10 thuộc phase sau).

---

## 5. AWS SDK v2 — dependency và bean config

### 5.1 Maven

`server/pom.xml` — thêm property và BOM vào `dependencyManagement` (đúng cách repo đang quản version tập trung):

```xml
<properties>
    <aws.sdk.version>2.31.78</aws.sdk.version>
</properties>
```

```xml
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>bom</artifactId>
    <version>${aws.sdk.version}</version>
    <type>pom</type>
    <scope>import</scope>
</dependency>
```

`server/filesharing-filehandler/pom.xml` — thêm vào `<dependencies>` (không ghi version, lấy từ BOM):

```xml
<dependency>
    <groupId>software.amazon.awssdk</groupId>
    <artifactId>s3</artifactId>
</dependency>
```

Ghi chú:
- Artifact `s3` đã bao gồm `S3Presigner` và HTTP client đồng bộ mặc định (`apache-client`) — **không** cần thêm dependency nào khác.
- `2.31.78` là mốc tham chiếu; chốt lại version cụ thể tại thời điểm build và ghim vào property. Mọi API dùng trong phase này (`createMultipartUpload`, `listParts`, `completeMultipartUpload`, `abortMultipartUpload`, `headObject`, `listMultipartUploads`, `presignUploadPart`, `presignGetObject`) ổn định từ 2.20 trở đi.
- `io.minio:minio` **giữ nguyên** trong pom: `MinIoServiceImpl` còn dùng cho `uploadSmallFile`, `deleteFile`, HLS (WP3 chỉ chuyển phần multipart).

### 5.2 Bean config

Đặt tại `server/filesharing-filehandler/src/main/java/org/example/filesharing/configurations/S3StorageConfig.java`. Chỉ cấu hình, không chứa logic nghiệp vụ:

```java
@Configuration
public class S3StorageConfig {

    private static final Region S3_REGION = Region.US_EAST_1;

    @Value("${minio.endpoint}")                 private String endpoint;
    @Value("${minio.svc-upload.access-key}")    private String uploadAccessKey;
    @Value("${minio.svc-upload.secret-key}")    private String uploadSecretKey;
    @Value("${minio.svc-download.access-key}")  private String downloadAccessKey;
    @Value("${minio.svc-download.secret-key}")  private String downloadSecretKey;

    /** Control plane: createMultipartUpload / listParts / completeMultipartUpload
     *  / abortMultipartUpload / headObject / listMultipartUploads — ký bằng svc-upload. */
    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(S3_REGION)
                .forcePathStyle(true)
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(uploadAccessKey, uploadSecretKey)))
                .build();
    }

    /** Presign PUT part (E1, E2) — svc-upload. */
    @Bean("uploadPresigner")
    public S3Presigner uploadPresigner() {
        return S3Presigner.builder()
                .endpointOverride(URI.create(endpoint))
                .region(S3_REGION)
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build())
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(uploadAccessKey, uploadSecretKey)))
                .build();
    }

    /** Presign GET (E6) — svc-download. */
    @Bean("downloadPresigner")
    public S3Presigner downloadPresigner() {
        return S3Presigner.builder()
                .endpointOverride(URI.create(endpoint))
                .region(S3_REGION)
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build())
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(downloadAccessKey, downloadSecretKey)))
                .build();
    }
}
```

Import: `software.amazon.awssdk.regions.Region`, `software.amazon.awssdk.services.s3.S3Client`, `software.amazon.awssdk.services.s3.S3Configuration`, `software.amazon.awssdk.services.s3.presigner.S3Presigner`, `software.amazon.awssdk.auth.credentials.AwsBasicCredentials`, `software.amazon.awssdk.auth.credentials.StaticCredentialsProvider`, `java.net.URI`.

Ràng buộc bắt buộc khi inject: hai bean cùng kiểu `S3Presigner` → **luôn** dùng `@Qualifier("uploadPresigner")` / `@Qualifier("downloadPresigner")` ở nơi tiêm, nếu không Spring báo `NoUniqueBeanDefinitionException`.

Hai lưu ý quyết định hành vi, ghi ở đây để không lặp lại trong code review:

1. **Không** set `contentMD5(...)` trên `UploadPartRequest` lúc presign. Server không biết MD5 tại thời điểm ký; nếu set, `Content-MD5` sẽ vào `SignedHeaders` và mọi PUT của client sẽ hỏng chữ ký. Client gửi `Content-MD5` như header không ký — MinIO vẫn verify và trả `BadDigest` (SEC-06).
2. Interface `StorageService` + `S3StorageServiceImpl` (WP3) nhận `sessionId`-centric tham số; **không** nhận `objectName`/`uploadId` từ tầng controller.

### 5.3 Code bị xoá cùng WP3 (nhắc lại để không sót — cập nhật theo quyết định user 2026-09-01)

`MinIoServiceImpl`: **XOÁ NGAY Ở WP3** các helper `calculateExpireTime`, `extractUploadIdFromXml`, `buildCompleteMultipartUploadXml`, field `OkHttpClient httpClient`, hằng `CHUNK_SIZE`. Bốn method multipart (`initiateMultipartUpload`, `getPresignedUrlForPart`, `completeMultipartUpload`, `abortMultipartUpload`) **KHÔNG xoá** mà **rewire thành adapter** gọi `StorageService` (TTL part URL đồng nhất `clamp(partCount × 60s, 1h, 6h)`) — chúng còn phục vụ E7 tới phase gỡ E7; hợp đồng E7 giữ nguyên (xem `01_api_contract.md` §E7, task `T-3.6`). Luồng mới (E1–E6) không được gọi vào các method adapter này.

---

## 6. Tương thích ngược của dữ liệu cũ

### 6.1 `MetadataEntity` có `uploadId` nhưng không có `UploadSession`

Đây là toàn bộ dữ liệu tạo trước phase (mọi document `metadata` hiện có).

| Thành phần | Hành vi bắt buộc |
|---|---|
| `UploadSessionGcJob` (15 phút) | Chỉ quét collection `upload_sessions`. **Không** quét `metadata`. Metadata cũ không có session → job không bao giờ chạm tới, không bị đánh `FAILED` oan |
| `UploadReconcileJob` (24 giờ) | `ListMultipartUploads` trên bucket → multipart **không** có session tương ứng (`uploadId` không tìm thấy trong `upload_sessions`) = "mồ côi". Chỉ abort mồ côi có `Initiated < now − 24h`, để không giết multipart legacy đang chạy dở của client cũ. Ghi log `WARN` kèm `uploadId` + `objectName` mỗi lần abort |
| MinIO ILM | Là tầng dọn duy nhất cho phần rác legacy còn lại (7 ngày, §4.2) |
| E2–E5 | Không có đường nào truy cập được multipart legacy (không có `sessionId`) → client cũ bắt buộc dùng E7 |

### 6.2 `fileSize`: `Double` → `long`

Phạm vi đổi kiểu (R5/REL-04): `MetadataEntity.fileSize`, `MetadataDTO.fileSize`, `AssetCreateRequestDto.fileSize`, `DownloadFileResponseDto.fileSize`, chữ ký `MinIoService.initiateMultipartUpload(String, Double)` và `getPresignedDownloadUrl(DownloadFileRequestDto, Double)`, cùng mọi chỗ gọi.

**Quy tắc chốt:**

| Nơi | Kiểu chốt | Lý do |
|---|---|---|
| `MetadataEntity.fileSize` | `Long` (wrapper) | Document cũ có thể thiếu field hoặc null; primitive `long` sẽ âm thầm thành `0` và làm hỏng công thức TTL download / partCount |
| `UploadSessionEntity.declaredSize`, `partSize` | `long` (primitive) | Collection mới, luôn được set ở E1 |
| DTO request/response API | `Long` | Cho phép phân biệt "không gửi" với `0` khi validate (`fileSize is required`) |
| Biến cục bộ, tham số service | `long` | Tính toán không cần nullable |

**Chiến lược đọc dữ liệu cũ:**

1. **Không cần migration để đọc.** Document cũ lưu `fileSize` là BSON `double` (ví dụ `1073741824.0`). Spring Data MongoDB dùng `ConversionService` (`NumberToNumberConverterFactory`) chuyển `Double → Long` tự động khi kiểu property là `Long`. Không cần custom converter.
2. **Rủi ro mất chính xác:** `double` chỉ biểu diễn nguyên chính xác tới 2^53 byte (~9 PB) → với `max-file-size` 50 GiB, mọi giá trị cũ đều nguyên vẹn sau khi ép kiểu.
3. **Migration một lần (khuyến nghị, làm cùng bước rollout WP7)** để mọi document về đúng `long`, tránh index/aggregation lệch kiểu:

```javascript
db.metadata.updateMany(
  { fileSize: { $type: "double" } },
  [ { $set: { fileSize: { $toLong: "$fileSize" } } } ]
);
```

4. **Kiểm tra sau migration** (phải trả về `0`):

```javascript
db.metadata.countDocuments({ fileSize: { $type: "double" } });
```

5. **Document thiếu `fileSize`** (`null`): giữ nguyên, không backfill. Luồng đọc phải coi `null` là "không rõ size" — E6 với metadata thiếu `fileSize` dùng `HeadObject` để lấy size thật thay vì mặc định `0`.
6. **`MetadataEntity.timeToLive`** (`int`, mặc định `Integer.MAX_VALUE`, hiện là field chết — S7): **không** đụng trong phase này. Vòng đời staging do `upload_sessions` quản; gỡ field khi phase sau dọn legacy.

### 6.3 Bảng tổng hợp thay đổi schema

| Collection | Thay đổi | Migration cần thiết |
|---|---|---|
| `upload_sessions` | **Tạo mới** + 4 index (§2) | Chạy §2.2 hoặc để `UploadSessionIndexInitializer` tạo lúc khởi động |
| `metadata` | `fileSize` `Double → Long`; `uploadId` giữ nguyên (chỉ còn phục vụ dữ liệu cũ + E7) | Script `$toLong` ở §6.2 (tuỳ chọn nhưng khuyến nghị) |
| `assets` | Không đổi | Không |
