# 01. Product Requirements (PRD) - Media Review Platform

## 1. Product Vision
Xây dựng nền tảng review media cho creative agency và freelancer studio, giúp giảm vòng lặp phản hồi giữa đội sản xuất media và khách hàng thông qua comment theo thời gian, annotation trực quan và quản lý version.

## 2. Bài toán cần giải quyết
1. Feedback rời rạc qua chat/email, khó truy vết theo khung thời gian/frame
2. Khó kiểm soát version mới-cũ, dễ sửa nhầm bản
3. Quy trình duyệt nội dung chậm, thiếu trạng thái rõ ràng (approved/request changes)
4. Upload file lớn mất ổn định, đặc biệt video dài

## 3. Product Goals
1. Rút ngắn thời gian review trung bình ít nhất 30%
2. Tăng tỷ lệ feedback có ngữ cảnh (timecode hoặc vùng ảnh) lên ít nhất 80%
3. Giảm lỗi sửa sai version xuống dưới 5% tổng lượt chỉnh sửa
4. Duy trì trải nghiệm xem mượt cho video review ở điều kiện mạng trung bình

## 4. Non-goals (Phase 2)
1. Không làm real-time co-editing kiểu Figma multi-cursor
2. Không làm DAM đầy đủ (AI tagging, advanced search toàn hệ thống)
3. Không tối ưu cho live streaming sự kiện

## 5. Persona chính
1. Media Producer (Editor/Designer/Photographer)
Mục tiêu: Upload nhanh, nhận feedback rõ, xử lý revision có thứ tự.
2. Reviewer/Client
Mục tiêu: Comment chính xác theo timeline/vùng ảnh, duyệt nhanh.
3. Project Manager/Coordinator
Mục tiêu: Theo dõi trạng thái duyệt, version và SLA phản hồi.

## 6. User Stories trọng yếu
1. Là Reviewer, tôi muốn đặt comment tại mốc thời gian cụ thể của video để team sửa đúng đoạn.
2. Là Reviewer, tôi muốn vẽ vùng đánh dấu trên ảnh để mô tả vị trí cần chỉnh.
3. Là Producer, tôi muốn upload version mới nhưng vẫn xem lại history và feedback cũ.
4. Là PM, tôi muốn chuyển trạng thái phiên review sang approved hoặc request changes.
5. Là Owner, tôi muốn phân quyền theo người dùng để kiểm soát ai được comment/chỉnh sửa.

## 7. Scope MVP
1. Upload/download media (ưu tiên video + image), hỗ trợ file lớn.
2. Video playback dạng streaming.
3. Annotation cơ bản:
- Video: comment theo timecode.
- Image: vùng chọn + text comment.
4. Threaded comments cơ bản.
5. Versioning theo file:
- Upload new version.
- Xem danh sách version.
- So sánh cơ bản (A/B switch).
6. Review workflow:
- In review.
- Request changes.
- Approved.
7. Permission theo vai trò hiện có (READ, COMMENT, MODIFY, OWNER).

## 8. Stretch Scope (sau MVP)
1. So sánh version nâng cao (side-by-side sync playback/frame diff)
2. Notification đa kênh (email + webhook + in-app realtime)
3. Folder upload nâng cao với cấu trúc cây đầy đủ

## 9. Success Metrics (đề xuất)
1. Time to first comment sau khi upload: dưới 90 giây (P50)
2. Tỷ lệ phiên review hoàn tất trong 1 vòng phản hồi: trên 40%
3. Crash/error rate của player: dưới 1%
4. Transcode success rate: trên 98%
5. Annotation create latency: dưới 300ms (P95 API)

## 10. Acceptance Criteria tổng quát
1. Reviewer tạo được comment gắn timecode và xem lại đúng vị trí.
2. Reviewer tạo được annotation vùng ảnh, lưu và render đúng sau reload.
3. Producer upload version mới, version cũ vẫn truy cập được trong history.
4. Trạng thái review đổi được và ghi nhận audit event.
5. User không đủ quyền COMMENT/MODIFY không thể tạo annotation.
