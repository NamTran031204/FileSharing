# ProjectController API

Nguồn tham chiếu: [ProjectController.java](../../server/filesharing-filehandler/src/main/java/org/example/filesharing/controllers/ProjectController.java)

Tài liệu này mô tả toàn bộ endpoint trong `ProjectController`, tập trung vào 2 nội dung chính cho mỗi API:
- Endpoint: đường dẫn và HTTP method.
- Mục đích sử dụng: endpoint này dùng để làm gì trong hệ thống.

## 1. Kiểm tra thông tin project trước khi thao tác
- **Endpoint**: `POST /api/project/check-project`
- **Mục đích sử dụng**: Kiểm tra thông tin đầu vào liên quan đến project trước khi tạo mới hoặc thực hiện một thao tác nghiệp vụ. Phù hợp cho bước validate hoặc pre-check từ phía client.

## 2. Tạo project mới
- **Endpoint**: `POST /api/project/create-new`
- **Mục đích sử dụng**: Tạo mới một project từ dữ liệu người dùng gửi lên. Dùng khi người dùng khởi tạo một không gian làm việc hoặc nhóm tài liệu mới.

## 3. Cập nhật chi tiết project
- **Endpoint**: `POST /api/project/update-detail`
- **Mục đích sử dụng**: Cập nhật thông tin chi tiết của project đã tồn tại, ví dụ như tên, mô tả hoặc các thuộc tính cấu hình liên quan.

## 4. Lưu trữ project
- **Endpoint**: `POST /api/project/archive/{projectId}`
- **Mục đích sử dụng**: Chuyển project sang trạng thái lưu trữ (archive/trash) thay vì xóa ngay. Dùng khi muốn ẩn project khỏi danh sách đang hoạt động nhưng vẫn giữ lại dữ liệu để có thể khôi phục sau.

## 5. Lấy danh sách project có phân trang
- **Endpoint**: `POST /api/project/get-page`
- **Mục đích sử dụng**: Trả về danh sách project theo phân trang và điều kiện lọc. Dùng cho màn hình danh sách project, tìm kiếm, lọc theo trạng thái hoặc các tiêu chí quản trị.

## 6. Lấy thông tin project theo ID
- **Endpoint**: `GET /api/project/get-by-id/{projectId}`
- **Mục đích sử dụng**: Truy vấn chi tiết một project cụ thể theo mã định danh. Dùng khi mở trang chi tiết project hoặc cần nạp lại dữ liệu project từ backend.

## 7. Xóa project
- **Endpoint**: `DELETE /api/project/delete/{projectId}`
- **Mục đích sử dụng**: Xóa project khỏi hệ thống. Dùng khi project không còn nhu cầu sử dụng và cần được loại bỏ hoàn toàn.

## 8. Khôi phục project
- **Endpoint**: `POST /api/project/restore/{projectId}`
- **Mục đích sử dụng**: Khôi phục một project đã bị archive hoặc đưa vào vùng trash. Dùng khi người dùng muốn đưa project quay lại trạng thái hoạt động.

## 9. Cập nhật trạng thái project
- **Endpoint**: `POST /api/project/{projectId}/status`
- **Mục đích sử dụng**: Thay đổi trạng thái nghiệp vụ của project, ví dụ như open, in-progress, completed hoặc trạng thái tương đương trong hệ thống.

## 10. Lấy danh sách cộng tác viên của project
- **Endpoint**: `GET /api/project/{projectId}/getCollaborators`
- **Mục đích sử dụng**: Lấy danh sách thành viên đang cộng tác trong project. Dùng để hiển thị danh sách người tham gia và phân quyền hiện tại.

## 11. Thêm cộng tác viên vào project
- **Endpoint**: `POST /api/project/{projectId}/addCollaborator`
- **Mục đích sử dụng**: Thêm một người dùng hoặc cộng tác viên vào project. Dùng khi chủ project hoặc quản trị viên muốn mở rộng thành viên tham gia làm việc.

## 12. Thay đổi quyền của cộng tác viên
- **Endpoint**: `POST /api/project/collaborators/changePermission`
- **Mục đích sử dụng**: Cập nhật quyền hạn của một cộng tác viên trong project, ví dụ chuyển từ quyền xem sang quyền chỉnh sửa hoặc quản trị.

## 13. Rời khỏi project
- **Endpoint**: `POST /api/project/{projectId}/leave`
- **Mục đích sử dụng**: Cho phép người dùng hiện tại rời khỏi project mà họ đang tham gia. Dùng trong trường hợp thành viên không còn cộng tác nữa.

## 14. Xóa cộng tác viên khỏi project
- **Endpoint**: `POST /api/project/remove-collaborator/{projectId}/{collaboratorId}`
- **Mục đích sử dụng**: Loại bỏ một cộng tác viên ra khỏi project. Dùng khi cần thu hồi quyền truy cập hoặc quản lý lại danh sách thành viên.

## 15. Tạo share token cho project
- **Endpoint**: `POST /api/project/create-share-token`
- **Mục đích sử dụng**: Tạo mã chia sẻ để người khác có thể truy cập hoặc tham gia project thông qua token. Dùng khi cần chia sẻ project nhanh mà không thao tác thủ công từng người.

## 16. Thu hồi share token của project
- **Endpoint**: `DELETE /api/project/{projectId}/delete-share-token`
- **Mục đích sử dụng**: Vô hiệu hóa token chia sẻ hiện tại của project. Dùng khi muốn ngừng chia sẻ project hoặc tránh người khác tiếp tục dùng link/token cũ.

## 17. Lấy thông tin từ share token
- **Endpoint**: `GET /api/project/share-token/{shareToken}`
- **Mục đích sử dụng**: Tra cứu thông tin project hoặc quyền truy cập tương ứng với một share token. Dùng khi người dùng mở link chia sẻ và hệ thống cần hiển thị thông tin trước khi tham gia.

## 18. Làm mới share token
- **Endpoint**: `POST /api/project/{projectId}/share-token/refresh`
- **Mục đích sử dụng**: Tạo lại token chia sẻ mới cho project, thường dùng khi token cũ có nguy cơ lộ, đã hết hạn hoặc cần thay thế để đảm bảo an toàn truy cập.

## 19. Tham gia project bằng share token
- **Endpoint**: `GET /api/project/join-project/{shareToken}`
- **Mục đích sử dụng**: Cho phép người dùng tham gia project thông qua token chia sẻ. Dùng trong luồng mời cộng tác viên bằng link hoặc mã chia sẻ.

## 20. Cập nhật chế độ hiển thị của project
- **Endpoint**: `POST /api/project/{projectId}/visibility`
- **Mục đích sử dụng**: Thay đổi phạm vi hiển thị của project, ví dụ public/private hoặc mức visibility tương đương do hệ thống định nghĩa.

## 21. Lấy thống kê của project
- **Endpoint**: `GET /api/project/{projectId}/stats`
- **Mục đích sử dụng**: Trả về số liệu thống kê liên quan đến project. Dùng cho dashboard, báo cáo nhanh hoặc màn hình tổng quan project.

## 22. Lấy nhật ký hoạt động của project
- **Endpoint**: `GET /api/project/{projectId}/audit-log`
- **Mục đích sử dụng**: Lấy lịch sử thao tác hoặc audit log của project theo phân trang và điều kiện lọc. Dùng cho việc theo dõi thay đổi, kiểm tra lịch sử hoạt động và hỗ trợ kiểm toán.

## 23. Chuyển dữ liệu sang project khác
- **Endpoint**: `POST /api/project/move-to-project/{projectId}`
- **Mục đích sử dụng**: Dự kiến dùng để chuyển dữ liệu hoặc đối tượng hiện tại sang một project đích. Tuy nhiên trong controller hiện tại endpoint này mới trả về thành công mặc định và chưa gọi xử lý nghiệp vụ thực tế.

## Ghi chú thêm
- Tất cả endpoint đều được khai báo trong controller tại [ProjectController.java:28-165](../../server/filesharing-filehandler/src/main/java/org/example/filesharing/controllers/ProjectController.java#L28-L165).
- Base path chung của controller là `api/project`.
- Tài liệu này đang tập trung vào mục đích sử dụng ở mức nghiệp vụ. Nếu cần, có thể bổ sung thêm phần request body, response model, quyền truy cập và ví dụ request/response ở bước tiếp theo.
