# Thiết kế phân quyền (Role-Based Access Control - RBAC)

### 1. Phân quyền cấp Hệ thống (System Level)

Ở cấp độ này, chúng ta quản lý quyền hạn trên toàn bộ nền tảng hoặc trên từng tenant (tổ chức/công ty).

| Role | Phạm vi quản lý | Quyền hạn cốt lõi |
| :--- | :--- | :--- |
| **SA (System Admin)** | Toàn bộ nền tảng (Global) | - Quản lý tất cả tenant (tổ chức/công ty).<br>- Tạo/Xóa tài khoản ADMIN.<br>- Can thiệp vào mọi dự án khi cần thiết (Override). |
| **ADMIN** | Một tổ chức cụ thể (Tenant) | - Đăng ký/Quản lý tên miền công ty.<br>- Quản lý danh sách USER thuộc tổ chức.<br>- Phân bổ tài nguyên (storage, số lượng project) cho tổ chức. |
| **USER** | Một tổ chức cụ thể (Tenant) | - Tạo dự án mới (Tự động trở thành Owner của dự án đó).<br>- Tham gia vào các dự án khác nếu được mời. |

---

### 2. Phân quyền cấp Dự án (Project Level)

Đây là nơi diễn ra các hoạt động chính trị của sản phẩm. Mỗi Project sẽ có một tập hợp các thành viên với các Role khác nhau.

**Ma trận Phân quyền cấp Dự án (Project RBAC Matrix)**

| Hành động / Tính năng | Owner | Producer | Reviewer |  Guest | Viewer |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Trạng thái tài khoản** | Đã Đăng nhập | Đã Đăng nhập | Đã Đăng nhập | Vãng lai (Nhập tên) | Vãng lai (Ẩn danh) |
| **Quản lý Dự án** | | | | | |
| Cập nhật thông tin Project | ✅ | ❌ | ❌ | ❌ | ❌ |
| Xóa Project | ✅ | ❌ | ❌ | ❌ | ❌ |
| Thêm/Xóa thành viên (Invite) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Cấp quyền Owner cho người khác | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Quản lý Nội dung (Assets)** | | | | | |
| Upload ảnh/video | ✅ | ✅ | ❌ | ❌ | ❌ |
| Xóa/Sắp xếp ảnh/video | ✅ | ✅ | ❌ | ❌ | ❌ |
| Tạo Folder/Version | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Tương tác (Collaboration)** | | | | | |
| Xem nội dung (View) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Download (Nếu được phép) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Comment & Reply | ✅ | ✅ | ✅ | ❌ | ❌ |
| Thả cảm xúc (Reaction) | ✅ | ✅ | ✅ | ❌ | ❌ |
| Approve/Reject Asset | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Luồng chọn ảnh (Select Flow)**| | | | | |
| Chọn nhiều ảnh (Multi-select) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Gửi danh sách ảnh đã chọn | ✅ | ✅ | ✅ | ✅ | ❌ |

---

### 3. Diễn giải chi tiết các Role cấp Dự án

* **Owner:** Là người tạo ra dự án (hoặc được cấp quyền). Nắm "sinh sát" trong tay đối với dự án đó.
* **Producer:** Người chịu trách nhiệm sản xuất và đẩy nội dung lên (Photographer, Editor). Họ quản lý nội dung nhưng không quản lý cấu trúc chung của dự án.
* **Reviewer:** Những người có tài khoản hệ thống được mời vào để đánh giá (Khách hàng nội bộ, Art Director). Họ có đầy đủ công cụ để feedback (Comment, Approve) nhưng không được sửa/xóa file gốc.
* **Guest:** (Người dùng vãng lai có định danh). Đây là điểm nhấn của hệ thống. Họ truy cập qua link chia sẻ, bắt buộc nhập tên để bắt đầu phiên làm việc. Tính năng "quyền lực" nhất của họ là **chọn ảnh và gửi lại danh sách**. (Hệ thống cần lưu Session cho họ để không mất danh sách khi F5).
* **Viewer:** (Người dùng vãng lai ẩn danh). Họ chỉ có thể "ngắm" sản phẩm. Không thể làm bất cứ thao tác nào tác động ngược lại hệ thống.
