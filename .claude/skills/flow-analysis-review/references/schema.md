# Schema Source of Truth

## Core Rules (Pre-execution)

- **Entity Database:** Mọi thiết kế luồng phải tuân thủ tuyệt đối các entity đang tồn tại trong thư mục `server/filesharing-filehandler/src/main/java/org/example/filesharing/entities/models/core`.

- **Domain Logic (Asset & Metadata):**
  - `Asset` là đại diện cho một media file hiển thị trên giao diện người dùng.
  - Mỗi `Asset` có thể có nhiều phiên bản. Mỗi phiên bản đó được gọi là một `Metadata`.
  - Các media file khi upload lên hệ thống thực chất được lưu là một `Metadata`.
  - Các file lưu trong minio được thể hiện bằng objectName tại table `Metadata`
  - Nếu upload file lần đầu tiên: mặc định đó là Version 1 của một `Asset` mới.
  - Nếu file upload có tên TRÙNG với tên của một `Asset` đã tồn tại: mặc định gán file đó là một phiên bản mới hơn (metadata mới) của `Asset` đó.

---

## Dynamic additions

> Thêm tại đây các schema/entity/rule mới được user cung cấp trong từng lần chạy.

- Rule Project Role (15/05/2026):
  - Create project: `ownerId`/`ownerEmail` = user hien tai; `startDate` = now; `visibility` mac dinh `PRIVATE` neu khong truyen; `stats` mac dinh 0; owner duoc gan `GrantedPermission.OWNER`.
  - Update/Delete/Archive project: chi cho phep `OWNER` hoac role he thong `ADMIN`/`SA`.
  - Create share token / Remove collaborator: chi cho phep `OWNER` hoac `PRODUCER`.

- Rule Project Endpoints (15/05/2026):
  - Soft delete: set `isActive=false`;
  - Restore: set `isActive=true`, `status=ACTIVE`, `trashedAt=null`.
  - Update status: neu `ARCHIVED` thi set `trashedAt=now`, neu `ACTIVE` thi set `trashedAt=null`.
  - Visibility: chi `OWNER` hoac `ADMIN/SA` duoc doi `visibility` (PUBLIC/PRIVATE).
  - Collaborators: add/remove by `OWNER`/`PRODUCER`; change permission chi `OWNER` (admin/SA co the override).
  - Share token: revoke/refresh chi `OWNER`/`PRODUCER`; validate token kiem tra `shareExpiry`.
  - Audit log project: chi `OWNER` hoac `ADMIN/SA` duoc xem.
  - Project status COMPLETED: khong cho upload media hoac tao folder.

---

## RBAC — Phân quyền Project / Folder / Asset (15/05/2026)

> Quy tắc này CHỈ áp dụng cho Project, Folder và Asset. Không áp dụng cho các entity khác.

### 1. Permission cấp Project

| Permission            | Mô tả                                                   | Chỉ Project | Cả Folder |
|-----------------------|---------------------------------------------------------|:-----------:|:---------:|
| `READ`                | Xem project/folder và nội dung bên trong                |             | ✅         |
| `DOWNLOAD`            | Tải asset                                               |             | ✅         |
| `COMMENT`             | Bình luận trên asset                                    |             | ✅         |
| `SELECT_AND_SUBMIT`   | Chọn và gửi danh sách ảnh                               |             | ✅         |
| `CREATE_FOLDER_ASSET` | Tạo folder hoặc upload asset                            |             | ✅         |
| `DELETE`              | Xóa asset hoặc folder                                   |             | ✅         |
| `ADD_USER`            | Thêm member vào project / folder collaborators          |             | ✅         |
| `UPDATE`              | Cập nhật thông tin project (tên, mô tả...)              | ✅           |            |
| `ARCHIVE`             | Đưa project vào trạng thái lưu trữ                      | ✅           |            |
| `AUDIT_LOG`           | Xem nhật ký hoạt động toàn project                      | ✅           |            |

### 2. Permission Matrix theo Role (cấp Project)

| Permission            | OWNER | PRODUCER | REVIEWER | GUEST | VIEWER |
|-----------------------|:-----:|:--------:|:--------:|:-----:|:------:|
| `READ`                | ✅    | ✅        | ✅        | ✅    | ✅      |
| `DOWNLOAD`            | ✅    | ✅        | ✅        | ❌    | ❌      |
| `COMMENT`             | ✅    | ✅        | ✅        | ❌    | ❌      |
| `SELECT_AND_SUBMIT`   | ✅    | ✅        | ✅        | ✅    | ❌      |
| `CREATE_FOLDER_ASSET` | ✅    | ✅        | ❌        | ❌    | ❌      |
| `DELETE`              | ✅    | ❌        | ❌        | ❌    | ❌      |
| `ADD_USER`            | ✅    | ✅        | ❌        | ❌    | ❌      |
| `UPDATE`              | ✅    | ❌        | ❌        | ❌    | ❌      |
| `ARCHIVE`             | ✅    | ❌        | ❌        | ❌    | ❌      |
| `AUDIT_LOG`           | ✅    | ❌        | ❌        | ❌    | ❌      |

> `GUEST` = người chưa đăng nhập nhưng có nhập tên (semi-anonymous).  
> `VIEWER` = người hoàn toàn ẩn danh, không nhập tên.

### 3. Folder Visibility — 3 trạng thái

| Visibility   | Ý nghĩa                                                                                       |
|--------------|-----------------------------------------------------------------------------------------------|
| `INHERIT`    | Kế thừa visibility của parent (project hoặc folder cha). Mặc định khi tạo folder.             |
| `RESTRICTED` | Chỉ mở cho danh sách `folderCollaborators` được chỉ định từ project member.                   |
| `PUBLIC`     | Ai có link đều truy cập được, kể cả khi project là PRIVATE.                                   |

**Ma trận truy cập Project × Folder:**

| Project Visibility | Folder Visibility | Ai truy cập được?                      |
|--------------------|-------------------|----------------------------------------|
| PRIVATE            | INHERIT           | Members của project                    |
| PRIVATE            | RESTRICTED        | Chỉ folderCollaborators được chỉ định  |
| PRIVATE            | PUBLIC            | Bất kỳ ai có link                      |
| PUBLIC             | INHERIT           | Bất kỳ ai có link vào project          |
| PUBLIC             | RESTRICTED        | Chỉ folderCollaborators được chỉ định  |
| PUBLIC             | PUBLIC            | Bất kỳ ai có link                      |

### 4. Effective Permission — Công thức

```
Effective Permission = Project Permission ∩ Folder Permission
```

- Folder chỉ được **thu hẹp** quyền, không bao giờ mở rộng.
- Luồng kiểm tra: Tính `projectPerms` → kiểm tra Folder Visibility → giao tập qua từng ancestor.

**Với RESTRICTED folder:**
- User không có trong `folderCollaborators` → DENIED hoàn toàn.
- User có trong `folderCollaborators` → `effectivePerms = projectPerms ∩ folderCollaborators[user].permissions`.

**Với PUBLIC folder:**
- User là project member → `effectivePerms = projectPerms`.
- User là GUEST (ngoài project) → `[READ, SELECT_AND_SUBMIT]`.
- User là VIEWER (ẩn danh) → `[READ]`.

**Nested Folder — Cascade rule:**
- `INHERIT`: leo lên ancestor gần nhất không phải INHERIT.
- `RESTRICTED`: chỉ kiểm tra danh sách của chính folder đó (không kế thừa danh sách cha).
- `PUBLIC`: override mọi ancestor. Con INHERIT bên dưới PUBLIC cũng được PUBLIC, trừ khi con là RESTRICTED.
- Effective cuối = giao của tất cả các cấp trong chuỗi ancestor.

### 5. Quy tắc bất biến

1. **Project là nguồn sự thật về người dùng:** `folderCollaborators` chỉ chứa userId đã có trong `project.collaborators`.
2. **Folder chỉ thu hẹp quyền:** `folderCollaborators[user].permissions` phải là subset của permission user đó có tại project.
3. **Xóa khỏi project vô hiệu hóa quyền folder:** Không cần cleanup `folderCollaborators`; mọi check đều bắt đầu từ project membership.
4. **PUBLIC folder ≠ PUBLIC asset:** Visibility chỉ áp dụng cho khả năng thấy folder. Download/modify asset vẫn phải qua effective permission check.
5. **`ADD_USER` tại Folder:** Chỉ được chọn member từ danh sách project, không thêm người ngoài project vào folder.
6. **GUEST/VIEWER không bao giờ được add vào `folderCollaborators` của RESTRICTED folder.**
