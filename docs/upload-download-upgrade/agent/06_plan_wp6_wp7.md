# 06 — Kế hoạch triển khai phần còn lại (đóng WP5 → WP6 → WP7)

> **TRẠNG THÁI 2026-09-09 — ĐÃ THỰC THI.** C1–C4 chốt **phương án A** cho cả bốn. WP6 ☑ (4/4 DoD), WP7 ☑ (6/6 DoD) — kết quả thật ghi ở `04_verification.md` §5.8 + §5.9.
> Còn lại: **W5.G** (nghiệm thu WP5 trên trình duyệt — F1…F6, cần thao tác tay) và **W7.7 bước 2** (đã chốt ghi thành nợ **N9**, đóng cùng phase gỡ E7).

> **Vai trò tài liệu:** kế hoạch thực thi cho phần **chưa** triển khai của phase Upload/Download v2, dựng trên `03_tasks.md` (T-5.6, T-6.1 → T-7.8) và trạng thái thật ghi ở `04_verification.md` §5.
> **Không thay thế** `03_tasks.md` — mỗi bước dưới đây ánh xạ 1-1 sang một task gốc, bổ sung 3 thứ mà bản gốc chưa có: (a) DoD riêng cho từng bước, (b) context verify (đọc trước + lệnh + kết quả kỳ vọng), (c) 4 điểm chặn mới phát hiện khi rà mã nguồn ngày 2026-09-09.
> Ngày lập: 2026-09-09 · Nhánh: `web-flux` · Gốc repo: `E:\DaiCuongBK\Project3\FileSharing\`

---

## 1. Trạng thái xuất phát (đọc từ `04_verification.md` §5 + mã nguồn thật)

| WP | Trạng thái | Ghi chú |
|---|---|---|
| WP0–WP4 | ☑ Xong, DoD xanh | WP1 có 1 sai lệch đã duyệt: ILM rule → `stale_uploads_expiry=168h` (§5.3) |
| WP5 | ◐ **Code xong, nghiệm thu dở** | 2/6 mục DoD xanh (build/lint, quét `console.log`); 4/6 mục cần trình duyệt thật: F1, F2+F3, F4, F5, F6 |
| WP6 | ☐ Chưa bắt đầu | 0/4 task |
| WP7 | ☐ Chưa bắt đầu | 0/8 task |

Xác minh trực tiếp trên mã nguồn (2026-09-09):

```
grep -rn "EnableScheduling" server/filesharing-filehandler/src/main/java/   -> 0 kết quả
ls  server/.../org/example/filesharing/jobs/                                 -> chỉ có consumer/, kafka/ (chưa có scheduled/)
UploadSessionRepo.java                                                       -> rỗng (chưa có query method nào)
StorageService.java                                                          -> 7 method, KHÔNG có listMultipartUploads
MetadataEntity.java:39                                                       -> private Double fileSize;
FileMetadataController.java                                                  -> 0 dòng @Deprecated
client/src/service/uploadService.ts:340                                      -> const objectName = uuidv4() + '_' + file.name;
application.yml block upload:                                                -> đủ 6 key WP2/WP7, THIẾU 2 key chu kỳ job
MongoIndexBootstrapConfig.java:218-234                                       -> đủ 4 index upload_sessions (TTL 172800, owner_status, status_expires, upload_id sparse)
MetadataService.java                                                         -> đã có markUploadFailed(metadataId) từ WP4 (GC job dùng lại, không cần sửa)
```

Kết luận: mọi tiền đề của WP6/WP7 đã sẵn sàng **trừ** 4 điểm chặn ở §2.

---

## 2. Bốn điểm chặn phải xử lý TRƯỚC khi gõ code

Ba trong bốn điểm là **stop condition** theo `00_guardrails.md` §4.6 ("muốn chạm file ngoài whitelist §3") — không được tự quyết.

### C1 — `StorageService` thiếu `listMultipartUploads` (chặn W6.4)

`T-6.4` yêu cầu `ListMultipartUploads` trên bucket `file-sharing`, nhưng interface hiện có đúng 7 method và **không** có thao tác này; `StorageService.java` / `S3StorageServiceImpl.java` **không nằm trong whitelist WP6** (`00_guardrails.md` §3 WP6).
Policy `svc-upload` đã có sẵn `s3:ListBucketMultipartUploads` (WP1) — thiết kế đã tính tới, chỉ thiếu đường code.

- **Phương án A (khuyến nghị):** nới whitelist WP6 thêm 2 file `StorageService.java` (S) + `S3StorageServiceImpl.java` (S), chỉ để thêm **đúng 1 method** `List<MultipartUploadSummary> listMultipartUploads()` + 1 record. Không đụng method nào khác.
- Phương án B: bỏ chiều "quét mồ côi" của reconcile → mất tầng 3 của REL-03, DoD WP6 mục 3 không thể xanh. **Không khuyến nghị.**

### C2 — Không có cách kiểm "object tồn tại" mà không ném exception (chặn chiều 2 của W6.4)

`T-6.4` bước 2 cần "session `COMPLETED` mà `HeadObject` 404 → alert + metadata FAILED". `S3StorageServiceImpl.headObject` bắt `NoSuchKeyException` rồi **ném lại** `FileBusinessException(FILE_ERROR, "Object not found after commit")`.

- **Phương án A (khuyến nghị):** job bắt `FileBusinessException` và coi là "không tồn tại" — **không** cần chạm `StorageService`, không cần duyệt whitelist. Nhược: bắt theo exception chung, kém tường minh.
- Phương án B: thêm `boolean objectExists(String)` vào `StorageService` — gộp chung lần nới whitelist của C1.

### C3 — 2 key config chu kỳ job chưa có tên chuẩn (chặn W6.1)

`02_schema_config.md` §3 chỉ định nghĩa 6 key `upload.*`; `00_guardrails.md` §2.7 cấm tự sáng tác tên config key. Nhưng `T-6.1` lại yêu cầu thêm 2 key chu kỳ "đặt tên theo style key hiện có".

- **Quyết định đề xuất (ghi thành delta D14):** `upload.gc-interval: 900s` và `upload.reconcile-interval: 86400s` — cùng style kebab-case + hậu tố `s` như `part-url-ttl`/`session-idle-ttl`. Đọc bằng `@Value` (delta D4: **không** tạo `UploadProperties.java`).

### C4 — `VersionCreateRequestDto.fileSize` còn `Double`, không nằm trong whitelist WP7 (chặn W7.2)

`00_guardrails.md` §3 WP7 liệt kê 6 call site + `MetadataEntity` + `MetadataDTO`, nhưng **bỏ sót** `entities/dtos/asset/VersionCreateRequestDto.java:18` (`private Double fileSize;`). `AssetServiceImpl.createNewVersion` đọc field này rồi ghi vào `MetadataEntity.fileSize` → sau W7.1 sẽ **gãy compile** ở một file ngoài whitelist.

- **Phương án A (khuyến nghị):** nới whitelist WP7 thêm `VersionCreateRequestDto.java` (S), đổi `Double` → `Long` cho đối xứng với `AssetCreateRequestDto` (đã đổi ở WP4-T-4.8). Là thay đổi kiểu số JSON (number vẫn là number), nhưng DTO generated phía client đổi kiểu TS → phải `gen-api` lại ở W7.7.
- Phương án B: giữ `Double`, ép kiểu tại call site trong `AssetServiceImpl` (file đã có trong whitelist). Không phá hợp đồng, nhưng để lại một `Double` lẻ đúng vào chỗ R5 muốn dọn → DoD WP7 mục 1 (`rg "Double fileSize"` → 0) **không xanh được**.

> **Hành động:** trả lời C1–C4 trước khi bắt đầu W6.1. C3 chốt được ngay (thuần đặt tên). C1/C2/C4 cần người dùng duyệt nới whitelist.

---

## 3. Thứ tự thực thi & cổng chặn

```
W5.G  (đóng WP5 — cổng bắt buộc theo 00_guardrails §1.3)
  ├─> W6.1 → W6.2 → W6.3 → W6.4 → W6.5            (WP6, tuần tự)
  └─> W7.1 → W7.2 → W7.3 → W7.4 → W7.5 → W7.6 → W7.7   (WP7, tuần tự)
                                                    └─> W7.8 → W7.9  (cần cả W6.5 + W7.7)
```

- WP6 và WP7 **chạy song song được** sau W5.G (`03_tasks.md` §0.4) — nhưng W7.8 (nghiệm thu toàn phase) phải đợi cả hai.
- Cổng chặn K1–K6 (`04_verification.md` §5.1) vẫn hiệu lực; K1–K4 đã xanh ở WP1–WP4, **K5** (không log URL) và **K6** (E1 + WP5 cùng release) là hai cổng còn sống trong kế hoạch này.
- Quy tắc bất di bất dịch cho mọi bước: `00_guardrails.md` §2 — không commit/push, không refactor tiện tay, không đổi hợp đồng E7, không log presigned URL, không chạm file ngoài whitelist.

**Chuẩn bị phiên làm việc** (mọi lệnh verify bên dưới giả định đã có):

```powershell
$ROOT   = "E:\DaiCuongBK\Project3\FileSharing"
$TMP    = "E:\tmp\upload-v2-smoke"
$BUCKET = "file-sharing"
$MONGO  = "mongodb://admin:admin123456@localhost:27017/metadata?authSource=admin"
function mcx { docker run --rm --network dockers_minio-network `
  -e MC_HOST_myminio="http://<root-user>:<root-pass>@minio:9000" --entrypoint mc minio/mc:latest @args }
docker compose -f $ROOT\server\dockers\docker-compose.yml ps   # Mongo/Kafka/MinIO đều Up
```

---

## 4. Bước 0 — Đóng WP5 (cổng bắt buộc)

### W5.G — Nghiệm thu WP5 trên trình duyệt thật (`T-5.6`, kịch bản F)

- **Vì sao đứng đầu:** `00_guardrails.md` §1.3 — "Không mở WP kế tiếp khi checklist DoD của WP hiện tại chưa xanh toàn bộ". WP5 đang ◐ với 4/6 mục chưa chạy. Nếu F1–F5 lộ lỗi ở client, W7.7 (chuyển đường legacy sang luồng asset) sẽ xây trên nền hỏng.
- **Đọc trước:** `04_verification.md` §2.6 (bảng F1–F8), §5.7 (những gì đã/chưa chạy); `00_guardrails.md` §6 "DoD WP5".
- **Sửa/tạo:** không sửa file repo. Nếu F1–F6 lộ lỗi → sửa trong đúng whitelist WP5 (`00_guardrails.md` §3 WP5), không mở rộng.
- **Các bước:**
  1. `npm run dev` + backend `:5000` + hạ tầng docker. DevTools → Network, lọc `localhost:9000`.
  2. F1/F2/F3: upload 1 file ≥ 100 MiB qua UI thật.
  3. F4: soi payload mọi request tới `:5000` trong lúc upload.
  4. F5: ngắt mạng ở ~50% → reload tab → upload tiếp.
  5. F6: hạ `upload.part-url-ttl` xuống `60s`, restart backend, upload file lớn; **trả lại `900s`** sau khi xong.
  6. F8: download lại chính file đó, kiểm `contentType` của blob (vá R4).
  7. **Bổ sung ngoài bảng F** (kiểm PERF-03 — hiện không mục nào phủ): upload 1 file **≤ 8 MiB** → xác nhận `uploadMode = SINGLE`, đúng **1** request PUT tới MinIO, không có `uploadId` trong query string, E4 vẫn trả `COMPLETED`.
- **DoD:**
  - [ ] F1: **mọi** PUT tới MinIO có header `Content-MD5`
  - [ ] F2: số PUT chạy đồng thời **không vượt 6** ở mọi thời điểm
  - [ ] F3: mọi part == `partSize` server trả (part cuối được nhỏ hơn)
  - [ ] F4: không request nào tới `:5000` mang `objectName`/`uploadId`; mọi control-plane call đi qua `/api/uploads/{sessionId}/...`
  - [ ] F5: tổng bytes PUT của lần 2 **< kích thước file**; `mc stat` sau complete == size gốc
  - [ ] F6: client tự xin URL mới, **không** hiện lỗi cho người dùng; `part-url-ttl` đã trả về `900s`
  - [ ] F8: blob tải về có `contentType` đúng (không `undefined`)
  - [ ] PERF-03: file ≤ 8 MiB đi đúng 1 request, `uploadMode = SINGLE`
- **Verify:**
  ```powershell
  mcx stat myminio/$BUCKET/<objectName>          # -> Size == size file gốc
  mcx ls --incomplete myminio/$BUCKET            # -> trống (không còn multipart dở)
  docker exec filesharing-mongodb mongosh $MONGO --quiet --eval `
    "db.upload_sessions.findOne({_id:'<sid>'}).status"    # -> COMPLETED
  ```
- **Phụ thuộc:** T-5.5 (đã xong).
- **Rủi ro:** F2 vượt 6 → lỗi hill-climbing ở `adaptiveBandwidth.ts`; F5 PUT lại toàn bộ → lỗi `findResumableSession`/`reconcileReceivedParts` (`04_verification.md` §5.7 mục 3, 5). Sửa trong whitelist WP5 rồi chạy lại F.

---

## 5. WP6 — GC & đối soát (REL-03, S7, R3)

> Nguồn: `03_tasks.md` T-6.1 → T-6.4 · Whitelist: `00_guardrails.md` §3 WP6 (+ nới theo C1/C2 nếu duyệt) · DoD gốc: §6 "DoD WP6" · Verify: `04_verification.md` §4.3

### W6.1 — Bật `@EnableScheduling` + 2 key chu kỳ job (`T-6.1`)

- **Đọc trước:** `../03_detailed_design.md` §WP7 dòng "Bật scheduling"; `02_schema_config.md` §3 (style key) + §3.1 (đọc bằng `@Value`, delta D4); cách imagecodec/videocodec bật scheduling.
- **Sửa/tạo:**
  - `server/filesharing-filehandler/src/main/java/org/example/filesharing/FileSharingApplication.java` (S)
  - `server/filesharing-filehandler/src/main/resources/application.yml` (S — thêm đúng 2 key vào block `upload:` đã có)
- **Các bước:**
  1. Đọc application class của imagecodec/videocodec để copy đúng style, thêm `@EnableScheduling`. Không thêm annotation nào khác.
  2. Thêm `upload.gc-interval: 900s`, `upload.reconcile-interval: 86400s` (chốt C3). Giữ hậu tố `s` — thiếu hậu tố Spring hiểu là **mili-giây**.
- **DoD:**
  - [ ] `FileSharingApplication.java` có đúng 1 dòng `@EnableScheduling`
  - [ ] Block `upload:` có đúng 8 key (6 cũ + 2 mới), không trùng lặp
  - [ ] `mvn install -pl filesharing-filehandler` → `BUILD SUCCESS`; app khởi động không lỗi bind property
- **Verify:**
  ```powershell
  rg -n "EnableScheduling" $ROOT\server\filesharing-filehandler\src\main\java\org\example\filesharing\FileSharingApplication.java   # -> 1 dòng
  rg -n "gc-interval|reconcile-interval" $ROOT\server\filesharing-filehandler\src\main\resources\application.yml                    # -> 2 dòng
  mvn -f $ROOT\server\pom.xml install -pl filesharing-filehandler -DskipTests    # -> BUILD SUCCESS
  # khởi động app -> "Started FileSharingApplication", không WARN property
  ```
- **Phụ thuộc:** W5.G; C3 đã chốt.

### W6.2 — Query method cho GC/reconcile (`T-6.2`)

- **Đọc trước:** `02_schema_config.md` §2.1 (thứ tự field của `idx_upload_sessions_status_expires`, `idx_upload_sessions_upload_id` sparse), §1.5 (ngữ nghĩa `expiresAt` vs TTL 48h grace).
- **Sửa/tạo:** `repositories/UploadSessionRepo.java` (S) · `services/UploadSessionService.java` (S) · `services/impl/UploadSessionServiceImpl.java` (S)
- **Các bước:**
  1. Repo: (a) tìm session **còn sống mà hết hạn** — `status IN (INITIATED, UPLOADING)` **AND** (`expiresAt < now` **OR** `hardExpiresAt < now`); đặt `status` trước để khớp thứ tự index. (b) `findByUploadId(String)` cho reconcile (index sparse).
  2. Service: **chỉ** thêm method truy vấn — logic abort nằm ở job.
  3. Không thêm method thừa ngoài nhu cầu đúng 2 job.
- **DoD:**
  - [ ] Repo có đúng 2 query method mới, không hơn
  - [ ] `UploadSessionService` chỉ thêm method **đọc**; không method nào ghi/abort
  - [ ] Query GC dùng `IXSCAN idx_upload_sessions_status_expires`, **không** COLLSCAN
  - [ ] Build filehandler PASS
- **Verify:**
  ```powershell
  docker exec filesharing-mongodb mongosh $MONGO --quiet --eval `
    "db.upload_sessions.find({status:{`$in:['INITIATED','UPLOADING']},expiresAt:{`$lt:new Date()}}).explain('queryPlanner').queryPlanner.winningPlan"
  # -> stage IXSCAN, indexName: idx_upload_sessions_status_expires
  mvn -f $ROOT\server\pom.xml install -pl filesharing-filehandler -DskipTests   # -> BUILD SUCCESS
  ```
- **Phụ thuộc:** W6.1.
- **Ghi chú:** vế `OR hardExpiresAt < now` khiến Mongo không dùng index cho nhánh thứ hai. Chấp nhận được vì `expiresAt = min(now+idleTtl, hardExpiresAt)` ⇒ `expiresAt` **luôn ≤** `hardExpiresAt`, nên vế `expiresAt < now` đã bao trùm; vế hai chỉ là lưới an toàn. Muốn IXSCAN tuyệt đối: query theo `expiresAt` rồi kiểm `hardExpiresAt` trong bộ nhớ.

### W6.3 — `UploadSessionGcJob` — 15 phút (`T-6.3`)

- **Đọc trước:** `../03_detailed_design.md` §WP6 bảng 3 tầng (tầng 2); `02_schema_config.md` §6.1 (**cấm** quét collection `metadata`), §1.5.
- **Sửa/tạo:** `.../jobs/scheduled/UploadSessionGcJob.java` (N — tạo cả thư mục `scheduled/`)
- **Các bước:**
  1. `@Scheduled(fixedDelayString = "${upload.gc-interval}")`, `@Slf4j`, constructor injection.
  2. Với mỗi session hết hạn còn sống: `storageService.abortMultipartUpload(objectName, uploadId)` — `NoSuchUpload` đã được nuốt sẵn trong `S3StorageServiceImpl`; nhánh `uploadMode = SINGLE` (`uploadId == null`) → bỏ qua abort.
  3. `session.status = EXPIRED` (giữ nguyên `expiresAt` để TTL index xoá vật lý sau 48h).
  4. `metadataService.markUploadFailed(session.getMetadataId())` — method **đã có sẵn** từ WP4, không sửa `MetadataService` (giữ đúng whitelist WP6).
  5. **Chỉ** đọc/ghi `upload_sessions` + metadata **có** `metadataId` trong session. Tuyệt đối không quét collection `metadata` (§6.1).
  6. Log: tổng số session xử lý + từng `sessionId`/`objectName`. **Cấm log URL** (§2.15).
  7. Một session lỗi không được giết cả vòng lặp: try/catch từng session, đếm `failed`.
- **DoD:**
  - [ ] Job chỉ chạm `upload_sessions`; `db.metadata.countDocuments({})` **không đổi** trước/sau khi job chạy trên dữ liệu cũ
  - [ ] Ép 1 session hết hạn → trong ≤ 1 chu kỳ: `status = EXPIRED`, multipart biến mất khỏi `mc ls --incomplete`, metadata tương ứng `FAILED`
  - [ ] Session `COMPLETED`/`ABORTED` **không** bị job đụng tới
  - [ ] 0 dòng log chứa URL trong file job
  - [ ] Metadata **không có** session (dữ liệu cũ) không bị đánh `FAILED`
- **Verify:**
  ```powershell
  # 0) hạ chu kỳ tạm: upload.gc-interval: 60s   (nhớ trả lại 900s ở W6.5)
  # 1) tạo session thật + PUT 1 part (04_verification §2.1 bước E1/PUT)
  docker exec filesharing-mongodb mongosh $MONGO --quiet --eval "db.metadata.countDocuments({})"   # ghi số trước
  docker exec filesharing-mongodb mongosh $MONGO --quiet --eval `
    "db.upload_sessions.updateOne({_id:'<sid>'},{`$set:{expiresAt:new Date(Date.now()-3600000)}})"
  # chờ 1 chu kỳ
  docker exec filesharing-mongodb mongosh $MONGO --quiet --eval "db.upload_sessions.findOne({_id:'<sid>'}).status"   # -> EXPIRED
  mcx ls --incomplete myminio/$BUCKET                                                                                 # -> không còn multipart đó
  docker exec filesharing-mongodb mongosh $MONGO --quiet --eval "db.metadata.findOne({_id:'<metadataId>'}).status"    # -> FAILED
  docker exec filesharing-mongodb mongosh $MONGO --quiet --eval "db.metadata.countDocuments({})"                      # -> BẰNG số trước
  ```
- **Phụ thuộc:** W6.2.

### W6.4 — `UploadReconcileJob` — 24h (`T-6.4`) — **chặn bởi C1/C2**

- **Đọc trước:** `../03_detailed_design.md` §WP6 tầng 3; `02_schema_config.md` §6.1 (định nghĩa "mồ côi" + ngưỡng `Initiated < now − 24h` + log `WARN`).
- **Sửa/tạo:** `.../jobs/scheduled/UploadReconcileJob.java` (N) · **+ (chờ duyệt C1)** `services/StorageService.java` (S) + `services/impl/S3StorageServiceImpl.java` (S)
- **Các bước:**
  1. (C1) Thêm `List<MultipartUploadSummary> listMultipartUploads()` + `record MultipartUploadSummary(String objectName, String uploadId, Instant initiated)`; impl gọi `s3Client.listMultipartUploads` có **phân trang** (`keyMarker`/`uploadIdMarker`) — bucket có thể > 1000 multipart. Policy `svc-upload` đã có `s3:ListBucketMultipartUploads`.
  2. Chiều 1 (MinIO → Mongo): multipart mà `findByUploadId(uploadId)` rỗng **và** `initiated < now − 24h` → `abortMultipartUpload` + `log.warn` kèm `uploadId` + `objectName`. Ngưỡng 24h để **không giết** multipart legacy E7 đang chạy dở.
  3. Chiều 2 (Mongo → MinIO): session `COMPLETED` mà object không tồn tại → `log.error` alert + `metadataService.markUploadFailed(metadataId)`. Kiểm tồn tại theo phương án C2 đã chốt.
  4. Không đụng metadata legacy không có session.
  5. `@Scheduled(fixedDelayString = "${upload.reconcile-interval}")`.
- **DoD:**
  - [ ] Multipart mồ côi có `Initiated` > 24h → bị abort sau khi job chạy; log ghi rõ số lượng đã dọn
  - [ ] Multipart mồ côi **mới tạo** (< 24h) **không** bị abort
  - [ ] `db.metadata.countDocuments({})` không đổi trước/sau khi job chạy
  - [ ] Session `COMPLETED` bị xoá object thủ công → job đánh metadata `FAILED` + log alert
  - [ ] `listMultipartUploads` có phân trang (không dừng ở 1000 phần tử đầu)
  - [ ] Diff của bước này **chỉ** chạm 1 file mới + 2 file đã được duyệt nới (C1)
- **Verify:**
  ```powershell
  docker exec filesharing-mongodb mongosh $MONGO --quiet --eval "db.metadata.countDocuments({})"   # trước
  mcx ls --incomplete myminio/$BUCKET                # liệt kê mồ côi trước khi chạy
  # hạ upload.reconcile-interval xuống 60s để test, chờ 1 chu kỳ, rồi trả lại 86400s ở W6.5
  mcx ls --incomplete myminio/$BUCKET                # -> mồ côi > 24h biến mất; mồ côi mới còn nguyên
  docker exec filesharing-mongodb mongosh $MONGO --quiet --eval "db.metadata.countDocuments({})"   # -> BẰNG số trước
  ```
- **Phụ thuộc:** W6.3 + quyết định C1, C2.
- **Ghi chú dữ liệu thật:** đang tồn 1 multipart test mồ côi từ WP4 (`wp4-e7-legacy-obj-358327164.bin`, `04_verification.md` §5.6 mục 5) — job này chính là thứ sẽ dọn nó. Dùng làm ca kiểm thật thay vì tạo mới.

### W6.5 — Nghiệm thu WP6 (DoD `00_guardrails.md` §6)

- **Đọc trước:** `00_guardrails.md` §6 "DoD WP6" (4 mục); `04_verification.md` §4.3.
- **Sửa/tạo:** không sửa file repo (task kiểm chứng).
- **Các bước:** trả `upload.gc-interval`/`upload.reconcile-interval` về giá trị thật (`900s`/`86400s`), restart, chạy lại 4 mục DoD, ghi **kết quả thật** (không phải kỳ vọng).
- **DoD:**
  - [ ] `FileSharingApplication.java` có `@EnableScheduling`; log khởi động có tên 2 job
  - [ ] Test GC xanh (W6.3)
  - [ ] Test reconcile xanh (W6.4)
  - [ ] Dữ liệu cũ không bị đụng: `db.metadata.countDocuments({})` không đổi
  - [ ] 2 key chu kỳ đã trả về giá trị production
  - [ ] `git status --short` không có file lạ ngoài whitelist WP6 (+ 2 file nới theo C1)
- **Verify:** `04_verification.md` §4.3 nguyên văn + `git -C $ROOT status --short`.
- **Phụ thuộc:** W6.4.

---

## 6. WP7 — Vệ sinh nền & deprecation (REL-04/R5/R2, SEC-07, SEC-08, S3)

> Nguồn: `03_tasks.md` T-7.1 → T-7.8 · Whitelist: `00_guardrails.md` §3 WP7 + delta D8 (+ nới theo C4) · DoD gốc: §6 "DoD WP7"

### W7.1 — `fileSize`: `Double` → `Long` trên entity + DTO (`T-7.1`) — **chặn bởi C4**

- **Đọc trước:** `02_schema_config.md` §6.2 (bảng quy tắc chốt); delta **D8** (`03_tasks.md` §0.3 — **không** migration).
- **Sửa/tạo:** `filesharing-core/.../entity/models/MetadataEntity.java` (S) · `filehandler/.../entities/dtos/metadata/MetadataDTO.java` (S) · **+ (chờ duyệt C4)** `.../entities/dtos/asset/VersionCreateRequestDto.java` (S)
- **Các bước:**
  1. `MetadataEntity.fileSize`: `Double` → **`Long`** (wrapper — document cũ có thể null) + `@Field(targetType = FieldType.INT64)`.
  2. `MetadataDTO.fileSize` → `Long`.
  3. (C4-A) `VersionCreateRequestDto.fileSize` → `Long`.
  4. **Không** chạy script migration (D8). Document cũ (BSON double) đọc qua `ConversionService`.
  5. `mvn install -pl filesharing-core` **trước** khi build filehandler. Build filehandler sẽ gãy ở call site → trạng thái trung gian có chủ đích, sửa ở W7.2/W7.3.
- **DoD:**
  - [ ] `rg "Double fileSize" server --glob "!**/target/**"` → 0 kết quả
  - [ ] `MetadataEntity.fileSize` có `@Field(targetType = FieldType.INT64)`
  - [ ] `mvn install -pl filesharing-core` → `BUILD SUCCESS`
  - [ ] Không có file migration/script nào được thêm
- **Verify:**
  ```powershell
  rg -n "Double fileSize" $ROOT\server --glob "!**/target/**"                  # -> 0
  mvn -f $ROOT\server\pom.xml install -pl filesharing-core -DskipTests          # -> BUILD SUCCESS
  # sau W7.3: gọi 1 API đọc metadata CŨ (tạo trước phase) -> 200, fileSize là số nguyên, không lỗi decode
  ```
- **Phụ thuộc:** W5.G; quyết định C4.
- **Rủi ro:** đọc BSON `double` thành `Long` — phải kiểm bằng document **thật đã có từ trước phase**, không phải document mới tạo.

### W7.2 — Call site `fileSize` nhóm 1: Metadata / Asset / Dashboard (`T-7.2`)

- **Đọc trước:** `00_guardrails.md` §3 WP7 ("**Chỉ** các dòng gãy vì đổi kiểu") + §2.2 (cấm refactor/format/sắp import).
- **Sửa/tạo:** `services/impl/MetadataServiceImpl.java` (S) · `services/impl/AssetServiceImpl.java` (S) · `services/impl/DashboardServiceImpl.java` (S)
- **Các bước:**
  1. Sửa **chỉ** dòng gãy compile. Không đổi tên biến, không format lại file.
  2. Xoá mọi `.intValue()` trên `fileSize` (vá **R2** — gốc của lỗi tràn số > 2 GiB); tính toán dùng `long`.
  3. Dashboard: cộng dồn dung lượng bằng `long`, không `double`.
  4. `AssetServiceImpl.buildMetadataVersion` hiện convert `Long`(request) → `Double`(entity) (`04_verification.md` §5.6) → bỏ convert, gán thẳng `Long`.
- **DoD:**
  - [ ] 3 file compile; `rg "fileSize\.intValue\(\)"` → 0 kết quả
  - [ ] `git diff` của 3 file **chỉ** chứa dòng liên quan `fileSize` (không dòng import/format nào bị xáo)
  - [ ] Không còn phép ép `(Double)`/`doubleValue()` trên đường `fileSize`
- **Verify:**
  ```powershell
  rg -n "fileSize\.intValue\(\)|doubleValue\(\)" $ROOT\server --glob "!**/target/**"    # -> 0 liên quan fileSize
  git -C $ROOT diff --stat server/filesharing-filehandler                                # -> chỉ 3 file, số dòng nhỏ
  mvn -f $ROOT\server\pom.xml install -pl filesharing-filehandler -DskipTests
  ```
- **Phụ thuộc:** W7.1.

### W7.3 — Call site `fileSize` nhóm 2: Processing / ImageData / FileMetadata (`T-7.3`)

- **Đọc trước:** như W7.2.
- **Sửa/tạo:** `services/impl/ProcessingServiceImpl.java` (S) · `controllers/ImageDataController.java` (S) · `controllers/FileMetadataController.java` (S — **chỉ** dòng 89 `(double) file.getSize()` ở `/direct-upload`)
- **Các bước:**
  1. Sửa đúng các dòng gãy.
  2. `dto.setFileSize((double) file.getSize())` → `dto.setFileSize(file.getSize())`.
  3. **Không** đổi hành vi `/direct-upload` (vẫn trần 5 MiB, vẫn proxy byte) — endpoint này **không** thuộc E7, không gắn `@Deprecated`.
- **DoD:**
  - [ ] `rg "\(double\) file\.getSize\(\)"` → 0 kết quả
  - [ ] `mvn clean install` **toàn reactor** → `BUILD SUCCESS` (6 module)
  - [ ] `/direct-upload` vẫn 200 với file < 5 MiB và vẫn từ chối file > 5 MiB (hành vi không đổi)
- **Verify:**
  ```powershell
  rg -n "\(double\) file\.getSize\(\)" $ROOT\server --glob "!**/target/**"     # -> 0
  mvn -f $ROOT\server\pom.xml clean install -DskipTests                        # -> BUILD SUCCESS
  curl.exe -s -o NUL -w "%{http_code}`n" -X POST http://localhost:5000/api/file-metadata/direct-upload `
    -H "Authorization: Bearer $env:JWT" -F "file=@$TMP\small.bin"              # -> 200
  ```
- **Phụ thuộc:** W7.2.

### W7.4 — `MinIoService`/`MinIoServiceImpl`: kiểu `long` + quét sạch log URL (`T-7.4`)

- **Đọc trước:** `00_guardrails.md` §2.3 (cấm đổi **hợp đồng** E7) + §2.15; `02_schema_config.md` §6.2 (phạm vi đổi kiểu); delta **D12**.
- **Sửa/tạo:** `services/MinIoService.java` (S) · `services/impl/MinIoServiceImpl.java` (S)
- **Các bước:**
  1. Đổi chữ ký `initiateMultipartUpload(String, Double)` → `(String, long)` và `getPresignedDownloadUrl(DownloadFileRequestDto, Double)` → `(…, long)`.
  2. Quét lại bằng `rg` (**không tin số dòng** trong tài liệu — file đã bị rewire ở T-3.6): 0 dòng log in presigned URL. *(Rà 2026-09-09 cho thấy đã sạch — bước này là xác nhận + chống hồi quy.)*
  3. 4 helper cũ đã xoá ở T-3.6 — chỉ **xác nhận không quay lại**, không xoá lại.
  4. Chạy lại regression E7 (`04_verification.md` §2.7 G1–G3) so với baseline T-4.2.
- **DoD:**
  - [ ] 0 dòng log URL trong `MinIoServiceImpl`
  - [ ] 0 tham chiếu `calculateExpireTime|extractUploadIdFromXml|buildCompleteMultipartUploadXml|OkHttpClient` trong `filehandler/src/main/java`
  - [ ] Không còn `Double` liên quan `fileSize` trên 2 file
  - [ ] Regression E7 G1–G3: **cùng** HTTP status + **cùng** tập tên field `data` như baseline
- **Verify:**
  ```powershell
  rg -n "log\.(info|debug|warn|error).*(presigned|Url|url)" `
     $ROOT\server\filesharing-filehandler\src\main\java --glob "!**/target/**"     # -> 0
  rg -n "calculateExpireTime|extractUploadIdFromXml|buildCompleteMultipartUploadXml|OkHttpClient" `
     $ROOT\server\filesharing-filehandler\src\main\java                            # -> 0
  Compare-Object (Get-Content "$TMP\e7-baseline\upload-metadata.json" | ConvertFrom-Json).data.PSObject.Properties.Name `
                 (Get-Content "$TMP\e7-after\upload-metadata.json"    | ConvertFrom-Json).data.PSObject.Properties.Name
  # -> không có dòng nào
  ```
- **Phụ thuộc:** W7.3.
- **Ghi chú:** `upload/stop-upload` đang trả **500** `"Type definition error: ...AbortUploadRequestDto"` — bug **có sẵn từ trước phase**, đã ghi ở `04_verification.md` §5.6 kịch bản G. Baseline là 500 ⇒ vẫn 500 là **PASS**; sửa nó sẽ **đổi hợp đồng E7** → cấm (§2.3).

### W7.5 — `@Deprecated` + log warning cho 3 endpoint E7 (`T-7.5`)

- **Đọc trước:** `01_api_contract.md` §E7 (message log warning chuẩn); `00_guardrails.md` §2.3.
- **Sửa/tạo:** `controllers/FileMetadataController.java` (S — **chỉ** 3 method E7)
- **Các bước:**
  1. `@Deprecated` trên đúng 3 method: `upload-metadata`, `upload/complete`, `upload/stop-upload`.
  2. Mỗi method thêm **đúng 1 dòng** `log.warn` theo mẫu §E7.
  3. **Không** thêm kiểm quyền, **không** đổi URL/request/response/status.
  4. `/direct-upload` **không** thuộc E7 — không đụng.
- **DoD:**
  - [ ] `rg "@Deprecated"` trong file → đúng **3** dòng
  - [ ] Gọi mỗi endpoint sinh **đúng 1** dòng `DEPRECATED endpoint called: ...` (G4)
  - [ ] Response schema + HTTP status không đổi so với baseline T-4.2
  - [ ] `/direct-upload` không có `@Deprecated`
- **Verify:**
  ```powershell
  rg -n "@Deprecated" $ROOT\server\filesharing-filehandler\src\main\java\org\example\filesharing\controllers\FileMetadataController.java  # -> 3
  # gọi 1 lần mỗi endpoint rồi soi log app -> đúng 1 dòng warning/lần gọi
  ```
- **Phụ thuộc:** W7.4.

### W7.6 — SEC-08: giới hạn session mở đồng thời / user → 429 (`T-7.6`)

- **Đọc trước:** `01_api_contract.md` E1.3 (dòng 429) + §9.2 (`SESSION_LIMIT_EXCEEDED`); `02_schema_config.md` §2.1 (index `idx_upload_sessions_owner_status`), §3 (`upload.max-sessions-per-user`).
- **Sửa/tạo:** `services/impl/UploadSessionServiceImpl.java` (S) · `repositories/UploadSessionRepo.java` (S) · `application.yml` (S — **chỉ kiểm**, 3 key đã có từ T-2.3, không thêm trùng)
- **Các bước:**
  1. Repo: `countByOwnerIdAndStatusIn(ownerId, List.of(INITIATED, UPLOADING))` — index `idx_upload_sessions_owner_status` đã tồn tại.
  2. Trong `create(...)`: vượt ngưỡng → `FileBusinessException(ErrorCode.SESSION_LIMIT_EXCEEDED)`, **ném trước** khi gọi `CreateMultipartUpload` để không tạo rác trên MinIO. **Lưu ý:** thứ tự hiện tại ở `AssetServiceImpl.initiateUploadSession` là `createMultipartUpload` → `UploadSessionService.create` ⇒ phải chèn kiểm ngưỡng ở nhánh sớm hơn (đầu `initiateUploadSession` hoặc trong `validateCreateAssetRequest`), nếu không multipart đã được tạo trước khi 429 bay ra.
  3. Abort/complete làm giảm bộ đếm ngay (do đổi `status` — không cần code thêm).
- **DoD:**
  - [ ] Session thứ `max-sessions-per-user + 1` → HTTP **429**, code **5506**
  - [ ] Lần bị 429 **không** sinh multipart mới trên MinIO
  - [ ] Abort 1 session rồi tạo lại → **200**
  - [ ] Query đếm dùng `IXSCAN idx_upload_sessions_owner_status`
  - [ ] `application.yml` không phát sinh key trùng
- **Verify:**
  ```powershell
  mcx ls --incomplete myminio/$BUCKET     # ghi số multipart trước
  curl.exe -s -o NUL -w "%{http_code}`n" -X POST http://localhost:5000/api/asset/create-new `
    -H "Authorization: Bearer $env:JWT" -H "Content-Type: application/json" -d (Get-Content $TMP\e1-request.json -Raw)
  # -> 429 ở lần thứ 21
  mcx ls --incomplete myminio/$BUCKET     # -> KHÔNG tăng so với trước
  ```
- **Phụ thuộc:** W7.5.

### W7.7 — Client: dọn log URL + đưa đường legacy về luồng asset (`T-7.7`)

- **Đọc trước:** `../03_detailed_design.md` §WP7 dòng "Deprecate legacy"; `01_user_requirement.md` §A.6 **S3**, **S6**; `00_guardrails.md` §3 WP7 (2 dòng client) + §2.6 (cấm hand-edit `src/api/api/`).
- **Sửa/tạo:** `client/src/api/fileApi/fileApiResource.ts` (S) · `client/src/service/uploadService.ts` (S) · `client/src/api/api/**` (chỉ qua `npm run gen-api`, nếu C4-A làm đổi DTO)
- **Các bước:**
  1. Quét và xoá mọi `console.log` in URL còn sót. *(Rà 2026-09-09: `fileApiResource.ts` đã sạch; `downloadService.ts` còn nhiều `console.log` nhưng **không** in URL — chỉ xoá dòng nào thực sự in URL, không dọn tiện tay theo §2.2.)*
  2. `uploadService.uploadFile()` (dòng ~340: `const objectName = uuidv4() + '_' + file.name`) → chuyển sang gọi luồng asset E1 → E2 → E4, **bỏ hẳn** việc client sinh `objectName`. Đường đi khuyến nghị: tái dùng `folderUploadService.createAssetUploadSession` + `uploadService.uploadFileWithSession` đã có từ WP5, **không** viết đường thứ ba.
  3. Sau khi hết caller, các wrapper E7 trong `fileApiResource.ts` (`initiateUpload`/`completeUpload`/`abortUpload`/`uploadChunk`) thành code chết — **để nguyên**, xoá ở phase gỡ E7 (§2.2).
  4. Nếu C4-A được duyệt: chạy `npm run gen-api` (backend phải chạy ở `:5000`) rồi sửa các dòng gãy type.
  5. **Không** chạm `client/src/page/**` trừ đúng dòng gãy type.
- **DoD:**
  - [ ] `rg "uuidv4\(\)" client/src/service/uploadService.ts` → 0 kết quả liên quan `objectName`
  - [ ] Không request nào từ client gửi `objectName`/`uploadId` do client sinh (kiểm bằng DevTools, không chỉ grep)
  - [ ] `rg "console\.log" client/src/service client/src/api/fileApi` → không dòng nào in URL
  - [ ] `npm run build` → exit 0; `npm run lint` **không phát sinh lỗi mới** so với baseline (338 errors / 7 warnings — `04_verification.md` §5.7)
  - [ ] Upload qua nút UI cũ (`UploadButton`) vẫn chạy end-to-end, file lên đúng bucket
  - [ ] `git status` phía client: ngoài 2 file whitelist, chỉ có `client/src/api/api/**` (nếu gen-api)
- **Verify:**
  ```powershell
  rg -n "uuidv4\(\)" $ROOT\client\src\service\uploadService.ts                  # -> 0 liên quan objectName
  rg -n "console\.log" $ROOT\client\src\service $ROOT\client\src\api\fileApi     # -> không dòng nào in URL
  cd $ROOT\client; npm run build                                                # -> exit 0
  cd $ROOT\client; npm run lint                                                 # -> 338 errors, 7 warnings (bằng baseline)
  ```
- **Phụ thuộc:** W7.6, W5.G (đường session phải được nghiệm thu trên trình duyệt trước khi legacy dựa vào nó).
- **Rủi ro:** đây là bước duy nhất trong WP7 **đổi hành vi người dùng cuối**. `UploadButton.tsx` gọi `uploadService.uploadFile()` — nếu chữ ký đổi thì phải sửa cả file đó, mà file này nằm trong whitelist **WP5**, **không** có trong whitelist WP7 → nếu cần sửa thì **STOP, hỏi người dùng**.

### W7.8 — Nghiệm thu toàn phase (`T-7.8`)

- **Đọc trước:** `00_guardrails.md` §6 (DoD WP0 → WP7); `04_verification.md` §4 + §5.
- **Sửa/tạo:** không sửa file repo.
- **Các bước:**
  1. Build server (toàn reactor) + client.
  2. Upload file **> 2 GiB** đi trọn vòng E1 → E2 → E4 (chứng minh R2 đã hết).
  3. Chạy toàn bộ mục quét của DoD WP7 + `04_verification.md` §4.1–§4.5.
  4. Quét log **runtime** (không chỉ mã nguồn) tìm chữ ký presigned — cổng **K5**.
  5. Ghi **kết quả thật** (không phải kỳ vọng) vào báo cáo.
- **DoD:**
  - [ ] `rg "Double fileSize|fileSize\.intValue\(\)|\(double\) file\.getSize\(\)"` → 0 kết quả
  - [ ] `rg "log\.(info|debug|warn).*(Url|url)"` trong `MinIoServiceImpl.java` → 0 kết quả
  - [ ] File > 2 GiB upload xong; `mc stat` size **khớp** file gốc
  - [ ] Session thứ `max+1` → 429; abort rồi tạo lại → 200
  - [ ] 3 endpoint E7 có `@Deprecated`, mỗi lần gọi đúng 1 dòng warning, schema không đổi
  - [ ] `mvn clean install` toàn reactor → `BUILD SUCCESS`; `npm run build` → exit 0
  - [ ] **K5:** `Select-String "X-Amz-Signature|X-Amz-Credential"` trên log runtime filehandler → 0 kết quả
  - [ ] `Select-String "<module>" server\pom.xml` → đúng **6** dòng
  - [ ] `mc admin config get myminio api` → `stale_uploads_expiry=168h` *(thay cho mục "ILM rule 7 days" của DoD WP1 — sai lệch đã duyệt §5.3)*
  - [ ] `mc ls --incomplete myminio/file-sharing` → trống (mọi rác test đã được GC/reconcile dọn)
- **Verify:**
  ```powershell
  mvn -f $ROOT\server\pom.xml clean install -DskipTests           # -> BUILD SUCCESS
  cd $ROOT\client; npm run build                                  # -> exit 0
  rg -n "Double fileSize|fileSize\.intValue\(\)|\(double\) file\.getSize\(\)" $ROOT\server --glob "!**/target/**"   # -> 0
  mcx stat myminio/$BUCKET/<obj-2gb>                              # -> Size khớp file gốc
  mcx admin config get myminio api | Select-String "stale_uploads"
  Select-String -Path "$TMP\app.log" -Pattern "X-Amz-Signature|X-Amz-Credential"   # -> 0
  ```
- **Phụ thuộc:** W7.7, W6.5, W5.G.

### W7.9 — Cập nhật hồ sơ nghiệm thu & truy vết

- **Vì sao:** `00_guardrails.md` §6 yêu cầu "ghi kết quả thật vào `agent/04_verification.md` khi báo cáo" — **ngoại lệ hợp lệ** duy nhất của §2.11 (docs read-only).
- **Sửa/tạo:** `agent/04_verification.md` (S) · `agent/05_traceability.md` (S) · `agent/03_tasks.md` §0.3 (S — thêm delta, **cần user duyệt**)
- **Các bước:**
  1. `04_verification.md` §5: đổi trạng thái WP5 (☑ sau W5.G), WP6, WP7 kèm ngày; thêm §5.8 (WP6) + §5.9 (WP7) ghi lệnh đã chạy + output thật.
  2. Ghi 4 quyết định C1–C4 vào `03_tasks.md` §0.3 thành delta **D14–D17**.
  3. `05_traceability.md`: cập nhật trạng thái của REL-03, S7, R3, R5, R2, SEC-07, SEC-08, S3; bổ sung khoảng trống mới nếu phát sinh (xem §8.6 của tài liệu này).
- **DoD:**
  - [ ] Bảng §5 của `04_verification.md` không còn ô ☐ hoặc ◐
  - [ ] Mọi kết quả ghi là output **thật**, không phải kỳ vọng
  - [ ] `05_traceability.md` §3 không còn dòng nào lệch với thực tế (đã vá mà ghi chưa vá, hoặc ngược lại)
- **Phụ thuộc:** W7.8.

---

## 7. Tổng hợp bước & phụ thuộc

| Bước | Task gốc | WP | Phụ thuộc | Chặn bởi |
|---|---|---|---|---|
| W5.G | T-5.6 | WP5 | — | — |
| W6.1 | T-6.1 | WP6 | W5.G | C3 |
| W6.2 | T-6.2 | WP6 | W6.1 | — |
| W6.3 | T-6.3 | WP6 | W6.2 | — |
| W6.4 | T-6.4 | WP6 | W6.3 | **C1, C2** |
| W6.5 | (DoD WP6) | WP6 | W6.4 | — |
| W7.1 | T-7.1 | WP7 | W5.G | **C4** |
| W7.2 | T-7.2 | WP7 | W7.1 | — |
| W7.3 | T-7.3 | WP7 | W7.2 | — |
| W7.4 | T-7.4 | WP7 | W7.3 | — |
| W7.5 | T-7.5 | WP7 | W7.4 | — |
| W7.6 | T-7.6 | WP7 | W7.5 | — |
| W7.7 | T-7.7 | WP7 | W7.6, W5.G | C4 (gen-api) |
| W7.8 | T-7.8 | WP7 | W7.7, W6.5 | — |
| W7.9 | (mới) | — | W7.8 | duyệt sửa docs |

**Tổng: 15 bước** — 1 cổng WP5 · 5 bước WP6 · 9 bước WP7.

---

## 8. Verify kế hoạch với `01` / `02` / `03` / `README`

Câu hỏi cần trả lời: *sau khi hoàn thành kế hoạch này, sản phẩm có đạt đúng bài toán và thiết kế đề ra không?*

### 8.1 Ma trận yêu cầu (`01_user_requirement.md` §B)

| Mã | Ưu tiên | Sau kế hoạch | Cơ chế / ghi chú |
|---|---|---|---|
| CLEAN-01 | P0 | ✅ Đạt | WP0 (đã xong) |
| SEC-01 | P0 | ⚠️ **Đạt phạm vi phase, còn nợ N3** | Luồng mới ký bằng `svc-upload`/`svc-download`; bean `MinioClient` legacy + 2 worker codec **vẫn giữ key toàn quyền** — chủ ý, đóng ở phase gỡ E7 |
| SEC-02 | P0 | ✅ Đạt (tầng 1 dùng cơ chế thay thế) | URL 15' + sliding TTL 24h + trần 7d + TTL index 48h grace + `stale_uploads_expiry=168h` |
| SEC-03 | P0 | ⚠️ Đạt cho **mọi client**, endpoint legacy vẫn hở | Sau W7.7 không client nào gửi `objectName`; 3 endpoint E7 vẫn **chấp nhận** `objectName` (nợ N2) |
| SEC-04 | P0 | ✅ Đạt | WP4-E4: owner → ListParts → size → checksum → commit |
| SEC-05 | P0 | ✅ Đạt | WP4-E6 kiểm quyền trước presign (đã smoke E-1…E-6) |
| SEC-06 | P1 | ✅ Đạt (chờ F1 xác nhận) | Content-MD5 per part + ETag fail-and-retry; `T-3.2` đã chứng minh MinIO trả `BadDigest` |
| SEC-07 | P1 | ✅ Đạt sau **W7.4 + W7.7 + W7.8/K5** | Gồm cả quét log **runtime**, không chỉ mã nguồn |
| SEC-08 | P1 | ⚠️ Đạt 2/3 vế | max file size (WP4) + max session/user (**W7.6**); vế ingress bytes/giờ — §B.4 ghi rõ ngoài phạm vi |
| SEC-09 | P2 | ❌ **Không làm** | Hoãn phase sau (`05_traceability.md` §4.1) |
| SEC-10 | P2 | ❌ **Không làm** | Hoãn; bucket `thumbnails` **vẫn public** (S8 còn nguyên) |
| PERF-01 | P0 | ✅ Đạt | Batch URL; `calculateExpireTime` đã xoá |
| PERF-02 | P0 | ✅ Đạt (chờ F3) | Server công bố `partSize`, client dùng cố định |
| PERF-03 | P1 | ✅ Đạt (**cần mục kiểm bổ sung ở W5.G bước 7**) | `uploadMode = SINGLE` ≤ 8 MiB, 1 request; bảng F gốc không có mục kiểm → kế hoạch này bổ sung |
| PERF-04 | P2 | ❌ **Không làm** | Delta D10; **P3 (ghép file trong RAM) còn nguyên** |
| PERF-05 | P1 | ✅ Đạt | AWS SDK v2; OkHttp + regex XML đã xoá |
| PERF-06 | P1 | ✅ Đạt (chờ F2) | Hill-climbing, trần 6 thread |
| REL-01 | P0 | ✅ Đạt (chờ F5) | E3 + `receivedParts` + `reconcileReceivedParts` phía client |
| REL-02 | P0 | ⚠️ Đạt cho E4; E7 vẫn không idempotent | Nợ N2/R6 — chủ ý |
| REL-03 | P1 | ✅ Đạt đủ 3 tầng **sau W6.3 + W6.4** | Tầng 1 = `stale_uploads_expiry=168h` (không phải ILM rule) |
| REL-04 | P0 | ✅ Đạt sau **W7.1 → W7.4** | R5 (kiểu), R2 (tràn số — chứng minh bằng file > 2 GiB ở W7.8), R4 (đã xong WP4/WP5) |
| REL-05 | P1 | ✅ Đạt | 5 trạng thái session, tách khỏi `ProcessingStatus` |

**P0: 9/9 đạt** (SEC-01/SEC-03/REL-02 đạt trong phạm vi phase, phần hở đã ghi thành nợ đã duyệt).
**P1: 8/8 đạt** (SEC-08 đạt 2/3 vế; vế 3 được §B.4 loại khỏi phạm vi).
**P2: 0/3** — SEC-09, SEC-10, PERF-04 hoãn đúng như `05_traceability.md` §4.1 đã tuyên bố.

### 8.2 Điểm yếu hiện trạng (`01` §A.6)

| Nhóm | Vá hết | Còn lại |
|---|---|---|
| Bảo mật S1–S8 | S2, S3*, S4, S5, S6, S7 | **S1 một phần** (N3 — worker/legacy giữ key rộng) · **S8 chưa vá** (SEC-10 hoãn) · S3* chỉ còn hở ở endpoint E7 |
| Hiệu năng P1–P4 | P1, P2, P4 | **P3 chưa vá** (ghép RAM khi download — PERF-04 hoãn) |
| Tin cậy R1–R7 | R1, R2, R3, R4, R5 (kiểu), R7 | **R6 một phần** (E7 legacy) · **R5 dữ liệu cũ chưa migrate** (N5) |

### 8.3 Đối chiếu `02_system_technical_design.md`

| Hạng mục | Sau kế hoạch |
|---|---|
| Pipeline 3 pha initiate → transfer → commit | ✅ Đúng §3.1 |
| UploadSession làm xương sống, client chỉ cầm `sessionId` | ✅ |
| AWS SDK v2 thay OkHttp/XML | ✅ |
| MinIO service accounts scope hẹp | ✅ (phần luồng mới) |
| **MinIO ILM lifecycle rule** (§2 bảng công nghệ mới) | ⚠️ **KHÔNG dùng được** — MinIO từ chối rule chỉ có `AbortIncompleteMultipartUpload` (issue minio#19115). Thay bằng `stale_uploads_expiry=168h`. Mục tiêu REL-03 vẫn đạt, **cơ chế khác tài liệu** → §2 và §5.4 của `02` cần sửa |
| MongoDB TTL index | ✅ (172800s grace, ADR §1.5) |
| Content-MD5 per part | ✅ |
| `@Scheduled` GC + reconcile | ✅ **chính là W6.3 + W6.4** |
| §3.2 / §4.3 "file lớn → **stream xuống đĩa** (File System Access API)" | ❌ **Không triển khai** (PERF-04 hoãn, delta D10). Nhánh `else file lớn` của sequence §4.3 **sẽ không tồn tại** trong sản phẩm |
| §4.4 state diagram vòng đời session | ✅ Khép kín sau W6.3/W6.4 (nhánh `EXPIRED → GC job abort` chính là mảnh còn thiếu hiện nay) |
| §6 ma trận đáp ứng | ✅ mọi dòng có cơ chế tương ứng (3 mục P2 vốn không nằm trong §6) |

### 8.4 Đối chiếu `03_detailed_design.md`

- WP6 §"3 tầng độc lập": kế hoạch phủ **đủ** tầng 2 (W6.3) và tầng 3 (W6.4); tầng 1 đổi cơ chế (xem 8.3).
- WP7 bảng 6 việc: phủ đủ — `@EnableScheduling` (W6.1, đưa sang WP6 vì là tiền đề của job), `fileSize` → `long` (W7.1–W7.3), log hygiene (W7.4 + W7.7), giới hạn session (W7.6), deprecate legacy (W7.5 + W7.7), `contentType` fix (đã xong ở WP4).
- **Phát hiện mới, không có trong tài liệu 03:** `VersionCreateRequestDto.fileSize` là call site thứ 7 của `fileSize` mà §WP7 ("đủ 6 file có call site") bỏ sót → điểm chặn **C4**.
- §"Rollout" bước 5 = `WP6 + WP7`: kế hoạch giữ đúng thứ tự; cổng **K6** (E1 + WP5 cùng release) không còn rủi ro vì cả hai đã nằm trên cùng nhánh chưa release.
- Bảng rủi ro của `03`: M1/M2/M3 đã đóng ở WP1–WP4; M5 (`verify-etag-md5`) và M6 (`part-url-ttl`) vẫn để mở đúng như thiết kế.

### 8.5 Đối chiếu `README.md` — 8 thay đổi lớn nhất

| # | Tuyên bố README | Sau kế hoạch |
|---|---|---|
| 0 | Gỡ `filesharing-uploadservice` | ✅ |
| 1 | UploadSession, client chỉ cầm `sessionId` | ✅ |
| 2 | Part URL theo batch, TTL 15' đồng nhất | ✅ |
| 3 | Part size cố định + hill-climbing concurrency trần 6 | ✅ |
| 4 | Complete verify trước commit + idempotent | ✅ |
| 5 | Ký bằng service account scope hẹp | ⚠️ luồng mới ✅, worker/legacy còn key rộng (N3) |
| 6 | Download kiểm quyền | ✅ |
| 7 | **GC 3 tầng: MinIO ILM 7d** + GC 15' + reconcile 24h | ⚠️ 3 tầng ✅ nhưng tầng 1 là `stale_uploads_expiry=168h`, **không phải ILM** → câu chữ README cần sửa |
| 8 | AWS SDK v2 cho mọi call multipart | ✅ |

### 8.6 Kết luận verify

**Có** — sau khi hoàn thành 15 bước, sản phẩm đạt **toàn bộ yêu cầu P0 và P1** của `01_user_requirement.md` và **đúng kiến trúc** mô tả ở `02_system_technical_design.md` §3/§4 và `03_detailed_design.md` WP0–WP7, với **4 điểm lệch phải được ghi nhận thay vì bỏ qua**:

1. **Tầng 1 của GC không phải ILM rule** mà là `stale_uploads_expiry=168h` — mục tiêu REL-03 đạt, cơ chế khác tài liệu. → Sửa `02` §2/§5.4, `03` §WP6 bảng tầng 1, `README` mục 7, và DoD WP1 dòng 2 (làm ở W7.9).
2. **PERF-04 / P3 không được vá**: download file lớn vẫn ghép Blob trong RAM. Sơ đồ `02` §3.2 và §4.3 mô tả nhánh stream-to-disk **sẽ không tồn tại** trong sản phẩm. → Hoặc đánh dấu "phase sau" ngay trên sơ đồ, hoặc mở rộng phạm vi (D10: muốn làm ngay → STOP, hỏi user).
3. **SEC-10 / S8 không được vá**: bucket `thumbnails` vẫn truy cập public không chữ ký — lỗ hổng **đang tồn tại thật**, chỉ được hoãn chứ không biến mất.
4. **SEC-01 chỉ khép một nửa** (N3): workers + bean `MinioClient` legacy vẫn dùng key không giới hạn policy. Presigned URL của luồng mới an toàn, nhưng key rộng vẫn nằm trong `application.yml`.

Ngoài ra, **4 điểm chặn C1–C4** ở §2 phải được quyết trước khi bắt đầu; riêng **C1** và **C4** nếu chọn phương án B sẽ khiến **DoD WP6 mục 3** và **DoD WP7 mục 1** không thể xanh — tức kế hoạch sẽ **không** kết thúc ở trạng thái "đạt thiết kế".
