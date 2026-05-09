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
 | POST /projects/{projectId}/folders/create-tree
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

# 4. API mới: `create-folder-tree`

## 4.1 Endpoint

```txt
POST /api/folder/create-tree
```

## 4.2 Mục đích API

API này nhận toàn bộ cây thư mục từ client và tạo các bản ghi trong collection `folder`.

API này **không upload file** và **không tạo asset**.

Nhiệm vụ duy nhất:

```txt
Tạo folder tree trong project và trả về folderId mapping.
```

---

# 5. Request của API `create-folder-tree`

## 5.1 Request cần có

```txt
projectId
parentFolderId
baseFolderPath
rootFolderName
folders[]
createdBy
```

Trong đó:

| Field                   | Bắt buộc | Ý nghĩa                                                               |
| ----------------------- | -------: | --------------------------------------------------------------------- |
| `projectId`             |       Có | Project mà folder được upload vào                                     |
| `parentFolderId`        |    Không | Folder hiện tại mà user đang đứng; `null` nếu upload vào root project |
| `baseFolderPath`        |    Không | Path của folder hiện tại trong project                                |
| `rootFolderName`        |       Có | Tên folder gốc user chọn                                              |
| `folders[]`             |       Có | Danh sách folder đã parse từ client                                   |
| `createdBy`             |       Có | User tạo folder                                                       |

---

## 5.2 Mỗi item trong `folders[]`

Mỗi folder node client gửi lên nên có:

```txt
clientFolderKey
folderName
relativeFolderPath
parentRelativeFolderPath
level
```

Ý nghĩa:

| Field                      | Ví dụ                 | Ý nghĩa                           |
| -------------------------- | --------------------- | --------------------------------- |
| `clientFolderKey`          | `CampaignA/video/raw` | Key tạm phía client               |
| `folderName`               | `raw`                 | Tên folder                        |
| `relativeFolderPath`       | `CampaignA/video/raw` | Path tính từ folder user chọn     |
| `parentRelativeFolderPath` | `CampaignA/video`     | Path cha tính từ folder user chọn |
| `level`                    | `3`                   | Cấp folder trong cây upload       |

Ví dụ user upload folder:

```txt
CampaignA/
  banner.png
  video/
    intro.mp4
    raw/
      source.mp4
```

Client gửi folder manifest:

```txt
folders:
- CampaignA
- CampaignA/video
- CampaignA/video/raw
```

---

# 6. Response của API `create-folder-tree`

## 6.1 Response cần trả về

API cần trả về mapping đủ để client upload file vào đúng folder:

```txt
folderUploadSessionId
projectId
rootFolderId
createdFolders[]
existingFolders[]
folderMappings[]
```

Trong đó 
* `folderMappings[]` là quan trọng nhất.
* `folderUploadSessionId` là id của một session upload để client lưu lại phục vụ resume upload, được tạo bằng cách lấy đường dẫn tuyệt đối của folder user chọn cộng với chuỗi uuid ngẫu nhiên đằng sau.

Mỗi item trong `folderMappings[]`:

```txt
clientFolderKey
relativeFolderPath
folderPath
folderId
parentFolderId
status
```

Ý nghĩa:

| Field                | Ý nghĩa                         |
| -------------------- | ------------------------------- |
| `clientFolderKey`    | Key client dùng để map lại file |
| `relativeFolderPath` | Path tính từ folder user chọn   |
| `folderPath`         | Path thật được lưu trong DB     |
| `folderId`           | Id folder trong database        |
| `parentFolderId`     | Id folder cha                   |
| `status`             | `CREATED` hoặc `EXISTING`       |

Ví dụ response:

```txt
folderMappings:
- clientFolderKey: CampaignA
  folderPath: CampaignA
  folderId: f001
  status: CREATED

- clientFolderKey: CampaignA/video
  folderPath: CampaignA/video
  folderId: f002
  status: CREATED

- clientFolderKey: CampaignA/video/raw
  folderPath: CampaignA/video/raw
  folderId: f003
  status: CREATED
```

---

# 7. Xử lý phía server cho `create-folder-tree`

## 7.1 Server validate request

Server cần validate:

```txt
1. projectId tồn tại.
2. User có quyền MODIFY/PRODUCER trong project.
3. folders[] không rỗng.
4. Không có relativeFolderPath duplicate.
5. Không có path chứa ký tự nguy hiểm.
6. Không có path traversal như ../
7. Folder cha phải tồn tại trong manifest hoặc là parentFolderId truyền vào.
8. level phải khớp với số segment của path.
```

## 7.2 Server normalize path

Server không nên tin hoàn toàn vào `folderPath` client gửi.

Server nên tự tính `folderPath` thật bằng:

```txt
folderPath = baseFolderPath + "/" + relativeFolderPath
```

Nếu upload vào root project:

```txt
folderPath = relativeFolderPath
```

Nếu user đang đứng trong folder:

```txt
baseFolderPath = Assets/2026
relativeFolderPath = CampaignA/video
folderPath = Assets/2026/CampaignA/video
```

## 7.3 Server tạo folder theo level

Server sort folders theo:

```txt
level ASC
folderPath ASC
```

Sau đó xử lý:

```txt
For each folderNode:
    Nếu parentRelativeFolderPath null:
        parentFolderId = request.parentFolderId
    Nếu có parentRelativeFolderPath:
        parentFolderId = createdFolderMap[parentRelativeFolderPath]

    Kiểm tra folderPath đã tồn tại trong project chưa.

    Nếu chưa tồn tại:
        insert folder

    Nếu đã tồn tại:
        dùng folderId hiện có

    Lưu mapping relativeFolderPath -> folderId
```

## 7.4 Transaction

Nên xử lý trong transaction:

```txt
BEGIN TRANSACTION

validate project
validate permission
validate folder tree
create folders
update project.stats.folderCount
update parent folder stats.subfoldersCount

COMMIT
```

Nếu lỗi:

```txt
ROLLBACK
```

Vì MongoDB có thể dùng transaction khi chạy replica set, nên nếu môi trường dev hiện tại chưa bật replica set thì version đầu có thể xử lý best-effort, nhưng thiết kế nghiệp vụ vẫn nên đặt theo transaction.

---

# 9. Client build folder manifest

## 9.1 Input folder

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

## 9.2 Build folders[]

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

# 10. Client gọi `create-folder-tree`

Sau khi build manifest, client gọi:

```txt
POST /projects/{projectId}/folders/create-tree
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

# 11. Build upload queue sau khi có folderId

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

# 12. Thứ tự upload file

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

# 13. Điều chỉnh `uploadService.uploadFile`

Hiện tại `uploadFile` chỉ nhận metadata:

```txt
ownerId
timeToLive
compressionAlgo
```

Để upload folder hoạt động đúng, cần mở rộng metadata truyền vào upload file.

## 13.1 Metadata cần truyền thêm

```txt
projectId
folderId
folderUploadSessionId
relativePath
folderPath
uploadSource
assetName
mediaType
mimeType
fileSize
```

Ý nghĩa:

| Field                   | Bắt buộc | Mục đích                           |
| ----------------------- | -------: | ---------------------------------- |
| `projectId`             |       Có | Asset thuộc project nào            |
| `folderId`              |       Có | Asset nằm trong folder nào         |
| `folderUploadSessionId` |   Nên có | Gom nhóm một lần upload folder     |
| `relativePath`          |       Có | Path file trong folder user chọn   |
| `folderPath`            |       Có | Path folder thật trong DB          |
| `uploadSource`          |       Có | `SINGLE_FILE` hoặc `FOLDER_UPLOAD` |
| `assetName`             |       Có | Tên asset ban đầu                  |
| `mediaType`             |       Có | `VIDEO`, `IMAGE`, `DESIGN`         |
| `mimeType`              |       Có | Loại file                          |
| `fileSize`              |       Có | Validate và hiển thị               |

---

# 14. Cách tạo asset và metadata

Sau khi có `folderId`, mỗi file upload cần tạo asset/metadata đúng chỗ.

## 14.1 Phương án khuyên dùng

Nên để API upload file hoặc API initiate upload tạo asset + metadata ở trạng thái ban đầu.

Luồng cho từng file:

```txt
Client gọi uploadService.uploadFile(file, metadata)
  ↓
Server initiate upload
  ↓
Server tạo asset với projectId + folderId
  ↓
Server tạo metadata với status = UPLOADING
  ↓
Client upload binary/chunk
  ↓
Server complete upload
  ↓
Server update metadata.status = COMPLETED
```

Với file lỗi:

```txt
metadata.status = FAILED
```

Với file video cần xử lý thêm:

```txt
processingStatus = PENDING
```

Collection `metadata` hiện đã có `status`, `processingStatus`, `uploadId`, `objectName`, `fileSize`, `mimeType`, còn collection `asset` đã có `projectId` và `folderId`, nên rất phù hợp với luồng này. 

---

# 15. State cần có trong `UploadFolderButton`

## 15.1 State chọn folder

```txt
selectedRootFolderName
selectedFiles
folderNodes
fileItems
totalBytes
```

## 15.2 State tạo folder tree

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

## 15.3 State upload file

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

# 16. Các bước implement chi tiết

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
Gọi POST /projects/{projectId}/folders/create-tree
Nhận folderMappings
Trả về mapping cho service
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
folderApiResource.createFolderTree
uploadService.uploadFile
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

# 17. UI cần hiển thị

## 17.1 Sau khi chọn folder

```txt
Selected folder: CampaignA
Folders: 12
Files: 80
Total size: 4.7 GB

[Preview tree]
[Start Upload]
```

## 17.2 Khi đang tạo folder tree

```txt
Creating folder tree...
Folders: 12
Status: Preparing database structure
```

Vì API `create-folder-tree` xử lý một lần, UI không nhất thiết có progress từng folder, chỉ cần trạng thái:

```txt
PREPARING_FOLDER_TREE
```

## 17.3 Khi bắt đầu upload file

```txt
Folder tree created successfully
Uploading files...
Current file: CampaignA/video/raw/source.mp4
File: 3 / 80
```

## 17.4 Progress nên có 2 lớp

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

# 18. Trạng thái nghiệp vụ

## 18.1 Trạng thái tổng upload folder

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

## 18.2 Trạng thái từng file

```txt
PENDING
UPLOADING
COMPLETED
FAILED
CANCELLED
SKIPPED
```

## 18.3 Trạng thái metadata phía server

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

# 19. Cancel flow

## 19.1 Cancel trước khi tạo folder tree

```txt
Client reset state
Không gọi API
Không có dữ liệu nào được tạo
```

## 19.2 Cancel khi đang gọi `create-folder-tree`

Vì đây là một API tạo cây folder, nếu request đã tới server thì nên để server xử lý transaction.

Có 2 khả năng:

```txt
1. Request chưa hoàn tất: client abort request.
2. Request đã hoàn tất phía server: folder tree có thể đã được tạo.
```

Nếu server dùng transaction, kết quả sẽ rõ ràng:

```txt
Tạo thành công toàn bộ hoặc không tạo gì.
```

## 19.3 Cancel khi đang upload file

```txt
1. Gọi uploadService.cancelUpload()
2. Dừng upload file hiện tại
3. Dừng queue
4. File đã upload thành công giữ COMPLETED
5. File hiện tại chuyển CANCELLED hoặc FAILED
6. File chưa upload giữ PENDING
```

`uploadService` hiện đã có `cancelUpload()` dựa trên `AbortController`, nên component upload folder có thể gọi lại trực tiếp. 

---

# 20. Retry flow

## 20.1 Retry sau khi tạo folder tree lỗi

Nếu `create-folder-tree` lỗi:

```txt
User bấm Retry Create Folder Tree
Client gửi lại cùng manifest
Server xử lý idempotent theo projectId + folderPath
```

Điều kiện quan trọng:

```txt
create-folder-tree nên idempotent
```

Tức là folder đã tồn tại thì trả về `status = EXISTING`, không báo lỗi cứng.

## 20.2 Retry file upload lỗi

Nếu một số file upload lỗi:

```txt
Retry failed files
```

Client không gọi lại `create-folder-tree`.

Chỉ cần dùng lại:

```txt
folderPathToFolderId
```

và upload lại các file có status `FAILED`.

---

# 21. Edge cases cần xử lý

## 21.1 Folder đã tồn tại

Nếu user upload folder có path đã tồn tại trong project:

```txt
Server trả folderId hiện có
status = EXISTING
```

Không nên coi đây là lỗi.

## 21.2 File trùng relativePath

Client cần validate trước khi gọi `create-folder-tree`:

```txt
Không cho 2 file cùng relativePath trong một lần upload.
```

## 21.3 Empty folder

Với input file thông thường, browser thường chỉ trả về file, không trả về folder rỗng.

Version đầu nên quy định:

```txt
Chỉ tạo các folder có chứa file hoặc có folder con chứa file.
Folder rỗng không được upload.
```

Nếu muốn upload cả folder rỗng, cần dùng thêm API đọc directory entries khi drag/drop folder.

## 21.4 User đang đứng trong folder con

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

# 22. Các trường bắt buộc cần lưu

## 22.1 Collection `folder`

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

## 22.2 Collection `asset`

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

## 22.3 Collection `metadata`

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

## 22.4 Nên bổ sung cho upload folder

Nên bổ sung vào `metadata` hoặc `asset`:

```txt
relativePath
folderPath
uploadSource
folderUploadSessionId
```

Trong đó:

| Field                   | Mục đích                                           |
| ----------------------- | -------------------------------------------------- |
| `relativePath`          | Biết file gốc nằm ở đâu trong folder user chọn     |
| `folderPath`            | Debug và query nhanh                               |
| `uploadSource`          | Phân biệt `SINGLE_FILE` và `FOLDER_UPLOAD`         |
| `folderUploadSessionId` | Gom nhóm các file trong cùng một lần upload folder |

---

# 23. Sơ đồ pipeline cuối cùng

```txt
Browser / UploadFolderButton
 |
 | 1. User chọn folder
 v
FileList + relativePath
 |
 | 2. Parse folder tree
 v
Folder Manifest
 |
 | 3. POST /projects/{projectId}/folders/create-tree
 v
Backend Folder Service
 |
 | validate project permission
 | validate tree
 | normalize folderPath
 | transaction create folders
 v
MongoDB - folder collection
 |
 | 4. Return folderMappings
 v
Client folderPathToFolderId Map
 |
 | 5. Build upload queue
 v
Upload Queue
 |
 | sort depth ASC
 | upload từng file tuần tự
 v
uploadService.uploadFile
 |
 | initiate upload
 | upload chunks/direct file
 | complete upload
 v
Object Storage + Backend Upload API
 |
 | create/update asset
 | create/update metadata
 v
MongoDB - asset + metadata
 |
 | 6. Refresh project tree and asset list
 v
UI hiển thị folder + media đúng cây thư mục
```

