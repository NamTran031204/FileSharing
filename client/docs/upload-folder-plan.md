# Kế hoạch implement Upload Folder
## 1. Mục tiêu thiết kế mới

Use case upload folder sẽ được chia thành 2 giai đoạn lớn:

```txt
Giai đoạn 1: Tạo cây thư mục trong database
Giai đoạn 2: Upload lần lượt từng asset vào đúng folderId
```

Thứ tự bắt buộc:

```txt
User chọn folder
  ↓
Client parse cây thư mục
  ↓
Client gọi API create-folder-tree
  ↓
Server tạo toàn bộ folder trong DB
  ↓
Server trả mapping folderPath -> folderId
  ↓
Client upload từng file theo folderId tương ứng
```

Lý do cần API `create-folder-tree`:

* Tránh client phải gọi API tạo từng folder.
* Tạo cây folder bằng một transaction phía server.
* Đảm bảo folder cha/con nhất quán.
* Client chỉ cần tập trung vào parse folder và upload file.
* Dễ rollback nếu tạo cây folder lỗi.
* Dễ kiểm tra duplicate folderPath trong project.

Database hiện tại đã phù hợp với hướng này vì collection `folder` có `projectId`, `parentFolderId`, `folderName`, `folderPath`, `level`, `stats`; collection `asset` có `projectId`, `folderId`; còn `metadata` có các thông tin upload như `fileName`, `objectName`, `assetId`, `mimeType`, `fileSize`, `uploadId`, `status`, `processingStatus`. 

---

# 2. Luồng nghiệp vụ tổng thể

```txt
User
 |
 | chọn Upload Folder trong project
 v
UploadFolderButton
 |
 | đọc FileList + relativePath
 v
Build Folder Manifest
 |
 | POST api/folder/create-tree
 v
Server
 |
 | validate folder tree
 | tạo folder cha trước, folder con sau
 | lưu folder vào DB
 | trả mapping folderPath -> folderId
 v
Client
 |
 | build upload queue từ files + folderId
 v
Upload từng file tuần tự
 |
 | gọi uploadService.uploadFile(...)
 v
Upload API / Object Storage
 |
 | tạo asset + metadata
 v
Database
 |
 | asset gắn đúng projectId + folderId
 | metadata gắn đúng assetId + objectName
 v
UI refresh folder tree + asset list
```

---

# 3. Component cần implement

## 3.1 Component mới

Nên tạo component riêng:

```txt
UploadFolderButton.tsx
```

hoặc:

```txt
FolderUploadPanel.tsx
```

Không nên sửa trực tiếp `UploadButton.tsx` thành upload folder, vì component hiện tại đang phục vụ use case upload đơn file và đang quản lý state đơn file như `file`, `isUploading`, `progress`, `error`, `uploadedObjectName`. 

## 3.2 Vai trò của component mới

Component upload folder sẽ chịu trách nhiệm:

```txt
1. Cho user chọn folder.
2. Đọc danh sách file trong folder.
3. Parse relativePath để build cây thư mục.
4. Gọi API create-folder-tree.
5. Nhận mapping folderPath -> folderId.
6. Build upload queue.
7. Upload từng file bằng uploadService.uploadFile.
8. Hiển thị progress tổng folder và progress file hiện tại.
9. Hỗ trợ cancel/retry.
```

---

# 4. Client build folder manifest

## 4.1 Input folder

Component cần cho user chọn folder.

Sau khi user chọn folder, client lấy danh sách file và relative path của từng file.

Mỗi file cần parse ra:

```txt
fileName
fileSize
mimeType
relativePath
folderRelativePath
depth
```

Ví dụ:

```txt
CampaignA/video/raw/source.mp4
```

Parse thành:

```txt
fileName = source.mp4
relativePath = CampaignA/video/raw/source.mp4
folderRelativePath = CampaignA/video/raw
depth = 3
```

## 4.2 Build folders[]

Client duyệt từng file, lấy path folder cha của file, rồi sinh ra toàn bộ folder segment.

Ví dụ từ:

```txt
CampaignA/video/raw/source.mp4
```

Sinh ra:

```txt
CampaignA
CampaignA/video
CampaignA/video/raw
```

Sau đó đưa vào Map để chống trùng.

Kết quả cuối cùng là:

```txt
folderNodes[]
fileItems[]
totalBytes
totalFiles
totalFolders
```

---

# 5. Client gọi `create-folder-tree`

Sau khi build manifest, client gọi:

```txt
POST api/folder/create-tree
```

Nếu API thành công, client nhận:

```txt
folderMappings[]
```

Client cần chuyển response thành Map:

```txt
folderPathToFolderId
```

Ví dụ:

```txt
CampaignA -> f001
CampaignA/video -> f002
CampaignA/video/raw -> f003
```

Lưu ý: client nên map bằng `relativeFolderPath` hoặc `clientFolderKey`, không nên tự đoán `folderId`.

---

# 6. Build upload queue sau khi có folderId

Sau khi `create-folder-tree` thành công, client mới build queue upload asset.

Mỗi file item trong queue cần có:

```txt
clientFileId
file
fileName
relativePath
folderRelativePath
folderId
projectId
depth
size
mimeType
mediaType
status
errorMessage
objectName
assetId
metadataId
```

Mapping:

```txt
folderId = folderPathToFolderId[folderRelativePath]
```

Nếu không tìm thấy `folderId`, file không được upload và phải báo lỗi prepare.

---

# 7. Thứ tự upload file

Yêu cầu của bạn là:

```txt
Upload lần lượt từng file, ưu tiên file tại thư mục cha trước.
```

Do đó queue cần sort theo:

```txt
1. depth ASC
2. folderRelativePath ASC
3. fileName ASC
```

Ví dụ thứ tự đúng:

```txt
CampaignA/banner.png
CampaignA/design/hero.psd
CampaignA/video/intro.mp4
CampaignA/video/raw/source.mp4
```

upload tuần tự từng file, không upload song song nhiều file 1 lúc. vì `uploadService` hiện tại vẫn có thể multipart upload theo chunk và dùng adaptive threading bên trong một file; đồng thời  `uploadService` hiện có state nội bộ như `abortController`, `uploadedBytes`, `semaphore`, `partUrls`, `completedParts`, nên upload tuần tự từng file là hướng an toàn. 

---

# 8. Upload từng file: Quy trình 3 bước

`uploadService.uploadFile` **không thay đổi** — nó chỉ upload binary lên object storage và trả về `objectName`. Asset/metadata được tạo bằng các API có sẵn trong `AssetController`.

Mỗi file trong queue được xử lý tuần tự theo 3 bước:

## 8.1 Bước 1 — Tạo Asset

```txt
POST api/asset/create-new
```

Request:

```txt
assetName  = fileName
projectId  = projectId hiện tại
folderId   = folderId lấy từ folderPathToFolderId
ownerId    = currentUser.id
ownerEmail = currentUser.email
```

Response trả về `assetId`. Lưu `assetId` vào file item trong queue.

## 8.2 Bước 2 — Upload binary file

```txt
uploadService.uploadFile(file, { ownerId, timeToLive })
```

`uploadService` được dùng nguyên bản, không sửa. Nó xử lý:
- File nhỏ (< 5MB): direct upload.
- File lớn: multipart upload với adaptive chunking.

Response trả về `objectName`. Lưu `objectName` vào file item trong queue.

## 8.3 Bước 3 — Tạo Version (Metadata)

```txt
POST api/asset/version/create-new
```

Request:

```txt
assetId     = assetId từ bước 1
objectName  = objectName từ bước 2
fileName    = tên file gốc
mimeType    = loại file
fileSize    = kích thước file
mediaType   = VIDEO / IMAGE / DESIGN
ownerId     = currentUser.id
ownerEmail  = currentUser.email
timeToLive  = giá trị mặc định
```

Server tạo `MetadataEntity` với `assetId` và `objectName`, kết nối đúng asset trong đúng folder.

## 8.4 Xử lý lỗi từng bước

```txt
Bước 1 lỗi → đánh dấu file FAILED, bỏ qua bước 2 và 3, tiếp tục file tiếp theo
Bước 2 lỗi → đánh dấu file FAILED (asset đã tạo sẽ orphan tạm thời)
Bước 3 lỗi → đánh dấu file FAILED (objectName đã upload nhưng chưa link vào asset)
```

Retry sẽ thực hiện lại cả 3 bước cho file FAILED.

## 8.5 Cập nhật trace file sau khi file upload thành công

Chỉ sau khi bước 3 (`create-version`) thành công mới cập nhật trace file:

```txt
Bước 1 (create-asset) OK
  ↓
Bước 2 (upload binary) OK
  ↓
Bước 3 (create-version) OK
  ↓
Ghi thêm entry vào trace file:
  {
    relativePath,
    assetId,
    fileId (metadataId),
    objectName,
    folderId
  }
```

Nếu một trong 3 bước chưa hoàn thành thì không được ghi vào trace file.

---

# 9. Cách tạo asset và metadata — tóm tắt luồng đầy đủ

Luồng hoàn chỉnh cho từng file:

```txt
Client
  |
  | 1. POST api/asset/create-new
  |    { assetName, projectId, folderId, ownerId }
  v
Server → tạo AssetEntity → trả assetId
  |
  | 2. uploadService.uploadFile(file, { ownerId, timeToLive })
  |    upload binary → initiate → upload chunks → complete
  v
Object Storage + Server → trả objectName
  |
  | 3. POST api/asset/version/create-new
  |    { assetId, objectName, fileName, mimeType, fileSize, mediaType }
  v
Server → tạo MetadataEntity (status=COMPLETED) → trả fileId
```

Với file video cần xử lý sau upload:

```txt
processingStatus = PENDING (server tự set khi nhận media type = VIDEO)
```

Collection `asset` đã có `projectId` và `folderId`; `metadata` đã có `assetId`, `objectName`, `status`, `processingStatus` — không cần thay đổi schema.

---

# 10. State cần có trong `UploadFolderButton`

## 10.1 State chọn folder

```txt
selectedRootFolderName
selectedFiles
folderNodes
fileItems
totalBytes
```

## 10.2 State tạo folder tree

```txt
isCreatingFolderTree
createTreeProgress
folderTreeCreated
folderTreeError
folderMappings
folderPathToFolderId
```

Trong đó quan trọng nhất:

```txt
folderPathToFolderId
```

## 10.3 State upload file

```txt
isUploadingFiles
uploadQueue
currentFileIndex
currentFile
currentFileProgress
overallProgress
uploadedFileCount
failedFileCount
uploadErrors
```

`currentFileProgress` có thể dùng lại `UploadProgress` từ `uploadService`, vì service hiện đã trả các thông tin như percentage, uploadedBytes, totalBytes, throughputMbps, estimatedTimeRemainingMs, currentChunkSize. 

---

# 11. Các bước implement chi tiết

## Phase 1 — Tạo parser cho folder upload

Tạo utility:

```txt
folderUploadParser
```

Nhiệm vụ:

```txt
Input:
- FileList

Output:
- rootFolderName
- folderNodes
- fileItems
- totalFiles
- totalFolders
- totalBytes
```

Parser chỉ xử lý dữ liệu local, không gọi API.

---

## Phase 2 — Tạo API resource cho folder tree

Tạo resource phía client:

```txt
folderApiResource.createFolderTree(...)
```

Nhiệm vụ:

```txt
Gọi POST api/folder/create-tree
Nhận folderMappings[]
Build folderPathToFolderId Map
Trả về Map cho folderUploadService
```

---

## Phase 3 — Tạo service orchestration

Tạo service mới:

```txt
folderUploadService
```

Nhiệm vụ:

```txt
1. parse folder files
2. createFolderTree
3. buildUploadQueue
4. uploadFilesSequentially
5. cancel
6. retryFailedFiles
```

Service này được phép gọi:

```txt
folderApiResource.createFolderTree   → POST api/folder/create-tree
assetApiResource.createAsset         → POST api/asset/create-new
uploadService.uploadFile             → upload binary (không thay đổi)
assetApiResource.createVersion       → POST api/asset/version/create-new
```

Không nên nhét orchestration upload folder vào `uploadService`, vì `uploadService` hiện đang làm tốt vai trò upload một file. 

---

## Phase 4 — Tạo component `UploadFolderButton`

Component nhận props:

```txt
projectId
currentParentFolderId
currentBaseFolderPath
currentUser
onCompleted
onFolderTreeCreated
onAssetUploaded
```

Ý nghĩa:

| Prop                    | Mục đích                           |
| ----------------------- | ---------------------------------- |
| `projectId`             | Project hiện tại                   |
| `currentParentFolderId` | Folder hiện tại user đang đứng     |
| `currentBaseFolderPath` | Path hiện tại                      |
| `currentUser`           | User upload                        |
| `onCompleted`           | Refresh UI sau khi xong            |
| `onFolderTreeCreated`   | Refresh folder tree sớm            |
| `onAssetUploaded`       | Cập nhật danh sách asset từng file |

---

# 12. UI cần hiển thị

## 12.1 Sau khi chọn folder

```txt
Selected folder: CampaignA
Folders: 12
Files: 80
Total size: 4.7 GB

[Preview tree]
[Start Upload]
```

## 12.2 Khi đang tạo folder tree

```txt
Creating folder tree...
Folders: 12
Status: Preparing database structure
```

Vì API `create-folder-tree` xử lý một lần, UI không nhất thiết có progress từng folder, chỉ cần trạng thái:

```txt
PREPARING_FOLDER_TREE
```

## 12.3 Khi bắt đầu upload file

```txt
Folder tree created successfully
Uploading files...
Current file: CampaignA/video/raw/source.mp4
File: 3 / 80
```

## 12.4 Progress nên có 2 lớp

### Progress tổng folder

```txt
Files uploaded: 12 / 80
Total uploaded: 1.2 GB / 4.7 GB
Overall progress: 25%
```

### Progress file hiện tại

Dùng lại kiểu hiển thị của `UploadButton`:

```txt
Current file progress
Chunk: 3 / 12
Uploaded: 90 MB / 320 MB
Speed: 18.2 Mbps
ETA: 45s
```

`UploadButton` hiện đã có UI cho progress, speed, chunk size, ETA và trạng thái lỗi/thành công, nên có thể lấy lại mô hình hiển thị này cho file hiện tại trong component upload folder. 

---

# 13. Trạng thái nghiệp vụ

## 13.1 Trạng thái tổng upload folder

```txt
IDLE
PARSING_FOLDER
READY_TO_CREATE_TREE
CREATING_FOLDER_TREE
FOLDER_TREE_CREATED
UPLOADING_FILES
COMPLETED
PARTIAL_FAILED
FAILED
CANCELLED
```

## 13.2 Trạng thái từng file

```txt
PENDING
UPLOADING
COMPLETED
FAILED
CANCELLED
SKIPPED
```

## 13.3 Trạng thái metadata phía server

Dùng theo thiết kế hiện tại:

```txt
UPLOADING
COMPLETED
FAILED
```

Với video/image cần xử lý sau upload:

```txt
PENDING
PROCESSING
READY
FAILED
```

Các trạng thái này đã phù hợp với collection `metadata` hiện tại. 

---

# 14. Cancel flow

## 14.1 Cancel trước khi tạo folder tree

```txt
Client reset state
Không gọi API
Xoá trace file nếu đã tạo
Không có dữ liệu nào được tạo trên server
```

## 14.2 Cancel khi đang gọi `create-folder-tree`

Việc cancel API `create-folder-tree` phụ thuộc vào trạng thái server:

```txt
1. Request chưa tới server: client abort, không có dữ liệu nào được tạo.
2. Server đang xử lý (transaction chưa commit): ROLLBACK tự động, không có folder nào được tạo.
3. Server đã commit: folder tree đã tồn tại trong DB.
```

Trong trường hợp 3, client cần rollback folder tree bằng cách gọi:

```txt
DELETE api/folder/delete/{folderId}
  → lần lượt từng folder trong folderMappings[]
  → ưu tiên xóa folder con trước (level DESC)
```

## 14.3 Cancel khi đang upload file — Rollback toàn bộ

Khi user bấm cancel trong giai đoạn upload, **phải rollback toàn bộ**, bao gồm cả những file đã upload thành công trước đó.

### Bước 1 — Dừng upload hiện tại

```txt
goi uploadService.cancelUpload()
  → abort multipart upload đang chạy
  → server sẽ hủy các part chưa complete trên MinIO
```

### Bước 2 — Xóa metadata (version) của các file đã upload thành công

```txt
For each file in uploadedFiles[]:
  POST api/asset/version/delete/{fileId}
    → server xóa MetadataEntity khỏi DB
    → server xóa object khỏi MinIO (objectName)
```

### Bước 3 — Xóa asset của các file đã upload thành công

```txt
For each file in uploadedFiles[]:
  POST api/asset/delete/{assetId}
    → server xóa AssetEntity khỏi DB
```

### Bước 4 — Xóa folder tree đã tạo

```txt
For each folder in folderMappings[] (level DESC — xóa folder con trước):
  DELETE api/folder/delete/{folderId}
    → server xóa FolderEntity khỏi DB
```

### Bước 5 — Xóa trace file local

```txt
Xóa file .upload-trace.json trong folder người dùng đang upload
```

### Danh sách file đã upload (để rollback)

Client lấy danh sách từ:

```txt
uploadedFiles[] — mảng trong state, được đằy vào sau mỗi file COMPLETED
```

Mỗi entry trong `uploadedFiles[]` chứa:

```txt
relativePath
assetId
fileId (metadataId)
objectName
folderId
```

### Lưu ý về rollback

```txt
- Rollback tuần tự, không song song.
- Nếu một bước rollback lỗi, vẫn tiếp tục rollback các item còn lại.
- Ghi log các item rollback thất bại để user có thể manual cleanup.
- Hiển thị dialog xác nhận trước khi rollback (vì thao tác không hoàn tác được).
```

---

# 15. Resume flow với trace file local

Khi upload folder bị ngắt giữa chừng (mất điện, đóng tab, crash), client có thể tiếp tục từ điểm dừng nhờ trace file lưu cứng tại máy người dùng.

## 15.1 Trace file là gì

Trace file được lưu ngay trong folder mà người dùng chọn để upload:

```txt
<folderUserĐãChọn>/.upload-trace.json
```

Ví dụ:

```txt
CampaignA/.upload-trace.json
```

## 15.2 Cấu trúc trace file

```json
{
  "sessionId": "uuid-đả-tạo-khi-create-folder-tree",
  "projectId": "proj-001",
  "rootFolderName": "CampaignA",
  "localFolderPath": "/Users/nam/Desktop/CampaignA",
  "parentFolderId": "folder-id-hiện-tại",
  "baseFolderPath": "Assets/2026",
  "folderTreeCreated": true,
  "folderMappings": [
    {
      "clientFolderKey": "CampaignA",
      "folderId": "f001",
      "relativeFolderPath": "CampaignA"
    }
  ],
  "totalFiles": 80,
  "uploadedFiles": [
    {
      "relativePath": "CampaignA/banner.png",
      "assetId": "asset-001",
      "fileId": "meta-001",
      "objectName": "uuid_banner.png",
      "folderId": "f001"
    }
  ],
  "createdAt": "2026-05-09T10:30:00Z",
  "updatedAt": "2026-05-09T10:45:00Z"
}
```

## 15.3 Quy tắc ghi trace file

```txt
Trace file được TẠO sau khi create-folder-tree thành công.
Trace file được CẬP NHẬT sau khi một file hoàn thành đủ 3 bước (create-asset, upload-binary, create-version).
Trace file được XÓA sau khi:
  - Toàn bộ file upload thành công (COMPLETED).
  - Hoặc user chủ động cancel và rollback xong.
```

**Không bao giờ** ghi vào trace file nếu file chưa hoàn thành bước 3.

## 15.4 Cách viết trace file từ browser

Browser không thể ghi file trực tiếp vào đường dẫn hệ thống. Phương án khả thi:

```txt
Dùng File System Access API (trình duyệt hỗ trợ Chromium-based).

User chọn folder bằng:
  window.showDirectoryPicker()
    → nhận FileSystemDirectoryHandle

Client tạo/ghi file:
  dirHandle.getFileHandle('.upload-trace.json', { create: true })
    → FileSystemFileHandle
  fileHandle.createWritable()
    → ghi JSON vào file
```

File System Access API cho phép đọc/ghi file trực tiếp vào thư mục mà user đã cấp quyền, không cần backend.

> **Lưu ý**: Với `<input type="file" webkitdirectory>` truyền thống, browser chỉ cho đọc file chứ không ghi được. Cần switch sang `showDirectoryPicker()` để hỗ trợ trace file.

## 15.5 Luồng resume khi mở lại

```txt
User mở lại trang / component upload
  |
  | User chọn folder (showDirectoryPicker)
  v
Client kiểm tra tồn tại .upload-trace.json trong folder
  |
  Nếu có trace file:
    → Đọc trace file
    → Hiển thị dialog: "Tìm thấy phiên upload dở. Tiếp tục?"
    → Nếu user đồng ý:
        - Nạp lại folderMappings, uploadedFiles từ trace file
        - Build lại upload queue, bỏ qua file có trong uploadedFiles[]
        - Tiếp tục upload từ file chưa upload
    → Nếu user từ chối:
        - Xóa trace file
        - Bắt đầu lại từ đầu
  |
  Nếu không có trace file:
    → Upload mới hoàn toàn
```

## 15.6 Xác định file đã upload khi resume

Client so sánh `relativePath` của từng file trong FileList với `uploadedFiles[].relativePath` trong trace file:

```txt
Nếu relativePath có trong uploadedFiles[] → bỏ qua (COMPLETED)
Nếu relativePath không có → thêm vào queue upload
```

Không cần gọi lại `create-folder-tree` vì `folderMappings` đã có trong trace file.

## 15.7 Trường hợp resume thất bại

Nếu trace file bị hỏng hoặc thiếu dữ liệu:

```txt
Xóa trace file
Bắt đầu lại từ đầu
Các file đã upload trước đó vẫn còn trong DB (không bị xóa tự động).
```

---

# 16. Edge cases cần xử lý

## 16.1 Folder đã tồn tại

Nếu user upload folder có path đã tồn tại trong project:

```txt
Server trả folderId hiện có
status = EXISTING
```

Không nên coi đây là lỗi.

## 16.2 File trùng relativePath

Client cần validate trước khi gọi `create-folder-tree`:

```txt
Không cho 2 file cùng relativePath trong một lần upload.
```

## 16.3 Empty folder

Với input file thông thường, browser thường chỉ trả về file, không trả về folder rỗng.

Version đầu nên quy định:

```txt
Chỉ tạo các folder có chứa file hoặc có folder con chứa file.
Folder rỗng không được upload.
```

Nếu muốn upload cả folder rỗng, cần dùng thêm API đọc directory entries khi drag/drop folder.

## 16.4 User đang đứng trong folder con

Nếu user đang đứng ở:

```txt
ProjectA / Assets / 2026
```

và upload folder:

```txt
CampaignA
```

thì server phải tạo path thật:

```txt
Assets/2026/CampaignA
```

Không phải:

```txt
CampaignA
```

Do đó request `create-folder-tree` cần có:

```txt
parentFolderId
baseFolderPath
```

---

# 17. Các trường bắt buộc cần lưu

## 17.1 Collection `folder`

Bắt buộc:

```txt
folderId
projectId
parentFolderId
folderName
folderPath
level
isActive
createdBy
createdAt
updatedAt
stats.assetCount
stats.subfoldersCount
```

## 17.2 Collection `asset`

Bắt buộc:

```txt
assetId
assetName
projectId
folderId
ownerId
ownerEmail
versionCount
assetStatus
createdAt
updatedAt
```

## 17.3 Collection `metadata`

Bắt buộc:

```txt
fileId
fileName
objectName
assetId
downloadFileName
versionNumber
mediaType
mimeType
fileSize
uploadId
status
processingStatus
ownerId
ownerEmail
timeToLive
isActive
isTrash
createdAt
updatedAt
```

---

# 18. Sơ đồ pipeline cuối cùng

```txt
Browser / UploadFolderButton
 |
 | 1. User chọn folder
 v
FileList + relativePath
 |
 | 2. Parse folder tree (folderUploadParser)
 v
Folder Manifest (folderNodes[], fileItems[])
 |
 | 3. POST api/folder/create-tree
 |    { projectId, parentFolderId, baseFolderPath, rootFolderName, folders[] }
 v
Backend FolderService
 |
 | validate project permission
 | validate tree
 | normalize folderPath
 | create folders
 v
MongoDB - folder collection
 |
 | 4. Return folderMappings[]
 v
Client folderPathToFolderId Map
 |
 | 5. Build upload queue (sort depth ASC)
 v
Upload Queue (tuần tự từng file)
 |
 | [Mỗi file — 3 bước]
 |
 | 5a. POST api/asset/create-new
 |     { assetName, projectId, folderId, ownerId }
 |     → nhận assetId
 |
 | 5b. uploadService.uploadFile(file, { ownerId, timeToLive })
 |     initiate → upload chunks → complete
 |     → nhận objectName
 |
 | 5c. POST api/asset/version/create-new
 |     { assetId, objectName, fileName, mimeType, fileSize, mediaType }
 |     → nhận fileId (metadata)
 v
MongoDB - asset + metadata collection
 |
 | 6. onAssetUploaded() → refresh asset list
 | 7. onCompleted()    → refresh folder tree
 v
UI hiển thị folder + media đúng cây thư mục
```

