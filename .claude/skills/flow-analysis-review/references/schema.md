# Schema Source of Truth

## Core Rules (Pre-execution)

- **Entity Database:** Mọi thiết kế luồng phải tuân thủ tuyệt đối các entity đang tồn tại trong thư mục `server/filesharing-filehandler/src/main/java/org/example/filesharing/entities/models/core`.

- **Domain Logic (Asset & Metadata):**
  - `Asset` là đại diện cho một media file hiển thị trên giao diện người dùng.
  - Mỗi `Asset` có thể có nhiều phiên bản. Mỗi phiên bản đó được gọi là một `Metadata`.
  - Các media file khi upload lên hệ thống thực chất được lưu là một `Metadata`.
  - Nếu upload file lần đầu tiên: mặc định đó là Version 1 của một `Asset` mới.
  - Nếu file upload có tên TRÙNG với tên của một `Asset` đã tồn tại: mặc định gán file đó là một phiên bản mới hơn (metadata mới) của `Asset` đó.

---

## Dynamic additions

> Thêm tại đây các schema/entity/rule mới được user cung cấp trong từng lần chạy.
