# Nghiên cứu hệ thống Upload File của Google
### Google Drive (web + API) · Google Cloud Storage · tham chiếu YouTube / Photos / Gemini File API
### Trọng tâm: kiến trúc backend & blob storage

> **Ngày nghiên cứu:** 2026-08-01
> **Phương pháp:** WebSearch + WebFetch trên nguồn chính thức (`developers.google.com`, `cloud.google.com`), blog kỹ thuật Google Cloud, source code công khai (rclone, gdata-java-client, google-gemini/cookbook).
> **Quy ước ký hiệu độ tin cậy trong toàn báo cáo:**
> - **(a) XÁC NHẬN** — có nguồn chính thức của Google, trích dẫn URL trực tiếp.
> - **(b) SUY ĐOÁN / KHÔNG CHÍNH THỨC** — từ source code bên thứ ba, GitHub issue, blog, hoặc suy luận kiến trúc. **Không được coi là sự thật.**
> - **(c) Bài học cho người tự xây upload service.**

---

## MỤC LỤC

1. [PROTOCOL — Giao thức upload](#1-protocol--giao-thức-upload)
2. [UPLOAD SESSION — Phiên upload](#2-upload-session--phiên-upload)
3. [BLOB / BACKEND — Đường đi của byte (TRỌNG TÂM)](#3-blob--backend--đường-đi-của-byte-trọng-tâm)
4. [FINALIZE / COMMIT](#4-finalize--commit)
5. [INTEGRITY — Toàn vẹn dữ liệu](#5-integrity--toàn-vẹn-dữ-liệu)
6. [SECURITY — Bảo mật](#6-security--bảo-mật)
7. [RELIABILITY — Độ tin cậy, retry, idempotency](#7-reliability--độ-tin-cậy-retry-idempotency)
8. [POST-PROCESSING — Xử lý sau commit](#8-post-processing--xử-lý-sau-commit)
9. [DANH SÁCH VẤN ĐỀ THIẾT KẾ PHẢI GIẢI QUYẾT](#9-danh-sách-vấn-đề-thiết-kế-phải-giải-quyết)
10. [Danh mục nguồn](#10-danh-mục-nguồn)

---

# 1. PROTOCOL — Giao thức upload

## 1.1 (a) XÁC NHẬN — Google Drive API: ba kiểu upload

Drive API v3 hỗ trợ đúng 3 cơ chế, phân biệt bằng query param `uploadType`:

| Kiểu | `uploadType=` | Ngưỡng khuyến nghị | Đặc điểm |
|---|---|---|---|
| **Simple** | `media` | file ≤ 5 MB, **không** kèm metadata | Body = raw bytes. Metadata bị suy diễn tự động |
| **Multipart** | `multipart` | file ≤ 5 MB, **có** metadata | Body = `multipart/related` (RFC 2387): part 1 JSON metadata, part 2 media |
| **Resumable** | `resumable` | file > 5 MB, **hoặc** mạng không ổn định (mobile) | 2 pha: initiate → upload |

Nguồn: [Drive API — Upload file data](https://developers.google.com/workspace/drive/api/guides/manage-uploads)

Trích nguyên văn khuyến nghị của Google: resumable nên dùng cho *"large files (greater than 5 MB) and when there's a high chance of network interruption, such as when creating a file from a mobile app."*

### Luồng resumable đầy đủ (Drive API)

**Bước 1 — Initiate (POST):**
```http
POST https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable HTTP/1.1
Authorization: Bearer <token>
Content-Type: application/json; charset=UTF-8
Content-Length: <độ dài JSON metadata>
X-Upload-Content-Type: video/mp4        ← MIME type của FILE (không phải của request)
X-Upload-Content-Length: 2000000        ← tổng byte của FILE

{"name": "myfile.mp4", "parents": ["<folderId>"]}
```

**Phản hồi:**
```http
HTTP/1.1 200 OK
Location: https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=xa298sd_sdlkj2
Content-Length: 0
```

> Điểm mấu chốt kiến trúc: `X-Upload-Content-*` tách biệt **metadata của file sẽ upload** khỏi **metadata của HTTP request hiện tại**. Request initiate có `Content-Type: application/json` và `Content-Length` = độ dài JSON, trong khi file thật là `video/mp4` dài 2 MB. Đây là chi tiết mà rất nhiều người tự xây upload service làm sai.

**Bước 2 — Upload chunk (PUT):**
```http
PUT <session_uri> HTTP/1.1
Content-Length: 524288
Content-Range: bytes 0-524287/2000000

<524288 bytes nhị phân>
```

**Bước 3 — Phản hồi từng chunk:**
- `308 Resume Incomplete` + header `Range: bytes=0-524287` → server đã persist tới byte 524287, chunk tiếp theo bắt đầu từ 524288.
- `200 OK` (khi update file có sẵn) / `201 Created` (khi tạo file mới) → hoàn tất, body chứa metadata file.

**Bước 4 — Hỏi offset (query status):** PUT rỗng với `Content-Range: bytes */2000000` (hoặc `bytes */*` nếu không biết tổng size).

Cảnh báo nguyên văn của Google: *"you should not assume that the server received all bytes sent in any given request."* → **luôn** đọc `Range` từ response, không tự tăng offset ở client.

Nếu response 308 **không có** header `Range` → server chưa persist byte nào; phải bắt đầu lại từ 0.

### Quy tắc chunk 256 KB

(a) XÁC NHẬN — Drive API: chunk phải là bội số của **256 KB**, trừ chunk cuối. Google khuyến nghị *"Keep the chunk size as large as possible"*. YouTube API cũng dùng bội số 256 KB và nói thêm rằng *"Larger chunks are more efficient"* + khuyến cáo **hạn chế chunking** vì overhead.

GCS: buffer/chunk phải là bội số của **256 KiB** (262144 bytes), và Google khuyến nghị **tối thiểu 8 MiB** mỗi chunk.

Ngoại lệ: Street View Publish API yêu cầu bội số **2 MiB**; Photos API trả về `X-Goog-Upload-Chunk-Granularity` động trong response initiate → **granularity là tham số do server công bố, không phải hằng số toàn cục**.

## 1.2 (a) XÁC NHẬN — Họ header `X-Goog-Upload-*` (giao thức nội bộ dùng chung)

Song song với giao thức `Content-Range`/`308` kiểu HTTP chuẩn, Google có một **giao thức thứ hai dựa hoàn toàn trên header riêng**, xuất hiện nhất quán trên nhiều sản phẩm: Google Photos Library API, Street View Publish API, Gemini File API.

### Bảng header đầy đủ

**Request — khởi tạo session:**

| Header | Giá trị | Ý nghĩa |
|---|---|---|
| `X-Goog-Upload-Protocol` | `resumable` \| `raw` \| `multipart` | Chọn giao thức |
| `X-Goog-Upload-Command` | `start` | Lệnh khởi tạo |
| `X-Goog-Upload-Header-Content-Length` | `<bytes>` | Tổng size **file** |
| `X-Goog-Upload-Header-Content-Type` | `image/jpeg` | MIME **file** |
| `Content-Length` | `0` hoặc độ dài JSON | Của **request** |

**Response — khởi tạo:**

| Header | Ý nghĩa |
|---|---|
| `X-Goog-Upload-URL` | Session URI (tương đương `Location` ở giao thức public) |
| `X-Goog-Upload-Chunk-Granularity` | Bội số byte bắt buộc cho chunk |
| `X-Goog-Upload-Status` | `active` |

**Request — gửi dữ liệu:**

| Header | Giá trị |
|---|---|
| `X-Goog-Upload-Command` | `upload` (chunk giữa) \| `upload, finalize` (chunk cuối / gửi 1 phát) |
| `X-Goog-Upload-Offset` | Vị trí byte tuyệt đối để ghi |
| `Content-Length` | Kích thước chunk |

**Request — hỏi trạng thái / hủy:**

| Header | Giá trị |
|---|---|
| `X-Goog-Upload-Command` | `query` \| `cancel` |
| `Content-Length` | `0` |

**Response — trạng thái:**

| Header | Ý nghĩa |
|---|---|
| `X-Goog-Upload-Status` | `active` \| `final` \| `cancelled` |
| `X-Goog-Upload-Size-Received` | Số byte server đã nhận |

Nguồn: [Photos Library API — Resumable uploads](https://developers.google.com/photos/library/guides/resumable-uploads), [Street View Publish — Performing a Resumable Upload](https://developers.google.com/streetview/publish/resumable-uploads)

### Ví dụ thật (Gemini File API — code chính thức của Google)

```bash
curl "${BASE_URL}/upload/v1beta/files?key=${api_key}" \
  -D "${tmp_header_file}" \
  -H "X-Goog-Upload-Protocol: resumable" \
  -H "X-Goog-Upload-Command: start" \
  -H "X-Goog-Upload-Header-Content-Length: ${NUM_BYTES}" \
  -H "X-Goog-Upload-Header-Content-Type: ${MIME_TYPE}" \
  -H "Content-Type: application/json" \
  -d "{'file': {'display_name': '${display_name}'}}"

upload_url=$(grep "x-goog-upload-url: " "${tmp_header_file}" | cut -d" " -f2 | tr -d "\r")

curl "${upload_url}" \
  -H "Content-Length: ${num_chunk_bytes}" \
  -H "X-Goog-Upload-Offset: ${byte_offset}" \
  -H "X-Goog-Upload-Command: ${upload_command}" \   # "upload" hoặc "upload, finalize"
  --data-binary "@${tmp_chunk_file}"
```
Nguồn: [google-gemini/cookbook `quickstarts/file-api/sample.sh`](https://github.com/google-gemini/cookbook/blob/main/quickstarts/file-api/sample.sh)

### So sánh hai giao thức

| Khía cạnh | Public (`Content-Range`) | `X-Goog-Upload-*` |
|---|---|---|
| Nơi mang offset | `Content-Range: bytes A-B/N` | `X-Goog-Upload-Offset: A` |
| Báo "chưa xong" | HTTP status `308` | HTTP `200` + `X-Goog-Upload-Status: active` |
| Báo "xong" | `200`/`201` | `X-Goog-Upload-Status: final` |
| Hỏi offset | PUT rỗng `Content-Range: bytes */N` | `X-Goog-Upload-Command: query` |
| Hủy | `DELETE <session_uri>` → 499 | `X-Goog-Upload-Command: cancel` |
| Finalize | Ngầm định (khi đủ N byte) | **Tường minh** (`, finalize`) |
| Vấn đề thực tế | 308 bị nhiều proxy/CDN/thư viện HTTP xử lý sai | Chỉ dùng 200/4xx/5xx → thân thiện với hạ tầng trung gian |

> **Đây là insight kiến trúc quan trọng nhất của mục 1:** Google thiết kế giao thức thứ hai để **né HTTP status code lạ (308) và né header `Content-Range`** — hai thứ hay bị proxy, load balancer, WAF và HTTP client library cắt/viết lại. Toàn bộ trạng thái được đẩy vào header custom, và **finalize trở thành hành động tường minh** thay vì suy diễn từ độ dài.

## 1.3 (b) SUY ĐOÁN — "Scotty" và giao thức mà web UI drive.google.com thực sự dùng

**Những gì XÁC NHẬN được về Scotty (bằng chứng công khai, gián tiếp):**

1. Source code chính thức của Google, `gdata-java-client`, có comment nhắc thẳng tên: *"Leaving out the header causes the **scotty server** to try to determine the content type."*
   → [`ResumableHttpUploadTask.java`](https://github.com/google/gdata-java-client/blob/master/java/src/com/google/gdata/client/uploader/ResumableHttpUploadTask.java)
   Đây là bằng chứng công khai chắc chắn rằng có một **server upload dùng chung** tên Scotty, đứng trước các API của Google, và nó có logic **content-type sniffing** phía server.

2. Mọi endpoint upload của Google trả về header `X-GUploader-UploadID` — kể cả GCS XML API khi POST `x-goog-resumable: start`. "GUploader" = Google Uploader.
   → [GCS — Initiate a resumable upload (XML API)](https://cloud.google.com/storage/docs/xml-api/post-object-resumable)

3. Họ header `X-Goog-Upload-*` **giống hệt nhau** giữa Photos, Street View, Gemini File API — ba sản phẩm thuộc ba tổ chức khác nhau trong Google. Điều này chỉ hợp lý nếu chúng dùng chung một tầng upload frontend.

**Suy luận kiến trúc (KHÔNG có nguồn chính thức xác nhận):**

- Scotty là một **upload proxy/frontend dùng chung toàn Google**, nằm giữa GFE và các application backend. Nó nhận byte, quản lý session/offset, ghi vào blob storage, rồi mới gọi backend ứng dụng (Drive/Photos/YouTube) kèm một **blob handle** thay vì kèm bytes.
- Mô hình này giải thích vì sao Drive, Photos, YouTube, Gemini có giao thức upload giống nhau nhưng metadata model hoàn toàn khác nhau: **tách tầng vận chuyển byte khỏi tầng nghiệp vụ**.
- App Engine Blobstore API (public) hoạt động theo đúng khuôn mẫu này: *"the user's browser uploads the file directly to the Blobstore via a generated URL, and Blobstore then stores the blob, rewrites the request to contain the **blob key**, and passes it to a path in the application."* → [App Engine Blobstore overview](https://docs.cloud.google.com/appengine/docs/standard/services/blobstore). Đây là bản public hoá của cùng một pattern.

**Về web UI drive.google.com — ⚠️ KHÔNG XÁC MINH ĐƯỢC:**

Tôi **không tìm được nguồn công khai đáng tin cậy nào** (blog phân tích, StackOverflow, HAR dump) mô tả chính xác request mà `drive.google.com` gửi khi upload. Các tìm kiếm nhắm vào `clients6.google.com/upload`, `upload/drive/v1/file`, HAR trace đều không trả về kết quả có giá trị.

Suy đoán hợp lý (mức tin cậy THẤP, cần tự verify bằng DevTools nếu cần dùng):
- Web UI dùng nhánh `X-Goog-Upload-*` chứ không dùng `Content-Range`/308, vì lý do tương thích proxy nêu ở §1.2.
- Endpoint là host nội bộ (`clients6.google.com` hoặc tương đương) chứ không phải `www.googleapis.com`.
- Xác thực bằng session cookie + `X-Goog-*` auth headers, không phải OAuth bearer token như public API.

> **Cách tự kiểm chứng:** mở DevTools → tab Network → filter `upload` → kéo thả một file ~50 MB vào Drive → xem request đầu tiên (`X-Goog-Upload-Command: start`) và các request `upload`/`upload, finalize` tiếp theo. Đây là cách duy nhất để có dữ liệu chắc chắn.

## 1.4 (a) XÁC NHẬN — GCS resumable upload khác Drive ở đâu

| Khía cạnh | Drive API | GCS |
|---|---|---|
| Khởi tạo | `POST .../files?uploadType=resumable` | JSON API: `POST .../o?uploadType=resumable&name=X`<br>XML API: `POST /BUCKET/OBJECT` + header `x-goog-resumable: start` |
| Status initiate | `200 OK` | JSON: `200`; XML: `201 Created` |
| Session URI ở đâu | `Location` | `Location` |
| Hủy session | (không tài liệu hoá rõ) | `DELETE <session_uri>` → JSON: `499`, XML: `204` |
| Session hết hạn | `404` → làm lại | `410 Gone` (<1 tuần), `404` (>1 tuần) |
| Hết hạn | 1 tuần | 1 tuần (7 ngày) |
| Đơn vị đích | File + metadata Drive (folder, permission) | Object bất biến trong bucket |
| Ghi đè | Tạo file mới (trùng tên là bình thường) | **Ghi đè** object cùng tên → cần `ifGenerationMatch=0` để chặn |

Nguồn: [GCS — Perform resumable uploads](https://docs.cloud.google.com/storage/docs/performing-resumable-uploads), [GCS — Resumable uploads](https://docs.cloud.google.com/storage/docs/resumable-uploads)

### GCS còn có thêm 2 kiểu upload mà Drive không có

**XML API multipart upload** (tương thích Amazon S3): 3 bước — `POST` initiate → nhận `UploadId` → nhiều `PUT` part song song → `POST` complete. Giới hạn: **10.000 parts**, mỗi part **5 MiB – 5 GiB** (trừ part cuối).
→ [GCS — XML API multipart uploads](https://docs.cloud.google.com/storage/docs/multipart-uploads)

**Parallel composite upload:** chia file thành tối đa **32 chunk**, upload song song vào các temporary object, rồi dùng `compose` API ghép lại và xoá temp. Ngưỡng mặc định của `gcloud`: **150 MiB** (`storage/parallel_composite_upload_threshold`).
→ [GCS — Parallel composite uploads](https://docs.cloud.google.com/storage/docs/parallel-composite-uploads)

### Ngưỡng chọn kiểu upload — công thức chính thức của Google

Google đưa ra cách tính ngưỡng theo **thời gian chấp nhận mất khi phải upload lại**:

| Băng thông | Chấp nhận mất 30s | → Ngưỡng single-request |
|---|---|---|
| 8 Mbps (internet thường) | 30 giây | **~30 MB** |
| 500 Mbps (trong region) | 30 giây | **~2 GB** |

Nguồn: [GCS — Uploads and downloads](https://docs.cloud.google.com/storage/docs/uploads-downloads)

Đồng thời Google nói: *"Resumable upload… is recommended for most applications, since it also works for small uploads with minimal additional cost of one additional HTTP request."* → **Nếu phân vân, chọn resumable.**

## 1.5 (c) Bài học cho người tự xây upload service

- **Tách MIME/size của file khỏi MIME/size của request.** Dùng header riêng (`X-Upload-Content-Type`/`-Length` hoặc `X-Goog-Upload-Header-*`). Nếu bạn nhét metadata file vào `Content-Type` của request initiate, bạn sẽ không bao giờ gửi kèm JSON metadata được.
- **Cân nhắc nghiêm túc việc KHÔNG dùng `308` và `Content-Range`.** Google tự làm giao thức thứ hai với header custom + status 200 chính vì hạ tầng trung gian (nginx, CloudFront, corporate proxy, HTTP client của Java/Python cũ) xử lý 308 và `Content-Range` request rất tệ. Với stack Spring WebFlux/nginx, đây là rủi ro thật.
- **Finalize phải tường minh.** `X-Goog-Upload-Command: upload, finalize` tốt hơn "suy ra đã xong khi đủ N byte" — vì client có thể không biết N (streaming), và suy diễn ngầm khiến bug offset trở thành bug corruption thay vì lỗi rõ ràng.
- **Công bố chunk granularity từ server**, đừng hard-code ở client. Photos trả `X-Goog-Upload-Chunk-Granularity` trong response initiate → server có thể đổi chính sách mà không cần release lại client.
- **Đừng ép mọi file đi resumable-với-nhiều-chunk.** YouTube nói thẳng chunking gây overhead; GCS nói single-request phù hợp tới ~30 MB trên internet thường. Đặt ngưỡng theo băng thông × thời gian chấp nhận mất.

---

# 2. UPLOAD SESSION — Phiên upload

## 2.1 (a) XÁC NHẬN — Session URI là bearer credential

Đây là câu hỏi quan trọng nhất về bảo mật của toàn bộ giao thức, và Google trả lời rất thẳng thắn.

Trích nguyên văn từ tài liệu GCS:

> *"This session URI acts as an authentication token, so the requests that use it don't need to be signed and can be used by **anyone** to upload data to the target bucket **without any further authentication**."*

> *"Be careful when sharing the resumable session URI, because it can be used by anyone to upload data to the target bucket without any further authentication."*

> *"Like signed URLs, a session URI can be used by anyone in possession of it to upload data. Be sure to transmit the session URI over HTTPS when giving it to a client."*

Nguồn: [GCS — Resumable uploads](https://docs.cloud.google.com/storage/docs/resumable-uploads), [GCS — Signed URLs](https://docs.cloud.google.com/storage/docs/access-control/signed-urls)

**Kết luận: ĐÚNG — session URI là bearer credential thuần tuý. Ai cầm được URI thì upload được.** Các PUT chunk tiếp theo **không** cần `Authorization` header.

Đây là lựa chọn thiết kế có chủ đích: nó cho phép **uỷ quyền upload** — backend giữ credential, tạo session, rồi đưa session URI cho browser/mobile để client đẩy byte thẳng lên storage mà không bao giờ thấy credential thật.

## 2.2 (a) XÁC NHẬN — Nội dung và TTL của session URI

**Nội dung:** Session URI Drive có dạng
```
https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&upload_id=xa298sd_sdlkj2
```
Phần mang trạng thái là **`upload_id`** — một opaque token. Google **không công bố** cấu trúc bên trong.

**TTL — nhất quán 1 tuần trên toàn bộ sản phẩm:**

| Sản phẩm | TTL | Nguồn |
|---|---|---|
| Drive API | *"A resumable session URI expires after **one week**"* | [Drive — manage-uploads](https://developers.google.com/workspace/drive/api/guides/manage-uploads) |
| GCS | *"Maximum resumable upload session duration: **7 days**"* | [GCS quotas](https://docs.cloud.google.com/storage/quotas) |
| Photos API | *"A resumable session URL expires after **7 days**"* | [Photos — Resumable uploads](https://developers.google.com/photos/library/guides/resumable-uploads) |
| Street View API | *"A resumable session URL expires after **7 days**"* | [Street View — Resumable uploads](https://developers.google.com/streetview/publish/resumable-uploads) |
| GData (giao thức gốc, ~2008) | *"A resumable session URI expires after **one week**"* | [GData resumable upload](https://developers.google.com/gdata/docs/resumable_upload) |
| Signed URL (GCS) | tối đa **604800 giây = 7 ngày** | [GCS Signed URLs](https://docs.cloud.google.com/storage/docs/access-control/signed-urls) |
| **Photos upload token** (khác session URI) | **1 ngày** | [Photos — Upload media](https://developers.google.com/photos/library/guides/upload-media) |

> Con số **7 ngày** đã tồn tại nhất quán từ giao thức GData 2008 đến GCS và Gemini File API 2025 — đây là hằng số kiến trúc của Google, không phải lựa chọn ngẫu nhiên của từng team.

**Hành vi khi hết hạn:**

| API | Response | Hành động |
|---|---|---|
| GCS | `410 Gone` (chưa quá 1 tuần) | Tạo session mới, upload lại từ đầu |
| GCS | `404 Not Found` (đã quá 1 tuần) | Tạo session mới, upload lại từ đầu |
| Drive | `404 Not Found` | *"restart the upload from the beginning"* |
| Drive | **bất kỳ 4xx nào (kể cả 403)** | *"For any 4xx errors (including 403) during a resumable upload, restart the upload"* — xin session URI mới |

Google nói rõ: *"If you lose the session URI before the upload is completed, you have to initiate a new resumable upload, obtain a new session URI, and start the upload from the beginning."* → **Session URI là điểm-hỏng-đơn (single point of failure) mà client PHẢI persist xuống đĩa, không chỉ giữ trong RAM.**

## 2.3 (b) SUY ĐOÁN — Server lưu trạng thái session ở đâu

**Không có nguồn chính thức nào của Google mô tả điều này.** Suy luận từ các ràng buộc quan sát được:

- Session state tối thiểu phải gồm: `{upload_id, target (bucket/object hoặc Drive parent+metadata), tổng size dự kiến, số byte đã persist, handle tới blob đang ghi dở, thời điểm tạo, chủ sở hữu/quyền}`.
- Vì session URI **không mang authorization** ở các PUT tiếp theo, quyền ghi phải được **chốt (bake in) tại thời điểm initiate** và lưu server-side. Đây là lý do Drive trả `4xx → restart`: nếu quyền thay đổi giữa chừng, session cũ không thể "sửa" mà phải bỏ.
- GCS docs nói: *"Rare 4xx errors on resume indicate permission changes or integrity mismatches"* → xác nhận rằng quyền được **re-check** khi resume, chứ không chỉ ở initiate.
- Dữ liệu chunk đã nhận **không thể** nằm trong RAM của một máy (file 5 TB, session sống 7 ngày, máy restart liên tục) → byte phải được ghi ngay vào tầng lưu trữ bền vững (Colossus) và metadata offset ghi vào một KV store bền vững.
- Việc `Location`/`X-Goog-Upload-URL` là URL đầy đủ (chứ không phải chỉ một token) cho phép server **sticky-route** request tới đúng cluster/datacenter đang giữ blob dở dang. Đây là suy đoán, nhưng giải thích tốt vì sao Google trả URL tuyệt đối thay vì token tương đối.

## 2.4 (a) XÁC NHẬN — Hỏi offset hiện tại

**Cách 1 — giao thức public (`Content-Range`):**
```http
PUT <session_uri> HTTP/1.1
Content-Length: 0
Content-Range: bytes */2000000        ← "*" = "tôi không biết mình đang ở đâu"
```

Phản hồi:
| Response | Ý nghĩa |
|---|---|
| `200 OK` / `201 Created` | Upload **đã hoàn tất** rồi (có thể bạn mất response lần trước) |
| `308` + `Range: bytes=0-42` | Server có 43 byte (0..42). Chunk tiếp theo bắt đầu ở **43** |
| `308` **không có** `Range` | Server có **0 byte**. Bắt đầu lại từ đầu |
| `410` / `404` | Session chết. Tạo session mới |

⚠️ **Bẫy off-by-one kinh điển:** `Range: bytes=0-42` nghĩa là đã nhận **43** byte (0-indexed, inclusive cả hai đầu). Byte tiếp theo là 43. YouTube docs nhấn mạnh riêng điểm này: *"The header is 0-indexed; `0-999999` means 1,000,000 bytes uploaded."*

**Cách 2 — giao thức `X-Goog-Upload-*`:**
```http
POST <upload_url> HTTP/1.1
X-Goog-Upload-Command: query
Content-Length: 0
```
→ Response: `X-Goog-Upload-Status: active`, `X-Goog-Upload-Size-Received: 524288`

Cách 2 dễ implement hơn hẳn: trả về **số byte đã nhận** (đếm từ 1) thay vì **chỉ số byte cuối** (đếm từ 0). Không có bẫy off-by-one.

## 2.5 (b) SUY ĐOÁN — Dọn dẹp session bỏ dở

**Không có tài liệu chính thức nào** mô tả cơ chế garbage collection session dở dang của Google.

Những gì XÁC NHẬN được:
- GCS: *"Only completed uploads appear in buckets. Incomplete uploads don't create objects."* → dữ liệu dở dang **không** hiện ra, **không** tính vào listing.
- GCS: có API hủy tường minh `DELETE <session_uri>` → `499` (JSON API) / `204` (XML API).
- Parallel composite upload thì **ngược lại**: temporary object là object **thật, hiện ra trong bucket**, và Google cảnh báo rõ rằng nếu bucket có retention policy / object hold / soft delete / versioning thì các temp object **không xoá được** và gây tốn tiền.

Suy luận (không có nguồn):
- Byte dở dang gần như chắc chắn bị GC theo TTL 7 ngày. Con số 7 ngày vừa là "TTL cho client resume" vừa là "hạn chót để hệ thống thu hồi dung lượng".
- Với GCS, dữ liệu dở dang **không bị tính tiền** cho khách hàng (không có object) → Google tự chịu chi phí này, nên 7 ngày là điểm cân bằng giữa UX và chi phí.

> **Đối chiếu ngược:** AWS S3 multipart upload thì tính tiền phần dở dang và bắt bạn tự cấu hình lifecycle rule `AbortIncompleteMultipartUpload`. Google chọn hướng "ẩn và tự dọn". Đây là quyết định sản phẩm khác biệt rõ rệt.

## 2.6 (c) Bài học cho người tự xây upload service

- **Coi session URI/token của bạn là credential.** Chỉ HTTPS, không log full URL, không nhét vào query string bị ghi ở access log của nginx, không đưa vào Referer. Nếu bạn log `X-Goog-Upload-URL` tương đương, bạn vừa log một credential.
- **Trả về "số byte đã nhận", đừng trả về "chỉ số byte cuối".** Bẫy off-by-one của `Range: bytes=0-42` là nguồn bug muôn thuở. `X-Goog-Upload-Size-Received: 43` không thể hiểu nhầm.
- **Client PHẢI persist session URI xuống đĩa,** không chỉ giữ trong memory/state của MobX. Mất session URI = upload lại từ 0, kể cả khi 99% byte đã lên server.
- **Chốt quyền tại initiate NHƯNG re-check tại mỗi resume.** GCS làm đúng vậy và trả 4xx nếu quyền đổi. Nếu chỉ check ở initiate, một session sống 7 ngày trở thành lỗ hổng quyền kéo dài 7 ngày.
- **Đặt TTL rõ ràng + có API hủy tường minh + có job GC.** Ba thứ này phải đi cùng nhau. Thiếu GC thì MinIO/S3 của bạn sẽ đầy rác dở dang không ai thấy.
- **Phân biệt "upload token" (ngắn, 1 ngày, để commit) và "session URI" (dài, 7 ngày, để truyền byte).** Photos API tách hẳn hai thứ này — xem §4.

---

# 3. BLOB / BACKEND — Đường đi của byte (TRỌNG TÂM)

## 3.1 (a) XÁC NHẬN — Tầng edge: Google Front End (GFE)

**Trích tài liệu bảo mật chính thức của Google:**

> *"When a user sends a request to a Google Cloud service, data in transit is secured using HTTPS with a certificate from a web certificate authority. Any data the user sends to the GFE is encrypted in transit with TLS or QUIC."*

> *"Google's infrastructure uses **ALTS** for the authentication, integrity, and encryption of connections from the GFE to a Google Cloud service, and from one Google Cloud service to another."*

Nguồn: [Encryption in transit for Google Cloud](https://docs.cloud.google.com/docs/security/encryption-in-transit), [ALTS whitepaper](https://cloud.google.com/security/encryption-in-transit/application-layer-transport-security/resources/alts-whitepaper.pdf)

**Đường đi của một byte upload:**

```
[Client]
   │  TLS 1.3 / QUIC
   ▼
[Maglev]  ← software load balancer, ECMP, consistent hashing, ở edge POP
   │
   ▼
[GFE]     ← TERMINATE TCP + TLS ngay tại POP gần user nhất
   │       ← parse HTTP header + URL path → chọn backend service
   │       ← DDoS protection, global rate limiting
   │  ALTS (mTLS nội bộ, long-lived connection)
   ▼
[Google backbone network]  ← private fiber, không đi qua public internet
   │
   ▼
[Upload frontend / "Scotty"]   ← (b) suy đoán về tên; sự tồn tại của tầng này là hợp lý
   │
   ▼
[Blobstore]  ← (b) tầng blob dùng chung của Google
   │
   ▼
[Colossus]   ← (a) XÁC NHẬN: distributed file system
   │
   ▼
[D file servers → đĩa/flash vật lý]
```

**Ý nghĩa kiến trúc của việc terminate TLS ở edge:**

Google *"extended the edge of its network to host Maglev and GFE, which terminate SSL as close to the user as possible, then forward requests to backend services deeper within the network over **long-lived encrypted connections**."*

Với upload, điều này cực kỳ quan trọng:
- **RTT của TLS handshake** (2-3 round trip) chỉ tính tới POP gần nhất (~10-30ms), không phải tới datacenter ở lục địa khác (~150-300ms).
- **TCP congestion window** phát triển trên đoạn client↔POP ngắn → throughput tăng nhanh hơn nhiều.
- Đoạn POP→datacenter dùng **connection tồn tại sẵn, đã warm** → không tốn slow-start.
- Với upload 5 GB qua kết nối chập chờn, sự khác biệt này là hàng chục phần trăm thời gian.

Nguồn suy diễn về Maglev/GFE: [Google SRE Workbook — Managing Load](https://sre.google/workbook/managing-load/), [The Production Environment at Google](https://medium.com/@jerub/the-production-environment-at-google-part-2-610884268aaa)

## 3.2 (a) XÁC NHẬN — Colossus: hệ thống lưu trữ nền

Colossus là distributed file system nội bộ của Google, kế nhiệm GFS. Nó là nền cho **Cloud Storage, Firestore, Cloud SQL, Filestore, YouTube, Drive, Gmail, Bigtable, Spanner**.

Nguồn chính: [A peek behind Colossus, Google's file system](https://cloud.google.com/blog/products/storage-data-transfer/a-peek-behind-colossus-googles-file-system)

### Kiến trúc 4 thành phần

| Thành phần | Vai trò |
|---|---|
| **Client library** | *"the most complex part of Colossus"* — chạy **trong** ứng dụng. Tự làm **software RAID**, tự chọn encoding (replication vs erasure coding), tự quyết định ghi ở đâu |
| **Curators** (control plane) | Metadata service scale ngang. Client nói chuyện trực tiếp với Curator cho các thao tác control (tạo file...) |
| **D file servers** (data plane) | Network-attached disk. **Client đọc/ghi THẲNG tới D server** — không qua Curator |
| **Custodians** (background) | Duy trì durability & availability: cân bằng disk space, RAID reconstruction, hiệu suất lưu trữ |

**Metadata nằm trong Bigtable:** *"Curators store file system metadata in Google's high-performance NoSQL database, BigTable… storing file metadata in BigTable allowed Colossus to **scale up by over 100x** over the largest GFS clusters."*

> Đây là điểm đảo ngược thú vị: **Bigtable chạy TRÊN Colossus, và metadata của Colossus lại nằm TRONG Bigtable.** Google giải quyết vòng lặp này bằng một lớp metadata bootstrap nhỏ. Đây chính là bài học "tách metadata plane khỏi data plane" ở dạng cực đoan nhất.

### Điểm kiến trúc quan trọng nhất: data plane KHÔNG đi qua control plane

```
Client ──(control: tạo file, xin vị trí)──► Curator ──► Bigtable
   │
   └────────(data: ghi byte thẳng)────────► D server ──► đĩa
```

Curator **không bao giờ chạm vào byte dữ liệu**. Nếu Curator nằm trên đường đi của data, nó sẽ trở thành nút cổ chai và không thể đạt được con số throughput dưới đây.

### Quy mô (số liệu chính thức)

| Chỉ số | Giá trị |
|---|---|
| Dung lượng 1 cluster | **10+ exabytes** |
| Số máy / cluster | hàng chục nghìn |
| Read throughput | **50+ TB/s** |
| Write throughput | **25+ TB/s** |
| IOPS | **600M+** (read+write, cluster bận nhất) |

Nguồn: [How Colossus optimizes data placement for performance](https://cloud.google.com/blog/products/storage-data-transfer/how-colossus-optimizes-data-placement-for-performance)

### Tiering nóng/lạnh và L4 SSD cache

Colossus có 3 chế độ đặt dữ liệu:
1. **Ép SSD** — path `/cns/ex/home/leg/partition=ssd/myfile` — toàn bộ trên flash, đắt nhất.
2. **Lai** — path `.../partition=ssd.1/...` — **chỉ 1 replica** trên SSD, rẻ hơn nhưng rủi ro latency nếu bản SSD không sẵn sàng.
3. **L4 động** (mặc định) — hệ thống tự chọn tier theo access pattern.

**L4 writeback (liên quan trực tiếp đến upload):**
- **Tại thời điểm tạo file**, L4 nhận "application features" (loại file, metadata) để phân loại file.
- L4 **cố vấn cho Curator** xem có nên đặt file mới lên SSD không.
- File ghi lên SSD sẽ **tự động migrate xuống HDD** sau một khoảng thời gian cấu hình được.
- Chính sách insert do **ML** chọn per-workload: insert-on-write / insert-after-first-read / insert-after-second-read-within-window (tham chiếu paper CacheSack).

> **Ý nghĩa cho upload:** byte vừa upload là "nóng nhất" (rất có thể sắp bị đọc để transcode/thumbnail ngay). Google **ghi upload mới lên flash trước, rồi hạ tầng xuống HDD sau**. Đây chính xác là pattern mà một video transcoding pipeline cần.

## 3.3 (a) XÁC NHẬN — GCS lưu object thế nào

> *"When you upload an object to Google Cloud Storage, it is broken into chunks, erasure-coded, and its fragments are stored and managed by Colossus, which provides the underlying durability."*

**Phân tầng trách nhiệm rõ ràng:**
- **GCS** lo: namespace bucket/object, ACL/IAM, lifecycle, versioning/generation, storage class, API semantics.
- **Colossus** lo: chunking vật lý, erasure coding, đặt dữ liệu, sửa lỗi, durability.
- **Spanner** lo: bucket metadata & object listing (đây là lý do GCS có **strongly consistent object listing** — khác S3 thời kỳ đầu).
  → [Spanner: The secret to Cloud Storage strong list consistency](https://cloud.google.com/blog/products/gcp/how-google-cloud-storage-offers-strongly-consistent-object-listing-thanks-to-spanner)

### Erasure coding

Colossus dùng **Reed-Solomon**: chia dữ liệu thành *k* fragment dữ liệu + tính *m* fragment parity, rải trên nhiều failure domain khác nhau.

> *"Erasure coding lets you survive the same number of failures as 3x replication, at **half the storage cost** — by replacing brute-force copying with mathematics."*

**Điểm mấu chốt:** *"Applications select encoding schemes appropriate to their durability and cost requirements, with clients managing both replication and encoding across multiple failure domains."* → Encoding scheme là **tham số của ứng dụng**, không phải hằng số của filesystem. Dữ liệu nóng có thể replicate (đọc nhanh), dữ liệu nguội chuyển sang erasure coding (rẻ).

### Compose / parallel composite upload

`compose` là một **thao tác server-side thuần metadata**: ghép 1–32 source object thành 1 object đích.

| Ràng buộc | Giá trị |
|---|---|
| Source object / 1 lệnh compose | **1–32** |
| Component tối đa trong 1 composite object | không giới hạn lý thuyết; counter bão hoà ở 2.147.483.647 |
| Size object tối đa | **5 TiB** (mọi phương pháp) |
| Ngưỡng mặc định `gcloud` | **150 MiB** |
| Đặt tên temp object | `TEMPORARY_PREFIX/RANDOM_VALUE_HEX_DIGEST_COMPONENT_ID`, prefix mặc định `/gcloud/tmp/parallel_composite_uploads/see_gcloud_storage_cp_help_for_details` |

**Nhiều hơn 32 chunk → phải compose nhiều tầng** (32 object, mỗi object lại được compose từ 32 object → 1024, v.v.).

**Cảnh báo chính thức khi KHÔNG nên dùng:**
- Bucket có **retention policy** → temp object không xoá được trong thời gian retention.
- Bucket có **default object hold** → phải release hold mới xoá được.
- Bucket có **soft delete** hoặc **versioning** → chi phí lưu trữ tăng đáng kể vì temp object bị giữ lại.
- Object kết quả **chỉ có CRC32C, KHÔNG có MD5**.

> Chi tiết "compose là metadata operation, không copy byte" giải thích vì sao nó nhanh: Colossus chỉ cần trỏ object mới tới các dải fragment đã có. Nhưng nó cũng giải thích vì sao MD5 biến mất — MD5 không có tính chất kết hợp (không thể tính MD5 của A‖B từ MD5(A) và MD5(B)), trong khi **CRC32C thì CÓ** (CRC composable qua phép toán trên đa thức).

## 3.4 (a) XÁC NHẬN — Khi nào byte được ack là bền vững

Đây là câu hỏi cốt lõi và Google trả lời rất cụ thể:

> *"Cloud Storage **redundantly stores objects that are written to it in at least two different availability zones BEFORE considering the write to be successful**."*

> *"Cloud Storage is designed for at least **99.999999999% (11 nines) annual durability**, regardless of storage class and location type."*

> *"**Checksums are stored and regularly revalidated** to proactively verify the integrity of all data at rest as well as to detect corruption of data in transit. If required, corrections are automatically made using redundant data."*

Nguồn: [GCS — Data availability and durability](https://docs.cloud.google.com/storage/docs/availability-durability)

**Rất quan trọng — replication đa region là BẤT ĐỒNG BỘ:**

> *"For multi-region and dual-region buckets, default replication is designed to provide redundancy across regions for **99.9% of newly written objects within a target of one hour** and **100% within a target of 12 hours**. However, redundancy across regions occurs **asynchronously**, and any data that does not finish replicating across regions prior to a region becoming unavailable is **inaccessible** until the downed region comes back online."*

**Diễn giải cho người thiết kế hệ thống:**

| Tầng | Đồng bộ/Bất đồng bộ | Thời điểm |
|---|---|---|
| Ghi ≥2 availability zone | **ĐỒNG BỘ** | Trước khi trả `200 OK` |
| Erasure coding + rải fragment | **ĐỒNG BỘ** (trong zone) | Trước khi trả `200 OK` |
| Replication cross-region (multi-region bucket) | **BẤT ĐỒNG BỘ** | 99.9% trong 1h, 100% trong 12h |
| Revalidate checksum at-rest, sửa lỗi | **NỀN, liên tục** | Custodians chạy mãi mãi |

→ Khi bạn nhận `200 OK` từ GCS, bạn được đảm bảo **durability trong region**, **chưa** được đảm bảo survive mất cả region đó (với multi-region bucket, trong cửa sổ ≤12h).

## 3.5 (b) SUY ĐOÁN — Blobstore và cách Drive lưu file

**Không có tài liệu chính thức của Google về "Blobstore nội bộ".** Thông tin dưới đây đến từ nguồn thứ cấp (blog phân tích), **độ tin cậy trung bình–thấp**:

- Blobstore là tầng "planet-scale, immutable blob storage" xây **trên** Colossus, phục vụ Gmail attachments, Photos, Drive.
- Blob được chia chunk, replicate qua nhiều Colossus node ở nhiều zone.
- Blobstore giữ **metadata database riêng** map `blob key → vị trí lưu trữ`, và lắp ráp chunk từ replica gần nhất khi đọc.

Nguồn thứ cấp: [Colossus: Google's File System (Medium)](https://shambhavishandilya.medium.com/colossus-googles-file-system-baced846d9b7)

**Nguồn CHÍNH THỨC duy nhất xác nhận Drive chạy trên Colossus:** blog "A peek behind Colossus" liệt kê Drive trong danh sách dịch vụ dùng Colossus.

**Suy luận về mô hình dữ liệu của Drive (KHÔNG có nguồn):**
- Drive gần như chắc chắn tách **nội dung file (blob, bất biến, content-addressed)** khỏi **metadata file (tên, parent, permission, revision — mutable, trong DB giao dịch)**.
- Bằng chứng gián tiếp: Drive có tính năng **revision history**, **shortcut**, cùng một file nằm trong nhiều folder (mô hình cũ), **copy file lớn tức thì** — tất cả đều chỉ khả thi nếu blob được tham chiếu bằng handle chứ không nhúng vào record metadata.
- Bằng chứng gián tiếp thứ hai: Drive giới hạn **copy file tối đa 750 GB** trong khi **upload tối đa 5 TB** — nếu copy chỉ là thao tác metadata thì giới hạn này khó giải thích; nhiều khả năng copy có thực hiện sao chép/ghi lại ở tầng nào đó.
- Việc dedup nội dung (cùng blob dùng chung giữa nhiều user) **không có bằng chứng nào** — đừng giả định.

## 3.6 (c) Bài học cho người tự xây upload service

- **Tách control plane khỏi data plane — đây là bài học số 1 từ Colossus.** Service quản lý metadata (Curator ↔ filehandler của bạn) **không được** nằm trên đường đi của byte. Byte phải đi thẳng client → storage (D server ↔ MinIO của bạn). Nếu file 5 GB đi qua Spring controller rồi mới sang MinIO, bạn vừa biến API server thành nút cổ chai và ăn gấp đôi băng thông nội bộ.
  → *Áp dụng cho dự án FileSharing: đây chính là lý do tồn tại của `filesharing-uploadservice` (WebFlux, tách riêng) — và lý do nó nên đưa presigned URL cho client đẩy thẳng vào MinIO thay vì proxy byte.*
- **Định nghĩa rõ "durable" nghĩa là gì và ack đúng lúc đó.** Google ack sau khi dữ liệu nằm ở ≥2 availability zone. Bạn phải trả lời được: khi API của bạn trả `200`, dữ liệu đã ở đâu? Trong page cache của 1 máy MinIO? Đã fsync? Đã replicate? Trả `200` sớm hơn mức bạn thực sự đảm bảo = nói dối client.
- **Blob bất biến + metadata mutable là hai hệ thống khác nhau.** Blob → object storage, content-addressed, không bao giờ sửa. Metadata → DB giao dịch. Nối bằng handle. Điều này cho bạn revision history, copy rẻ, và khả năng đổi tên/di chuyển file mà không đụng byte.
- **Ghi upload mới vào tầng lưu trữ nhanh, hạ tier sau.** L4 writeback của Colossus tồn tại vì file vừa upload là file nóng nhất — nó sắp bị worker transcode/thumbnail đọc ngay. Đặt file mới lên storage nhanh, chuyển sang lớp rẻ sau N ngày.
- **Terminate TLS gần user nếu có thể.** Với upload file lớn qua mạng chậm, đây là tối ưu có tác động lớn nhất mà không cần đổi một dòng code ứng dụng. CDN có hỗ trợ upload (Cloudflare, Fastly) hoặc edge POP là công cụ, không phải xa xỉ phẩm.
- **CRC32C composable, MD5 thì không.** Nếu bạn định làm parallel/multipart upload rồi ghép, hãy chọn checksum có tính kết hợp ngay từ đầu — nếu không bạn sẽ phải đọc lại toàn bộ file để tính hash, mất sạch lợi ích của việc upload song song.

---

# 4. FINALIZE / COMMIT

## 4.1 (a) XÁC NHẬN — Bước finalize làm gì

**Với Drive API:** chunk cuối (khi `Content-Range` cho thấy đã đủ tổng số byte) kích hoạt finalize. Response:
- `200 OK` — cập nhật file đã tồn tại (PATCH semantics)
- `201 Created` — tạo file mới (POST semantics)
- Body chứa **metadata file đầy đủ** (`id`, `name`, `mimeType`, ...)

rclone ghi chú đúng hành vi này trong code: *"the HTTP response code for a completed upload would have been 200 OK"* cho update, và 201 cho create.
→ [rclone `backend/drive/upload.go`](https://github.com/rclone/rclone/blob/master/backend/drive/upload.go)

**Với giao thức `X-Goog-Upload-*`:** finalize là **tường minh** — `X-Goog-Upload-Command: upload, finalize`. Response có `X-Goog-Upload-Status: final`.

**Với GCS:** chunk cuối có `Content-Range: bytes A-B/N` với `B = N-1` → server ghép, validate, commit object, trả `200`/`201` kèm object metadata (bao gồm `generation`, `crc32c`, `md5Hash`, `size`).

## 4.2 (a) XÁC NHẬN — Commit CÓ atomic (với GCS, cực kỳ rõ ràng)

Đây là phần Google tài liệu hoá tốt nhất trong toàn bộ chủ đề. Trích nguyên văn từ [GCS — Consistency](https://docs.cloud.google.com/storage/docs/consistency) và [GCS — Objects](https://docs.cloud.google.com/storage/docs/objects):

> *"Cloud Storage provides **atomicity guarantees** for most operations involving individual objects, such as uploading an object, updating an object's metadata, overwriting an object, and deleting an object."*

> *"When you upload an object, the object is **not available until it is completely uploaded**. By extension, uploaded objects are **never available for download in a corrupted state or as partial objects**."*

> *"It is possible to replace objects that are stored in Cloud Storage, and doing so happens **atomically**: **until the new upload completes, the OLD version of the object is served to readers**, and after the upload completes, the new version is served."*

> *"When you write an object… the object is **immediately available** for reading and metadata operations **as soon as you receive a success response**. This is true for all buckets and storage classes… you never receive a `404 Not Found` response or stale data for an object read-after-write."*

> *"Objects are **immutable**, which means that an uploaded object cannot change throughout its storage lifetime."*

**Tóm tắt mô hình commit của GCS:**

| Thuộc tính | Đảm bảo |
|---|---|
| Atomicity | ✅ All-or-nothing |
| Visibility trước khi xong | ❌ Không visible |
| Partial/corrupted object | ❌ Không bao giờ xảy ra |
| Ghi đè | Atomic swap — reader thấy bản cũ cho tới đúng thời điểm chuyển |
| Read-after-write | ✅ Strongly consistent, kể cả dual-region/multi-region |
| Object listing | ✅ Strongly consistent (nhờ Spanner) |
| Object sau khi ghi | Bất biến; mỗi lần ghi tạo **generation number** mới |

> **Đây là hợp đồng (contract) mà một upload service tốt phải cung cấp, và là thước đo để tự đánh giá hệ thống của mình.** "Object chưa hoàn tất không bao giờ visible" là điều kiện đủ để tránh toàn bộ một lớp bug: worker đọc file dở dang, user download file cụt, thumbnail sinh từ nửa cái ảnh.

## 4.3 (a) XÁC NHẬN — Object chưa hoàn tất KHÔNG visible

> *"Only completed uploads appear in buckets. Incomplete uploads don't create objects."*

**Ngoại lệ duy nhất — parallel composite upload:** ở đây các temporary object **LÀ object thật và CÓ visible** trong bucket dưới prefix `/gcloud/tmp/parallel_composite_uploads/...`. Đây chính là lý do Google phải cảnh báo dài về retention policy / object hold / soft delete / versioning: cơ chế này **phá vỡ** đảm bảo "chưa xong thì không thấy" để đổi lấy tốc độ.

> Bài học ẩn: khi bạn thấy Google phải viết một trang cảnh báo dài về caveat, đó là dấu hiệu họ đã đánh đổi một đảm bảo cốt lõi. Parallel composite upload là tối ưu hiệu năng có giá phải trả về mặt ngữ nghĩa.

## 4.4 (b) SUY ĐOÁN — Crash giữa lúc finalize thì sao?

**Google KHÔNG tài liệu hoá trực tiếp trường hợp này.** Nhưng có thể suy ra chính xác từ các đảm bảo đã công bố + luồng status-query:

**Trường hợp 1 — Server crash TRƯỚC khi commit:**
Object không tồn tại. Session vẫn còn (chưa hết 7 ngày). Client query status → nhận `308 + Range` → upload tiếp. **Không mất dữ liệu đã persist.**

**Trường hợp 2 — Server đã commit NHƯNG client mất response (đứt mạng, timeout):**
Đây là trường hợp nguy hiểm nhất trong mọi hệ thống upload. Google giải quyết bằng: client query status → server trả **`200 OK` / `201 Created`** thay vì `308`.

Tài liệu GCS ghi rõ trong bảng status-check:
> `200 OK` hoặc `201 Created`: *"Upload complete"*

→ **Query status vừa là cơ chế lấy offset, vừa là cơ chế xác nhận commit.** Đây là thiết kế rất gọn: client không cần API riêng để hỏi "upload của tôi xong chưa?".

**Trường hợp 3 — Crash giữa lúc đang ghi metadata (Drive):**
Không có tài liệu. Suy đoán: vì Drive tách blob khỏi metadata, việc "commit" là ghi record metadata trỏ tới blob handle — một thao tác đơn lẻ trong DB giao dịch, do đó atomic. Blob đã ghi xong từ trước.

**Cơ chế idempotency thật sự của Drive — pre-generated file IDs:**

Đây là câu trả lời chính thức của Google cho bài toán "gửi lại mà không tạo bản trùng":

> *"Uploads using pre-generated IDs safely retry on indeterminate server errors without duplicate file creation. **Subsequent retries return `409 Conflict`**."*

Luồng:
1. `files.generateIds` → nhận danh sách ID do server cấp.
2. Upload với `id` đã cấp sẵn trong metadata.
3. Nếu response không xác định (timeout/5xx) → **retry an toàn**.
4. Nếu lần đầu thực ra đã thành công → retry trả `409 Conflict` thay vì tạo file thứ hai.

Nguồn: [Drive API — manage-uploads](https://developers.google.com/workspace/drive/api/guides/manage-uploads), [Method: files.generateIds](https://developers.google.com/drive/api/v2/reference/files/generateIds)

**Ngoại lệ:** pre-generated ID **không dùng được** cho việc chuyển đổi sang định dạng Google Workspace (Docs/Sheets/Slides), trừ MIME type `application/vnd.google-apps.drive-sdk` và folder.

## 4.5 (a) XÁC NHẬN — Mô hình 2 pha rõ ràng nhất: Google Photos

Photos API tách **truyền byte** và **commit metadata** thành hai API riêng biệt — đây là ví dụ sạch nhất về pattern này trong toàn bộ hệ sinh thái Google:

**Pha 1 — đẩy byte:**
```http
POST https://photoslibrary.googleapis.com/v1/uploads
Content-type: application/octet-stream
X-Goog-Upload-Content-Type: image/jpeg
X-Goog-Upload-Protocol: raw
```
→ Response body = **upload token** (chuỗi text). **Hiệu lực: 1 ngày.**

**Pha 2 — commit:**
```http
POST .../v1/mediaItems:batchCreate
{"newMediaItems": [{"simpleMediaItem": {"uploadToken": "..."}, "description": "..."}]}
```
→ Tối đa **50 media item / lần gọi**. Google khuyến nghị gọi **tuần tự** cho cùng một user, không song song.

Giới hạn: ảnh ≤ 200 MB, video ≤ 20 GB, khuyến nghị ảnh < 50 MB.

Nguồn: [Photos Library API — Upload media](https://developers.google.com/photos/library/guides/upload-media)

> **Điểm hay:** upload token sống **1 ngày** (ngắn) trong khi session URI sống **7 ngày** (dài). Hai TTL khác nhau cho hai giai đoạn khác nhau: truyền byte thì cần lâu (mạng chậm, mobile ngủ), còn commit thì phải nhanh (đã có byte rồi, không lý do gì trì hoãn). **Byte mồ côi (uploaded nhưng chưa commit) chỉ tồn tại tối đa 1 ngày.**

## 4.6 (c) Bài học cho người tự xây upload service

- **Object dở dang TUYỆT ĐỐI không được visible.** Ghi vào key tạm rồi rename/commit atomic ở bước cuối, hoặc chỉ insert record DB sau khi blob đã hoàn tất. Không bao giờ để worker/user nhìn thấy file đang ghi dở.
- **Query-status phải trả về CẢ "đã xong" lẫn "đang ở offset X".** Client mất response commit là trường hợp phổ biến nhất trong thực tế (mobile, wifi chập chờn). Nếu API status của bạn chỉ trả offset, client sẽ upload lại một file đã commit thành công và tạo bản trùng.
- **Cấp ID trước khi upload (pre-generated ID) là cách rẻ nhất để có idempotency.** Client xin ID → upload với ID đó → retry bao nhiêu lần cũng chỉ ra một file. Trả `409 Conflict` cho lần thứ hai. Rẻ hơn nhiều so với dedup bằng content hash.
- **Tách "upload token" (ngắn hạn, để commit) khỏi "session" (dài hạn, để truyền byte),** với TTL khác nhau. Giới hạn cửa sổ tồn tại của byte mồ côi.
- **Commit metadata phải là MỘT thao tác giao dịch đơn lẻ.** Nếu commit của bạn gồm "insert MongoDB + publish Kafka + update quota", bạn cần outbox pattern hoặc chấp nhận trạng thái không nhất quán. Google gộp về một điểm atomic duy nhất.

---

# 5. INTEGRITY — Toàn vẹn dữ liệu

## 5.1 (a) XÁC NHẬN — CRC32C là lựa chọn chính thức

Nguồn chính: [GCS — Data validation and change detection](https://docs.cloud.google.com/storage/docs/data-validation)

| Thuật toán | Vai trò | Áp dụng cho |
|---|---|---|
| **CRC32C** (Castagnoli) | **Khuyến nghị chính thức cho MỌI trường hợp** | Mọi object GCS đều có |
| **MD5** | Hỗ trợ, nhưng hạn chế | **Chỉ** single-request upload. **Không** hỗ trợ chunked upload, composite object, XML multipart |

Trích nguyên văn: *"Only CRC32C checksums can be used to verify the integrity of XML API multipart uploads. MD5 checksums aren't supported."*

**Vì sao CRC32C thắng:**
1. **Composable** — CRC của A‖B tính được từ CRC(A), CRC(B), len(B). MD5 thì không. Đây là điều kiện tiên quyết cho parallel/multipart upload.
2. **Có hỗ trợ phần cứng** — instruction `SSE4.2 CRC32` trên x86, `CRC32CX` trên ARM64. Nhanh hơn MD5 hàng chục lần.
3. **Đủ tốt cho phát hiện lỗi ngẫu nhiên** (bit flip, lỗi truyền) — mục tiêu ở đây là data integrity, **không phải** chống giả mạo có chủ đích.

> CRC32C **không** phải hàm băm mật mã. Nó phát hiện hỏng hóc ngẫu nhiên, không chống được kẻ tấn công cố ý tạo va chạm. Đây là lựa chọn đúng cho bài toán này, nhưng đừng dùng nó để xác thực.

## 5.2 (a) XÁC NHẬN — Header mang checksum

| API | Header | Ví dụ |
|---|---|---|
| JSON API (media upload) | `X-Goog-Hash` | `X-Goog-Hash: crc32c=n03x6A==` |
| JSON API (multipart) | trường trong phần metadata JSON | `{"crc32c": "...", "md5Hash": "..."}` |
| XML API | `Content-MD5` (chuẩn HTTP) và/hoặc `x-goog-hash` | |
| Response object metadata | `crc32c`, `md5Hash` (base64) | |

Giá trị được mã hoá **base64** (không phải hex) — `n03x6A==` là 4 byte CRC32C encode base64.

## 5.3 (a) XÁC NHẬN — Verify ở mức nào

**Cách server xử lý:**
> *"For object writes, the client calculates the checksum of the local file and attaches it to the HTTP headers of the object upload request. The server receives the data payload, calculates its own checksum, and validates the data by comparing both checksums **after the upload completes**. If the checksums don't match, the write request is **rejected with a `BadRequestException: 400`**."*

**Giới hạn cực kỳ quan trọng của resumable upload:**
> *"You **can't perform integrity checks on intermediate portions or chunks** of a resumable upload."*

→ **Checksum được verify ở mức TOÀN OBJECT, KHÔNG phải per-chunk.** Với upload 5 TB chia 640 chunk 8 MiB, nếu chunk số 3 bị hỏng, bạn chỉ biết điều đó khi chunk 640 đã gửi xong và server tính CRC toàn file → **fail toàn bộ, upload lại từ đầu**.

Đây là một điểm yếu thật của giao thức, không phải hiểu nhầm. Google chấp nhận nó vì:
- TCP đã có checksum (yếu, 16-bit) và TLS có MAC (mạnh) → hỏng dữ liệu trên đường truyền cực hiếm.
- Verify per-chunk sẽ phải lưu checksum từng chunk trong session state → phức tạp hơn nhiều.

**Đối chiếu:** S3 multipart upload **có** checksum per-part (`Content-MD5` cho từng part) và verify ngay. Đây là chỗ S3 làm tốt hơn GCS resumable upload.

**Khi không biết checksum trước:**
> *"If your application has already computed the object's MD5 or CRC32C prior to starting the upload, you can supply it with the upload request, and Cloud Storage will **only create the object if the hash you provided matches** the value calculated."*

→ Checksum hoạt động như một **precondition**, không phải chỉ là metadata.

## 5.4 (a) XÁC NHẬN — Khuyến nghị chính thức cho client

1. **Dùng CRC32C** cho mọi trường hợp.
2. **Gửi kèm checksum khi upload** → server tự reject nếu sai (400), client không cần đọc lại để verify.
3. **Khi download:** server gửi kèm stored checksum; client tự tính từ byte nhận được và so sánh.
4. **Không verify được** khi: ranged request, decompressive transcoding — vì checksum server đại diện cho **toàn bộ object như đã lưu**. (Ngoại lệ: gRPC ranged read có hỗ trợ verify per-chunk.)
5. **Composite object không có MD5** → nếu code của bạn phụ thuộc `md5Hash`, nó sẽ vỡ khi ai đó bật parallel composite upload.
6. **Client library hiện đại tự tính checksum khi ghi** — Go ≥1.60.0, Python ≥3.7.0, Java ≥2.62, Node.js ≥7.19.0, Ruby ≥1.60.0, C++ ≥2.46, PHP ≥1.51.0.

**Bảo vệ dữ liệu at-rest:**
> *"Checksums are stored and **regularly revalidated** to proactively verify the integrity of all data at rest as well as to detect corruption of data in transit. If required, **corrections are automatically made using redundant data**."*

→ Đây là các **Custodian** của Colossus chạy nền vĩnh viễn: quét, phát hiện bit rot, tự sửa từ fragment parity. Toàn vẹn dữ liệu không phải sự kiện một lần lúc upload — nó là tiến trình liên tục suốt vòng đời.

## 5.5 (c) Bài học cho người tự xây upload service

- **Chọn CRC32C, không chọn MD5.** Composable (ghép được), có hardware acceleration, và là thứ Google khuyến nghị. Java: `java.util.zip.CRC32C` có sẵn từ JDK 9.
- **Nhận checksum từ client TRƯỚC khi upload và dùng nó làm precondition,** không chỉ lưu làm metadata. "Chỉ tạo object nếu hash khớp" biến integrity check thành một phần của giao dịch.
- **Cân nhắc verify PER-CHUNK — đây là chỗ bạn có thể làm TỐT HƠN Google.** GCS không làm được vì lý do lịch sử/quy mô; hệ thống của bạn nhỏ hơn nhiều, lưu checksum từng chunk trong Redis session là chuyện nhỏ. Phát hiện chunk hỏng ở byte thứ 3 thay vì ở byte cuối cùng của file 5 GB là khác biệt rất lớn về UX.
- **Lưu checksum vào metadata và quét lại định kỳ.** Bit rot có thật. Custodian của Google chạy vĩnh viễn. Một cron job hàng tuần quét lại CRC của object là rẻ và đáng.
- **Đừng để API của bạn phụ thuộc vào một loại hash duy nhất.** GCS composite object mất MD5 và điều đó làm vỡ code của rất nhiều người. Thiết kế field `checksums: {crc32c, md5?, sha256?}` ngay từ đầu.

---

# 6. SECURITY — Bảo mật

## 6.1 (a) XÁC NHẬN — Rủi ro của session URI: ai cầm là upload được

Đã trình bày ở §2.1. Nhắc lại vì đây là điểm bảo mật quan trọng nhất:

> *"This session URI acts as an authentication token… can be used by **anyone** to upload data to the target bucket **without any further authentication**."*

**Bề mặt tấn công thực tế:**

| Đường rò rỉ | Hậu quả |
|---|---|
| Log của web server / access log nginx | URI nằm trong request line → ai đọc log là có credential |
| Header `Referer` khi trang chuyển hướng | Rò sang bên thứ ba |
| Analytics / APM / error tracking (Sentry) capture URL | Credential vào hệ thống bên thứ ba |
| Browser history, bookmark | Lưu vĩnh viễn |
| Chia sẻ qua kênh không mã hoá | Google nói rõ: chỉ HTTPS |
| Screenshot / paste vào issue tracker | Rất phổ biến trong thực tế |

**Giới hạn thiệt hại (mitigation có sẵn trong thiết kế):**
- Session URI chỉ ghi được **đúng một object/file đích đã cố định lúc initiate** — không phải quyền ghi toàn bucket.
- Chỉ ghi được, **không đọc được**.
- TTL 7 ngày là trần cứng.
- Kẻ tấn công có thể **phá hoại** (ghi rác đè lên nội dung dự kiến) nhưng không thể **lan rộng**.

## 6.2 (a) XÁC NHẬN — Signed URL của GCS cho upload

Nguồn: [GCS — Signed URLs](https://docs.cloud.google.com/storage/docs/access-control/signed-urls)

**V4 signing — các query parameter:**

| Parameter | Nội dung |
|---|---|
| `X-Goog-Algorithm` | `GOOG4-RSA-SHA256` |
| `X-Goog-Credential` | email service account + credential scope |
| `X-Goog-Date` | timestamp ISO 8601 |
| `X-Goog-Expires` | thời hạn (giây), **tối đa 604800 = 7 ngày** |
| `X-Goog-SignedHeaders` | danh sách header nằm trong chữ ký |
| `X-Goog-Signature` | chữ ký RSA-SHA256 |

**Cơ chế:** chữ ký được tính trên **canonical request** — biểu diễn chuẩn hoá của HTTP request (method, path, query, các header đã ký, payload hash). Nghĩa là **method, path và các header đã ký đều bị khoá chặt**; client không thể đổi `PUT` thành `DELETE`, không thể đổi object đích.

**Đặc điểm bảo mật:** *"Anyone in possession of the signed URL can use it while it's active, regardless of whether they have a valid account."* → Signed URL cũng là bearer credential, giống session URI.

**Kết hợp Signed URL + resumable upload:**
- Signed URL chỉ dùng cho **request POST khởi tạo**.
- Phải ký kèm header `x-goog-resumable: start`, **nếu không signature validation sẽ fail**.
- Các PUT chunk tiếp theo dùng **session URI**, không dùng signed URL nữa.

```bash
gcloud storage sign-url gs://my-bucket/file.txt \
  --http-verb=POST \
  --headers=x-goog-resumable=start,content-type=text/plain \
  --private-key-file=key.json
```

**Mô hình bảo mật đầy đủ cho việc uỷ quyền upload:**
```
Backend (giữ service account key)
   │  ký một signed URL: POST, đúng 1 object path, TTL ngắn (vài phút)
   ▼
Client (browser/mobile) — KHÔNG bao giờ thấy credential
   │  POST signed URL + x-goog-resumable: start
   ▼
GCS → trả session URI (TTL 7 ngày)
   │
   ▼
Client PUT các chunk thẳng vào GCS
```
→ Backend **không bao giờ chạm vào byte**. Credential **không bao giờ rời khỏi server**. Đây là pattern chuẩn.

## 6.3 (a) XÁC NHẬN — Quota / size limit được kiểm tra ở đâu

**Giới hạn Google Drive:**

| Giới hạn | Giá trị |
|---|---|
| Kích thước file tối đa | **5 TB** |
| Copy file tối đa | **750 GB** |
| Upload mỗi user mỗi ngày | **750 GB** (tính chung My Drive + shared drive) |
| Egress mỗi project mỗi ngày | 1 TB |
| Quota units / phút / project | 1.000.000 |
| Quota units / phút / user / project | 325.000 |
| Quota units / ngày / project (trước khi tính phí) | 400.000.000 |

Chi phí quota theo thao tác: read = 5, list = 100, download = 200, edit = 50, other = 5.

Nguồn: [Drive API — Usage limits](https://developers.google.com/workspace/drive/api/guides/limits)

Hành vi khi vượt 750 GB/ngày: *"Users hitting the 750 GB daily limit cannot upload or copy additional files for 24 hours."* Đáng chú ý: **file đầu tiên vượt ngưỡng vẫn được upload xong** — nghĩa là ngưỡng được kiểm tra **trước khi bắt đầu file**, không phải cắt giữa chừng. Một file >750 GB vẫn upload được (miễn ≤5 TB).

**Giới hạn GCS:**

| Giới hạn | Giá trị |
|---|---|
| Object tối đa | **5 TiB** (mọi phương pháp: resumable, multipart, compose) |
| Ghi cùng một tên object | **1 write/giây** — vượt sẽ bị throttle |
| Source object / lệnh compose | 32 |
| Parts / XML multipart upload | 10.000 |
| Kích thước part | 5 MiB – 5 GiB (trừ part cuối) |
| Thời hạn resumable session | 7 ngày |
| Tạo/xoá bucket | ~1 request / 2 giây / project |

Nguồn: [GCS — Quotas & limits](https://docs.cloud.google.com/storage/quotas)

**Thời điểm kiểm tra:**
- `X-Upload-Content-Length` / `X-Goog-Upload-Header-Content-Length` gửi ở bước **initiate** → cho phép Google **từ chối sớm** trước khi truyền một byte nào. Đây là lý do tồn tại của header này ngoài mục đích thông tin.
- Quyền được kiểm ở initiate **và** kiểm lại khi resume (bằng chứng: *"Rare 4xx errors on resume indicate permission changes"*).
- Drive: *"For any 4xx errors (including 403) during a resumable upload, restart the upload"* — nghĩa là quota bị vượt giữa chừng sẽ giết session.

## 6.4 (a)+(b) Pipeline quét malware của Drive

**(a) XÁC NHẬN từ Google Drive Help:**
- Giới hạn quét virus: **100 MB**.
- Quét chạy khi **download hoặc share**, **không phải** lúc upload.
- File > 100 MB: Google hiện cảnh báo *"file quá lớn để kiểm tra và xác nhận an toàn"*, nhưng **vẫn cho download**.
- File bị phát hiện nhiễm: cảnh báo khi download, nhưng user **vẫn có thể bỏ qua cảnh báo và tải về**.
- Có chính sách abuse riêng: file vi phạm bị **restricted** — chủ sở hữu không share được, mọi quyền truy cập của người khác bị thu hồi (chủ sở hữu vẫn giữ).
- Drive API có tham số `acknowledgeAbuse` để tải file đã bị gắn cờ (rclone expose qua `--drive-acknowledge-abuse`).

Nguồn: [Google Drive Community — Virus scanning files larger than 100mb](https://support.google.com/drive/thread/225474267/virus-scanning-files-in-google-drive-larger-than-100mb), [rclone issue #2338](https://github.com/rclone/rclone/issues/2338)

**Kết luận: quét malware của Drive là ASYNC / LAZY, không phải sync tại thời điểm upload.**

> Đây là quyết định kiến trúc rất đáng học: Google **không** chặn upload để chờ quét. Quét được **hoãn tới thời điểm phát tán** (download/share) — vì đó mới là lúc rủi ro hiện thực hoá. File chỉ nằm trong Drive của chính chủ thì không gây hại cho ai.
> Đồng thời họ **fail-open** (cho phép, kèm cảnh báo) thay vì **fail-closed** (chặn) khi không quét được. Đây là lựa chọn UX rõ ràng: chặn nhầm file sạch tốn kém hơn cho Google so với để lọt file bẩn có cảnh báo.

**(b) Không xác nhận được:** cơ chế quét khi file được share ở quy mô lớn, có cache kết quả quét theo content hash hay không, độ trễ từ upload đến khi có verdict.

**Ghi nhận thêm (nguồn thứ cấp, độ tin cậy trung bình):** hệ thống gắn cờ abuse tự động của Drive từng bị báo chí ghi nhận có tỉ lệ false positive đáng kể, kể cả với file `.txt` chứa một ký tự số.
→ [PhoneArena](https://www.phonearena.com/news/google-drive-restricting-files-mistake-ai_id138090), [TechRadar](https://www.techradar.com/news/google-drive-is-locking-some-peoples-files-for-no-reason)

## 6.5 (a) XÁC NHẬN — Rate limiting

| Code | Ý nghĩa | Xử lý |
|---|---|---|
| `403` + `userRateLimitExceeded` | Quota user cạn | Exponential backoff, retry |
| `403` + `rateLimitExceeded` | Quota project cạn | Exponential backoff, retry |
| `429 Too Many Requests` | Backend rate limiting | Đọc `Retry-After`, backoff, retry |
| `408 Request Timeout` | Transient | Retry |
| `5xx` | Transient | Retry |

Xử lý `Retry-After`: đọc header (giây hoặc HTTP date) và **lấy max giữa giá trị đó và thời gian backoff tính được** — không được retry sớm hơn `Retry-After`.

⚠️ **Bẫy đặc thù của Drive:** *"For any 4xx errors (including 403) during a resumable upload, restart the upload"* — nghĩa là với Drive, `403` rate limit **giữa lúc đang resumable upload** thì **không** retry chunk mà phải **xin session URI mới**. Điều này khác với semantics `403 → backoff → retry` của các API thông thường.

## 6.6 (c) Bài học cho người tự xây upload service

- **Presigned/session URL là credential — hãy đối xử như password.** Không log full URL, scrub khỏi Sentry/APM, không đặt trong query string nếu access log ghi query string, TTL càng ngắn càng tốt cho bước initiate.
- **Ràng buộc credential vào ĐÚNG MỘT thao tác.** Signed URL của GCS khoá cả method, path và các header đã ký thông qua canonical request. Presigned URL của bạn (MinIO/S3) cũng nên khoá `Content-Type` và, nếu được, `Content-Length` range để chặn upload file khổng lồ ngoài dự kiến.
- **Kiểm tra size/quota ở bước INITIATE, không phải sau khi nhận hết byte.** Bắt client khai `X-Upload-Content-Length` và từ chối ngay. Nhận 5 GB rồi mới nói "vượt quota" là lãng phí băng thông và cực kỳ khó chịu cho user.
- **Re-check quyền tại mỗi lần resume, không chỉ ở initiate.** Session sống 7 ngày = cửa sổ 7 ngày để quyền thay đổi.
- **Quét malware ASYNC, đừng chặn upload.** Trạng thái file: `UPLOADED → SCANNING → CLEAN | FLAGGED`. Chặn ở bước **download/share** chứ không ở bước upload. Quyết định fail-open hay fail-closed phải là quyết định có ý thức, ghi vào tài liệu.
- **Đặt giới hạn cho việc quét và xử lý file quá lớn một cách tường minh.** Google chọn 100 MB + cảnh báo. Bạn cần một con số và một hành vi mặc định rõ ràng, không để undefined.
- **Backend không bao giờ nên proxy byte của file lớn.** Cấp presigned URL, cho client đẩy thẳng vào object storage.
  → *Áp dụng cho FileSharing: `filesharing-filehandler` nên cấp presigned URL MinIO, không nhận `MultipartFile` 5 GB qua Spring MVC.*

---

# 7. RELIABILITY — Độ tin cậy, retry, idempotency

## 7.1 (a) XÁC NHẬN — Lỗi nào retryable

Nguồn: [GCS — Retry strategy](https://docs.cloud.google.com/storage/docs/retry-strategy)

**Retryable:**
- `408 Request Timeout`
- `429 Too Many Requests`
- `5xx` (500, 502, 503, 504)
- **Socket timeout và TCP disconnect** (không có HTTP status)

**Không retryable:** `400`, `401`, `403` (trừ trường hợp rate-limit), `404`, `412 Precondition Failed`.

## 7.2 (a) XÁC NHẬN — Thuật toán backoff chính thức

Công thức chính thức của Google (Drive API):
```
delay = min( (2^n) + random_jitter_ms , maximum_backoff )
```
- `n` tăng sau mỗi lần retry
- `random_jitter_ms` = 0–1000 ms — *"to prevent synchronized retries"*
- `maximum_backoff` điển hình: **32–64 giây**
- Đạt max rồi thì tiếp tục retry ở khoảng max

Nguồn: [Drive API — Usage limits](https://developers.google.com/workspace/drive/api/guides/limits)

**Tham số mặc định trong các client library GCS chính thức:**

| Library | Initial delay | Max delay | Multiplier | Max attempts |
|---|---|---|---|---|
| Go | 1s | 30s | 2.0 | không giới hạn |
| Java | 1s | 32s | 2.0 | 6 |
| Node.js | 1s | 64s | 2.0 | 3 |
| Python | 1s | 60s | 2.0 | không giới hạn |
| Ruby | 1s | 60s | 2.0 | 3 |

> Chú ý sự **thiếu nhất quán giữa các ngôn ngữ** (max attempts 3 vs 6 vs vô hạn). Ngay cả Google cũng không thống nhất được — nghĩa là đây là tham số phải tune theo ngữ cảnh, không có con số "đúng".

## 7.3 (a) XÁC NHẬN — Idempotency

GCS phân loại thao tác thành 3 nhóm:

**1. Luôn idempotent** — mọi `get`/`list`, bucket insert/delete, IAM test, lock retention policy, xoá HMAC key / Pub/Sub notification.

**2. Idempotent CÓ ĐIỀU KIỆN** — chỉ an toàn retry khi kèm precondition:
| Thao tác | Precondition cần |
|---|---|
| Update bucket/object | `IfMetagenerationMatch` hoặc `etag` |
| Upload / thao tác object | `ifGenerationMatch` |
| Xoá object | `ifGenerationMatch` hoặc chỉ định generation |
| Set IAM policy | `etag` |

**3. Không bao giờ idempotent** — tạo HMAC key, tạo Pub/Sub notification, ACL create/delete/patch.

> **Insight quan trọng:** Google **không** cố làm cho mọi thứ idempotent bằng ma thuật. Họ **phân loại rõ ràng** và **giao cho client công cụ (precondition)** để tự biến thao tác thành idempotent khi cần. Trung thực và thực tế hơn nhiều so với việc hứa hẹn "at-most-once" không thể giữ.

**Công cụ idempotency cụ thể:**

| Hệ thống | Cơ chế | Hành vi khi trùng |
|---|---|---|
| GCS | `ifGenerationMatch=0` | Chỉ tạo nếu object chưa tồn tại → `412 Precondition Failed` nếu đã có |
| GCS | `ifGenerationMatch=<N>` | Chỉ ghi đè nếu generation hiện tại đúng bằng N |
| Drive | Pre-generated file ID | Retry an toàn; lần thứ hai trả `409 Conflict`, không tạo bản trùng |

## 7.4 (a) XÁC NHẬN — Idempotency khi gửi lại cùng một range

Đây là câu trả lời quan trọng nhất của mục 7:

> *"Cloud Storage **ignores any bytes you send at an offset that Cloud Storage has already persisted**."*

> *"Once persisted, bytes **cannot be overwritten**. If an upload resumes mid-stream, sending **different data** to previously-uploaded byte ranges results in Cloud Storage **ignoring those bytes** and continuing from the last persisted offset."*

**Diễn giải:**
- Gửi lại đúng range đã persist → **an toàn, no-op**. Idempotent theo thiết kế.
- Gửi **dữ liệu KHÁC** vào range đã persist → **byte mới bị bỏ qua âm thầm**, dữ liệu cũ giữ nguyên. **KHÔNG có lỗi báo về.**

> ⚠️ Điểm thứ hai là con dao hai lưỡi. Nó bảo vệ khỏi corruption do retry bị nhiễu, nhưng nếu client của bạn có bug tính offset sai, hệ thống sẽ **âm thầm** tạo ra file không giống file gốc — và bạn chỉ phát hiện ở bước validate CRC32C cuối cùng (nếu bạn có gửi CRC). **Nếu không gửi CRC, bạn sẽ không bao giờ biết.** Đây là lý do §5.5 khuyên gửi checksum như precondition.

## 7.5 (a)+(b) Offset mismatch giữa client và server

**(a) XÁC NHẬN — quy tắc bắt buộc:**
- **Luôn** đọc offset từ response, **không bao giờ** tự tăng ở client. Drive nói thẳng: *"you should not assume that the server received all bytes sent in any given request."*
- Trước khi resume sau bất kỳ gián đoạn nào: **query status** để lấy offset thật.
- `308` không kèm `Range` → server có **0 byte**.
- Nếu offset client gửi **vượt quá** số byte server đã persist → **lỗi** (không thể tạo lỗ hổng trong file).

**(b) Không tài liệu hoá chính thức:** response code chính xác khi gửi offset quá xa. GitHub issue của `google-cloud-cpp` mô tả: *"the upload offset can exceed the already uploaded size, resulting in an error"* → [google-cloud-cpp#3280](https://github.com/googleapis/google-cloud-cpp/issues/3280)

**Cách rclone xử lý (source code thật, đáng tin cậy):**
- Định nghĩa hằng `statusResumeIncomplete = 308`.
- Khi gặp 308: parse `Range` bằng regex `[0-9]+-[0-9]+`, lấy chỉ số byte cuối, offset tiếp theo = `lastByteIndex + 1`.
- Khi gặp `503`: **query lại server** để hỏi số byte đã nhận, giảm bộ đếm, backoff mũ.
- Có xử lý **location redirect** — server có thể trả về session URI mới giữa chừng, client phải cập nhật.
- Với upload không biết trước độ dài: **chỉ set `ContentLength` ở chunk cuối** — vì nếu set sớm *"Google doesn't know we've finished"*.

→ [rclone `backend/drive/upload.go`](https://github.com/rclone/rclone/blob/master/backend/drive/upload.go), [gdata-java-client `ResumableHttpUploadTask.java`](https://github.com/google/gdata-java-client/blob/master/java/src/com/google/gdata/client/uploader/ResumableHttpUploadTask.java)

> Chi tiết "session URI có thể redirect" là thứ **không có trong tài liệu chính thức** nhưng cả gdata-java-client (code của Google) và rclone đều xử lý → **có thật trong production**. Nếu bạn viết client, bạn phải follow redirect và cập nhật session URI.

## 7.6 (a)+(b) Hai client cùng ghi một session

**(a) XÁC NHẬN gián tiếp:** *"Cloud Storage ignores any bytes you send at an offset that Cloud Storage has already persisted"* → không có corruption, nhưng cũng không có tiến triển hữu ích cho client chậm hơn.

**(b) Từ GitHub issue (google-cloud-cpp#3280 — "Parallel resumable upload corrupting uploads to GCS"):**
- Client chậm hơn nhận `next_expected_byte` đã cập nhật từ server trong response.
- Nếu offset client gửi vượt quá size đã upload → **error**.
- Kết luận của cộng đồng: **chia sẻ một session URI giữa nhiều client đồng thời là sai lầm**; mỗi client phải có session riêng.

**Kết luận thiết kế:** Resumable session của Google là **single-writer, sequential**. Nó **không** phải cơ chế upload song song. Muốn song song, Google cung cấp cơ chế **khác hẳn**: XML multipart upload (nhiều `PUT` part độc lập, mỗi part có số thứ tự) hoặc parallel composite upload (nhiều object tạm + compose).

> **Đây là sự phân tách rất rõ ràng và đáng học:**
> - **Resumable** = giải bài toán **mạng không ổn định** (một writer, tuần tự, resume được).
> - **Multipart / parallel composite** = giải bài toán **thông lượng** (nhiều writer, song song).
> Trộn hai bài toán vào một cơ chế là sai lầm thiết kế. Google giữ chúng tách bạch.

## 7.7 (c) Bài học cho người tự xây upload service

- **Server là nguồn chân lý duy nhất về offset.** Client không bao giờ được tự suy ra offset. API của bạn phải trả offset trong **mọi** response, và client phải dùng nó.
- **Bỏ qua (ignore) byte gửi lại ở offset đã persist — nhưng HÃY validate checksum toàn file để bắt bug.** Cơ chế "im lặng bỏ qua" của Google an toàn với retry nhưng che giấu bug offset. Checksum cuối cùng là lưới an toàn duy nhất.
- **Tách rõ cơ chế "chống mạng đứt" (resumable, single-writer) khỏi cơ chế "tăng throughput" (multipart, multi-writer).** Đừng cố cho phép nhiều client ghi song song vào một session.
- **Backoff = exponential + jitter, luôn luôn.** `min(2^n + rand(0,1000ms), 32-64s)`. Không có jitter thì mọi client retry đồng loạt và giết chính server bạn vừa hồi phục.
- **Cấp ID/token idempotency ở bước initiate.** Đây là cách rẻ nhất và tổng quát nhất để chống duplicate.
- **Client phải follow redirect của session URI** — Google có làm điều này trong production dù không tài liệu hoá.
- **Phân loại rõ thao tác nào idempotent, thao tác nào cần precondition.** Viết nó ra thành tài liệu. Đừng để người dùng API phải đoán.

---

# 8. POST-PROCESSING — Xử lý sau commit

## 8.1 (a) XÁC NHẬN — Có xử lý bất đồng bộ sau commit

**Google Drive làm sau khi commit:**

1. **Sinh thumbnail** — trường `hasThumbnail`, `thumbnailLink`, `thumbnailVersion` trong File resource đều là **output-only** → server tự điền, không phải ngay lập tức.
   → [Drive API v3 File resource](https://developers.google.com/drive/api/reference/rest/v3/files)

2. **Trích xuất media metadata** — `videoMediaMetadata` *"only present for video types"*, chứa `width`, `height`, `durationMillis`. Phải decode video mới có được → chắc chắn async.

3. **Transcode video** cho trình phát nhúng của Drive.

4. **Indexing full-text** — Drive cho phép tìm kiếm nội dung file bằng `fullText` trong `files.list`. Với định dạng Google không hiểu, Google cung cấp trường `contentHints.indexableText` để **ứng dụng tự cấp text cho index**.
   → Đây là bằng chứng chính thức rằng có một **pipeline indexing tách rời**: nếu index là đồng bộ và tự động hoàn toàn, sẽ không cần cơ chế cho phép client "tiêm" text vào.

5. **Chuyển đổi sang định dạng Google Workspace** (Docs/Sheets/Slides) khi được yêu cầu. Ghi nhận chính thức: pre-generated ID **không hoạt động** cho conversion (trừ `application/vnd.google-apps.drive-sdk` và folder) → conversion đi qua đường xử lý **khác** với upload thường.

6. **Quét malware / abuse** — như §6.4, chạy lazy tại thời điểm download/share.

**Google Cloud Search (sản phẩm liên quan):** thumbnail URL **hết hạn sau 5 phút**, và **không sinh thumbnail cho file > 50 MB**.
→ [Cloud Search — Enable thumbnails](https://developers.google.com/workspace/cloud-search/docs/guides/thumbnails)

## 8.2 (b) SUY ĐOÁN — Trạng thái "đang xử lý" thể hiện thế nào qua API

**Đây là điểm yếu rõ ràng của Drive API, và tôi cần nói thẳng:**

**Drive API KHÔNG có trường trạng thái xử lý tường minh.** Không có `processingState`, không có `status: PROCESSING`. Không tìm được nguồn chính thức nào mô tả một field như vậy.

Client chỉ có thể **suy ra** trạng thái bằng cách polling và quan sát sự **vắng mặt** của các trường:

| Tín hiệu gián tiếp | Ý nghĩa suy ra |
|---|---|
| `hasThumbnail == false` | Thumbnail chưa sinh xong (hoặc không hỗ trợ loại file này — **không phân biệt được**) |
| `videoMediaMetadata` vắng mặt | Chưa decode xong metadata video |
| `thumbnailVersion` không đổi | Chưa có bản thumbnail mới |
| UI web hiện *"We're still processing this video"* | Transcode chưa xong |

**Hệ quả thực tế được ghi nhận rộng rãi:**
- Video mới upload hiển thị *"We're still processing this video"* trong khoảng thời gian **không xác định trước**.
- Job sinh thumbnail đôi khi **kẹt** và không tự phục hồi; workaround phổ biến trong cộng đồng là **mở phát video** để kích hoạt lại pipeline.
  → [filerev.com — Still processing video](https://filerev.com/blog/still-processing-video-drive/)
- Có issue chính thức được báo cáo về việc `thumbnailLink` trả 302 rồi lỗi, và PDF không sinh được thumbnail.
  → [issuetracker #328843683](https://issuetracker.google.com/issues/328843683), [issuetracker #163065199](https://issuetracker.google.com/issues/163065199)

> **Bài học ngược (anti-pattern):** Google **không** expose trạng thái xử lý qua API, và điều đó gây khó chịu thực sự cho developer — buộc phải polling mù, không phân biệt được "đang xử lý" với "không hỗ trợ", không biết bao giờ nên bỏ cuộc. Đây là chỗ bạn **nên làm tốt hơn Google**, không phải bắt chước.

**Đối chiếu — Google Photos làm khác:** commit là **tường minh** qua `mediaItems:batchCreate`, và response trả về kết quả từng item trong batch. Người gọi biết chính xác item nào thành công.

## 8.3 (c) Bài học cho người tự xây upload service

- **Expose trạng thái xử lý TƯỜNG MINH — đây là chỗ nên vượt Google.** Một enum rõ ràng: `UPLOADING → UPLOADED → PROCESSING → READY | FAILED`, kèm `processingError` khi FAILED. Đừng bắt client suy ra trạng thái từ việc một field có mặt hay vắng mặt.
- **Phân biệt "chưa xử lý xong" với "không áp dụng được".** `hasThumbnail == false` của Drive gộp hai trường hợp hoàn toàn khác nhau (đang sinh vs. loại file không có thumbnail) — client không thể biết nên chờ hay nên bỏ cuộc.
- **Job xử lý phải có retry + dead-letter + observable.** Bài học từ chính lỗi của Drive: pipeline thumbnail kẹt và không tự phục hồi, phải chờ "sự kiện tình cờ" (user mở video) mới chạy lại. Kafka consumer của bạn cần DLQ và alert, không phải hy vọng.
- **Commit metadata và bắt đầu xử lý là hai sự kiện tách biệt.** File phải "tồn tại" và list được ngay sau commit, kể cả khi thumbnail/transcode còn đang chạy. Đừng chặn visibility để chờ post-processing.
  → *Áp dụng cho FileSharing: `filehandler` commit Asset vào MongoDB → publish `video_encode_topic` → worker xử lý → publish `video_encode_result_topic` → filehandler cập nhật status. Asset phải visible với `status=PROCESSING` ngay từ đầu.*
- **Đặt giới hạn tường minh cho post-processing và ghi vào tài liệu.** Google Cloud Search: không thumbnail cho file >50 MB. Drive: không quét virus cho file >100 MB. Có giới hạn rõ ràng tốt hơn là hành vi không xác định.
- **Cân nhắc push thay vì poll.** Drive bắt polling. Nếu bạn có WebSocket/SSE (hoặc đã có Kafka), hãy đẩy sự kiện `PROCESSING_COMPLETE` về client.

---

# 9. DANH SÁCH VẤN ĐỀ THIẾT KẾ PHẢI GIẢI QUYẾT

Tổng hợp mọi bài toán kỹ thuật mà Google đã phải giải trong pipeline upload của họ. Đây là **checklist thiết kế** cho bất kỳ ai xây upload service nghiêm túc.

### A. Giao thức & tương thích

| # | Vấn đề | Cách Google giải |
|---|---|---|
| A1 | Tách metadata của **file** khỏi metadata của **HTTP request** | Header riêng `X-Upload-Content-Type/-Length`, `X-Goog-Upload-Header-*` |
| A2 | HTTP `308` và `Content-Range` bị proxy/CDN/HTTP-client xử lý sai | Giao thức thứ hai `X-Goog-Upload-*` chỉ dùng 200/4xx/5xx |
| A3 | Bẫy off-by-one khi trả offset | `X-Goog-Upload-Size-Received` (đếm từ 1) thay vì `Range: bytes=0-N` (đếm từ 0) |
| A4 | Finalize ngầm định gây bug khó thấy | `X-Goog-Upload-Command: upload, finalize` tường minh |
| A5 | Chunk granularity khác nhau giữa các backend | Server công bố `X-Goog-Upload-Chunk-Granularity` động |
| A6 | Upload khi **không biết trước tổng size** (streaming) | `Content-Range: bytes A-B/*`, chỉ set tổng ở chunk cuối |
| A7 | Chọn kiểu upload theo kích thước | Công thức băng thông × thời gian chấp nhận mất (8 Mbps/30s→30 MB; 500 Mbps/30s→2 GB) |
| A8 | Tương thích với hệ sinh thái S3 | XML API multipart upload S3-compatible |
| A9 | Session URI cần được redirect sang cluster khác giữa chừng | Trả URL tuyệt đối; client phải follow redirect (không tài liệu hoá) |

### B. Quản lý session

| # | Vấn đề | Cách Google giải |
|---|---|---|
| B1 | Client mất kết nối và cần biết đã upload tới đâu | Query status: `Content-Range: bytes */N` hoặc `Command: query` |
| B2 | Session sống bao lâu là đủ (UX vs chi phí lưu trữ rác) | **7 ngày** — hằng số nhất quán từ 2008 đến nay |
| B3 | Client mất session URI | Không cứu được — phải làm lại từ đầu. Client PHẢI persist |
| B4 | Phân biệt "session hết hạn gần đây" vs "hết hạn lâu rồi" | GCS: `410 Gone` vs `404 Not Found` |
| B5 | Session mang trạng thái ở đâu cho file 5 TB / 7 ngày | Byte → Colossus ngay; offset → KV store bền vững (suy đoán) |
| B6 | Quyền thay đổi giữa vòng đời session | Re-check tại mỗi resume → 4xx → bắt tạo session mới |
| B7 | Dọn session bỏ dở | TTL 7 ngày + API hủy tường minh (`DELETE`→499 / `Command: cancel`) |
| B8 | Byte "mồ côi" (đã upload, chưa commit) | TTL ngắn hơn cho token commit (Photos: 1 ngày) |
| B9 | Hủy upload chủ động để giải phóng tài nguyên | `DELETE <session_uri>` → 499 (JSON) / 204 (XML) |

### C. Kiến trúc backend & storage

| # | Vấn đề | Cách Google giải |
|---|---|---|
| C1 | RTT cao + TCP slow-start giết throughput upload đường dài | Terminate TLS ở GFE tại edge POP; backbone riêng với connection warm |
| C2 | Metadata plane trở thành nút cổ chai của data plane | Curator chỉ lo control; client ghi **thẳng** vào D file server |
| C3 | Metadata filesystem không scale (giới hạn của GFS) | Đưa metadata vào Bigtable → scale 100x |
| C4 | Object listing phải strongly consistent toàn cầu | Spanner cho bucket/object metadata |
| C5 | Chi phí 3x replication quá cao | Reed-Solomon erasure coding — cùng mức chịu lỗi, nửa chi phí |
| C6 | Không phải dữ liệu nào cũng cần cùng mức durability/latency | Encoding scheme là tham số của **ứng dụng**, không phải hằng số hệ thống |
| C7 | Dữ liệu vừa upload là nóng nhất (sắp bị transcode/thumbnail) | L4 writeback: ghi lên SSD trước, migrate xuống HDD theo thời gian; chính sách chọn bằng ML |
| C8 | Bit rot / hỏng dữ liệu at-rest theo thời gian | Custodian quét & revalidate checksum liên tục, tự sửa từ fragment parity |
| C9 | Cân bằng dung lượng đĩa, tái tạo RAID khi máy chết | Custodian chạy nền |
| C10 | Một cluster phải phục vụ đồng thời OLTP, analytics, serving, archive | Disaggregation — resource là "byte và I/O" trừu tượng |
| C11 | Tách vận chuyển byte khỏi logic nghiệp vụ của từng sản phẩm | Upload frontend dùng chung ("Scotty" — suy đoán) trả blob handle cho backend |
| C12 | Cùng blob nhưng metadata model khác nhau (Drive/Photos/YouTube) | Blob bất biến + metadata mutable, nối bằng handle |

### D. Commit & tính nhất quán

| # | Vấn đề | Cách Google giải |
|---|---|---|
| D1 | Object dở dang không được lộ ra cho reader | *"not available until completely uploaded"* — không bao giờ có partial object |
| D2 | Ghi đè object đang có reader | Atomic swap — bản cũ phục vụ tới đúng thời điểm chuyển |
| D3 | Read-after-write consistency toàn cầu | Strongly consistent, kể cả dual/multi-region; không bao giờ trả 404 sau khi ghi xong |
| D4 | Client mất response commit → có thể tạo bản trùng | Query status trả `200/201` (đã xong) thay vì `308` |
| D5 | Retry request tạo file → duplicate | Drive: pre-generated file ID → lần 2 trả `409 Conflict` |
| D6 | Ghi đè ngoài ý muốn khi trùng tên | GCS: `ifGenerationMatch=0` precondition |
| D7 | Cần giữ lịch sử phiên bản | Generation number mỗi lần ghi + Object Versioning |
| D8 | Cân bằng đúng thời điểm ack durable | Ghi ≥2 availability zone **trước khi** trả 200; cross-region là async (1h/12h target) |

### E. Toàn vẹn dữ liệu

| # | Vấn đề | Cách Google giải |
|---|---|---|
| E1 | Checksum phải ghép được để hỗ trợ upload song song | **CRC32C** (composable); MD5 bị bỏ cho mọi trường hợp chunked |
| E2 | Tính hash không được là nút cổ chai CPU | CRC32C có hardware instruction (SSE4.2 / ARM64) |
| E3 | Phát hiện dữ liệu hỏng trên đường truyền | Client gửi `X-Goog-Hash` / `Content-MD5`; server tính lại và so, sai → `400` |
| E4 | Checksum như precondition, không chỉ là metadata | *"only create the object if the hash you provided matches"* |
| E5 | Chi phí verify per-chunk quá cao ở quy mô exabyte | **Chấp nhận đánh đổi:** chỉ verify toàn object, không verify chunk trung gian |
| E6 | Composite object mất MD5 | Tài liệu hoá rõ ràng như caveat; buộc client dùng CRC32C |
| E7 | Không verify được ranged read / transcoding | Nêu rõ giới hạn; gRPC ranged read có verify per-chunk |

### F. Bảo mật

| # | Vấn đề | Cách Google giải |
|---|---|---|
| F1 | Client cần upload thẳng vào storage mà không có credential | Session URI / Signed URL làm bearer credential ngắn hạn |
| F2 | Bearer credential có thể rò rỉ | Giới hạn phạm vi: **1 object, chỉ ghi, TTL ≤7 ngày**; bắt buộc HTTPS |
| F3 | Không cho client đổi method/path/header sau khi ký | Canonical request trong V4 signature khoá tất cả |
| F4 | Không lãng phí băng thông cho request chắc chắn bị từ chối | Khai `X-Upload-Content-Length` ở initiate → từ chối sớm |
| F5 | Quét malware không được chặn upload | **Async / lazy** — quét khi download/share, không khi upload |
| F6 | File quá lớn không quét nổi | Ngưỡng 100 MB; **fail-open** kèm cảnh báo |
| F7 | Content vi phạm chính sách | Hệ thống abuse flagging → restrict share; `acknowledgeAbuse` để override |
| F8 | Mã hoá dữ liệu trên toàn đường đi | TLS/QUIC client→GFE; **ALTS** GFE→backend; PSP giữa datacenter |
| F9 | Chống lạm dụng tài nguyên | Quota nhiều tầng: 750 GB/ngày/user, quota units/phút/project và /user |
| F10 | Ghi liên tục vào cùng một key | GCS: giới hạn 1 write/giây/object name |

### G. Độ tin cậy

| # | Vấn đề | Cách Google giải |
|---|---|---|
| G1 | Phân loại lỗi retryable vs không | 408/429/5xx + socket timeout/TCP disconnect = retryable |
| G2 | Retry storm giết server vừa hồi phục | `min(2^n + jitter(0-1000ms), 32-64s)` — jitter là bắt buộc |
| G3 | Tôn trọng tín hiệu của server | `Retry-After` — lấy **max** giữa nó và backoff tính được |
| G4 | Gửi lại cùng range có an toàn không | Có — byte ở offset đã persist bị **bỏ qua** |
| G5 | Gửi **dữ liệu khác** vào range đã persist | Bỏ qua âm thầm → chỉ CRC toàn file mới bắt được |
| G6 | Client và server lệch offset | Server là nguồn chân lý duy nhất; *"do not assume the server received all bytes"* |
| G7 | Nhiều client cùng ghi một session | **Không hỗ trợ** — resumable là single-writer; dùng multipart/composite cho song song |
| G8 | Phân biệt bài toán "mạng đứt" và bài toán "throughput" | Hai cơ chế **hoàn toàn tách biệt** |
| G9 | Thao tác không idempotent tự nhiên | Phân loại 3 nhóm + cung cấp precondition (`ifGenerationMatch`, `etag`) |
| G10 | Retry vô hạn vs bỏ cuộc | Max attempts cấu hình được (3/6/vô hạn tuỳ library — không có con số "đúng") |

### H. Hiệu năng & mở rộng

| # | Vấn đề | Cách Google giải |
|---|---|---|
| H1 | File lớn upload tuần tự quá chậm | XML multipart (10.000 parts) + parallel composite (32 chunks) |
| H2 | Giới hạn 32 object mỗi lệnh compose | Compose nhiều tầng (32² = 1024, …) |
| H3 | Ngưỡng nào thì song song mới đáng | 150 MiB (mặc định `gcloud`) — dưới đó overhead lớn hơn lợi ích |
| H4 | Chunk quá nhỏ = quá nhiều round trip | Bội số 256 KiB, khuyến nghị tối thiểu 8 MiB, *"as large as possible"* |
| H5 | Temp object của parallel composite gây rác/tốn tiền | Naming convention có prefix rõ ràng + tự xoá; cảnh báo với retention/versioning |
| H6 | Đạt throughput cực đại | Colossus: 25+ TB/s write, 50+ TB/s read, 600M+ IOPS |
| H7 | Giới hạn kích thước tuyệt đối | 5 TiB (GCS), 5 TB (Drive) |

### I. Post-processing

| # | Vấn đề | Cách Google giải |
|---|---|---|
| I1 | Thumbnail/transcode không được chặn visibility của file | Async hoàn toàn; file list được ngay sau commit |
| I2 | Trích metadata media (duration, resolution) | Async → `videoMediaMetadata` xuất hiện sau |
| I3 | Index full-text cho định dạng lạ | `contentHints.indexableText` — cho client tự cấp text |
| I4 | Chuyển đổi sang Google Workspace format | Đường xử lý riêng (pre-generated ID không dùng được) |
| I5 | Thông báo trạng thái xử lý cho client | ❌ **CHƯA GIẢI TỐT** — không có field trạng thái; client phải polling mù |
| I6 | Job xử lý bị kẹt | ❌ **CHƯA GIẢI TỐT** — cần sự kiện ngoài (user mở video) để kích hoạt lại |
| I7 | Giới hạn tài nguyên cho post-processing | Ngưỡng tường minh (Cloud Search: không thumbnail >50 MB; virus scan >100 MB) |

---

# 10. Danh mục nguồn

## Nguồn chính thức Google — Drive / Workspace
- [Drive API — Upload file data](https://developers.google.com/workspace/drive/api/guides/manage-uploads) — giao thức resumable, 3 kiểu upload, chunk 256 KB, session 1 tuần, 4xx→restart, pre-generated ID
- [Drive API — Usage limits](https://developers.google.com/workspace/drive/api/guides/limits) — quota, 750 GB/ngày, 5 TB, công thức backoff
- [Drive API v3 — File resource](https://developers.google.com/drive/api/reference/rest/v3/files) — `hasThumbnail`, `thumbnailVersion`, `videoMediaMetadata` (output-only)
- [Method: files.generateIds](https://developers.google.com/drive/api/v2/reference/files/generateIds) — pre-generated ID
- [Google Drive Help — Virus scanning >100 MB](https://support.google.com/drive/thread/225474267/virus-scanning-files-in-google-drive-larger-than-100mb)

## Nguồn chính thức Google — Cloud Storage
- [GCS — Resumable uploads](https://docs.cloud.google.com/storage/docs/resumable-uploads) — session URI là auth token, 7 ngày, 410/404, 256 KiB, không verify chunk trung gian
- [GCS — Perform resumable uploads](https://docs.cloud.google.com/storage/docs/performing-resumable-uploads) — luồng HTTP đầy đủ, DELETE→499/204
- [GCS — Object uploads](https://docs.cloud.google.com/storage/docs/uploads) — streaming, `ifGenerationMatch=0`
- [GCS — Uploads and downloads](https://docs.cloud.google.com/storage/docs/uploads-downloads) — taxonomy + công thức ngưỡng
- [GCS — Consistency](https://docs.cloud.google.com/storage/docs/consistency) — atomicity, strong read-after-write
- [GCS — About objects](https://docs.cloud.google.com/storage/docs/objects) — immutability, không có partial object
- [GCS — Data validation and change detection](https://docs.cloud.google.com/storage/docs/data-validation) — CRC32C, MD5, `X-Goog-Hash`
- [GCS — Retry strategy](https://docs.cloud.google.com/storage/docs/retry-strategy) — 408/429/5xx, phân loại idempotency, backoff defaults
- [GCS — Quotas & limits](https://docs.cloud.google.com/storage/quotas) — 5 TiB, 32 compose, 1 write/s, 10.000 parts, 7 ngày
- [GCS — Parallel composite uploads](https://docs.cloud.google.com/storage/docs/parallel-composite-uploads) — 32 chunk, 150 MiB, temp naming, caveat
- [GCS — Composite objects](https://docs.cloud.google.com/storage/docs/composite-objects)
- [GCS — XML API multipart uploads](https://docs.cloud.google.com/storage/docs/multipart-uploads) — tương thích S3
- [GCS — Initiate a resumable upload (XML API)](https://cloud.google.com/storage/docs/xml-api/post-object-resumable) — `x-goog-resumable: start`, `X-GUploader-UploadID`
- [GCS — Signed URLs](https://docs.cloud.google.com/storage/docs/access-control/signed-urls) — V4 signing, 604800s, canonical request
- [GCS — Data availability and durability](https://docs.cloud.google.com/storage/docs/availability-durability) — 11 nines, ≥2 AZ trước khi ack, async cross-region

## Nguồn chính thức Google — các API khác dùng chung giao thức
- [Photos Library API — Resumable uploads](https://developers.google.com/photos/library/guides/resumable-uploads) — `X-Goog-Upload-*` đầy đủ
- [Photos Library API — Upload media](https://developers.google.com/photos/library/guides/upload-media) — 2 pha, upload token 1 ngày, batchCreate
- [Street View Publish — Performing a Resumable Upload](https://developers.google.com/streetview/publish/resumable-uploads) — `X-Goog-Upload-Header-*`, 2 MiB
- [YouTube Data API — Resumable upload protocol](https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol) — 256 KB, cảnh báo về chunking
- [Google Data Protocol — Resumable Media Uploads](https://developers.google.com/gdata/docs/resumable_upload) — spec gốc (~2008), DELETE→499
- [Cloud Search — Enable thumbnails](https://developers.google.com/workspace/cloud-search/docs/guides/thumbnails) — thumbnail URL 5 phút, không sinh cho >50 MB

## Nguồn chính thức Google — kiến trúc hạ tầng
- [A peek behind Colossus, Google's file system](https://cloud.google.com/blog/products/storage-data-transfer/a-peek-behind-colossus-googles-file-system) — Curator, Bigtable, D server, Custodian, client library
- [How Colossus optimizes data placement for performance](https://cloud.google.com/blog/products/storage-data-transfer/how-colossus-optimizes-data-placement-for-performance) — L4 SSD cache, writeback, 50 TB/s
- [Spanner: The secret to Cloud Storage strong list consistency](https://cloud.google.com/blog/products/gcp/how-google-cloud-storage-offers-strongly-consistent-object-listing-thanks-to-spanner)
- [Encryption in transit for Google Cloud](https://docs.cloud.google.com/docs/security/encryption-in-transit) — GFE, TLS/QUIC, ALTS
- [ALTS whitepaper (PDF)](https://cloud.google.com/security/encryption-in-transit/application-layer-transport-security/resources/alts-whitepaper.pdf)
- [App Engine Blobstore overview](https://docs.cloud.google.com/appengine/docs/standard/services/blobstore) — pattern "upload trực tiếp → blob key → rewrite request"
- [Google SRE Workbook — Managing Load](https://sre.google/workbook/managing-load/) — Maglev, GFE

## Source code (bằng chứng thực thi)
- [google-gemini/cookbook — `quickstarts/file-api/sample.sh`](https://github.com/google-gemini/cookbook/blob/main/quickstarts/file-api/sample.sh) — curl `X-Goog-Upload-*` thật
- [google/gdata-java-client — `ResumableHttpUploadTask.java`](https://github.com/google/gdata-java-client/blob/master/java/src/com/google/gdata/client/uploader/ResumableHttpUploadTask.java) — **nhắc tên "scotty server"**, xử lý 308/503/redirect
- [rclone — `backend/drive/upload.go`](https://github.com/rclone/rclone/blob/master/backend/drive/upload.go) — `statusResumeIncomplete = 308`, chunk mặc định 8M, quirk `ContentLength` chunk cuối
- [google-cloud-cpp issue #3280 — Parallel resumable upload corrupting uploads](https://github.com/googleapis/google-cloud-cpp/issues/3280) — hành vi khi 2 client dùng chung session
- [google-api-ruby-client issue #311](https://github.com/googleapis/google-api-ruby-client/issues/311)

## Nguồn thứ cấp (độ tin cậy trung bình — đã đánh dấu (b) trong báo cáo)
- [Colossus: Google's File System (Medium)](https://shambhavishandilya.medium.com/colossus-googles-file-system-baced846d9b7) — Blobstore trên Colossus
- [The Production Environment at Google, part 2](https://medium.com/@jerub/the-production-environment-at-google-part-2-610884268aaa) — GFE/Maglev
- [filerev.com — Still processing video in Drive](https://filerev.com/blog/still-processing-video-drive/) — pipeline thumbnail kẹt
- [issuetracker #328843683](https://issuetracker.google.com/issues/328843683), [issuetracker #163065199](https://issuetracker.google.com/issues/163065199) — lỗi thumbnail
- [PhoneArena — Drive restricting files by mistake](https://www.phonearena.com/news/google-drive-restricting-files-mistake-ai_id138090), [TechRadar](https://www.techradar.com/news/google-drive-is-locking-some-peoples-files-for-no-reason) — false positive abuse flagging

## ⚠️ Những điều KHÔNG xác minh được
1. **Kiến trúc nội bộ của "Scotty"** — chỉ có một comment trong source code công khai của Google xác nhận cái tên tồn tại và nó làm content-type sniffing. Mọi mô tả kiến trúc trong §1.3 và C11 là **suy luận**.
2. **Giao thức chính xác mà `drive.google.com` (web UI) dùng** — không tìm được HAR dump, blog phân tích, hay câu hỏi StackOverflow nào đáng tin cậy. Cần tự capture bằng DevTools.
3. **Cơ chế garbage collection session bỏ dở của Google** — không có tài liệu.
4. **Cách Drive lưu trữ file cụ thể** (blob handle, dedup, revision) — chỉ xác nhận được "Drive chạy trên Colossus".
5. **Nơi lưu trạng thái session server-side** — không có tài liệu.
6. **Trường trạng thái post-processing trong Drive API** — nhiều khả năng **không tồn tại**, chứ không phải tôi tìm không ra.
