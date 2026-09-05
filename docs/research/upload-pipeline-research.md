# Thiết kế Upload Pipeline chuẩn Google Drive / OneDrive
## Bản tổng hợp research — trọng tâm backend & blob storage

> **Nguồn**: tổng hợp từ 2 báo cáo research độc lập (~63 nguồn, ưu tiên docs chính thức của Google/Microsoft, paper SOSP 2011, source code rclone/gdata-java-client):
> - [google-upload-research.md](google-upload-research.md) — Google Drive API, GCS, Colossus, GFE, Photos/Gemini File API
> - [microsoft-upload-research.md](microsoft-upload-research.md) — Microsoft Graph, OneDrive/SharePoint, Azure Blob Storage, Windows Azure Storage paper
>
> Mọi khẳng định trong file này đều có trích dẫn URL trong 2 báo cáo gốc, kèm phân loại rõ **(a) đã xác nhận từ nguồn chính thức** / **(b) suy đoán**. Ngày research: 2026-08-01.

---

## 0. TL;DR — 10 quyết định kiến trúc quan trọng nhất

Cả Google lẫn Microsoft, dù protocol khác nhau, đều hội tụ về cùng một bộ quyết định:

1. **Upload là quy trình 3 pha**: `initiate` (có auth, business logic, quota check) → `transfer bytes` (endpoint riêng, pre-authenticated, tối ưu throughput) → `commit` (atomic). Không bao giờ là "một request PUT to đùng".
2. **Tách control plane khỏi data plane**: service quản lý metadata/session **không nằm trên đường đi của byte**. Byte đi thẳng client → storage front-end → blob storage. (Colossus: Curator không bao giờ chạm byte; OneDrive: `uploadUrl` trỏ tới `*.up.1drv.com`, tách khỏi API gateway.)
3. **Staging bất khả kiến (invisible staging)**: dữ liệu chưa commit nằm trên storage **bền** (không phải RAM/đĩa local) nhưng **tuyệt đối vô hình với reader**. GCS: "Incomplete uploads don't create objects". Azure: uncommitted blocks không xuất hiện trong `Get Blob`.
4. **Session URL là bearer credential**: ai cầm là upload được, không cần auth thêm. Hệ quả: scope hẹp nhất có thể (1 session, 1 file đích, chỉ ghi), TTL rõ ràng, revoke được, không log full URL.
5. **Commit phải atomic + idempotent**: object dở dang không bao giờ visible; ghi đè là atomic swap; chống duplicate bằng pre-generated ID (Drive), conditional write `ifGenerationMatch`/`If-Match: etag` (GCS/Azure), hoặc block ID do client chọn (Azure).
6. **Blob bất biến + metadata mutable là hai hệ thống tách biệt**, nối bằng handle. Nội dung → object storage (append-only, content-immutable); metadata (tên, folder, quyền, version) → DB giao dịch. Đây là nền của versioning, copy rẻ, rename không đụng byte.
7. **Ack durability đúng thời điểm**: trả `200` chỉ sau khi replicate **đồng bộ trong region** (GCS: ≥2 availability zone; Azure stream layer: cả 3 replica ghi đĩa xong; SharePoint: cả 2 region). Geo-replication là **async** — không bắt client chờ.
8. **Integrity**: chọn checksum **composable** (CRC32C — ghép được từ checksum các phần, có hardware instruction); validate per-block khi ghi (Azure làm, GCS không — đây là chỗ làm tốt hơn Google được); checksum là **precondition** của commit, không chỉ là metadata; job đối soát DB ↔ blob định kỳ (SharePoint: 14 ngày).
9. **Malware scan async trên file ĐÃ RÁP LẠI**, không chặn upload, enforce ở đường download/share. Cảnh báo trực tiếp từ Microsoft Defender: *"Detection might fail when a file is uploaded in fragments… Scan data before chunking or after reassembly"* — quét từng chunk là bug bảo mật.
10. **Post-processing async + trạng thái tường minh**: file phải visible ngay sau commit với status `PROCESSING`; pipeline thumbnail/transcode chạy nền có retry + DLQ. (Google Drive **không** expose trạng thái xử lý qua API — đây là điểm yếu được ghi nhận rộng rãi, nên làm **ngược lại**.)

---

## 1. So sánh nhanh hai hệ thống

| Khía cạnh | Google (Drive API / GCS) | Microsoft (Graph / OneDrive / Azure Blob) |
|---|---|---|
| **Initiate** | `POST …?uploadType=resumable` + `X-Upload-Content-Type/-Length` → `Location: <session URI>` | `POST …/createUploadSession` (+ `conflictBehavior`, `fileSize`, `deferCommit`) → `{uploadUrl, expirationDateTime}` |
| **Endpoint nhận byte** | Session URI trên cùng domain API (nội bộ có tầng upload chung "Scotty") | Domain riêng `*.up.1drv.com` — tách hẳn khỏi API gateway |
| **Auth khi PUT byte** | Không cần (session URI = bearer) | Không cần — gửi kèm `Authorization` còn bị lỗi 401 |
| **Báo tiến độ** | `308 Resume Incomplete` + `Range: bytes=0-N` (0-indexed → bẫy off-by-one) | `202 Accepted` + `nextExpectedRanges: ["N-"]` (danh sách range, có thể nhiều khoảng) |
| **Hỏi trạng thái** | PUT rỗng `Content-Range: bytes */N`; trả `200/201` nếu đã xong | `GET uploadUrl`; `404` nếu session chết |
| **Thứ tự chunk** | Tuần tự (resumable); song song phải dùng cơ chế khác (XML multipart / parallel composite) | Tuần tự bắt buộc; gửi lại range đã nhận → `416` |
| **Gửi lại phần đã nhận** | **Bỏ qua âm thầm** (an toàn với retry, che giấu bug offset) | Trả `416` tường minh (nhiễu hơn nhưng lộ bug sớm) |
| **TTL session** | **7 ngày cố định** (hằng số từ 2008 đến nay, mọi sản phẩm) | **Sliding expiration** — mỗi fragment gia hạn thêm; bỏ đói thì session chết |
| **Commit** | Ngầm định khi đủ N byte (public API) / **tường minh** `upload, finalize` (giao thức X-Goog-Upload-*) | Ngầm định ở fragment cuối / tường minh với `deferCommit: true` |
| **Commit fail (trùng tên/quota)** | 4xx → session chết, làm lại từ đầu | **Session được giữ** — commit lại với metadata mới qua `@microsoft.graph.sourceUrl`, không upload lại byte |
| **Idempotency chống duplicate** | Pre-generated file ID (`files.generateIds`) → retry lần 2 trả `409` | Block ID do client chọn (Azure `Put Block` — retry ghi đè, bản cuối thắng) |
| **Integrity** | CRC32C toàn object (không verify per-chunk); checksum là precondition | `Content-MD5`/CRC64 **per-block** validate lúc ghi → `400` nếu sai; QuickXorHash toàn file trong metadata |
| **Blob storage nền** | Colossus (Curator + Bigtable metadata, D file servers, erasure coding Reed-Solomon) | Azure Storage (front-end / partition layer / stream layer; block ≤4MB, extent ≤1GB, append-only) |
| **Ack bền vững khi** | Ghi xong ≥2 availability zone (đồng bộ) | Cả 3 replica trong stamp ghi đĩa xong (đồng bộ); SharePoint còn ghi đồng bộ 2 region |
| **Dọn staging rác** | TTL 7 ngày, tự dọn, dữ liệu dở không tính tiền, không visible | Uncommitted blocks GC sau **7 ngày trượt**; job quét nền (temp "có thể không bị xóa ngay") |
| **Malware scan** | Async/lazy — quét khi download/share; ngưỡng 100 MB; fail-open kèm cảnh báo | Async sau upload, heuristics chọn file; chưa quét mà user download → trigger quét trước; mặc định vẫn cho tải file nhiễm kèm cảnh báo |
| **File tối đa** | 5 TB (Drive) / 5 TiB (GCS) | 250 GB (OneDrive) / ~190.7 TiB (block blob) |

**Điểm hội tụ đáng chú ý**: cả hai đều chọn **7 ngày** cho vòng đời dữ liệu staging bỏ dở, đều làm **single-writer session** (không hỗ trợ 2 client ghi chung 1 session), đều quét malware **async + fail-open có cảnh báo**, và đều tách **bytes** khỏi **metadata commit**.

---

## 2. Protocol — các bài học thiết kế

### 2.1 Google có HAI giao thức, và lý do rất đáng học

Ngoài giao thức public (`Content-Range` + `308`), Google vận hành giao thức thứ hai dựa hoàn toàn trên header custom `X-Goog-Upload-*` (dùng cho Photos, Street View, Gemini File API — và nhiều khả năng là web UI Drive):

- Mọi response chỉ dùng **HTTP 200/4xx/5xx** — né hẳn `308` và `Content-Range`, hai thứ hay bị proxy/CDN/WAF/HTTP client library xử lý sai.
- **Finalize tường minh**: `X-Goog-Upload-Command: upload, finalize` thay vì suy diễn "đã đủ N byte". Bug offset trở thành lỗi rõ ràng thay vì file corrupt.
- **Server công bố chunk granularity** (`X-Goog-Upload-Chunk-Granularity`) trong response initiate — đổi chính sách không cần release lại client.
- Trả `X-Goog-Upload-Size-Received: 43` (số byte đã nhận) thay vì `Range: bytes=0-42` (chỉ số byte cuối, 0-indexed) — **loại bỏ bẫy off-by-one kinh điển**.

### 2.2 Các quyết định protocol nên copy

| Quyết định | Ai làm | Vì sao |
|---|---|---|
| Tách MIME/size của **file** khỏi MIME/size của **HTTP request** (`X-Upload-Content-Type/-Length`) | Google | Request initiate mang JSON metadata; file thật là binary — hai thứ khác nhau |
| Bắt khai tổng size ở initiate (`Content-Range: bytes a-b/TOTAL` cố định mọi request) | Microsoft | Cho phép quota check sớm, pre-allocate, phát hiện client sai |
| Trả tiến độ dạng **danh sách range** thay vì một offset | Microsoft | Mở đường cho upload song song sau này mà không đổi protocol |
| Có ít nhất 2 đường: simple PUT cho file nhỏ, session cho file lớn | Cả hai | Bắt file 50 KB đi 3 round-trip là lãng phí. Ngưỡng tham chiếu: Google ~5 MB (công thức: băng thông × 30 giây chấp nhận mất), Microsoft khuyến nghị 10 MiB |
| `GET session status` và `DELETE session` là API hạng nhất | Microsoft | Client chắc chắn sẽ mất state; không có DELETE thì mọi upload hủy thành rác |
| Không hứa quá về `nextExpectedRanges` | Microsoft | Doc nói thẳng "không đảm bảo liệt kê đủ mọi khoảng thiếu" — client phải viết vòng lặp kiểm tra |

### 2.3 Resumable ≠ Parallel — hai bài toán, hai cơ chế

Phát hiện quan trọng từ cả hai phía: **session resumable là single-writer, tuần tự**. Nó giải bài toán *mạng không ổn định*, không phải bài toán *throughput*.

- Google: muốn song song phải dùng cơ chế **khác hẳn** — XML multipart upload (10.000 parts, S3-compatible) hoặc parallel composite upload (32 chunks + `compose`).
- Microsoft: Graph session ép tuần tự; tầng dưới Azure `Put Block` mới cho song song (block ID độc lập thứ tự + commit list).
- Trộn hai bài toán vào một cơ chế là sai lầm thiết kế. Google/Microsoft đều giữ chúng tách bạch.

---

## 3. Upload Session — quản lý phiên

### 3.1 Session URL là credential

Google nói thẳng trong docs: *"This session URI acts as an authentication token… can be used by **anyone** to upload data… **without any further authentication**."* Microsoft: `uploadUrl` là "preauthenticated", gửi kèm `Authorization` header còn bị 401.

Hệ quả bắt buộc:
- **Chỉ HTTPS**; không log full URL (access log nginx, Sentry/APM, Referer đều là đường rò rỉ).
- **Scope tối thiểu**: 1 session → 1 file đích, chỉ ghi (không đọc), không lan sang object khác. `uploadUrl` của Graph là "một SAS được thu hẹp cực đại và có nút revoke" — mô hình đáng copy hơn SAS/presigned URL scope rộng.
- **Chốt quyền tại initiate NHƯNG re-check tại mỗi resume** (GCS trả 4xx nếu quyền đổi giữa chừng). Session sống 7 ngày = cửa sổ 7 ngày để quyền thay đổi.
- Chấp nhận: **không audit được ai đã dùng URL** (Microsoft ghi rõ SAS "not tracked in any way"). Cần audit thì phải proxy byte qua service — đánh đổi băng thông.

### 3.2 TTL và dọn rác

| | Google | Microsoft |
|---|---|---|
| Kiểu expiry | Cố định 7 ngày | Sliding — mỗi fragment gia hạn |
| Hết hạn trả | GCS: `410` (<1 tuần) / `404` (>1 tuần); Drive: mọi 4xx → làm lại từ đầu | `404` → upload lại từ đầu |
| Staging GC | Tự dọn, không visible, không tính tiền user | Uncommitted blocks: 7 ngày trượt; temp file dọn bằng job nền ("có thể không xóa ngay") |

Bài học: **sliding expiration cho transfer** (file 100 GB trên mạng chậm không chết oan) + **TTL trần cứng** + **API cancel tường minh** + **job GC quét nền** — bốn thứ này phải đi cùng nhau. Và học Photos API: tách "upload token" (TTL ngắn — 1 ngày, để commit) khỏi "session" (TTL dài — 7 ngày, để truyền byte) → giới hạn cửa sổ tồn tại của byte mồ côi.

### 3.3 Trạng thái session phía server

Xác nhận được (gián tiếp): byte staging ghi vào **storage bền ngay lập tức** (Graph: "temporary storage location"; không thể giữ RAM vì file 250 GB, session sống nhiều ngày, server restart liên tục). Trạng thái session (đích, quyền đã chốt, tổng size, ranges đã nhận, expiry) nằm trong KV store nhanh, phân tán, có TTL, **tách khỏi metadata DB chính**. Session URL là URL tuyệt đối (chứ không phải token tương đối) để **sticky-route** về đúng cluster đang giữ dữ liệu dở — client phải follow redirect nếu server trả (Google có làm trong production dù không tài liệu hóa).

---

## 4. Tầng Blob / Backend (trọng tâm)

### 4.1 Control plane tách khỏi data plane — bài học số 1

**Colossus (Google):**
```
Client ──(control: tạo file, xin vị trí)──► Curator ──► metadata trong Bigtable
   │
   └────────(data: ghi byte THẲNG)────────► D file server ──► đĩa/flash
```
Curator không bao giờ chạm byte. Custodians chạy nền: revalidate checksum, sửa bit rot từ parity, cân bằng đĩa. Erasure coding Reed-Solomon = độ chịu lỗi của 3x replication với nửa chi phí. Encoding scheme là **tham số per-application**, không phải hằng số hệ thống.

**Windows Azure Storage (paper SOSP 2011)** — ba tầng trong một storage stamp:
```
Front-end (stateless: auth + route) → Partition layer (namespace, transaction,
strong consistency) → Stream layer (append-only DFS: block ≤4MB có checksum riêng,
extent ≤1GB seal xong mới erasure-code, 3 replica ĐỒNG BỘ — ack khi cả 3 ghi đĩa xong)
```
Geo-replication giữa các stamp là **async** — ack cho client không đợi.

**OneDrive cụ thể** (xác nhận chính thức): OneDrive xây trên SharePoint; **content → Azure Storage, metadata → Azure SQL**. SharePoint dùng **append-only blob** (version mới = blob mới, không bao giờ mutate), ghi **đồng bộ vào 2 region — fail 1 region là save fail** (mạnh hơn GRS mặc định, đánh đổi latency lấy RPO=0), checksum lưu **tách rời trong metadata** và verify ở **mọi lần đọc**, job đối soát DB ↔ blob **mỗi 14 ngày**.

### 4.2 Mô hình staging → commit ở tầng storage

Azure block blob là mô hình tham chiếu sạch nhất (và là thứ MinIO/S3 multipart mô phỏng):

- `Put Block (blockId, bytes)` — staging. Block **idempotent theo block ID** (gửi lại cùng ID → bản cuối thắng khi commit). Uncommitted block vô hình với `Get Blob`, GC sau 7 ngày trượt. Giới hạn: 50.000 committed / 100.000 uncommitted blocks, block ≤4.000 MiB.
- `Put Block List ([ids theo thứ tự])` — commit **atomic với reader**, hỗ trợ conditional headers (`If-None-Match: *` = create-if-not-exists nguyên tử; `If-Match: etag` = chống lost update → `412` nếu trượt).
- Bonus: commit list có thể trộn `<Committed>` (block cũ) + `<Uncommitted>` (block mới) → **update từng phần blob không cần upload lại toàn bộ** — cơ chế delta ở tầng storage.

Ánh xạ Graph session ↔ block blob (suy đoán mạnh): fragment PUT = Put Block, fragment cuối = Put Block List, quantum 320 KiB tồn tại để backend map fragment → đơn vị lưu trữ cố định (sai bội số → lỗi **ở bước commit**, không phải lúc gửi).

### 4.3 Định nghĩa "durable" và thời điểm ack

| Hệ thống | Ack `200` khi | Geo |
|---|---|---|
| GCS | Dữ liệu nằm ở **≥2 availability zone** (đồng bộ) | Async: 99.9% trong 1h, 100% trong 12h |
| Azure stream layer | **Cả 3 replica** trong stamp ghi đĩa + ack | Async giữa stamp (GRS RPO ≤15 phút) |
| SharePoint/OneDrive | **Cả 2 region** ghi xong (đồng bộ, RPO=0) | — (đã sync sẵn) |

Câu hỏi bạn phải trả lời cho hệ thống của mình: *khi API trả `200`, dữ liệu đang ở đâu?* Page cache của 1 máy MinIO? Đã fsync? Đã replicate? Trả `200` sớm hơn mức đảm bảo thật = nói dối client.

### 4.4 Dữ liệu vừa upload là dữ liệu nóng nhất

Colossus L4 writeback: file mới ghi lên **SSD trước** (vì sắp bị đọc ngay — transcode, thumbnail), tự migrate xuống HDD sau; chính sách chọn bằng ML per-workload. Pattern đúng cho mọi pipeline media: upload → storage nhanh → worker đọc → hạ tier.

---

## 5. Finalize / Commit

### 5.1 Các đảm bảo phải có (hợp đồng của GCS — thước đo để tự chấm)

- **Atomic all-or-nothing**: không bao giờ có partial/corrupted object visible.
- **Không visible trước khi xong**: "Only completed uploads appear in buckets."
- **Ghi đè = atomic swap**: reader thấy bản cũ cho tới đúng thời điểm chuyển.
- **Read-after-write strongly consistent**: không bao giờ 404 sau khi nhận success.
- **Object bất biến** sau commit; mỗi lần ghi tạo generation/version mới.

### 5.2 Ba cơ chế chống duplicate/race khi commit

1. **Pre-generated ID** (Drive): client xin ID trước → upload với ID đó → retry bao nhiêu lần cũng chỉ ra 1 file, lần 2 trả `409 Conflict`. Rẻ nhất, tổng quát nhất.
2. **Conditional write** (GCS `ifGenerationMatch=0` / Azure `If-None-Match: *`, `If-Match: etag`): biến check-then-write thành thao tác nguyên tử tại storage, không race.
3. **Query-status trả cả "đã xong"**: client mất response commit (trường hợp phổ biến nhất thực tế) → query status nhận `200/201` thay vì `308` → biết đã commit, không upload lại tạo bản trùng.

### 5.3 Chi tiết thiết kế hay nhất của Microsoft: decouple bytes khỏi metadata đích

Commit fail vì trùng tên/quota → **session và bytes được giữ nguyên**; client commit lại bằng PUT metadata mới (tên khác, `conflictBehavior` khác) kèm `@microsoft.graph.sourceUrl` trỏ về session. Với file 50 GB, "sửa tên rồi commit lại" vs "upload lại từ đầu" là khác biệt giữa sản phẩm dùng được và không.

Hệ quả thiết kế: **kiểm tra conflict/quota ở CẢ hai đầu** — lúc initiate (fail nhanh, tiết kiệm băng thông; Graph trả `507` nếu `fileSize` vượt quota) và lúc commit (bắt race — thế giới thay đổi trong lúc upload).

### 5.4 Commit metadata phải là một thao tác giao dịch đơn lẻ

Nếu commit của bạn gồm "insert DB + publish Kafka + update quota" thì cần **transactional outbox** hoặc chấp nhận trạng thái không nhất quán. Google gộp mọi thứ về một điểm atomic duy nhất (record metadata trỏ tới blob handle — blob đã bền từ trước).

---

## 6. Integrity — toàn vẹn dữ liệu

### 6.1 Chọn thuật toán

| Thuật toán | Ai dùng | Đặc tính quyết định |
|---|---|---|
| **CRC32C** | Google (khuyến nghị chính thức duy nhất) | **Composable** (CRC(A‖B) tính được từ CRC(A), CRC(B)) → điều kiện tiên quyết cho multipart/compose; hardware instruction (SSE4.2/ARM64); JDK 9+ có sẵn `java.util.zip.CRC32C` |
| MD5 | Cả hai, hạn chế | Không composable → GCS composite object **mất MD5 hoàn toàn**; chỉ còn giá trị transport check per-block |
| **QuickXorHash** | Microsoft (mẫu số chung duy nhất mọi loại OneDrive) | 160-bit non-crypto, XOR + rotate 11 bit → tính **song song/incremental trên từng chunk rồi gộp** — lý do họ không dùng SHA. Là detection tool, không phải security tool |

### 6.2 Verify ở đâu — điểm khác biệt lớn nhất giữa hai hãng

- **Azure**: validate **per-block lúc ghi** (`Content-MD5` hoặc `x-ms-content-crc64` → sai là `400` ngay). Hash toàn blob (`x-ms-blob-content-md5`) chỉ là metadata tự khai, service không validate.
- **GCS**: **chỉ validate toàn object khi hoàn tất** — "You can't perform integrity checks on intermediate portions or chunks of a resumable upload." File 5 TB hỏng ở chunk 3 → chỉ biết khi gửi xong chunk cuối → fail toàn bộ.

→ **Verify per-chunk là chỗ hệ thống nhỏ làm TỐT HƠN Google được**: lưu checksum từng part trong session state là chuyện nhỏ ở quy mô thường, và phát hiện hỏng ở GB thứ 3 thay vì GB thứ 100 là khác biệt UX rất lớn.

### 6.3 Checksum là precondition, không chỉ là metadata

GCS: *"only create the object if the hash you provided matches"* — client gửi checksum trước/kèm upload, server tính lại, **sai thì từ chối tạo object** (`400`). Integrity check trở thành một phần của giao dịch commit. Đặc biệt quan trọng vì cơ chế "bỏ qua âm thầm byte gửi lại ở offset đã persist" của GCS che giấu bug offset — **checksum cuối là lưới an toàn duy nhất**.

### 6.4 Integrity là tiến trình liên tục, không phải sự kiện một lần

- Checksum lưu **ở tầng metadata, tách khỏi blob** (SharePoint lưu 2 hash: hash file logic + hash ciphertext của blob).
- **Verify ở mọi lần đọc**, không chỉ lúc ghi (SharePoint, Azure CRC mọi block read; Colossus Custodians quét nền vĩnh viễn, tự sửa từ parity).
- **Job đối soát DB ↔ object store định kỳ** (SharePoint: 14 ngày, khôi phục qua soft-delete nếu blob thiếu). Sẽ luôn có case metadata ghi thành công nhưng blob mất, hoặc ngược lại.
- Thiết kế field `checksums: {crc32c, md5?, sha256?}` dạng mở — đừng để API phụ thuộc một loại hash duy nhất (composite object của GCS mất MD5 đã làm vỡ code của rất nhiều người).

---

## 7. Security

### 7.1 Mô hình cấp quyền cho endpoint nhận byte

Hai pattern chính thức (Microsoft tự vẽ trong docs):
1. **Front-end proxy**: mọi byte qua service của bạn — validate/audit được, nhưng đắt và khó scale.
2. **Credential provider**: service nhẹ chỉ auth + phát presigned URL/session URL, client ghi thẳng vào storage — rẻ, scale tốt, **không audit được**.
3. Thực tế: **hybrid** — initiate/commit qua service (control plane), bytes đi thẳng (data plane).

Checklist cho credential (từ cả GCS Signed URL V4 lẫn Azure SAS):
- Khóa chặt **method + path + headers đã ký** (canonical request) — client không đổi PUT thành DELETE được.
- TTL ngắn cho bước initiate (vài phút); xử lý clock skew (Azure khuyên lùi start time 15 phút).
- Giới hạn `Content-Length` nếu được — presigned write URL không giới hạn size là lời mời upload 200 GB phá chi phí.
- Có đường **revoke** (Graph: `DELETE uploadUrl`; Azure: stored access policy).

### 7.2 Quota / limit — kiểm ở đâu

- **Initiate**: bắt khai size (`X-Upload-Content-Length` / `fileSize`) → từ chối sớm trước khi nhận byte nào (Graph trả `507 Insufficient Storage`). Nhận 5 GB rồi mới báo vượt quota là lãng phí băng thông + phá UX.
- **Commit**: kiểm lại lần nữa (bắt race).
- **Resume**: re-check quyền mỗi lần (session sống nhiều ngày).
- Không tin `Content-Type` client khai — Google có content-type sniffing phía server (Scotty).

### 7.3 Malware scanning — cả hai hãng đều làm giống nhau

| Quyết định | Google Drive | OneDrive/SharePoint |
|---|---|---|
| Thời điểm quét | **Lazy** — khi download/share | **Async sau upload**, heuristics chọn file; download file chưa quét → trigger quét trước |
| Chặn upload chờ quét? | Không | Không |
| File quá lớn | >100 MB: không quét, cảnh báo, **vẫn cho tải** (fail-open) | Defender for Storage: ≤50 GB, timeout 30ph–3h → "Scan timed out" |
| File nhiễm | Cảnh báo khi tải, user bỏ qua được; abuse → restrict share | **Mặc định vẫn cho tải** kèm cảnh báo; switch `DisallowInfectedFileDownload` để chặn hẳn |

**Cảnh báo quan trọng nhất cho kiến trúc chunked upload** (Microsoft Defender, nguyên văn): *"Detection might fail when a file is uploaded in fragments. Header-only fragments are marked as corrupt, while tail-only fragments might appear benign. **Scan data before chunking or after reassembly**."* → Quét từng chunk riêng lẻ là bug bảo mật, không phải tối ưu.

Thiết kế chuẩn: trạng thái `UPLOADED → SCANNING → CLEAN | FLAGGED` trên metadata, **enforce ở đường download**, quyết định fail-open/fail-closed một cách có ý thức và ghi vào tài liệu. Lưu ý thêm: sync client có thể đã kéo file về máy trước khi nó bị đánh dấu nhiễm → cần cơ chế thu hồi.

### 7.4 Rate limiting nhiều chiều (mô hình SharePoint — chi tiết nhất công khai)

- Giới hạn theo **request count** (3.000/5 phút/user) VÀ theo **ingress băng thông** (50 GB/giờ/user, 400 GB/giờ/app) — một client ít request vẫn có thể chiếm hết băng thông.
- **Resource Units có trọng số**: upload/write = 2 RU, read = 1 RU, permission ops = 5 RU.
- `Retry-After` trên mọi response throttle; *"throttled requests count towards usage limits"* → retry hung hăng làm mọi thứ tệ hơn; honor **max**(Retry-After, backoff tự tính).
- **Tín hiệu sớm** `RateLimit-Limit/Remaining/Reset` khi chạm 80% quota — cho client tự điều tiết trước khi bị 429.
- Traffic decoration (`User-Agent: ISV|Company|App/Version`) được **ưu tiên** — cơ chế nhận diện app đáng copy.

---

## 8. Reliability — retry, idempotency, lỗi

### 8.1 Phân loại lỗi (copy nguyên được)

| Nhóm | Google | Microsoft | Hành động |
|---|---|---|---|
| Retryable | `408`, `429`, `5xx`, socket timeout/TCP disconnect | `5xx`, đứt kết nối | Exponential backoff + jitter: `min(2^n + rand(0–1000ms), 32–64s)` |
| Throttle | `403 rate limit` / `429` + `Retry-After` | `429`/`503` + `Retry-After` | Chờ max(Retry-After, backoff) |
| Session chết | Drive: **mọi 4xx** → session mới; GCS: `410`/`404` | `404` | Restart từ đầu — client phải hiểu đây là hành vi đúng |
| Retry thừa | Byte đã persist → bỏ qua âm thầm | `416` tường minh → `GET status` để tự sửa | Cả hai đều an toàn; 416 lộ bug sớm hơn |
| Lỗi khác (4xx logic) | Không retry | Retry **có giới hạn, không backoff mũ** | Sửa nguyên nhân |

### 8.2 Quy tắc bất biến

- **Server là nguồn chân lý duy nhất về offset/ranges.** Google nguyên văn: *"you should not assume that the server received all bytes sent in any given request."* Client không bao giờ tự tăng offset — luôn đọc từ response; sau mọi gián đoạn phải query status trước khi gửi tiếp.
- **Fragment đứt giữa chừng = bỏ toàn bộ fragment đó** (all-or-nothing mức fragment — Microsoft) — đơn giản hơn nhiều so với ghi nhận partial.
- **Một session = một writer.** Cả hai hệ đều không có locking/fencing trong protocol; 2 client chung session là lỗi sử dụng. Cần song song → part ID độc lập thứ tự + commit list (mô hình block blob).
- **Part identifier nên là ID do client chọn, không phải byte offset.** `Put Block` idempotent vô điều kiện theo blockId; Graph (offset-based) phải trả 416 + bắt client tự sửa — thiết kế block ID tốt hơn cho retry.
- Ngay cả Google cũng không thống nhất được max-retry-attempts giữa các client library (3/6/vô hạn) → đây là tham số phải tune theo ngữ cảnh, không có con số "đúng".

---

## 9. Post-processing — sau khi commit

### 9.1 Những gì hai hãng làm sau upload

Drive: thumbnail, extract media metadata (`videoMediaMetadata`), transcode cho player, full-text indexing, conversion sang Workspace format, virus scan lazy. OneDrive: blob + metadata + versioning (500 versions), malware scan async, thumbnail/preview (ngưỡng: không tạo cho file >100 MB), search indexing, delta feed cho sync client, data integrity job 14 ngày.

### 9.2 Anti-pattern của Google — chỗ phải làm NGƯỢC LẠI

Drive API **không có field trạng thái xử lý** (`processingState` không tồn tại). Client phải polling mù và suy trạng thái từ sự *vắng mặt* của field (`hasThumbnail == false` = "đang xử lý" HAY "loại file không hỗ trợ"? — không phân biệt được). Pipeline thumbnail còn bị ghi nhận **kẹt vĩnh viễn** cho tới khi có sự kiện ngoài (user mở video) kích lại.

Thiết kế đúng:
- **Enum trạng thái tường minh**: `UPLOADING → UPLOADED → PROCESSING → READY | FAILED` + `processingError` khi FAILED.
- **Phân biệt "chưa xong" với "không áp dụng"** (video đang transcode ≠ file .zip không có preview).
- File **visible ngay sau commit** với `status=PROCESSING` — không chặn visibility chờ post-processing.
- Worker có **retry + dead-letter queue + alert** — không hy vọng vào sự kiện tình cờ.
- **Push (WebSocket/SSE/event) thay vì bắt client polling** khi xử lý xong.
- **Ngưỡng cứng tường minh** cho xử lý tốn kém (Google: không thumbnail >50 MB Cloud Search, không scan >100 MB; Microsoft: không preview >100 MB) — có giới hạn rõ tốt hơn hành vi không xác định; không có ngưỡng = một file 4 GB nghẽn cả worker pool.

---

## 10. CHECKLIST TỔNG — toàn bộ vấn đề phải giải quyết

Hợp nhất từ 2 báo cáo (Google: 60+ vấn đề nhóm A–I; Microsoft: 84 vấn đề nhóm A–I). Đây là danh sách để rà khi thiết kế — mỗi mục là một quyết định phải đưa ra một cách có ý thức.

### Protocol & API
- [ ] Ngưỡng simple upload vs resumable (công thức: băng thông × thời gian chấp nhận mất; tham chiếu 5–10 MiB)
- [ ] Tách metadata file khỏi metadata HTTP request (header riêng cho size/MIME của file)
- [ ] Bắt khai tổng size ở initiate (quota check sớm, phát hiện client sai)
- [ ] Tránh phụ thuộc `308`/`Content-Range` nếu hạ tầng có proxy/CDN/WAF (giao thức header-only + HTTP 200)
- [ ] Offset semantics không có bẫy off-by-one (trả "số byte đã nhận", không phải "chỉ số byte cuối")
- [ ] Finalize tường minh (không suy diễn từ "đủ N byte")
- [ ] Server công bố chunk granularity/quantum, không hard-code ở client
- [ ] Tiến độ dạng danh sách range (mở đường song song), không hứa liệt kê đủ
- [ ] `GET session status` — trả CẢ "đang ở offset X" LẪN "đã commit xong" (chống double-upload khi mất response)
- [ ] `DELETE session` (cancel tường minh)
- [ ] Upload không biết trước tổng size (streaming) — có hỗ trợ không?

### Session
- [ ] Session URL/token = bearer credential: HTTPS only, không log, scope 1 file đích, chỉ ghi
- [ ] TTL: sliding cho transfer + trần cứng; tách token commit (ngắn) khỏi session transfer (dài)
- [ ] Client phải persist session URL (mất = làm lại từ đầu — nói rõ trong docs)
- [ ] Chốt quyền tại initiate + re-check tại mỗi resume
- [ ] Phân biệt lỗi "session hết hạn gần đây" vs "không tồn tại" (410 vs 404)
- [ ] Trạng thái session trong KV store bền, tách khỏi metadata DB; byte staging trên storage bền ngay
- [ ] Sticky-routing/redirect session về đúng node giữ dữ liệu dở (client phải follow)
- [ ] Một session = một writer; từ chối ghi lệch thứ tự/chồng lấn một cách xác định

### Storage & staging
- [ ] Control plane không nằm trên đường đi của byte (API server không proxy file lớn)
- [ ] Staging bất khả kiến: chưa commit thì reader/list không bao giờ thấy
- [ ] Part ID do client chọn (idempotent) thay vì byte offset
- [ ] Giới hạn số part/kích thước part (tham chiếu S3: 10.000 parts, 5 MiB–5 GiB; Azure: 50k blocks)
- [ ] GC staging bỏ dở: TTL trượt (~7 ngày) + lifecycle rule trên MinIO/S3 + job quét; chấp nhận GC bất đồng bộ
- [ ] Blob bất biến + metadata mutable, nối bằng handle; version mới = blob mới (append-only)
- [ ] Định nghĩa "durable" và thời điểm ack: sync replication trong phạm vi nào trước khi trả 200?
- [ ] File mới lên tier nhanh (hot) → hạ tier sau N ngày
- [ ] Chi phí staging (tier nào, ai trả) — Azure tính Put Block theo default tier

### Commit & consistency
- [ ] Commit atomic all-or-nothing; ghi đè = atomic swap; read-after-write consistent
- [ ] Idempotency: pre-generated ID (retry lần 2 → 409) và/hoặc conditional write (`If-None-Match: *`, `If-Match: etag` → 412)
- [ ] Conflict tên + quota check ở CẢ initiate LẪN commit; policy cho client chọn (`fail|replace|rename`)
- [ ] Commit fail → GIỮ session + bytes, cho commit lại với metadata mới (không bắt upload lại)
- [ ] Commit metadata = một giao dịch đơn; nếu kèm publish event → transactional outbox
- [ ] Trả full resource (id, size, checksums, etag) trong response commit
- [ ] Crash giữa finalize: mọi nhánh (đã commit/chưa commit/mất response) đều recovery được qua query-status

### Integrity
- [ ] Chọn checksum composable + hardware-accelerated (CRC32C; cân nhắc xxHash/BLAKE3)
- [ ] Verify per-part lúc ghi (sai → 400 ngay) — làm tốt hơn GCS
- [ ] Checksum toàn file là precondition của commit, không chỉ metadata
- [ ] Lưu hash ở tầng metadata (tách khỏi blob); field checksums dạng mở nhiều thuật toán
- [ ] Verify khi đọc + job đối soát DB ↔ object store định kỳ (tham chiếu: 14 ngày) + đường khôi phục (soft-delete)

### Security
- [ ] Chọn pattern: proxy byte (audit được, đắt) vs presigned/credential provider (rẻ, không audit được) vs hybrid
- [ ] Credential khóa method+path+headers, TTL ngắn, revoke được, giới hạn size
- [ ] Malware scan ASYNC trên file ĐÃ RÁP LẠI (không quét từng chunk); status scan trên metadata; enforce ở download; quyết định fail-open/fail-closed; ngưỡng size + timeout scan; cơ chế thu hồi file đã sync
- [ ] Không tin Content-Type client khai (server-side sniffing/validation)
- [ ] Validate dữ liệu SAU khi client ghi qua presigned URL, TRƯỚC khi dùng
- [ ] Mã hóa: TLS bên ngoài, mTLS nội bộ; lưu ý mã hóa per-tenant giết dedup cross-tenant (đánh đổi có chủ đích)

### Throttling & chống lạm dụng
- [ ] Rate limit nhiều chiều: request count VÀ ingress bytes, theo user VÀ theo app
- [ ] Chi phí có trọng số (upload đắt hơn read)
- [ ] `Retry-After` trên mọi response throttle; request bị throttle vẫn tính quota (ghi rõ)
- [ ] Tín hiệu sớm RateLimit-* headers; ghi đè cùng object key bị giới hạn (GCS: 1 write/s/key)
- [ ] Chặn session "nhỏ giọt" giữ tài nguyên mãi; giới hạn số session mở/user

### Reliability
- [ ] Bảng phân loại lỗi: retryable-backoff / throttle-RetryAfter / session-dead-restart / logic-4xx
- [ ] Backoff: `min(2^n + jitter, 32–64s)` — jitter bắt buộc
- [ ] Server là nguồn chân lý offset; query status sau mọi gián đoạn
- [ ] Fragment đứt giữa chừng = vứt cả fragment (all-or-nothing mức part)
- [ ] Hành vi tường minh khi retry phần đã nhận (ignore im lặng + checksum cuối, hoặc 416 + GET status)
- [ ] Tách cơ chế resumable (mạng đứt, 1 writer) khỏi cơ chế parallel (throughput, nhiều part)

### Post-processing
- [ ] Trạng thái tường minh `UPLOADING→UPLOADED→PROCESSING→READY|FAILED` + lý do lỗi (vượt Google ở điểm này)
- [ ] Visible ngay sau commit (không chặn chờ xử lý); phân biệt "chưa xong" vs "không áp dụng"
- [ ] Worker: retry + DLQ + alert (pipeline kẹt phải tự phát hiện, không chờ user "mở video")
- [ ] Push event khi xong thay vì bắt polling
- [ ] Ngưỡng cứng cho xử lý tốn kém (no-thumbnail > X MB…)
- [ ] Versioning + retention + soft-delete nhiều tầng

### Giới hạn nghiệp vụ phải chốt sớm
- [ ] Max file size (Drive 5 TB / OneDrive 250 GB — của bạn?); max ingress/user/ngày (Drive: 750 GB)
- [ ] Tên file: ký tự cấm, độ dài path, case sensitivity
- [ ] Số item/folder; giới hạn share/permission

---

## 11. Hướng thiết kế đề xuất cho FileSharing (WebFlux + Redis + MinIO + Kafka)

Map trực tiếp các kết luận trên vào stack hiện có:

```
[React client]
    │ 1. POST /api/uploads (filehandler :5000, JWT)     ← INITIATE: auth, quota,
    │    body: {name, size, mimeType, folderId, crc32c?}   conflict check, sinh assetId
    │    ← {sessionId, uploadUrl, partSize, expiresAt}      (= pre-generated ID)
    ▼
[filesharing-uploadservice :8080 — WebFlux, data plane]
    │ 2. PUT {uploadUrl}/parts/{partNumber} (+checksum per-part)
    │    - session state trong Redis (đích, size, parts đã nhận, expiry TRƯỢT)
    │    - byte stream thẳng vào MinIO multipart part (DataBuffer, không load heap)
    │    - verify checksum part ngay → sai trả 400
    │    ← {receivedParts, nextExpected, expiresAt}
    │ 3. GET  /session  → trạng thái (kể cả "đã commit")
    │    DELETE /session → abort multipart + xóa Redis
    ▼
    │ 4. POST /complete                                  ← COMMIT
    │    - verify đủ part + checksum toàn file (precondition)
    │    - MinIO CompleteMultipartUpload (atomic, invisible trước đó)
    │    - ghi Asset vào MongoDB: status=PROCESSING, checksums, blobKey
    │      + outbox record → Kafka (image_process_topic / video_encode_topic)
    │    ← full Asset resource
    ▼
[Kafka workers] → xử lý → result topic → filehandler update status READY|FAILED
                                        → push event/SSE cho client
```

Quyết định cụ thể theo từng mục ở trên:

| Vấn đề | Lựa chọn đề xuất |
|---|---|
| Data plane | Client → uploadservice → MinIO multipart. KHÔNG cho byte đi qua filehandler (Spring MVC). Giai đoạn 2 có thể chuyển sang presigned part URL của MinIO để bỏ luôn proxy byte |
| Part model | Part number do client/server thoả thuận (idempotent kiểu `Put Block`) — retry part = ghi đè, an toàn vô điều kiện. Lưu ý ràng buộc S3/MinIO: part 5 MiB–5 GiB, ≤10.000 parts |
| Session state | Redis hash `upload:session:{id}`: đích, userId, size khai báo, parts đã nhận + checksum từng part, expiry trượt (gia hạn mỗi part), trần cứng 7 ngày |
| GC | MinIO lifecycle rule `AbortIncompleteMultipartUpload` 7 ngày + scheduled job đối soát Redis ↔ MinIO ↔ MongoDB |
| Idempotency | `assetId` sinh ở initiate (pre-generated ID); complete lần 2 trả 409; insert Mongo dùng unique index trên assetId |
| Integrity | CRC32C (`java.util.zip.CRC32C`): per-part verify lúc nhận + toàn file làm precondition ở complete; lưu `checksums{}` trong Asset; cron đối soát hàng tuần |
| Commit + Kafka | Transactional outbox trong MongoDB (insert Asset + outbox trong 1 transaction; relay publish Kafka) — tránh "Mongo ghi xong, Kafka publish fail" |
| Malware scan | Nếu làm: worker riêng đọc file ĐÃ RÁP từ MinIO (không quét part), status SCANNING/CLEAN/FLAGGED trên Asset, enforce ở endpoint download |
| Status | Enum tường minh trên Asset: `UPLOADING/UPLOADED/PROCESSING/READY/FAILED` + `processingError` — worker có DLQ |
| Rate limit | Đếm cả số request lẫn ingress bytes theo user (tham chiếu 50 GB/giờ/user); `Retry-After` trên 429 |

---

## 12. Những điều KHÔNG xác minh được (trung thực về giới hạn research)

1. **Kiến trúc nội bộ "Scotty"** của Google — chỉ có 1 comment trong source `gdata-java-client` xác nhận tên tồn tại + content-type sniffing; mọi mô tả kiến trúc là suy luận.
2. **Giao thức chính xác của web UI** drive.google.com / onedrive.live.com — không có HAR dump công khai đáng tin; cần tự capture DevTools (Network tab → upload file ~50 MB → xem request `X-Goog-Upload-Command: start` hoặc `createUploadSession`).
3. **Nơi lưu session state** phía server của cả hai — suy đoán từ ràng buộc, không có docs.
4. **`expirationDateTime` ban đầu của Graph session** (~15 phút theo cộng đồng) — Microsoft chưa bao giờ trả lời chính thức.
5. **Lý do con số 320 KiB** của Microsoft — không nguồn nào giải thích.
6. **Dedup cross-tenant** — không hãng nào xác nhận; với OneDrive có lập luận mạnh là KHÔNG (blob hash tính trên ciphertext → mã hóa per-tenant giết dedup).
