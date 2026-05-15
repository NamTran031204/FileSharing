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
