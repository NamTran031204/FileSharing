# 03. Danh sách chức năng quan trọng và ưu tiên

## 1. Khung ưu tiên
- P0: Bắt buộc để sản phẩm dùng được
- P1: Quan trọng để tạo khác biệt và tăng hiệu suất
- P2: Nâng cao, triển khai sau khi MVP ổn định

## 2. Feature List

### 2.1 P0 - Must Have
1. Media upload ổn định cho video/image dung lượng lớn
2. Streaming playback cho video review
3. Comment theo timecode video
4. Annotation vùng ảnh + comment text
5. Threaded comment cơ bản (reply, resolve)
6. Version history (upload new version, xem bản cũ)
7. Review status cơ bản: In review, Request changes, Approved
8. Permission enforcement cho READ/COMMENT/MODIFY/OWNER
9. Share link an toàn theo quyền

### 2.2 P1 - Should Have
1. Compare version cơ bản (A/B switch hoặc overlay)
2. Notification in-app khi có feedback mới
3. Mention user trong comment
4. Search/filter comment theo trạng thái và người tạo
5. Audit trail cho action quan trọng (status change, version upload)

### 2.3 P2 - Could Have
1. Side-by-side compare đồng bộ timeline
2. Webhook tích hợp với PM tools
3. Folder upload nâng cao giữ nguyên cấu trúc
4. Dashboard hiệu suất review theo dự án/team

## 3. Feature-to-Value Map
1. Timecode comment -> giảm feedback mơ hồ -> giảm vòng sửa
2. Annotation ảnh -> tăng độ chính xác chỉnh sửa thiết kế
3. Version history -> giảm lỗi sửa sai bản
4. Review status -> tăng minh bạch tiến độ với khách hàng

## 4. Rủi ro theo chức năng
1. Streaming không ổn định -> reviewer bỏ dùng -> rủi ro adoption cao
2. Annotation UX phức tạp -> tỷ lệ sử dụng thấp
3. Versioning thiếu rõ ràng -> xung đột feedback giữa các bản

## 5. Định nghĩa hoàn thành MVP
1. P0 hoàn tất và qua UAT nội bộ.
2. Tối thiểu 1 dự án pilot có thể chạy full vòng review.
3. KPI kỹ thuật baseline đạt mức chấp nhận được (transcode success, comment latency, playback stability).
