# Nghiên cứu hệ thống upload file của Microsoft
## OneDrive (web) + Microsoft Graph API + Azure Blob Storage — trọng tâm kiến trúc backend & blob storage

> **Phạm vi**: tập trung vào protocol, upload session, blob/backend, finalize, integrity, security, reliability, dedup/delta & post-processing. Bỏ qua chi tiết client-side chunking và UI.
>
> **Quy ước ghi nhãn trong mỗi mục:**
> - **(a) XÁC NHẬN** — có nguồn chính thức của Microsoft (learn.microsoft.com, paper SOSP 2011 do Microsoft công bố).
> - **(b) SUY ĐOÁN / NGUỒN KHÔNG CHÍNH THỨC** — từ source code bên thứ ba (rclone), blog, Q&A, hoặc suy luận kiến trúc.
> - **(c) BÀI HỌC** — rút ra cho người tự xây upload service.
>
> **Ngày nghiên cứu**: 2026-08-01.

---

## Bảng tóm tắt số liệu quan trọng (cheat sheet)

| Hạng mục | Giá trị | Nguồn |
|---|---|---|
| Simple upload `PUT /content` (Graph v1.0) | ≤ 250 MB | [driveitem-put-content](https://learn.microsoft.com/en-us/graph/api/driveitem-put-content) |
| Simple upload (doc OneDrive dev center) | < 4 MB | [rest-api/concepts/upload](https://learn.microsoft.com/en-us/onedrive/developer/rest-api/concepts/upload?view=odsp-graph-online) |
| Khuyến nghị dùng resumable upload | file > 10 MiB (10,485,760 bytes) | [createUploadSession § Best practices](https://learn.microsoft.com/en-us/graph/api/driveitem-createuploadsession) |
| Kích thước 1 fragment PUT tối đa | < 60 MiB | như trên |
| Fragment phải là bội số của | **320 KiB = 327,680 bytes** | như trên |
| Fragment size tối ưu khuyến nghị | 5–10 MiB | như trên |
| File tối đa OneDrive/SharePoint | 250 GB | [Restrictions and limitations](https://support.microsoft.com/en-us/office/restrictions-and-limitations-in-onedrive-and-sharepoint-64883a5d-228e-48f5-b3d2-eb39e07630fa) |
| Azure block blob: max block size | 4,000 MiB (API ver ≥ 2019-12-12) | [Put Block](https://learn.microsoft.com/en-us/rest/api/storageservices/put-block) |
| Azure block blob: max committed blocks | 50,000 | như trên |
| Azure block blob: max uncommitted blocks | 100,000 (vượt → 409) | như trên |
| Azure block blob: max blob size | ~190.7 TiB | như trên |
| Azure `Put Blob` (1 request) tối đa | 5,000 MiB | như trên |
| GC uncommitted blocks | **1 tuần (7 ngày)** kể từ `Put Block` thành công cuối | như trên |
| WAS stream layer: max block | 4 MB | [SOSP 2011](https://www.sigops.org/s/conferences/sosp/2011/current/2011-Cascais/11-calder-online.pdf) |
| WAS stream layer: max extent | 1 GB | như trên |
| Intra-stamp replication | **3 bản đồng bộ**, ack khi cả 3 xong | như trên |
| SPO throttling: user requests | 3,000 / 5 phút | [Avoid throttling in SPO](https://learn.microsoft.com/en-us/sharepoint/dev/general-development/how-to-avoid-getting-throttled-or-blocked-in-sharepoint-online) |
| SPO throttling: user ingress | 50 GB / giờ | như trên |
| SPO throttling: per-app-per-tenant ingress | 400 GB / giờ | như trên |
| Chi phí resource unit của thao tác upload | 2 RU | như trên |

---

# 1. PROTOCOL

## 1.1 Luồng chuẩn của Microsoft Graph `createUploadSession`

### (a) XÁC NHẬN

**Bước 1 — Tạo session.** Client `POST` tới một trong các endpoint sau (kèm `Authorization: Bearer {token}`):

```http
POST /drives/{driveId}/items/{parentItemId}:/{fileName}:/createUploadSession   # tạo file mới
POST /drives/{driveId}/items/{itemId}/createUploadSession                       # ghi đè file có sẵn
POST /me/drive/items/{parentItemId}:/{fileName}:/createUploadSession
POST /sites/{siteId}/drive/items/{parentItemId}:/{fileName}:/createUploadSession
```

Request body (tất cả optional):

```json
{
  "item": {
    "@microsoft.graph.conflictBehavior": "fail (default) | replace | rename",
    "name": "filename.txt",
    "description": "…",          // chỉ OneDrive Personal
    "fileSize": 1234,            // chỉ OneDrive Personal
    "driveItemSource": { … },
    "mediaSource": { … }
  },
  "deferCommit": true
}
```

Header optional: `if-match` / `if-none-match` với etag/ctag — không khớp → `412 Precondition Failed`.

Response: `200 OK` + resource `uploadSession`:

```json
{
  "uploadUrl": "https://sn3302.up.1drv.com/up/fe6987415ace7X4e1eF866337",
  "expirationDateTime": "2015-01-29T09:21:55.523Z"
}
```

Nguồn: <https://learn.microsoft.com/en-us/graph/api/driveitem-createuploadsession>

**Bước 2 — PUT từng fragment.**

```http
PUT https://sn3302.up.1drv.com/up/fe6987415ace7X4e1eF866337
Content-Length: 26
Content-Range: bytes 0-25/128

<bytes 0-25 của file>
```

- `Content-Length` = kích thước request hiện tại.
- `Content-Range: bytes {start}-{end}/{total}` — **tổng kích thước file phải giống hệt nhau ở MỌI request**; nếu một byte range khai báo total khác → request fail.
- **Phải biết trước tổng kích thước file** trước khi upload fragment đầu tiên.
- **Fragment phải upload tuần tự, đúng thứ tự.** Upload lệch thứ tự → lỗi.
- Mỗi request tối đa < 60 MiB.
- Mỗi byte range **BẮT BUỘC** là bội số của 320 KiB (327,680 bytes) nếu file bị chia nhiều mảnh. Doc ghi rõ: *"Using a fragment size that doesn't divide evenly by 320 KiB results in errors committing some files"* — tức lỗi xảy ra **ở bước commit**, không phải ở bước gửi.

**Bước 3 — Phản hồi 202 và `nextExpectedRanges`.**

```http
HTTP/1.1 202 Accepted
{
  "expirationDateTime": "2015-01-29T09:21:55.523Z",
  "nextExpectedRanges": ["26-"]
}
```

**Bước 4 — Fragment cuối = commit.** Nếu `deferCommit` false/unset, PUT byte range cuối cùng sẽ tự động hoàn tất upload; server trả `201 Created` (hoặc `200 OK`) kèm **body là driveItem** (id, name, size, file facet…).

### 1.2 `nextExpectedRanges` — cách dùng

### (a) XÁC NHẬN

- Là một **String collection**, format `"start-end"` (zero-indexed), ví dụ `"0-26"` nghĩa là 27 byte đầu tiên. Nguồn: [uploadSession resource](https://learn.microsoft.com/en-us/graph/api/resources/uploadsession).
- **CÓ THỂ có nhiều range** — biểu thị các phần server chưa nhận:

```json
{
  "expirationDateTime": "…",
  "nextExpectedRanges": ["12345-55232", "77829-99375"]
}
```

- **Cảnh báo quan trọng của Microsoft**: *"The **nextExpectedRanges** property doesn't always list all of the missing ranges."* — nó **không đảm bảo liệt kê đủ** mọi khoảng thiếu.
- Sau khi ghi fragment thành công, server thường trả dạng open-ended `"523-"` (từ 523 đến hết).
- Microsoft nhấn mạnh: **KHÔNG được coi `nextExpectedRanges` là gợi ý kích thước fragment**. Nó chỉ nói "phần nào chưa nhận", không phải "nên gửi bao nhiêu".
- Với Outlook attachment (không phải driveItem), `nextExpectedRanges` luôn là **một giá trị đơn `"{start}"`**, không phải range.

### 1.3 `@microsoft.graph.conflictBehavior`

### (a) XÁC NHẬN

Ba giá trị:

| Giá trị | Ý nghĩa |
|---|---|
| `fail` | **Mặc định** — nếu trùng tên thì fail |
| `replace` | Ghi đè file trùng tên |
| `rename` | Tự đổi tên (ví dụ `file (1).txt`) |

Đặt trong `item` khi tạo session, và **có thể đặt lại** khi commit lại session bị lỗi (xem §4).

### 1.4 OneDrive bản web thực tế dùng gì?

### (a) XÁC NHẬN

- `uploadUrl` trả về thuộc domain riêng biệt, **không phải `graph.microsoft.com`** — ví dụ chính thức trong doc là `https://sn3302.up.1drv.com/up/…`. Đây là một storage front-end riêng, tách khỏi API gateway.
- URL roots chính thức của OneDrive API:
  - OneDrive Personal: `https://api.onedrive.com/v1.0`
  - OneDrive for Business: `https://{tenant}-my.sharepoint.com/_api/v2.0`
  Nguồn: [OneDrive dev center — resumable upload / URL roots](https://learn.microsoft.com/en-us/onedrive/developer/rest-api/api/driveitem_createuploadsession?view=odsp-graph-online).
- OneDrive for Business/SharePoint **còn** một protocol chunked upload thứ hai, cũ hơn, dựa trên CSOM/REST của SharePoint: `File.StartUpload(uploadId, stream)` → `File.ContinueUpload(uploadId, fileOffset, stream)` → `File.FinishUpload(uploadId, fileOffset, stream)` → `File.CancelUpload(uploadId)`. Session được định danh bằng **GUID `uploadId`** và con trỏ **`fileOffset`** (không phải Content-Range). Ví dụ endpoint REST: `{siteUrl}/_api/web/GetFileById('{fileId}')/ContinueUpload(uploadId=guid'{uploadId}',fileOffset={start})`.
  - `CancelUpload` được mô tả chính thức: *"Stops the chunk upload session without saving the uploaded data. If the file doesn't already exist in the library, the partially updated file will be deleted."* Nguồn: [File.CancelUpload](https://learn.microsoft.com/en-us/previous-versions/office/sharepoint-server/dn760920(v=office.15)).
  - Bắt buộc chunk khi upload file > 250 MB qua SharePoint REST/CSOM.

### (b) SUY ĐOÁN / NGUỒN KHÔNG CHÍNH THỨC

- **OneDrive web UI gần như chắc chắn KHÔNG gọi `graph.microsoft.com` public.** Nó gọi API nội bộ cùng họ (`/_api/v2.0` hoặc `/_api/v2.1` trên `{tenant}-my.sharepoint.com`, hoặc `api.onedrive.com` / `my.microsoftpersonalcontent.com` cho consumer) — nhưng **cùng một hình dạng protocol**: `createUploadSession` → `uploadUrl` → `PUT` với `Content-Range` → `nextExpectedRanges`. Bằng chứng gián tiếp: (i) doc chính thức liệt kê chính các URL root này; (ii) `uploadUrl` trong doc trỏ tới `*.up.1drv.com` — hạ tầng upload dùng chung cho cả web và API; (iii) không tìm thấy tài liệu công khai nào mô tả một protocol thứ ba riêng cho web.
- Không tìm thấy tài liệu công khai xác nhận web UI dùng `deferCommit`.

### 1.5 Ngưỡng chuyển từ simple PUT sang upload session

### (a) XÁC NHẬN — **có mâu thuẫn giữa các trang doc chính thức**

| Nguồn | Ngưỡng nói |
|---|---|
| [Graph v1.0 `driveItem: PUT /content`](https://learn.microsoft.com/en-us/graph/api/driveitem-put-content) | *"This method only supports files up to 250 MB in size."* |
| [OneDrive dev center — Uploading files](https://learn.microsoft.com/en-us/onedrive/developer/rest-api/concepts/upload?view=odsp-graph-online) | *"Simple item upload is available for items with less than 4 MB of content."* |
| [createUploadSession § Best practices](https://learn.microsoft.com/en-us/graph/api/driveitem-createuploadsession) | *"Use resumable file transfers for files larger than 10 MiB (10,485,760 bytes)."* |

Cách đọc hợp lý: **4 MB** là ngưỡng an toàn lịch sử/bảo thủ, **250 MB** là giới hạn cứng hiện tại của endpoint đơn giản, **10 MiB** là ngưỡng *khuyến nghị vận hành* để chuyển sang resumable (vì trên mức đó xác suất đứt kết nối làm hỏng cả lần upload trở nên đáng kể).

Có 4 API upload cho OneDrive:
1. **Simple item upload** — `PUT …/content`
2. **Resumable item upload** — `createUploadSession`
3. **Multipart item upload** — nội dung + metadata trong 1 call, **chỉ OneDrive Personal**
4. **Upload from URL (preview)** — server tự tải từ URL, **chỉ OneDrive Personal**

### (c) BÀI HỌC cho người tự xây upload service

- **Đặt tổng kích thước file vào protocol ngay từ đầu** (`Content-Range: bytes a-b/TOTAL`). Việc biết trước total cho phép server pre-allocate, kiểm tra quota sớm, và phát hiện client gửi sai (khai báo total khác nhau → reject ngay).
- **Trả `nextExpectedRanges` dạng danh sách, không phải một con số offset.** Một con số offset ép protocol phải tuần tự tuyệt đối; danh sách range cho phép mở rộng sang upload song song sau này mà không đổi protocol.
- **Định nghĩa một "hạt" (quantum) kích thước chunk và ép client tuân thủ** (Microsoft chọn 320 KiB). Điều này cho phép backend map chunk → block/extent một cách xác định, tránh phải xử lý các đường biên lẻ.
- **Tách endpoint tạo session (có auth, có business logic) khỏi endpoint nhận bytes (pre-authenticated, tối ưu throughput).** Đây là quyết định kiến trúc lớn nhất trong thiết kế của Microsoft.
- **Có ít nhất 2 đường: simple PUT cho file nhỏ, session cho file lớn.** Bắt file 50 KB đi qua 3 round-trip (create session → PUT → commit) là lãng phí nghiêm trọng.

---

# 2. UPLOAD SESSION

## 2.1 `uploadUrl` là pre-authenticated URL

### (a) XÁC NHẬN

- Doc ghi rõ: *"When a session is created and generates **preauthenticated** upload URLs, the upload URL can be used to complete the upload within a time window sufficient for large files."*
- **KHÔNG được gửi `Authorization` header khi PUT**: *"If you include the `Authorization` header when issuing the PUT call, it might result in an `HTTP 401 Unauthorized` response. Only include the `Authorization` header and bearer token when issuing the POST request during the first step."*

**Rủi ro bảo mật (phân tích):**

| Đặc điểm | Hệ quả |
|---|---|
| Toàn bộ credential nằm trong URL | Rò rỉ qua Referer header, access log của proxy/CDN, lịch sử browser, ảnh chụp màn hình, copy-paste |
| Bearer semantics | Ai cầm URL đều ghi được — không ràng buộc user/IP/device |
| Không có Authorization header | Không thể áp policy dựa trên token ở tầng gateway |

**Yếu tố giảm thiểu (do thiết kế của Microsoft):**
- Scope cực hẹp: **một session, một file đích, một drive** — không phải quyền ghi toàn bộ drive.
- Tự hết hạn (`expirationDateTime`).
- Revoke được ngay bằng `DELETE uploadUrl`.
- Không đọc được nội dung file (chỉ ghi + GET trạng thái range).

### 2.2 `expirationDateTime` — bao lâu?

### (a) XÁC NHẬN

Doc mô tả cơ chế **sliding expiration**:
- *"You must upload the next fragment or commit the session before the time specified in the **expirationDateTime** property."*
- *"**Each uploaded fragment extends the expiration time**, which allows large file uploads to be completed successfully. The updated expiration time is returned in every request to upload a file fragment."*
- *"If no fragments are received and the session isn't committed, **all previously uploaded fragments are discarded**."*
- Temp file + session **tự động được dọn sau khi `expirationDateTime` trôi qua**, nhưng *"Temporary files might not be deleted immediately after the expiration time has elapsed."*

**Microsoft KHÔNG công bố con số cụ thể trong doc.** Doc chỉ nói "một cửa sổ thời gian đủ cho file lớn".

### (b) SUY ĐOÁN / NGUỒN KHÔNG CHÍNH THỨC

- Nhiều báo cáo cộng đồng ghi nhận `expirationDateTime` ban đầu ≈ **15 phút** kể từ lúc tạo session, và uploads kéo dài > 1 giờ vẫn thành công nhờ sliding extension. Câu hỏi chính thức trên Microsoft Q&A ([Expiration Date & Time of Upload Session](https://learn.microsoft.com/en-us/answers/questions/852442/expiration-date-time-of-upload-session-created-via)) được Microsoft tiếp nhận (2022) nhưng **chưa bao giờ được trả lời** — không có xác nhận chính thức.
- **Không có giới hạn tổng thời gian tối đa của session được công bố.** Suy luận: chỉ cần client duy trì nhịp gửi fragment đều đặn thì session sống mãi.

### 2.3 Resume sau khi client mất trạng thái

### (a) XÁC NHẬN

```http
GET https://sn3302.up.1drv.com/up/fe6987415ace7X4e1eF866337

HTTP/1.1 200 OK
{
  "expirationDateTime": "2015-01-29T09:21:55.523Z",
  "nextExpectedRanges": ["12345-"]
}
```

- Nếu request bị đứt giữa chừng, **toàn bộ byte trong request đó bị bỏ qua** (all-or-nothing ở mức fragment): *"If an upload request is disconnected or fails before the request is completed, all bytes in that request are ignored."*
- `GET uploadUrl` (không cần Authorization) là **nguồn sự thật duy nhất** về trạng thái server.
- Nếu gửi lại một fragment server **đã nhận** → `HTTP 416 Requested Range Not Satisfiable`, và doc khuyên: *"To get a more detailed list of missing ranges, you can request upload status."*
- `404 Not Found` → session không còn tồn tại → **phải upload lại từ đầu**.

### 2.4 Cancel session

### (a) XÁC NHẬN

```http
DELETE https://sn3302.up.1drv.com/up/fe6987415ace7X4e1eF866337

HTTP/1.1 204 No Content
```

*"This cleans up the temporary file holding the data previously uploaded."* Dùng khi user bấm hủy.

### 2.5 Server lưu trạng thái session thế nào?

### (a) XÁC NHẬN (gián tiếp)

- Doc nói createUploadSession *"creates a **temporary storage location** where the bytes of the file are saved until the complete file is uploaded"* và gọi nó là **"temporary file"**. Tức: **server ghi bytes vào một staging area thật, không giữ trong RAM**.
- Khi commit, *"the upload session is completed and the final file is shown in the destination folder"* — file đích chỉ **materialize** ở thời điểm commit.
- SharePoint (nền của OneDrive) lưu nội dung file trong Azure Storage và metadata trong Azure SQL Database ([SharePoint and OneDrive data resiliency](https://learn.microsoft.com/en-us/compliance/assurance/assurance-sharepoint-onedrive-data-resiliency)).

### (b) SUY ĐOÁN

- Trạng thái session (uploadUrl token → drive/parent/name/conflictBehavior/total size/ranges đã nhận) gần chắc chắn nằm trong một store nhanh, phân tán, có TTL (Redis/Cosmos/SQL-like), tách khỏi metadata DB chính. Bằng chứng: `uploadUrl` trỏ tới một cluster riêng (`sn3302.up.1drv.com` — tên gợi ý stamp/scale-unit), và session phải sống được qua nhiều request có thể vào các máy khác nhau.
- Việc "temp file có thể không bị xóa ngay sau expiration" gợi ý **cleanup bằng job quét nền định kỳ**, không phải TTL cứng của storage.

### (c) BÀI HỌC

- **Sliding expiration là đúng, absolute expiration là sai** cho upload lớn. Nếu bạn đặt TTL cố định 1 giờ, một file 100 GB trên đường truyền chậm sẽ không bao giờ upload xong. Gia hạn mỗi khi nhận được chunk.
- **`GET session` phải là API hạng nhất.** Client sẽ mất state (đóng tab, crash, đổi máy). Nếu server không thể trả lời "tôi đã nhận đến đâu", mọi lần đứt kết nối = upload lại từ đầu.
- **`DELETE session` cũng phải là API hạng nhất.** Không có nó, mọi upload bị hủy đều thành rác chiếm dung lượng cho tới khi job dọn chạy.
- **Đừng để credential của staging endpoint có scope rộng.** Pre-authenticated URL chỉ nên cho phép: ghi vào đúng 1 session, đọc trạng thái session đó, xóa session đó. Không hơn.
- **Ghi staging bytes xuống storage bền, không giữ trong bộ nhớ tiến trình.** Nếu không, restart/deploy sẽ giết mọi upload đang chạy.
- **Chấp nhận rằng cleanup là bất đồng bộ.** Đừng thiết kế hệ thống giả định temp data biến mất đúng lúc expiration. Phải có job quét + phải chịu được chi phí lưu trữ trong khoảng trễ đó.

---

# 3. BLOB / BACKEND — **TRỌNG TÂM**

## 3.1 Azure Blob Storage — mô hình block blob

### (a) XÁC NHẬN

#### `Put Block` (staging)

```http
PUT https://myaccount.blob.core.windows.net/mycontainer/myblob?comp=block&blockid=AAAAAA%3D%3D
Content-Length: 1048576
Content-MD5: <optional>          # hoặc x-ms-content-crc64, KHÔNG được có cả hai
```

Quy tắc `blockid`:
- Là chuỗi **Base64 hợp lệ**; chuỗi **trước khi encode phải ≤ 64 bytes**.
- Base64 string **phải được URL-encode**.
- **Mọi block của cùng một blob phải có block ID cùng độ dài.** Sai độ dài → `400 Bad Request`.
- Block ID được **scope theo blob** — hai blob khác nhau có thể dùng cùng block ID.

Ngữ nghĩa quan trọng:
- Thành công → `201 Created`.
- **Block đã upload KHÔNG trở thành một phần của blob cho tới khi commit bằng `Put Block List`.** `Get Blob` trước commit trả về nội dung blob **không bao gồm** uncommitted block.
- `Put Block` trên một blob **chưa tồn tại** → tạo block blob với content-length 0; blob này chỉ xuất hiện trong `List Blobs` nếu dùng `include=uncommittedblobs`; **được giữ trên server 1 tuần**.
- **Upload lại cùng blockid → bản upload cuối cùng thắng** khi commit: *"If you upload a block that has the same block ID as another block that hasn't yet been committed, the last uploaded block with that ID will be committed on the next successful `Put Block List` operation."* → **`Put Block` là idempotent theo block ID.**
- `Put Block` **KHÔNG cập nhật last-modified time** của blob hiện có.
- `Put Block` **không hỗ trợ conditional headers** (nằm trong danh sách operations không hỗ trợ ở [Specifying conditional headers](https://learn.microsoft.com/en-us/rest/api/storageservices/specifying-conditional-headers-for-blob-service-operations)).
- Nếu blob có lease đang hoạt động, phải gửi `x-ms-lease-id` hợp lệ, nếu không → `412`.

#### Giới hạn theo phiên bản API

| Service version | Max block (`Put Block`) | Max blob (`Put Block List`) | Max blob 1 request (`Put Blob`) |
|---|---|---|---|
| ≥ 2019-12-12 | **4,000 MiB** | ~**190.7 TiB** (4,000 MiB × 50,000) | **5,000 MiB** |
| 2016-05-31 → 2019-07-07 | 100 MiB | ~4.75 TiB | 256 MiB |
| < 2016-05-31 | 4 MiB | ~195 GiB | 64 MiB |

- Max **committed** blocks: **50,000**.
- Max **uncommitted** blocks: **100,000** → vượt trả `409 (RequestEntityTooLargeBlockCountExceedsLimit)`.
- Block quá lớn → `413 Request Entity Too Large` (kèm thông tin max size trong response).

#### Garbage collection của uncommitted blocks — **7 ngày**

Ba đường dẫn tới GC (tất cả từ doc `Put Block` / `Put Block List`):
1. **Sau commit**: mọi uncommitted block **không có mặt** trong block list được commit sẽ bị GC và xóa ngay.
2. **Hết hạn**: *"Any uncommitted blocks are also garbage collected if there are **no successful calls to `Put Block` or `Put Block List` on the same blob within a week** following the last successful `Put Block` operation."* → **1 tuần trượt** (sliding, không phải cố định từ block đầu).
3. **`Put Blob`**: gọi `Put Blob` lên blob đó → mọi uncommitted block bị GC.

#### Billing note (đáng lưu ý về chi phí)

*"`Put Block` operations write blocks to **temporary storage using the storage account's default access tier**"* — tức nếu bạn định lưu vào Archive tier, các block staging vẫn bị tính giá theo default tier. `Put Block List` / `Put Blob` mới tính theo destination tier.

## 3.2 OneDrive có chạy trên Azure Storage không?

### (a) XÁC NHẬN — **CÓ**

Từ [SharePoint and OneDrive data resiliency in Microsoft 365](https://learn.microsoft.com/en-us/compliance/assurance/assurance-sharepoint-onedrive-data-resiliency) (doc Service Assurance chính thức):

> *"Within Microsoft 365, **OneDrive is built on top of the SharePoint file platform**."*
>
> **Blob storage**: *"SharePoint stores user content that you upload in **Azure Storage**. SharePoint has built a custom resiliency plan on top of Azure Storage to ensure near real-time duplication of user content and a truly active/active system."*
>
> **Metadata**: *"SharePoint stores metadata about each file in **Azure SQL Database**."*

Các đặc tính quan trọng của lớp SharePoint trên Azure Storage:

1. **Append-only**: *"SharePoint uses **Append-Only storage**, meaning that Microsoft can only add new blobs and can never change old ones until they're permanently deleted."* → mỗi version file = blob mới, không bao giờ mutate blob cũ. Đây là nền tảng của versioning + chống ransomware.

2. **Dual-region synchronous write**: *"**Every file is simultaneously written into both a primary and a secondary datacenter region. If the writes to either Azure region fail, the file save fails.**"* → Đây là **mạnh hơn** GRS mặc định của Azure (vốn async). SharePoint tự làm 2PC-like write vào 2 region.

3. **Checksum tách rời**: *"After the contents are written into Azure Storage, SharePoint stores **checksums separately with metadata**, and uses them to ensure that the committed write is identical to the original file during all future reads."*

4. **LRS trong mỗi region**: *"Within each region, Azure Locally Redundant Storage (LRS) provides a high level of reliability."*

5. **Active/active đọc**: cả hai region đều đọc được; ưu tiên local; nếu local chậm quá ngưỡng → fetch từ remote region.

6. **Metadata là "khóa"**: *"SharePoint metadata is critical to accessing user content because it stores the **location of and access keys to** the content stored in Azure Storage."* → blob được mã hóa/khóa; mất metadata = mất khả năng đọc blob.

7. **Soft delete + data integrity job**:
   - Recycle bin 93 ngày; sau đó metadata xóa ngay, blob dùng Azure Blob **soft delete 14 ngày**.
   - *"Every 14 days, each site is scanned for integrity by listing items in the database and matching those up with listed blobs in Azure storage."* — job đối soát DB ↔ blob, khôi phục từ soft-delete nếu thiếu.

8. **Versioning**: library mới mặc định giữ **500 versions**; Files Restore cho phép quay về bất kỳ giây nào trong **30 ngày**.

## 3.3 Kiến trúc Azure Storage theo paper SOSP 2011

Nguồn: Calder et al., *"Windows Azure Storage: A Highly Available Cloud Storage Service with Strong Consistency"*, SOSP 2011 — <https://www.sigops.org/s/conferences/sosp/2011/current/2011-Cascais/11-calder-online.pdf> (và [blog công bố của Azure](https://azure.microsoft.com/en-us/blog/sosp-paper-windows-azure-storage-a-highly-available-cloud-storage-service-with-strong-consistency/)).

### (a) XÁC NHẬN — ba tầng trong một **storage stamp**

```
                    ┌──────────────────────────────────────┐
   Client request → │  FRONT-END LAYER (stateless)          │
                    │  • authenticate + authorize           │
                    │  • route tới partition server đúng    │
                    │  • caching                            │
                    └──────────────┬───────────────────────┘
                                   ↓
                    ┌──────────────────────────────────────┐
                    │  PARTITION LAYER                      │
                    │  • hiểu ngữ nghĩa Blob/Table/Queue    │
                    │  • namespace, Object Table            │
                    │  • transaction ordering               │
                    │  • STRONG CONSISTENCY cho object      │
                    │  • load balancing tự động (100s tỷ    │
                    │    object)                            │
                    └──────────────┬───────────────────────┘
                                   ↓
                    ┌──────────────────────────────────────┐
                    │  STREAM LAYER (distributed FS)        │
                    │  • stream = danh sách extent          │
                    │  • extent = danh sách block (≤ 1 GB)  │
                    │  • block = đơn vị ghi/đọc (≤ 4 MB)    │
                    │  • APPEND-ONLY                        │
                    │  • INTRA-STAMP REPLICATION: 3 bản     │
                    │    ĐỒNG BỘ trong stamp                │
                    └──────────────────────────────────────┘

   INTER-STAMP REPLICATION: BẤT ĐỒNG BỘ, giữa các stamp/region (geo)
```

**Phân cấp dữ liệu ở stream layer:**
- **Block**: đơn vị ghi và đọc nhỏ nhất, **tối đa 4 MB**. Mỗi block có **checksum riêng**.
- **Extent**: đơn vị replication, là danh sách các block, **tối đa 1 GB**. Extent đầy → **seal** → **bất biến** → có thể áp dụng **erasure coding** để giảm chi phí lưu trữ.
- **Stream**: danh sách có thứ tự các extent — giống một file append-only.

**Đường ghi và thời điểm được ack là bền vững — điểm quan trọng nhất:**

Khi client append vào một extent:
1. Request tới **primary Extent Node (EN)** của extent đó.
2. Primary EN forward song song tới **2 replica EN**.
3. **Chỉ khi CẢ BA node đều ghi thành công lên đĩa và ack, primary mới trả success cho tầng trên.** Nếu bất kỳ replica nào fail, request bị block/fail — không có ghi "lỏng".

Đây là **intra-stamp replication đồng bộ**, và là lý do WAS có thể tuyên bố strong consistency + high availability đồng thời (paper lập luận đạt cả C, A, P cho các dạng partition phổ biến trong stamp, nhờ **co-design partition layer + stream layer**).

**Inter-stamp replication (geo)** là **bất đồng bộ**, chạy ở tầng partition layer, dành cho phục hồi thảm họa cấp region. → **Ack cho client KHÔNG đợi geo-replication.**

**Checksum**: mỗi block có CRC; CRC được **kiểm tra ở mọi lần đọc** và trong quá trình scrubbing nền, phát hiện bit rot.

**Location Service** ánh xạ account → stamp qua DNS; partition layer tự động chia/gộp partition range để cân tải.

### (a) XÁC NHẬN — số liệu bổ sung từ doc Azure hiện đại

Từ [Data redundancy](https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy):

| Mức | Cách ghi | Durability/năm |
|---|---|---|
| **LRS** | đồng bộ trong 1 datacenter | ≥ 11 nines |
| **ZRS** | **đồng bộ qua ≥3 availability zone; write chỉ trả success khi đã ghi xong TẤT CẢ replica ở 3 zone** | ≥ 12 nines |
| **GRS** | LRS ở primary + **async** sang secondary (rồi LRS ở secondary) | ≥ 16 nines |
| **GZRS** | ZRS ở primary + **async** sang secondary | ≥ 16 nines |

- Geo-replication async → **có RPO**; Azure có "Geo priority replication" đảm bảo RPO ≤ 15 phút cho block blob.
- *"Azure Storage regularly verifies the integrity of data stored using **cyclic redundancy checks (CRCs)**. And detected data corruption is repaired using redundant data. Azure Storage also **calculates checksums on all network traffic** to detect corruption of data packets when storing or retrieving data."*

### 3.4 Ánh xạ: Graph upload session ↔ Azure block blob

### (b) SUY ĐOÁN (rất mạnh, nhưng không có doc xác nhận trực tiếp)

Sự tương ứng về cấu trúc là quá rõ để bỏ qua:

| Graph upload session | Azure block blob |
|---|---|
| `PUT` fragment với `Content-Range` | `Put Block` (staged, chưa thấy được) |
| Fragment chưa commit không thấy trong drive | Uncommitted block không thấy trong `Get Blob` |
| Fragment cuối / `deferCommit` commit | `Put Block List` |
| `DELETE uploadUrl` | uncommitted block bị GC |
| Session hết hạn → temp bị dọn | uncommitted block GC sau 1 tuần |
| **320 KiB quantum** | căn chỉnh với biên block/extent nội bộ |

Giả thuyết về **320 KiB**: 320 KiB = 327,680 bytes = 5 × 64 KiB. Nó chia hết 4 MB (block max của stream layer) đúng 12.8 lần — **không chia hết**. Nhưng 320 KiB × 32 = 10 MiB (đúng fragment size khuyến nghị), và 320 KiB có khả năng liên quan tới kích thước "shred"/chunk nội bộ của SharePoint hoặc đơn vị mã hóa. **Không có nguồn công khai giải thích con số này.** Doc chỉ nói hậu quả: sai bội số → **lỗi ở bước commit**, gợi ý mạnh rằng backend ghép các fragment thành các đơn vị lưu trữ cố định và biên lẻ làm hỏng phép ghép.

### (c) BÀI HỌC

- **Tách "staging" khỏi "commit" ở tầng storage, không chỉ ở tầng API.** Toàn bộ độ tin cậy của mô hình đến từ việc phần đã upload tồn tại thật trên storage bền nhưng **vô hình với reader** cho tới lúc commit. MinIO multipart upload / S3 multipart cho bạn đúng ngữ nghĩa này — hãy dùng nó thay vì tự ghép file trên đĩa local.
- **Đặt TTL cho staging data và có job GC.** Azure chọn 7 ngày trượt. Không có GC = rò rỉ dung lượng vô hạn từ những upload bị bỏ dở. Đây là chi phí thật, không phải chi tiết nhỏ.
- **Part/block phải idempotent theo ID do client chọn.** `Put Block` với cùng blockid ghi đè — nhờ vậy retry một part luôn an toàn. Nếu bạn dùng auto-increment offset làm khóa, retry sẽ tạo trạng thái nhập nhằng.
- **Tách metadata (DB giao dịch) khỏi content (object store).** Đây chính xác là mô hình SharePoint: Azure SQL giữ metadata + vị trí + access key, Azure Storage giữ bytes. Trong dự án của bạn: MongoDB giữ metadata Asset, MinIO giữ bytes — cùng một pattern.
- **Append-only + version mới = blob mới** là lựa chọn đắt nhưng đúng. Nó cho bạn versioning, chống ransomware, và loại bỏ toàn bộ lớp bug "ghi đè nửa chừng làm hỏng file".
- **Đừng chờ replication địa lý mới ack.** Ack khi đã bền trong region (đồng bộ N bản), replicate cross-region async. SharePoint là ngoại lệ có chủ đích (ghi 2 region đồng bộ) vì họ chấp nhận đánh đổi latency lấy RPO = 0.
- **Checksum ở mọi tầng và verify ở mọi lần đọc**, không chỉ lúc ghi. Bit rot là có thật ở quy mô exabyte.

---

# 4. FINALIZE / COMMIT

## 4.1 `Put Block List` — tính nguyên tử

### (a) XÁC NHẬN

Doc **không dùng chữ "atomic"**, nhưng ngữ nghĩa được mô tả là nguyên tử đối với người đọc:

- Trước khi `Put Block List` được gọi, *"any calls to `Get Blob` return the blob contents **without the inclusion of the uncommitted block**"*.
- `Put Block List` thành công → `201 Created`, trả về `ETag`, `Last-Modified`, và `x-ms-version-id` (nếu bật versioning).
- → **Không có trạng thái trung gian nào mà reader nhìn thấy blob "nửa cũ nửa mới".** Việc chuyển đổi là một bước.

Request body là XML với 3 loại element:

```xml
<?xml version="1.0" encoding="utf-8"?>
<BlockList>
  <Committed>first-base64-block-id</Committed>    <!-- chỉ tìm trong committed list -->
  <Uncommitted>second-base64-block-id</Uncommitted><!-- chỉ tìm trong uncommitted list -->
  <Latest>third-base64-block-id</Latest>           <!-- ưu tiên uncommitted, fallback committed -->
</BlockList>
```

- `Put Block List` **áp đặt thứ tự** ghép block.
- **Cùng một block ID có thể xuất hiện nhiều lần** trong list (block được dùng lại ở nhiều vị trí) — nhưng mọi lần xuất hiện phải nằm trong **cùng một loại element**.
- Nếu block không tìm thấy trong list được chỉ định → `400 Bad Request`, blob **không** được ghi.
- Đây cũng là cơ chế **update từng phần**: upload lại chỉ các block thay đổi, rồi commit list gồm `<Committed>` (block cũ) + `<Uncommitted>` (block mới) → không cần upload lại toàn bộ blob.

## 4.2 Semantics khi commit đè blob đang tồn tại

### (a) XÁC NHẬN

- *"When you call `Put Block List` to update an existing blob, the blob's existing **properties and metadata are overwritten**. However, any existing **snapshots are retained** with the blob."*
- **Lease được giữ nguyên** trên blob sau update.
- Blob **kế thừa access tier** của blob cũ nếu không truyền `x-ms-access-tier`.
- **Ghi đè blob ở tier `archive` → fail.**
- Nếu blob có lease đang hoạt động mà không truyền `x-ms-lease-id` hợp lệ → `412 Precondition Failed`.

## 4.3 ETag / versioning / conditional commit

### (a) XÁC NHẬN

`Put Block List` **hỗ trợ conditional headers** (khác `Put Block`, vốn không hỗ trợ):

| Header | Dùng để |
|---|---|
| `If-None-Match: *` | **Chỉ tạo nếu blob CHƯA tồn tại** (create-if-not-exists nguyên tử) |
| `If-Match: {etag}` | Optimistic concurrency — chỉ ghi nếu blob chưa đổi kể từ lúc đọc |
| `If-Modified-Since` / `If-Unmodified-Since` | Điều kiện theo thời gian |
| `x-ms-if-tags` | Điều kiện theo blob index tags |

Điều kiện không thỏa trên **write operation** → **`412 Precondition Failed`** (nguồn: [Specifying conditional headers](https://learn.microsoft.com/en-us/rest/api/storageservices/specifying-conditional-headers-for-blob-service-operations)).

→ Đây chính là **primitive để chống lost update và chống double-commit**: `If-None-Match: *` cho tạo mới, `If-Match: etag` cho update.

## 4.4 Với Graph upload session: fragment cuối chính là commit

### (a) XÁC NHẬN — server làm gì tại thời điểm đó

Khi PUT byte range cuối:

1. **Verify** — kiểm tra đã nhận đủ mọi byte, tổng size khớp `Content-Range`. (Nếu fragment size không phải bội số 320 KiB, lỗi xuất hiện **chính ở đây**: *"can result in large file transfers failing after the last byte range is uploaded"*.)
2. **Materialize driveItem** — tạo item thật trong folder đích, gán id, name, size, file facet. Response body **là driveItem đầy đủ**.
3. **Xử lý conflict** — kiểm tra trùng tên tại đúng thời điểm này (không phải lúc tạo session).
4. **Kiểm tra quota** — có thể fail ở đây.
5. Trả `201 Created` (file mới) hoặc `200 OK` (ghi đè).

**Trường hợp `deferCommit: true`** — commit tường minh:
- **OneDrive for Business / SharePoint**: `POST uploadUrl` với `Content-Length: 0`.
- **OneDrive Personal**: `PUT` (theo cách xử lý lỗi upload, xem dưới).

**Xử lý lỗi ở bước commit — cơ chế "redirect session"**:

Nếu commit fail (ví dụ trùng tên phát sinh trong lúc upload, hoặc vượt quota), server trả:

```http
HTTP/1.1 409 Conflict
{
  "error": {
    "code": "nameAlreadyExists",
    "message": "Another file exists with the same name as the uploaded session. You can redirect the upload session to use a new filename by calling PUT with the new metadata and @microsoft.graph.sourceUrl attribute."
  }
}
```

**Session vẫn được giữ tới `expirationDateTime`** → client có thể commit lại với metadata mới **mà không phải upload lại bytes**:

```http
PUT https://graph.microsoft.com/v1.0/me/drive/root:/{path_to_parent}
Content-Type: application/json
If-Match: {etag or ctag}

{
  "name": "largefile-v2.vhd",
  "@microsoft.graph.conflictBehavior": "rename",
  "@microsoft.graph.sourceUrl": "{upload session URL}"
}
```

→ `201 Created` / `200 OK` + driveItem.

**Đây là một trong những chi tiết thiết kế thông minh nhất của Microsoft**: bytes và metadata đích được **decouple hoàn toàn**. Bytes đã ở trên server; tên/vị trí/conflict policy có thể thương lượng lại nhiều lần cho tới khi thành công.

### (c) BÀI HỌC

- **Commit phải nguyên tử với reader.** Không bao giờ để client khác nhìn thấy object đang được ghi dở. Trong MinIO/S3: `CompleteMultipartUpload` đã cho bạn tính chất này; đừng tự ghép bằng cách append vào object đích.
- **Kiểm tra conflict/quota ở CẢ hai thời điểm**: lúc tạo session (fail nhanh, tiết kiệm băng thông — Graph làm việc này qua `fileSize` → `507`) và lúc commit (bắt race condition). Kiểm tra lúc tạo session không đủ vì thế giới thay đổi trong lúc upload.
- **Đừng vứt bỏ bytes khi commit fail.** Giữ session sống và cho phép commit lại với metadata khác. Với file 50 GB, khác biệt giữa "sửa tên rồi commit lại" và "upload lại từ đầu" là khác biệt giữa sản phẩm dùng được và không dùng được.
- **Dùng conditional write cho commit**: `If-None-Match: *` để đảm bảo không ghi đè ngoài ý muốn, `If-Match: etag` để chống lost update. Đừng tự làm check-then-write ở tầng ứng dụng — nó có race.
- **Trả về full resource ở response commit**, không chỉ 204. Client cần id/size/etag ngay để cập nhật UI mà không phải gọi thêm request.

---

# 5. INTEGRITY

## 5.1 Azure Blob: `Content-MD5` / `x-ms-content-crc64` per-block

### (a) XÁC NHẬN

Trên `Put Block`:

| Header | Ngữ nghĩa |
|---|---|
| `Content-MD5` | MD5 của **nội dung block**. Service tính lại và so sánh. Không khớp → **`400 Bad Request`**. **Hash này KHÔNG được lưu cùng blob** — chỉ dùng kiểm tra transport. |
| `x-ms-content-crc64` | CRC64 của nội dung block, cùng ngữ nghĩa. Hỗ trợ từ version 2019-02-02. |
| **Cả hai cùng lúc** | → **`400 Bad Request`**. Chỉ được chọn một. |

Response cũng trả về `Content-MD5` / `x-ms-content-crc64` do **service tự tính** — client so sánh để phát hiện hỏng trên đường về.

**Structured body (version ≥ 2025-01-05)**: `x-ms-structured-body: XSM/1.0; properties=crc64` cho phép nhúng **CRC64 theo từng segment** vào bên trong payload → phát hiện lỗi ở mức mịn hơn cả block, không cần chia block nhỏ. Nếu checksum của một segment không khớp → `400`.

Trên `Put Block List`:

| Header | Ngữ nghĩa |
|---|---|
| `Content-MD5` / `x-ms-content-crc64` | Hash của **request body** (danh sách block XML), **không phải** của blob |
| `x-ms-blob-content-md5` | MD5 của **nội dung blob**, **được lưu** vào blob properties và trả về ở `Content-MD5` khi `Get Blob`. **Nhưng service KHÔNG validate nó** — lý do được ghi rõ: *"This hash isn't validated, because the hashes for the individual blocks were validated when each was uploaded."* |

→ **Mô hình integrity của Azure**: validate **per-block lúc ghi**, còn hash toàn-blob chỉ là **metadata tự khai** cho client dùng.

## 5.2 OneDrive: hash gì để client verify?

### (a) XÁC NHẬN

Facet `hashes` trên driveItem ([hashes resource type](https://learn.microsoft.com/en-us/graph/api/resources/hashes)):

| Property | Kiểu | Ghi chú |
|---|---|---|
| `crc32Hash` | String (hex) | nếu có |
| `quickXorHash` | String (base64) | **hash độc quyền của Microsoft** |
| `sha1Hash` | String (hex) | nếu có |
| `sha256Hash` | String (hex) | **"This property isn't supported. Don't use."** |

> **Note chính thức**: *"**quickXorHash** is the only value that is **guaranteed to be available for both OneDrive for work or school and OneDrive for home**."*

Và: *"Not all services provide a value for all hash properties listed."*

### QuickXorHash — thuật toán

Nguồn: [QuickXorHash snippet](https://learn.microsoft.com/en-us/onedrive/developer/code-snippets/quickxorhash)

*"A quick, simple **non-cryptographic** hash algorithm that works by XORing the bytes in a circular-shifting fashion."*

- Độ rộng: **160 bit (20 bytes)**.
- Shift: **11 bit** mỗi byte.
- Pseudocode:

```
block XorHash0(byte[] rgb):
    block ret = zero()
    for (int i = 0; i < rgb.Length; i++)
        ret = xor(ret, rotate(extend8(rgb[i]), i * 11))
    return reverse(ret)

block XorHash(byte[] rgb):
    return xor(extend64(rgb.Length), XorHash0(rgb))
```

- Bước cuối: **XOR độ dài file (8 bytes, little-endian) vào 64 bit thấp nhất** của kết quả.
- Kết quả trả về ở dạng **base64**.

**Vì sao Microsoft dùng nó?** Không có tuyên bố chính thức, nhưng đặc tính rõ ràng: XOR + rotate là O(n) với hằng số cực nhỏ, **không cần dữ liệu tuần tự** (XOR giao hoán) → **có thể tính song song và tính incremental trên từng chunk rồi gộp lại**. Với hàng exabyte dữ liệu và upload theo chunk, đây là ưu thế lớn so với SHA-1/SHA-256 (vốn tuần tự bắt buộc). Đánh đổi: **không chống được va chạm cố ý** — nó là detection tool, không phải security tool.

### (b) NGUỒN KHÔNG CHÍNH THỨC — rclone

Từ [rclone OneDrive backend docs](https://rclone.org/onedrive/):
- Mặc định dùng **QuickXorHash** cho mọi loại drive kể từ rclone 1.62+.
- **OneDrive Personal** trước 1.62 dùng SHA1; **Microsoft đang bỏ SHA1 từ tháng 7/2023**.
- **OneDrive Business & SharePoint** hỗ trợ QuickXorHash, SHA1 (legacy), SHA256, CRC32.
- Có flag `--onedrive-hash-type` để chọn tay; `none` để tắt.

→ Xác nhận độc lập rằng **QuickXorHash là mẫu số chung duy nhất đáng tin**.

## 5.3 SharePoint/OneDrive làm gì với hash ở backend

### (a) XÁC NHẬN

Từ [SharePoint and OneDrive data resiliency § Integrity checks](https://learn.microsoft.com/en-us/compliance/assurance/assurance-sharepoint-onedrive-data-resiliency):

- **File hash stored in metadata**: *"Hash of the entire file is stored with file metadata to ensure document level data integrity is maintained during all operations."*
- **Blob hash stored in metadata**: *"Each blob-item stores a hash of the **encrypted content** to protect against corruption in underlying Azure storage."* → hai hash ở hai tầng khác nhau: một cho nội dung logic, một cho bytes đã mã hóa.
- **Data integrity job**: chạy **mỗi 14 ngày**, quét từng site, đối chiếu item trong DB với blob trong Azure Storage, phát hiện blob-reference thiếu blob, khôi phục qua Azure blob soft-delete.
- Checksum còn được dùng *"to ensure that the committed write is identical to the original file during all future reads"* — verify ở **mọi lần đọc**, không chỉ lúc ghi.

## 5.4 Client nên verify thế nào sau upload

### (a)+(b) Quy trình đề xuất (tổng hợp)

1. Trong lúc đọc file để chunk, **tính QuickXorHash incremental** (thuật toán cho phép streaming).
2. Sau khi commit thành công, đọc `hashes.quickXorHash` từ driveItem trả về (hoặc `GET /items/{id}?$select=file` nếu response commit không có).
3. So sánh. Khác → file đã hỏng trên đường truyền hoặc ở backend → xóa + upload lại.
4. **Đồng thời so sánh `size`** — kiểm tra rẻ nhất, bắt được lỗi truncation ngay.

### (b) Lưu ý không chính thức

- Hash có thể **không có ngay lập tức** sau khi commit đối với một số loại drive/file (facet `hashes` là "if available"). Client nên retry với backoff nếu field vắng mặt, thay vì coi là lỗi.
- Doc không nêu SLA cho thời điểm hash sẵn sàng.

### (c) BÀI HỌC

- **Validate integrity ở mức chunk, lúc ghi** (như Azure: `Content-MD5`/CRC64 per block → 400 nếu sai). Đừng đợi tới cuối mới phát hiện — với file 100 GB, phát hiện muộn nghĩa là vứt bỏ 100 GB.
- **Cung cấp hash toàn-file trong metadata cho client verify**, kể cả khi bạn không tự validate nó. Client cần một cách để tự tin file đã tới nơi nguyên vẹn.
- **Chọn hash có thể tính incremental/song song** nếu bạn xử lý file lớn. CRC32C, xxHash, BLAKE3 là các lựa chọn hiện đại; QuickXorHash chứng minh rằng non-crypto + parallel-friendly là đánh đổi hợp lý cho use case này. Nếu bạn cần chống giả mạo có chủ đích thì mới cần SHA-256.
- **Lưu hash ở tầng metadata, tách khỏi blob**, và có job đối soát định kỳ (SharePoint: 14 ngày). Nếu bạn chỉ lưu hash bên trong object store, corruption của object store cũng có thể làm hỏng hash.
- **Verify ở mọi lần đọc, không chỉ lúc ghi.** Silent data corruption là nguyên nhân mất dữ liệu phổ biến hơn người ta tưởng.

---

# 6. SECURITY

## 6.1 SAS token — cho direct-to-blob upload

### (a) XÁC NHẬN

Nguồn: [Grant limited access to data with SAS](https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview)

### Ba loại SAS

| Loại | Ký bằng | Scope | Ghi chú |
|---|---|---|---|
| **User delegation SAS** | **Microsoft Entra credentials** (user delegation key) | Blob/Queue/Table/Files | **Microsoft khuyến nghị dùng loại này**. Không cần lưu account key trong code. Bắt buộc là ad-hoc. |
| **Service SAS** | Storage **account key** | Một service duy nhất | Duy nhất hỗ trợ **stored access policy** (→ revoke được) |
| **Account SAS** | Storage **account key** | Nhiều service + service-level ops | Quyền rộng nhất. Bắt buộc ad-hoc. |

### Hai dạng

- **Ad hoc SAS**: start time, expiry, permissions nhúng thẳng trong URI. **Không revoke được** (trừ khi xoay account key).
- **Service SAS + stored access policy**: constraints nằm ở container-level policy → **revoke được mà không cần xoay key**. Giới hạn **5 stored access policy / container**.

### Thành phần SAS token

Query params gồm: signed permissions (`sp`), signed start (`st`), signed expiry (`se`), signed IP (`sip`), signed protocol (`spr` — HTTPS only), signed resource, và **signature** ký bằng key.

Quyền cần cho upload direct-to-blob:

| Operation | Signed permission |
|---|---|
| `Put Block` / `Put Block List` — tạo blob mới | Create (c) hoặc Write (w) |
| `Put Block` / `Put Block List` — ghi đè blob có sẵn | Write (w) |

### Rủi ro & best practices (từ doc chính thức)

**Hai rủi ro chính được nêu tên:**
1. *"If a SAS is leaked, it can be used by anyone who obtains it, which can potentially compromise your storage account."*
2. *"If a SAS provided to a client application expires and the application is unable to retrieve a new SAS from your service, then the application's functionality may be hindered."*

**Cảnh báo rất quan trọng:**
> *"**It's not possible to audit the generation of SAS tokens.** Any user that has privileges to generate a SAS token, either by using the account key, or via an Azure role assignment, can do so **without the knowledge of the owner** of the storage account."*
>
> *"The SAS token is **not tracked by Azure Storage in any way**. You can create an unlimited number of SAS tokens on the client side."*

**Best practices được liệt kê:**
- **Luôn dùng HTTPS** để tạo và phân phối SAS (nếu qua HTTP → MITM đọc được).
- **Ưu tiên user delegation SAS.**
- **Có kế hoạch revoke.**
- **Cấu hình SAS expiration policy** cho storage account (cảnh báo khi ai đó tạo SAS quá dài).
- **Dùng stored access policy** cho service SAS để revoke được.
- **Expiry ngắn hạn** cho ad-hoc SAS — *"Near-term expiration times also limit the amount of data that can be written to a blob by limiting the time available to upload to it."*
- **Cẩn thận clock skew**: đặt start time lùi ít nhất **15 phút** (hoặc không đặt). Có thể lệch tới 15 phút theo cả hai hướng.
- **Least privilege.**
- **Cảnh báo chi phí**: *"If you provide write access to a blob, a user may choose to upload a 200 GB blob. If you've given them read access as well, they may choose to download it 10 times, incurring 2 TB in egress costs for you."*
- **Validate dữ liệu ghi qua SAS**: *"perform that validation **after** the data is written and **before** it is used by your application. This practice also protects against corrupt or malicious data being written to your account."*
- **Biết khi nào KHÔNG dùng SAS**: nếu rủi ro > lợi ích, dùng middle-tier service làm proxy có validation + auth + audit.

### Hai design pattern chính thức được Microsoft vẽ ra

1. **Front-end proxy service**: mọi byte đi qua service của bạn → validate business rules được, nhưng *"for large amounts of data, or high-volume transactions, creating a service that can scale to match demand may be expensive or difficult"*.
2. **SAS provider service**: service nhẹ chỉ auth + phát SAS, client ghi thẳng vào storage → *"The SAS mitigates the need for routing all data through the front-end proxy service."*
3. Thực tế: **hybrid**.

## 6.2 `uploadUrl` của Graph so với SAS

### (a)+(b) So sánh

| Tiêu chí | Graph `uploadUrl` | Azure SAS |
|---|---|---|
| Bản chất | Capability URL (bearer-in-URL) | Capability URL (bearer-in-URL) |
| Scope | **1 session, 1 file đích, 1 drive** | Blob / container / account tùy loại |
| Hết hạn | Sliding, gia hạn theo fragment | **Cố định** (`se`), không gia hạn |
| Revoke | **`DELETE uploadUrl` → 204** | Chỉ với service SAS + stored access policy, hoặc xoay account key |
| Cho phép đọc nội dung? | **Không** (GET chỉ trả trạng thái range) | Có, nếu cấp `r` |
| Audit việc phát hành | Có (createUploadSession là API call có auth, log được) | **Không audit được** |
| Ghi vượt scope | Không thể (chỉ ghi đúng byte range của file đó) | Có thể ghi bất kỳ blob nào trong scope |

→ **`uploadUrl` là một SAS được thu hẹp cực đại và có nút revoke.** Đây là mô hình an toàn hơn đáng kể cho user-generated content.

## 6.3 Quota check — khi nào?

### (a) XÁC NHẬN

- **Lúc tạo session (chỉ OneDrive Personal)**: nếu truyền `fileSize` trong `item` và vượt quota khả dụng → **`507 Insufficient Storage`** và **session không được tạo**.
- **Lúc commit**: doc ghi rõ lỗi cuối có thể do *"a name conflict or **quota limitation being exceeded**"*, và session được giữ để client recover.

→ Quota được kiểm tra ở **cả hai đầu**, nhưng chỉ đầu đầu tiên là optional và chỉ có trên consumer.

## 6.4 Malware scanning của OneDrive / SharePoint

### (a) XÁC NHẬN

Nguồn: [Built-in virus protection in SharePoint, OneDrive, and Teams](https://learn.microsoft.com/en-us/defender-office-365/anti-malware-protection-for-spo-odfb-teams-about)

**Quét là BẤT ĐỒNG BỘ và KHÔNG QUÉT TẤT CẢ:**

> *"The Microsoft 365 virus detection engine scans files **asynchronously (at some time after upload)**. If a user tries to download a file in a web browser or from Microsoft Teams that hasn't been scanned, **a scan is triggered before the download is allowed**. **All files are not automatically scanned.** **Anti-malware heuristics determine the files to scan.**"*

Luồng:
1. User upload file.
2. SharePoint sau đó quyết định file có đủ tiêu chí quét không (heuristics).
3. Nếu có → engine quét.
4. Nếu phát hiện virus → **đặt một property trên file đánh dấu nhiễm**.

**File nhiễm CÓ được download mặc định:**
> *"**By default, users can download infected files** from SharePoint or OneDrive."* — user thấy cảnh báo và có tùy chọn tải về.

Để chặn hẳn: `Set-SPOTenant -DisallowInfectedFileDownload $true`.

**Sync client có thể đã sync file trước khi bị đánh dấu:**
> *"When a malicious file is uploaded to SharePoint or OneDrive, **the file might be synced to the local machine before being marked as malware**. After the file is marked as malware, the user can't open the synced file from their local machine."*

**Forensics**: admin dùng `Get-SPOMalwareFileContent` / `Get-SPOMalwareFile` để trích xuất/xem thông tin file nhiễm.

**Lớp mở rộng**: Safe Attachments for SharePoint/OneDrive/Teams (cần Defender for Office 365).

**Tuyên bố quan trọng của Microsoft về giới hạn của lớp bảo vệ này:**
> *"The built-in anti-virus capabilities are **a way to help contain viruses**. They **aren't intended as a single point of defense** against malware for your environment."*

## 6.5 Microsoft Defender for Storage (cho Azure Blob thuần)

### (a) XÁC NHẬN

Nguồn: [Introduction to Defender for Storage malware scanning](https://learn.microsoft.com/en-us/azure/defender-for-cloud/introduction-malware-scanning)

Hai chế độ: **on-upload** (tự động khi blob được upload/modify) và **on-demand**.

**Cách hoạt động (on-upload):**
- Deploy một **Event Grid System Topic** lắng nghe blob upload event → trigger scan.
- Deploy resource `StorageDataScanner` với managed identity có role **Storage Blob Data Owner**.
- Dùng engine **Microsoft Defender Antivirus (MDAV)**, cùng signature với Defender for Endpoint.

**Kết quả scan** xuất hiện ở 4 nơi:
1. **Blob index tags**: `Scan result` = `No threats found` | `Malicious` | `Error` | `Not scanned`, + `Scan time (UTC)`. ⚠️ *"index tags **aren't tamper-resistant**. Users with permissions to modify tags can alter them, so they shouldn't be used as a sole security control."*
2. **Defender for Cloud security alerts**
3. **Event Grid events** (near-real-time, cho automation)
4. **Log Analytics** (bảng `StorageMalwareScanningResults`)

**Remediation**: soft-delete tự động blob độc hại; hoặc **chặn truy cập file chưa quét/độc hại bằng ABAC**.

**Giới hạn quan trọng:**
- File tối đa **50 GB**/blob. Hỗ trợ mọi loại file kể cả archive (ZIP, RAR).
- **KHÔNG hỗ trợ append blob và page blob.**
- **KHÔNG quét được client-side encrypted blob.**
- **KHÔNG quét blob upload qua NFS 3.0.**
- **Scan timeout 30 phút – 3 giờ** tùy kích thước/cấu trúc → vượt thì đánh dấu "Scan timed out".
- ⚠️ **CẢNH BÁO CỰC KỲ QUAN TRỌNG CHO KIẾN TRÚC CHUNKED UPLOAD:**
  > *"**Chunked data:** Detection might fail when a file is uploaded in fragments. **Header-only fragments are marked as corrupt, while tail-only fragments might appear benign.** **Scan data before chunking or after reassembly** to ensure coverage."*
- **Metadata update timing**: nếu cập nhật metadata của blob ngay sau upload, on-upload scan **có thể fail**. Khuyến nghị: đặt metadata ngay trong `BlobOpenWriteOptions`, hoặc hoãn cập nhật metadata cho tới khi scan xong.
- Độ chính xác thấp hơn endpoint scanning vì thiếu context (Mark of the Web, file path, behavioral data) → **tỷ lệ false negative cao hơn**.

**Chi phí**: mỗi lần scan = 1 read operation thêm + update index tags; cộng thêm chi phí Event Grid.

## 6.6 Throttling — 429 + Retry-After

### (a) XÁC NHẬN — Microsoft Graph

Nguồn: [Microsoft Graph throttling guidance](https://learn.microsoft.com/en-us/graph/throttling)

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 10

{
  "error": {
    "code": "TooManyRequests",
    "message": "Please retry again later."
  }
}
```

- *"Backing off requests using the `Retry-After` delay is **the fastest way to recover** from throttling because **Microsoft Graph continues to log resource usage while a client is being throttled**."*
- Quy trình: chờ đúng `Retry-After` giây → retry → nếu vẫn 429, tiếp tục dùng `Retry-After`.
- Nếu **không có** `Retry-After` → dùng exponential backoff.
- **Trong JSON batching**: batch trả `200 OK` nhưng từng request bên trong có thể `429` riêng. **SDK không tự retry request bị throttle trong batch.**
- Doc khuyên tránh polling; dùng **delta query** và **change notifications**.

### (a) XÁC NHẬN — SharePoint Online / OneDrive (chi tiết hơn nhiều)

Nguồn: [Avoid getting throttled or blocked in SharePoint Online](https://learn.microsoft.com/en-us/sharepoint/dev/general-development/how-to-avoid-getting-throttled-or-blocked-in-sharepoint-online)

- Trả **`429`** (quá nhiều request) hoặc **`503`** (service quá tải). **Cả hai đều kèm `Retry-After`.**
- ⚠️ *"**Throttled requests count towards usage limits**, so failure to honor `Retry-After` may result in more throttling."* → **retry hung hăng làm mọi thứ tệ hơn**.
- Vi phạm kéo dài → **block hoàn toàn** app (chỉ nhận 503 mãi), Microsoft thông báo qua Message Center.

**Mô hình Resource Units (RU)**:

| RU / request | Thao tác |
|---|---|
| 1 | single item query, **delta with a token**, download file |
| **2** | multi-item query, **create/update/delete/upload** |
| 5 | mọi thao tác permission, `$expand=permissions` |

**Giới hạn user:**

| Loại | Cửa sổ | Giới hạn |
|---|---|---|
| Requests | 5 phút | 3,000 |
| **Ingress (upload)** | 1 giờ | **50 GB** |
| Egress | 1 giờ | 100 GB |
| Delegation token request | 5 phút | 50 |

**Giới hạn per-app-per-tenant:**

| Loại | Cửa sổ | Giới hạn |
|---|---|---|
| Resource Units | 1 phút | 1,250 → 6,250 (theo số license) |
| Resource Units | 24 giờ | 1.2M → 6M |
| **Ingress** | 1 giờ | **400 GB** |
| Egress | 1 giờ | 400 GB |

**RateLimit headers (preview, IETF draft-03)** — tín hiệu sớm trước khi bị throttle:

```http
HTTP/1.1 200 Ok
RateLimit-Limit: 1200
RateLimit-Remaining: 120
RateLimit-Reset: 5
```

Trả về khi app dùng ≥ 80% quota 1 phút. Khi bị throttle:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 31
RateLimit-Limit: 1200
RateLimit-Remaining: 0
RateLimit-Reset: 31
```

*"There are instances where the `Retry-After` returns a smaller value. In such cases, the general rule of thumb is to **honor the greater of the two values**."*

Headers này là **best-effort** — có thể bị throttle mà không nhận được chúng.

**Traffic decoration** — *"Well-decorated traffic will be **prioritized** over traffic that isn't properly decorated."*

| Loại | User-Agent format |
|---|---|
| ISV app | `ISV\|CompanyName\|AppName/Version` |
| Enterprise app | `NONISV\|CompanyName\|AppName/Version` |

(rclone dùng chính kỹ thuật này để giảm throttling trên SharePoint: `--user-agent "ISV|rclone.org|rclone/v1.55.1"`.)

**Peak vs off-peak**: throttling dễ xảy ra hơn trong giờ cao điểm theo múi giờ của tenant.

### (c) BÀI HỌC

- **Pre-authenticated URL với scope một-session là mô hình tốt hơn SAS rộng.** Nếu bạn phát URL ghi trực tiếp vào MinIO/S3, hãy làm nó: (i) chỉ ghi được đúng object key đó, (ii) TTL ngắn, (iii) revoke được, (iv) không kèm quyền đọc.
- **Ghi nhận rằng bạn KHÔNG audit được ai đã dùng presigned URL.** Nếu cần audit, phải proxy qua service của bạn — chấp nhận chi phí băng thông.
- **Kiểm tra quota ở CẢ create-session (fail nhanh) VÀ commit (bắt race).** Fail sớm tiết kiệm băng thông người dùng; fail muộn bắt được thay đổi trong lúc upload.
- **Malware scan bất đồng bộ + chặn download cho tới khi quét xong** là mô hình thực dụng. Quét đồng bộ trước khi commit sẽ giết throughput. Nhưng **phải có cờ trạng thái quét trên metadata** và **enforce ở đường download**.
- **⚠️ Quét malware TRÊN FILE ĐÃ RÁP LẠI, không phải trên từng chunk.** Microsoft cảnh báo trực tiếp: chunk chỉ có header bị đánh dấu corrupt, chunk chỉ có tail trông vô hại. Với kiến trúc chunked upload, đây là bug bảo mật rất dễ mắc.
- **Honor `Retry-After` tuyệt đối, đừng tự chế backoff khi server đã nói bao lâu.** Và nhớ: request bị throttle vẫn tính vào quota → retry hung hăng = tự bắn vào chân.
- **Phát tín hiệu sớm (RateLimit-*) cho client tự điều tiết**, thay vì chỉ trả 429 khi đã quá muộn.
- **Đặt giới hạn ingress theo user VÀ theo app**, không chỉ theo request count. Một client có thể gửi ít request nhưng chiếm hết băng thông (50 GB/giờ/user, 400 GB/giờ/app là các con số tham chiếu tốt).

---

# 7. RELIABILITY

## 7.1 Hướng dẫn retry chính thức của Microsoft

### (a) XÁC NHẬN — từ `createUploadSession § Best practices`

> - **Resume hoặc retry** uploads fail do đứt kết nối hoặc **bất kỳ lỗi 5xx nào**, gồm: `500 Internal Server Error`, `502 Bad Gateway`, `503 Service Unavailable`, `504 Gateway Timeout`.
> - **Dùng exponential backoff nếu gặp 5xx** khi resume/retry.
> - **Với lỗi khác, KHÔNG dùng exponential backoff** — thay vào đó **giới hạn số lần retry**.
> - **Xử lý `404 Not Found`** bằng cách **bắt đầu lại toàn bộ upload** — nghĩa là session không còn tồn tại.
> - Dùng resumable transfer cho file > 10 MiB.
> - Fragment 10 MiB tối ưu cho kết nối nhanh ổn định; **5–10 MiB** khuyến nghị chung; kết nối chậm/kém → fragment nhỏ hơn.
> - Fragment phải là bội số 320 KiB, nếu không *"can result in large file transfers failing **after the last byte range is uploaded**"*.

Phân loại lỗi hoàn chỉnh:

| Status | Nghĩa | Hành động |
|---|---|---|
| `202 Accepted` | Đã nhận fragment, còn thiếu | Gửi tiếp theo `nextExpectedRanges` |
| `200 OK` / `201 Created` | Hoàn tất | Đọc driveItem từ body |
| `401 Unauthorized` | Có thể do gửi Authorization header vào PUT | Bỏ header đi |
| `404 Not Found` | Session không tồn tại | **Upload lại từ đầu** |
| `409 Conflict` (`nameAlreadyExists`) | Trùng tên lúc commit | **Commit lại** với `@microsoft.graph.sourceUrl` + tên/conflictBehavior mới |
| `412 Precondition Failed` | if-match/if-none-match không thỏa | Đọc lại etag |
| `416 Range Not Satisfiable` | Gửi lại range server đã có | **`GET uploadUrl`** để lấy trạng thái thật |
| `429 Too Many Requests` | Throttle | Chờ `Retry-After` |
| `5xx` | Lỗi server | **Exponential backoff**, retry |
| `507 Insufficient Storage` | Vượt quota | Không tạo được session |

## 7.2 PUT fragment có idempotent không?

### (a) XÁC NHẬN — **KHÔNG idempotent theo nghĩa an toàn**

- Gửi lại một fragment mà **server đã nhận** → **`416 Requested Range Not Satisfiable`**, KHÔNG phải `202`.
- Doc: *"On failures where the client sent a fragment the server already received, the server responds with `HTTP 416`. To get a more detailed list of missing ranges, you can request upload status."*

→ 416 là một **lỗi vô hại nhưng gây nhiễu**: client phải phân biệt "416 vì tôi retry thừa" (an toàn, chỉ cần GET rồi tiếp tục) với lỗi thật.

**So sánh với Azure Blob `Put Block`**: `Put Block` **HOÀN TOÀN idempotent theo block ID** — upload lại cùng blockid chỉ ghi đè, bản cuối thắng. Đây là thiết kế **tốt hơn** cho retry.

### (b) SUY LUẬN

Sự khác biệt bắt nguồn từ mô hình định danh:
- Graph định danh fragment bằng **vị trí byte** (`Content-Range`) trong một stream tuần tự → gửi lại vị trí cũ là "đi ngược" → lỗi.
- Azure định danh block bằng **ID do client chọn** → gửi lại cùng ID là "thay thế" → hợp lệ.

## 7.3 Xử lý khi ranges bị lệch

### (a) XÁC NHẬN — quy trình chuẩn

1. Nhận `416` hoặc mất trạng thái → **`GET uploadUrl`**.
2. Đọc `nextExpectedRanges` từ response.
3. **KHÔNG tin tưởng nó liệt kê đủ mọi khoảng thiếu** (doc nói rõ). Sau khi vá xong các khoảng biết được, GET lại để kiểm tra.
4. **KHÔNG dùng kích thước range trả về làm kích thước fragment** — tự tính theo best practice (bội số 320 KiB, 5–10 MiB).
5. Nếu `nextExpectedRanges` trả `"12345-"` (open-ended) → tiếp tục tuần tự từ 12345.

## 7.4 Hành vi khi 2 client cùng ghi vào 1 session

### (b) SUY ĐOÁN — **KHÔNG có tài liệu chính thức**

Microsoft không mô tả trường hợp này ở bất kỳ đâu. Suy luận từ ngữ nghĩa đã biết:

- Server là **nguồn sự thật duy nhất** về ranges đã nhận. Hai client cùng gửi cùng range → client đến sau nhận `416`.
- Hai client gửi range **khác nhau, không chồng lấn** → về lý thuyết cả hai có thể được chấp nhận (vì `nextExpectedRanges` hỗ trợ nhiều khoảng rời rạc), nhưng **doc yêu cầu fragment tuần tự** → khả năng cao client gửi range "nhảy cóc" sẽ bị từ chối.
- Cả hai cùng gửi fragment cuối → chỉ một thắng, cái còn lại có thể nhận `409` hoặc `404` (session đã đóng).
- **Không có locking, không có fencing token, không có session ownership** trong protocol.

→ Kết luận thực dụng: **upload session của Graph được thiết kế cho một writer duy nhất.** Nếu bạn cần multi-writer (upload song song từ nhiều worker), phải dùng mô hình kiểu Azure block blob (block ID độc lập, không thứ tự) chứ không phải mô hình Content-Range tuần tự.

## 7.5 Giới hạn tổng thời gian upload session

### (a) XÁC NHẬN
- Không có giới hạn cứng nào được công bố.
- Cơ chế duy nhất là sliding `expirationDateTime` gia hạn theo mỗi fragment.
- *"If no fragments are received and the session isn't committed, all previously uploaded fragments are discarded."*

### (b) SUY ĐOÁN
- Session sống miễn là client duy trì nhịp gửi. Không tìm thấy bằng chứng về hard cap.
- Với Azure Blob (nếu bạn tự xây trên nó): **7 ngày** là giới hạn thực tế của staged blocks.

## 7.6 Graph SDK làm gì (tham chiếu implementation)

### (a) XÁC NHẬN — [Upload large files using the Graph SDKs](https://learn.microsoft.com/en-us/graph/sdks/large-file-upload)

- `LargeFileUploadTask<DriveItem>(uploadSession, fileStream, maxSliceSize, requestAdapter)`.
- *"Max slice size **must be a multiple of 320 KiB**"* — ví dụ code dùng `320 * 1024`.
- Có `UploadAsync(progress)` với callback tiến độ sau mỗi slice.
- Có **`ResumeAsync()` / `resume()`** — *"If your application encounters a connection interruption or a 5.x.x HTTP status during upload, you can resume the upload."*
- Java SDK: `upload(maxAttempts, callback)` với `maxAttempts = 5`.
- PHP: pattern `try { upload() } catch (NetworkException) { resume() }`.

### (c) BÀI HỌC

- **Thiết kế part identifier để retry là idempotent.** Dùng part number / part ID do client chọn (như S3/Azure), **không** dùng byte offset thuần. Nó biến "retry an toàn" từ một quy trình có điều kiện thành một thao tác vô điều kiện.
- **Phân biệt rõ lỗi retryable với lỗi cần đổi chiến lược.** Microsoft chia làm 3 nhóm: 5xx + đứt kết nối → exponential backoff; 404 → restart hoàn toàn; lỗi khác → retry giới hạn, không backoff mũ. Đây là phân loại tốt để copy nguyên.
- **Trả 416 (hoặc tương đương) thay vì 200 khi client gửi lại phần đã có** — nhưng phải document rõ và cung cấp `GET status` để client tự sửa. Trả 200 im lặng khiến client tưởng đã ghi đè.
- **Đừng hứa nhiều hơn mức bạn đảm bảo được về `nextExpectedRanges`.** Microsoft nói thẳng "không phải lúc nào cũng liệt kê đủ" — client vì thế phải viết vòng lặp kiểm tra lại, chứ không giả định một lần GET là đủ.
- **Nếu muốn hỗ trợ upload song song, đừng ép tuần tự.** Ràng buộc "fragment phải tuần tự" của Graph là giới hạn lớn nhất của protocol này. S3/Azure multipart cho phép upload part song song → throughput cao hơn nhiều trên kết nối có latency cao.
- **Một session = một writer.** Nếu cần nhiều writer, phải có part ID không phụ thuộc thứ tự + commit list tường minh.

---

# 8. DEDUPLICATION & DELTA + POST-PROCESSING

## 8.1 OneDrive có instant upload / dedup bằng hash không?

### (a) XÁC NHẬN — những gì Microsoft KHÔNG cung cấp

- **Không có API công khai nào** trong Microsoft Graph cho phép "gửi hash trước, server trả lời đã có rồi thì bỏ qua upload". Không có endpoint kiểu `HEAD /by-hash/{hash}` hay tham số `if-content-exists`.
- `createUploadSession` **không nhận hash** trong request body. Các field được chấp nhận là: `@microsoft.graph.conflictBehavior`, `description`, `driveItemSource`, `fileSize`, `name`, `mediaSource`.
- Facet `hashes` là **read-only** trên driveItem.

### (a) XÁC NHẬN — những gì Microsoft CÓ cung cấp

- `quickXorHash` được điền sẵn trên mọi driveItem → **client có thể tự dedup**: liệt kê hash các file đã có, so với file sắp upload, bỏ qua nếu trùng. Đây chính xác là cách rclone và các sync tool hoạt động.
- **Server-side copy** (`POST /items/{id}/copy`) cho phép nhân bản file **không tốn băng thông upload**, trong cùng tenant (Business/SharePoint) hoặc giữa các drive Personal đã share (theo rclone docs).

### (b) SUY ĐOÁN — dedup ở tầng storage

- **Không có tài liệu công khai** nào của Microsoft xác nhận hay phủ nhận việc dedup nội dung giống nhau giữa các user/tenant ở tầng Azure Storage.
- Có **lập luận mạnh chống lại** cross-tenant dedup: doc data resiliency nói metadata lưu *"the location of and **access keys to** the content"* → mỗi blob có access key riêng; blob hash được tính trên **nội dung đã mã hóa** (*"a hash of the **encrypted content**"*). Nếu mỗi tenant/file có key riêng, ciphertext khác nhau → **dedup nội dung không khả thi** ở tầng blob. (Convergent encryption sẽ cần thiết cho dedup, và nó có các vấn đề bảo mật đã biết như confirmation-of-a-file attack.)
- Trong **cùng một file** thì có: SharePoint dùng **Shredded Storage** (từ SharePoint 2013) để chỉ lưu phần thay đổi giữa các version, tránh nhân bản toàn bộ nội dung mỗi lần save.

→ **Kết luận**: OneDrive **không có "instant upload" kiểu Dropbox/Baidu** ở tầng API công khai. Dedup nếu có thì là chi tiết implementation nội bộ, không phải feature.

## 8.2 Delta sync — cơ chế và phạm vi áp dụng

### (a) XÁC NHẬN — ba cơ chế KHÁC NHAU thường bị nhầm lẫn

#### (1) Graph `delta` query — **change tracking METADATA, KHÔNG phải content delta**

Nguồn: [driveItem: delta](https://learn.microsoft.com/en-us/graph/api/driveitem-delta)

```http
GET /me/drive/root/delta
→ { "value": [...driveItems...], "@odata.nextLink": "..." }
→ ... → { "value": [...], "@odata.deltaLink": "..." }
```

- Trả về **các driveItem đã thay đổi** (metadata), không phải bytes thay đổi.
- `deleted` facet đánh dấu item đã xóa.
- **Delta feed hiển thị trạng thái MỚI NHẤT của mỗi item, không phải từng thay đổi.** Rename 2 lần → chỉ xuất hiện 1 lần với tên cuối.
- Cùng một item có thể xuất hiện nhiều lần → dùng lần xuất hiện cuối.
- **Phải track theo `id`, không theo path** (`parentReference.path` không có giá trị).
- `?token=latest` → lấy deltaLink hiện tại mà không phải enumerate toàn bộ.
- Hỗ trợ **timestamp thay cho token** (chỉ Business/SharePoint): `?token=2021-09-29T20%3A00%3A00Z`.
- Token hết hạn/server đổi state → **`410 Gone`** + `Location` header chứa nextLink mới, kèm error code:
  - `resyncChangesApplyDifferences` — thay local bằng bản server
  - `resyncChangesUploadDifferences` — upload lên những gì server không có
- **Delta là cách DUY NHẤT được đảm bảo** để enumerate đầy đủ: *"Other approaches, such as paging through the `children` collection of a folder, are **not guaranteed to return every single item** if any writes take place during the enumeration."*
- Delta with token **chỉ tốn 1 RU** thay vì 2 (Microsoft cố tình ưu đãi để khuyến khích dùng).

#### (2) MS-FSSHTTP / FSSHTTPB (Cobalt) — **content delta thật, cho Office co-authoring**

Nguồn: [[MS-FSSHTTP] File Synchronization via SOAP over HTTP Protocol](https://learn.microsoft.com/en-us/openspecs/sharepoint_protocols/ms-fsshttp/05fa7efd-48ed-48d5-8d85-77995e17cc81), [[MS-FSSHTTPB]](https://learn.microsoft.com/en-us/openspecs/sharepoint_protocols/ms-fsshttpb/f59fc37d-2232-4b14-baac-25f98e9e7b5a), [[MS-FSSHTTPD]](https://learn.microsoft.com/en-us/openspecs/sharepoint_protocols/ms-fsshttpd/9e64d4aa-e451-4ae7-9cce-6f112ef4f478)

- Protocol cho phép client **đồng bộ thay đổi** trên file chia sẻ, hỗ trợ co-authoring, check-in/out, version revert.
- Client Office chỉ gửi **phần chênh lệch đã nén (delta)** về SharePoint khi save.
- Đây là protocol **binary + SOAP**, hoàn toàn khác REST upload session.
- Phía server, SharePoint dùng **Shredded Storage** để lưu các "shred" và chỉ ghi shred thay đổi.

#### (3) OneDrive sync client differential sync — **block-level, cho MỌI loại file (từ 2020)**

### (b) NGUỒN KHÔNG CHÍNH THỨC (báo chí công nghệ + phân tích)

- Microsoft hoàn tất rollout **differential sync cho mọi loại file** vào tháng 4/2020 ([Windows Central](https://www.windowscentral.com/onedrive-rolls-out-differential-sync-save-you-time-and-data-when-syncing-files), [Office365ITPros](https://office365itpros.com/2020/04/28/onedrive-differential-sync/), [BetaNews](https://betanews.com/2020/04/28/differential-sync-onedrive/)). Trước đó chỉ Office file mới có (qua Cobalt).
- Cơ chế mô tả: client chia file thành block nhỏ, giữ fingerprint cho từng block; khi file đổi, so fingerprint mới với fingerprint đã lưu và chỉ truyền các block khác biệt.
- Change detection qua **file system filter driver** bắt event (`FILE_NOTIFY_CHANGE_LAST_WRITE`, `FILE_NOTIFY_CHANGE_CREATION`).

### (b) Có áp dụng cho web không? — **KHÔNG**

- Microsoft **không công bố** bất kỳ API nào cho phép upload delta của một file qua Graph/REST. `createUploadSession` chỉ nhận byte range của **toàn bộ file mới**.
- Browser không thể (và không nên) truy cập file system filter driver hay giữ fingerprint database giữa các phiên.
- → **Web UI upload lại toàn bộ file** mỗi lần thay đổi. Differential sync là đặc quyền của **desktop sync client**.

**Ngoại lệ đáng lưu ý**: Azure Blob `Put Block List` **CÓ** hỗ trợ delta update ở tầng storage — upload lại chỉ các block đổi, rồi commit list gồm `<Committed>` (block cũ) + `<Uncommitted>` (block mới). Nhưng khả năng này **không được expose qua Graph API**.

## 8.3 Sau upload OneDrive làm gì? (post-processing pipeline)

### (a) XÁC NHẬN

| Bước | Chi tiết | Nguồn |
|---|---|---|
| **1. Ghi blob** | Ghi đồng thời vào primary + secondary region; fail 1 region → file save fail. Append-only. | [data resiliency](https://learn.microsoft.com/en-us/compliance/assurance/assurance-sharepoint-onedrive-data-resiliency) |
| **2. Ghi metadata** | Azure SQL Database: tên, vị trí blob, access key, file hash, blob hash | như trên |
| **3. Versioning** | Library mới mặc định giữ **500 versions**; UI không cho đặt < 100 | như trên |
| **4. Malware scan** | **Bất đồng bộ**, heuristics quyết định file nào được quét; nếu chưa quét mà user download qua browser → **trigger quét trước** | [virus protection](https://learn.microsoft.com/en-us/defender-office-365/anti-malware-protection-for-spo-odfb-teams-about) |
| **5. Thumbnail / preview** | Chỉ cho filetype được hỗ trợ (Office, PDF, một số ảnh/app). **Không tạo thumbnail cho ảnh > 100 MB. Không tạo PDF preview cho file > 100 MB.** | [Restrictions and limitations](https://support.microsoft.com/en-us/office/restrictions-and-limitations-in-onedrive-and-sharepoint-64883a5d-228e-48f5-b3d2-eb39e07630fa) |
| **6. Search indexing** | Incremental indexing; SharePoint indexer trích text từ DOCX/DOC/DOCM, XLSX/XLS/XLSM, PPTX/PPT/PPTM, MSG, XML. **Cập nhật metadata file cũng có thể trigger incremental indexing** dù nội dung không đổi. | [SharePoint indexer](https://learn.microsoft.com/en-us/azure/search/search-how-to-index-sharepoint-online) |
| **7. Delta feed** | Item xuất hiện trong `/delta` → sync client và app bên thứ ba biết có thay đổi | [driveItem: delta](https://learn.microsoft.com/en-us/graph/api/driveitem-delta) |
| **8. Data integrity job** | Mỗi **14 ngày** đối soát DB ↔ blob, khôi phục qua soft-delete nếu thiếu | [data resiliency](https://learn.microsoft.com/en-us/compliance/assurance/assurance-sharepoint-onedrive-data-resiliency) |

Retention:
- Recycle bin: **93 ngày** (site → site collection).
- Files Restore: quay về bất kỳ giây nào trong **30 ngày**.
- Metadata backup (PITR): **14 ngày**, snapshot mỗi 5–10 phút.
- Blob soft-delete sau khi metadata xóa: **14 ngày**.

Thumbnails được lấy qua API riêng: `GET /items/{id}/thumbnails` ([driveItem: list thumbnails](https://learn.microsoft.com/en-us/graph/api/driveitem-list-thumbnails)).

### (c) BÀI HỌC

- **Đừng hứa dedup toàn cục.** Nếu bạn mã hóa per-tenant (điều đúng đắn), dedup cross-tenant là bất khả thi. Nếu bạn muốn dedup, hãy làm ở phạm vi hẹp (trong 1 project/folder) và bằng hash **client-side** để tiết kiệm băng thông upload — đó là mô hình OneDrive thực tế hỗ trợ.
- **Expose hash trên metadata resource** để client tự dedup. Đây là cách tiết kiệm băng thông rẻ nhất và an toàn nhất.
- **Phân biệt rõ 3 khái niệm** khi thiết kế: change tracking (delta của metadata), content delta (chỉ gửi byte thay đổi), và block-level dedup (không gửi block đã có). Chúng giải quyết ba vấn đề khác nhau. Web hầu như chỉ cần cái thứ nhất.
- **Delta feed phải trả trạng thái mới nhất, không phải log từng thay đổi**, và client phải track theo **id chứ không phải path**. Nếu track theo path, mọi thao tác rename folder sẽ làm hỏng state của client.
- **Phải có cơ chế "resync required"** (Microsoft: 410 Gone + resyncChangesApplyDifferences / resyncChangesUploadDifferences). Token sẽ hết hạn; nếu không có đường thoát rõ ràng, client sẽ kẹt vĩnh viễn.
- **Post-processing phải bất đồng bộ và có trạng thái quan sát được.** Trong dự án của bạn: transcode/thumbnail qua Kafka. Quan trọng là mỗi Asset phải có **field trạng thái** (`PENDING` / `PROCESSING` / `READY` / `FAILED`) và API đọc phải phản ánh nó — đúng như OneDrive chặn download file chưa quét.
- **Đặt ngưỡng cứng cho post-processing tốn kém.** OneDrive không tạo thumbnail cho ảnh > 100 MB, không tạo PDF preview > 100 MB. Không có ngưỡng = một file 4 GB làm nghẽn cả worker pool.
- **Job đối soát định kỳ giữa metadata DB và object store là bắt buộc**, không phải "nice to have". Sẽ luôn có trường hợp metadata ghi thành công nhưng blob mất, hoặc ngược lại.

---

# DANH SÁCH VẤN ĐỀ THIẾT KẾ PHẢI GIẢI QUYẾT

Tổng hợp mọi bài toán kỹ thuật mà Microsoft đã phải giải trong pipeline upload của họ. Đây là checklist đầy đủ cho bất kỳ ai xây upload service nghiêm túc.

## A. Protocol & phiên (session)

1. **Chọn ngưỡng chuyển giữa simple upload và resumable upload** — và chấp nhận rằng ngưỡng "đúng" khác nhau tùy độ tin cậy mạng (MS: 4 MB / 250 MB / khuyến nghị 10 MiB).
2. **Xác định tổng kích thước file trước khi bắt đầu** — cần cho quota check, pre-allocation, và phát hiện client sai.
3. **Định nghĩa đơn vị chunk và quantum bắt buộc** (MS: bội số 320 KiB, tối đa < 60 MiB) để backend map chunk → block storage một cách xác định.
4. **Thiết kế cách biểu diễn "server đã nhận đến đâu"** — offset đơn hay danh sách range? Danh sách range mở đường cho upload song song sau này.
5. **Quyết định fragment tuần tự hay song song** — tuần tự đơn giản hơn nhiều nhưng giới hạn throughput trên mạng latency cao.
6. **Tách endpoint tạo session (có auth, business logic) khỏi endpoint nhận bytes (tối ưu throughput, pre-authenticated)**.
7. **Cơ chế commit tường minh (`deferCommit`) vs commit ngầm ở fragment cuối** — commit tường minh cho phép upload bytes trước, quyết định vị trí/tên sau.
8. **Cho phép thương lượng lại metadata đích sau khi bytes đã lên server** (MS: `@microsoft.graph.sourceUrl`) — tránh phải upload lại 50 GB chỉ vì trùng tên.
9. **API `GET session status` là bắt buộc** — client sẽ mất state.
10. **API `DELETE session` là bắt buộc** — không có nó thì mọi upload bị hủy đều thành rác vĩnh viễn.
11. **Xác định chính sách hết hạn: sliding hay absolute** — sliding là bắt buộc cho file lớn.
12. **Quyết định hành vi khi 2 client cùng ghi 1 session** — hoặc cấm (một writer), hoặc dùng part ID độc lập thứ tự.

## B. Lưu trữ & staging

13. **Nơi lưu bytes chưa commit** — phải là storage bền, không phải RAM hay đĩa local của một instance.
14. **Ngữ nghĩa "đã ghi nhưng vô hình"** — reader tuyệt đối không được thấy dữ liệu chưa commit.
15. **Định danh part: byte offset hay client-chosen ID?** — ID cho phép retry idempotent; offset thì không.
16. **Ràng buộc kích thước và số lượng part** (MS/Azure: 50,000 committed, 100,000 uncommitted, 4,000 MiB/block).
17. **Garbage collection cho staging data bị bỏ dở** — TTL trượt + job quét (Azure: 7 ngày). Đây là chi phí lưu trữ thật.
18. **Chấp nhận GC bất đồng bộ** — không thiết kế hệ thống giả định temp data biến mất đúng thời điểm.
19. **Tách metadata (DB giao dịch) khỏi content (object store)** và giữ chúng nhất quán.
20. **Chiến lược lưu version: append-only blob mới, hay mutate in-place?** — append-only cho versioning, chống ransomware, loại bỏ lớp bug ghi đè nửa chừng.
21. **Chi phí staging theo tier** — Azure tính `Put Block` theo default tier chứ không phải destination tier.

## C. Commit & tính nhất quán

22. **Đảm bảo commit nguyên tử đối với reader** — không có trạng thái trung gian nhìn thấy được.
23. **Xác định điều gì bị ghi đè khi commit lên object đã tồn tại** (Azure: properties + metadata bị ghi đè, snapshot giữ lại, lease giữ, tier kế thừa).
24. **Optimistic concurrency bằng ETag** — `If-Match` chống lost update, `If-None-Match: *` cho create-if-not-exists nguyên tử.
25. **Xử lý conflict tên tại thời điểm commit, không chỉ lúc tạo session** — thế giới thay đổi trong lúc upload.
26. **Chính sách conflict rõ ràng và cho client chọn** (`fail` / `replace` / `rename`).
27. **Quota check hai lần**: lúc tạo session (fail nhanh, tiết kiệm băng thông) và lúc commit (bắt race).
28. **Xử lý part thiếu lúc commit** — trả lỗi rõ ràng để client biết upload lại part nào.
29. **Trả về full resource ở response commit** để client không phải gọi thêm request.

## D. Tính toàn vẹn dữ liệu

30. **Checksum per-chunk validate lúc ghi** — phát hiện lỗi sớm thay vì sau khi upload xong 100 GB.
31. **Chọn thuật toán hash: crypto hay non-crypto? tuần tự hay parallel-friendly?** (MS chọn QuickXorHash 160-bit, non-crypto, XOR+rotate).
32. **Hash toàn-file lưu trong metadata cho client verify** — kể cả khi server không tự validate nó.
33. **Lưu hash ở nhiều tầng** (SharePoint: file hash logic + blob hash của ciphertext).
34. **Verify checksum ở MỌI lần đọc**, không chỉ lúc ghi — chống bit rot.
35. **Job đối soát định kỳ metadata DB ↔ object store** (SharePoint: 14 ngày), có đường khôi phục qua soft-delete.
36. **Checksum trên network traffic** ngoài checksum at-rest.

## E. Bảo mật

37. **Mô hình cấp quyền cho endpoint nhận bytes**: pre-authenticated URL (rẻ, scale tốt, không audit được) vs proxy qua service (audit được, đắt).
38. **Thu hẹp scope của credential tối đa** — một session, một object đích, không quyền đọc.
39. **Cơ chế revoke** cho credential đã phát (MS: `DELETE uploadUrl`; Azure: stored access policy hoặc xoay key).
40. **Expiry ngắn + xử lý clock skew** (Azure: lùi start time 15 phút).
41. **Bắt buộc HTTPS** cho việc tạo và truyền credential.
42. **Chấp nhận rằng không audit được ai dùng presigned URL** — nếu cần audit, phải proxy.
43. **Chống lạm dụng chi phí** — presigned write URL cho phép upload file khổng lồ; giới hạn size + expiry ngắn.
44. **Validate dữ liệu SAU khi ghi, TRƯỚC khi dùng** — client có thể ghi rác hoặc dữ liệu độc hại.
45. **Malware scanning bất đồng bộ** + cờ trạng thái quét trên metadata + enforce ở đường download.
46. **⚠️ Quét trên file đã ráp lại, KHÔNG quét từng chunk** — chunk header-only bị đánh dấu corrupt, chunk tail-only trông vô hại.
47. **Chính sách với file chưa quét**: chặn hoàn toàn, hay cho tải với cảnh báo? (MS mặc định cho tải + cảnh báo; có switch để chặn hẳn).
48. **Sync client có thể đã đồng bộ file trước khi nó bị đánh dấu độc hại** — cần cơ chế thu hồi ở client.
49. **Timeout cho scan** (Defender: 30 phút – 3 giờ) và trạng thái "scan timed out".
50. **Không cập nhật metadata ngay sau upload nếu có on-upload scan** — có thể làm scan fail.
51. **Mã hóa at-rest + quản lý access key trong metadata** (SharePoint: metadata giữ access key tới blob).

## F. Kiểm soát tải & throttling

52. **Rate limiting nhiều chiều**: theo request count, theo băng thông ingress, theo user, theo app, theo tenant.
53. **Mô hình chi phí có trọng số (resource units)** thay vì đếm request thuần — upload đắt hơn read.
54. **`Retry-After` bắt buộc trên mọi response throttle**.
55. **Request bị throttle vẫn tính vào quota** — cần thông báo rõ để client không retry hung hăng.
56. **Tín hiệu sớm trước khi throttle** (RateLimit-Limit / Remaining / Reset).
57. **Traffic decoration / app identification** để ưu tiên traffic đã đăng ký và điều tra sự cố.
58. **Cơ chế block hoàn toàn** cho client vi phạm kéo dài + kênh thông báo cho chủ tenant.
59. **Peak vs off-peak** — giới hạn có thể chặt hơn trong giờ cao điểm.
60. **Chống hot partition** — naming scheme tuần tự/append-only làm dồn traffic vào một partition (Azure cảnh báo trực tiếp).

## G. Độ tin cậy & phục hồi

61. **Phân loại lỗi rõ ràng**: retryable với exponential backoff (5xx, đứt kết nối) / retryable có giới hạn (4xx khác) / phải restart hoàn toàn (404 session gone).
62. **Retry idempotent** — thiết kế part ID để gửi lại luôn an toàn.
63. **Ngữ nghĩa khi client gửi lại phần đã có** — 416 rõ ràng + đường dẫn tới `GET status` để tự sửa.
64. **Không hứa quá về độ đầy đủ của `nextExpectedRanges`** — client phải viết vòng lặp kiểm tra.
65. **Fragment đứt giữa chừng = bỏ toàn bộ fragment đó** (all-or-nothing ở mức fragment) — đơn giản hóa rất nhiều so với ghi nhận partial.
66. **Xử lý session không tồn tại (404)** — restart hoàn toàn, và làm rõ với client rằng đó là hành vi đúng.
67. **Không có giới hạn tổng thời gian, chỉ có sliding expiry** — nhưng phải bảo vệ chống session sống mãi mà không tiến triển.
68. **Nhân bản đồng bộ trong region trước khi ack** (WAS: 3 bản; SharePoint: 2 region).
69. **Geo-replication bất đồng bộ + chấp nhận RPO** — hoặc trả giá latency để có RPO = 0 (lựa chọn của SharePoint).
70. **Soft delete nhiều tầng** (recycle bin 93 ngày → blob soft-delete 14 ngày → PITR metadata 14 ngày).
71. **Automated failover** không phụ thuộc DNS caching (SharePoint dùng Azure Front Door).

## H. Sau upload (post-processing)

72. **Pipeline bất đồng bộ với trạng thái quan sát được** trên mỗi asset.
73. **Ngưỡng cứng cho post-processing tốn kém** (thumbnail/preview không tạo cho file > 100 MB).
74. **Thứ tự và phụ thuộc giữa các bước** (scan trước khi cho download; index sau khi có metadata).
75. **Versioning và retention policy** (mặc định 500 versions; không cho phép < 100 vì rủi ro mất dữ liệu).
76. **Change feed / delta API cho client đồng bộ** — trả trạng thái mới nhất, track theo id, có cơ chế resync.
77. **Xử lý token delta hết hạn** (410 Gone + hướng dẫn resync cụ thể).
78. **Đối soát định kỳ và tự phục hồi**.

## I. Giới hạn nghiệp vụ phải quyết định sớm

79. **Kích thước file tối đa** (OneDrive: 250 GB).
80. **Độ dài path/tên file** (OneDrive: < 400 ký tự tính cả tên).
81. **Ký tự và tên bị cấm** (`" * : < > ? / \ |`, `CON`, `PRN`, `AUX`, `NUL`, `COM0-9`, `LPT0-9`, `.lock`, `desktop.ini`, tên bắt đầu `~$`, khoảng trắng đầu/cuối).
82. **Phân biệt hoa thường** — OneDrive case-insensitive: không thể có cả `Hello.doc` và `hello.doc`.
83. **Số item tối đa trong một folder** (rclone ghi nhận lỗi quanh 100,000 file/folder trên OneDrive).
84. **Giới hạn sharing/permission** (50,000 sub-item cho shared folder; khuyến nghị ≤ 5,000 unique permission).

---

## Phụ lục: Danh sách nguồn

### Nguồn chính thức Microsoft — Graph / OneDrive API
- driveItem: createUploadSession — <https://learn.microsoft.com/en-us/graph/api/driveitem-createuploadsession>
- uploadSession resource type — <https://learn.microsoft.com/en-us/graph/api/resources/uploadsession>
- Upload small files (PUT /content) — <https://learn.microsoft.com/en-us/graph/api/driveitem-put-content>
- Uploading files (concepts) — <https://learn.microsoft.com/en-us/onedrive/developer/rest-api/concepts/upload?view=odsp-graph-online>
- Resumable file upload (OneDrive dev center) — <https://learn.microsoft.com/en-us/onedrive/developer/rest-api/api/driveitem_createuploadsession?view=odsp-graph-online>
- hashes resource type — <https://learn.microsoft.com/en-us/graph/api/resources/hashes>
- QuickXorHash sample — <https://learn.microsoft.com/en-us/onedrive/developer/code-snippets/quickxorhash>
- driveItem: delta — <https://learn.microsoft.com/en-us/graph/api/driveitem-delta>
- Upload large files using the Microsoft Graph SDKs — <https://learn.microsoft.com/en-us/graph/sdks/large-file-upload>
- Microsoft Graph throttling guidance — <https://learn.microsoft.com/en-us/graph/throttling>
- Microsoft Graph throttling limits — <https://learn.microsoft.com/en-us/graph/throttling-limits>
- File.CancelUpload (SharePoint CSOM) — <https://learn.microsoft.com/en-us/previous-versions/office/sharepoint-server/dn760920(v=office.15)>

### Nguồn chính thức Microsoft — Azure Storage
- Put Block (REST API) — <https://learn.microsoft.com/en-us/rest/api/storageservices/put-block>
- Put Block List (REST API) — <https://learn.microsoft.com/en-us/rest/api/storageservices/put-block-list>
- Specifying conditional headers for Blob service operations — <https://learn.microsoft.com/en-us/rest/api/storageservices/specifying-conditional-headers-for-blob-service-operations>
- Blob Storage scalability and performance targets — <https://learn.microsoft.com/en-us/azure/storage/blobs/scalability-targets>
- Azure Storage data redundancy — <https://learn.microsoft.com/en-us/azure/storage/common/storage-redundancy>
- Grant limited access with shared access signatures (SAS) — <https://learn.microsoft.com/en-us/azure/storage/common/storage-sas-overview>
- Introduction to Defender for Storage malware scanning — <https://learn.microsoft.com/en-us/azure/defender-for-cloud/introduction-malware-scanning>

### Nguồn chính thức Microsoft — SharePoint / OneDrive service
- SharePoint and OneDrive data resiliency in Microsoft 365 — <https://learn.microsoft.com/en-us/compliance/assurance/assurance-sharepoint-onedrive-data-resiliency>
- Built-in virus protection in SharePoint, OneDrive, and Teams — <https://learn.microsoft.com/en-us/defender-office-365/anti-malware-protection-for-spo-odfb-teams-about>
- Avoid getting throttled or blocked in SharePoint Online — <https://learn.microsoft.com/en-us/sharepoint/dev/general-development/how-to-avoid-getting-throttled-or-blocked-in-sharepoint-online>
- Restrictions and limitations in OneDrive and SharePoint — <https://support.microsoft.com/en-us/office/restrictions-and-limitations-in-onedrive-and-sharepoint-64883a5d-228e-48f5-b3d2-eb39e07630fa>
- [MS-FSSHTTP] File Synchronization via SOAP over HTTP Protocol — <https://learn.microsoft.com/en-us/openspecs/sharepoint_protocols/ms-fsshttp/05fa7efd-48ed-48d5-8d85-77995e17cc81>
- [MS-FSSHTTPB] Binary Requests for File Synchronization — <https://learn.microsoft.com/en-us/openspecs/sharepoint_protocols/ms-fsshttpb/f59fc37d-2232-4b14-baac-25f98e9e7b5a>
- SharePoint in Microsoft 365 Indexer (Azure AI Search) — <https://learn.microsoft.com/en-us/azure/search/search-how-to-index-sharepoint-online>

### Paper học thuật
- Calder et al., *Windows Azure Storage: A Highly Available Cloud Storage Service with Strong Consistency*, SOSP 2011 — <https://www.sigops.org/s/conferences/sosp/2011/current/2011-Cascais/11-calder-online.pdf>
- Azure blog công bố paper — <https://azure.microsoft.com/en-us/blog/sosp-paper-windows-azure-storage-a-highly-available-cloud-storage-service-with-strong-consistency/>

### Nguồn bên thứ ba (đánh dấu (b) trong báo cáo)
- rclone OneDrive backend documentation — <https://rclone.org/onedrive/>
- Microsoft Q&A: Expiration Date & Time of Upload Session (câu hỏi chưa được trả lời) — <https://learn.microsoft.com/en-us/answers/questions/852442/expiration-date-time-of-upload-session-created-via>
- Windows Central — OneDrive differential sync rollout — <https://www.windowscentral.com/onedrive-rolls-out-differential-sync-save-you-time-and-data-when-syncing-files>
- Office 365 for IT Pros — OneDrive Completes Roll-Out of Differential Sync — <https://office365itpros.com/2020/04/28/onedrive-differential-sync/>
- SharePoint REST chunked upload gist (vgrem) — <https://gist.github.com/vgrem/d313805b9b4401c9ccefff2c2782f866>
- sp-dev-docs discussion: Uploading files larger than 262 MB via REST API — <https://github.com/SharePoint/sp-dev-docs/discussions/8757>
