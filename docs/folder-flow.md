# Luồng nghiệp vụ Folder API

## Phạm vi
- Base path: `/api/folder`
- Đối tượng chính: `FolderEntity` (thư mục), gắn với `ProjectEntity`
- Các thao tác ghi (create/update/delete) đều chạy trong transaction

## Quy tắc chung
- Dự án không được chỉnh sửa nếu trạng thái là `ARCHIVED` hoặc `COMPLETED`.
- Quyền dự án:
   - Admin/SA luôn được phép.
   - Chủ dự án (`OWNER` - vai trò dự án) luôn được phép.
   - Quyền sửa (modify) yêu cầu vai trò `OWNER` hoặc `PRODUCER`.
   - Quyền đọc (read) yêu cầu người dùng có vai trò trong dự án.
- Quyền thư mục (FileAppPermission):
   - Mức quyền: `PUBLIC` < `READ` < `COMMENT` < `MODIFY` < `OWNER`.
   - Nếu thư mục có `permissions`, hệ thống tìm quyền theo `userId` và so sánh mức theo FileAppPermission.
   - Nếu không có `permissions`, quyền thư mục kế thừa theo quyền dự án (read/modify).
- Xóa thư mục là xóa mềm: đặt `isActive = false` cho thư mục và toàn bộ con, đồng thời tắt `isActive` của asset trong các thư mục đó.
- Ghi audit log: `CREATE`, `UPDATE`, `PERMISSION_CHANGE`, `DELETE`.

## Endpoint: POST /api/folder/create-new
### Mục đích
Tạo mới một thư mục đơn lẻ trong dự án.

### Input
`FolderCreateRequestDTO`
- `projectId` (bắt buộc)
- `parentFolderId` (không bắt buộc)
- `folderName` (bắt buộc)
- `description` (không bắt buộc)

### Luồng xử lý
1. Validate body, bắt buộc `projectId` và `folderName`.
2. Lấy dự án theo `projectId`; dự án phải tồn tại và đang active.
3. Kiểm tra dự án có trạng thái cho phép chỉnh sửa.
4. Xác định thư mục cha:
   - Có `parentFolderId`: lấy thư mục cha active, kiểm tra thuộc dự án, và có quyền `MODIFY` (FileAppPermission) trên thư mục cha.
   - Không có `parentFolderId`: yêu cầu quyền `MODIFY` ở cấp dự án.
5. Kiểm tra tên thư mục không trùng trong cùng `projectId` + `parentFolderId`.
6. Tạo `folderPath` (ghép từ thư mục cha và `folderName`) và `level`.
7. Tạo `FolderEntity` với `FolderStats` mặc định (asset/subfolder/pending = 0).
8. Lưu thư mục, cập nhật thống kê dự án (+1 folder) và thư mục cha (+1 subfolder nếu có).
9. Ghi audit log `CREATE` và trả về thư mục đã tạo.

### Lỗi chính
- `BAD_REQUEST`: thiếu body, thiếu `projectId`/`folderName`.
- `PROJECT_NOT_FOUND`: dự án không tồn tại hoặc inactive.
- `FOLDER_NOT_FOUND`: thư mục cha không tồn tại hoặc inactive.
- `FILE_PERMISSION_ERROR`: không đủ quyền.
- `FOLDER_ALREADY_EXISTS`: trùng tên trong cùng cấp.

## Endpoint: POST /api/folder/create-tree
### Mục đích
Tạo cây thư mục hàng loạt, hỗ trợ vừa tạo mới vừa ánh xạ thư mục đã tồn tại.

### Input
`FolderTreeCreateRequestDTO`
- `projectId` (bắt buộc)
- `parentFolderId` (không bắt buộc)
- `baseFolderPath` (không bắt buộc)
- `rootFolderName` (bắt buộc)
- `folders`: danh sách `FolderTreeNodeDTO`
  - `clientFolderKey` (bắt buộc)
  - `folderName` (bắt buộc)
  - `relativeFolderPath` (bắt buộc)
  - `parentRelativeFolderPath` (không bắt buộc)
  - `level` (bắt buộc)

### Luồng xử lý
1. Validate body, bắt buộc `projectId`, `rootFolderName`, `folders` không rỗng.
2. Lấy dự án; dự án phải active và cho phép chỉnh sửa.
3. Yêu cầu quyền `MODIFY` (FileAppPermission) ở cấp dự án.
4. Nếu có `parentFolderId`: lấy thư mục cha active, kiểm tra thuộc dự án và có quyền `MODIFY` (FileAppPermission).
5. Chuẩn hóa `baseFolderPath`:
   - Nếu không có `parentFolderId` thì `baseFolderPath` phải rỗng.
   - Nếu có `parentFolderId` thì `baseFolderPath` phải đúng bằng path của thư mục cha.
6. Chuẩn hóa danh sách node:
   - Mỗi node không được null.
   - `clientFolderKey`, `folderName`, `relativeFolderPath` bắt buộc.
   - `relativeFolderPath` không được bắt đầu/kết thúc bằng `/`, không chứa `\`, không có segment rỗng, không chứa `.` hoặc `..`.
   - `level` phải khớp số lượng segment trong `relativeFolderPath`.
   - Segment cuối của `relativeFolderPath` phải đúng `folderName`.
   - `relativeFolderPath` phải duy nhất.
7. Mọi `parentRelativeFolderPath` (nếu có) phải tồn tại trong danh sách; nếu không sẽ lỗi `FOLDER_PARENT_NOT_FOUND`.
8. `rootFolderName` phải là một `relativeFolderPath` có trong danh sách.
9. Sắp xếp node theo `level` rồi theo `folderPath` để đảm bảo tạo cha trước con.
10. Duyệt từng node:
    - Xác định `parentId` dựa trên `parentRelativeFolderPath` hoặc `parentFolderId`.
    - Tạo `folderPath` = `baseFolderPath` + `relativeFolderPath`.
    - Nếu đã có thư mục cùng `projectId` + `folderPath`:
      - Kiểm tra quyền `MODIFY`.
      - Ghi mapping `EXISTING`.
    - Nếu chưa có:
      - Tạo mới thư mục, lưu, ghi mapping `CREATED`.
      - Tăng `subfoldersCount` của thư mục cha (nếu có) và ghi audit log `CREATE`.
11. Nếu có thư mục mới, tăng `folderCount` của dự án.
12. Trả về `FolderTreeCreateResponseDTO` gồm:
    - `folderUploadSessionId` (prefix path + UUID)
    - `rootFolderId`
    - `createdFolders`, `existingFolders`, `folderMappings`

### Lỗi chính
- `BAD_REQUEST`: thiếu field, `relativeFolderPath` không hợp lệ, `level` không khớp.
- `PROJECT_NOT_FOUND`, `FOLDER_NOT_FOUND`.
- `FOLDER_PARENT_NOT_FOUND`: thiếu node cha.
- `FILE_PERMISSION_ERROR`: không đủ quyền.

## Endpoint: POST /api/folder/update-detail
### Mục đích
Cập nhật thông tin thư mục, đổi tên/di chuyển, cập nhật mô tả và quyền truy cập.

### Input
`FolderUpdateRequestDTO`
- `folderId` (bắt buộc)
- `folderName` (không bắt buộc)
- `description` (không bắt buộc)
- `parentFolderId` (không bắt buộc)
- `permissions` (không bắt buộc, chỉ `OWNER`)
- `isActive` (hiện chưa được xử lý)

### Luồng xử lý
1. Validate body, bắt buộc `folderId`.
2. Lấy thư mục active; lấy dự án; kiểm tra dự án có trạng thái cho phép chỉnh sửa.
3. Yêu cầu quyền `MODIFY` (FileAppPermission) trên thư mục.
4. Nếu đổi `folderName`: giá trị mới không được rỗng.
5. Nếu đổi `parentFolderId`:
   - Thư mục cha phải active và thuộc cùng dự án.
   - Không được trỏ tới chính nó hoặc cây con (chống vòng lặp).
   - Cần quyền `MODIFY` (FileAppPermission) trên thư mục cha.
   - Nếu chuyển lên root (parent = null), cần quyền `MODIFY` ở cấp dự án.
6. Nếu đổi tên hoặc đổi cha:
   - Kiểm tra trùng tên trong cùng cha mới.
   - Tính `oldPath` và `newPath`, cập nhật `folderPath` và `level` của toàn bộ thư mục con.
   - Điều chỉnh thống kê `subfoldersCount` của cha cũ/cha mới.
7. Nếu có `description`: cập nhật (trim hoặc null).
8. Nếu cập nhật `permissions` (FileAppPermission):
   - Chỉ chủ dự án (`OWNER` vai trò dự án) hoặc admin mới được phép.
   - Ghi audit log `PERMISSION_CHANGE`.
9. Lưu thư mục và ghi audit log `UPDATE` nếu có thay đổi tên/cha/mô tả.

### Lỗi chính
- `BAD_REQUEST`: thiếu body, thiếu `folderId`, `folderName` rỗng.
- `FOLDER_NOT_FOUND`, `PROJECT_NOT_FOUND`.
- `FILE_PERMISSION_ERROR`: không đủ quyền.
- `FOLDER_CIRCULAR_REFERENCE`: tạo vòng lặp cây thư mục.
- `FOLDER_ALREADY_EXISTS`: trùng tên trong cùng cha.

## Endpoint: GET /api/folder/get-by-id/{folderId}
### Mục đích
Lấy chi tiết thư mục theo id.

### Luồng xử lý
1. Kiểm tra `folderId` không rỗng.
2. Lấy thư mục theo id; nếu thư mục inactive và user không phải admin thì trả `FOLDER_NOT_FOUND`.
3. Lấy dự án và kiểm tra quyền `READ` (FileAppPermission) trên thư mục.
4. Trả về `FolderEntity`.

### Lỗi chính
- `BAD_REQUEST`: thiếu `folderId`.
- `FOLDER_NOT_FOUND`, `PROJECT_NOT_FOUND`.
- `FILE_PERMISSION_ERROR`: không đủ quyền.

## Endpoint: POST /api/folder/get-page
### Mục đích
Lấy danh sách thư mục theo phân trang và bộ lọc.

### Input
`PageRequestDto<FolderFilterRequestDTO>`
- `maxResultCount`, `skipCount`, `sorting`
- `filter.projectId` (bắt buộc)
- `filter.parentFolderId` (không bắt buộc)
- `filter.folderName` (không bắt buộc)
- `filter.isActive` (không bắt buộc, mặc định `true` nếu null)

### Luồng xử lý
1. Nếu body null, dùng mặc định phân trang.
2. Bắt buộc `filter.projectId`.
3. Lấy dự án và kiểm tra quyền `READ` (FileAppPermission).
4. Nếu có `parentFolderId`: lấy thư mục cha active, kiểm tra thuộc dự án và quyền `READ` (FileAppPermission).
5. Tạo query theo `projectId`, `parentFolderId`, `folderName` (regex, ignore case), `isActive`.
6. Đếm tổng, áp dụng phân trang và sorting, trả `PageResult`.

### Lỗi chính
- `BAD_REQUEST`: thiếu `projectId`.
- `PROJECT_NOT_FOUND`, `FOLDER_NOT_FOUND`.
- `FILE_PERMISSION_ERROR`: không đủ quyền.

## Endpoint: DELETE /api/folder/delete/{folderId}
### Mục đích
Xóa mềm thư mục và toàn bộ thư mục con, đồng thời vô hiệu hóa assets liên quan.

### Luồng xử lý
1. Kiểm tra `folderId` không rỗng.
2. Lấy thư mục active và dự án; kiểm tra dự án có trạng thái cho phép chỉnh sửa.
3. Yêu cầu quyền `MODIFY` (FileAppPermission) trên thư mục.
4. Tìm toàn bộ thư mục con theo `folderPath` (prefix search).
5. Tập hợp danh sách thư mục cần vô hiệu hóa (self + descendants).
6. Tìm asset thuộc các thư mục này và set `isActive = false`.
7. Set `isActive = false` cho toàn bộ thư mục trong danh sách.
8. Cập nhật thống kê dự án: giảm `folderCount` và `assetCount` theo số lượng bị vô hiệu hóa.
9. Nếu có thư mục cha, giảm `subfoldersCount` của cha.
10. Ghi audit log `DELETE`.

### Lỗi chính
- `BAD_REQUEST`: thiếu `folderId`.
- `FOLDER_NOT_FOUND`, `PROJECT_NOT_FOUND`.
- `FILE_PERMISSION_ERROR`: không đủ quyền.
