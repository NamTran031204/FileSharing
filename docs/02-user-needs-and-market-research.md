# 02. Nhu cầu thực tế và nghiên cứu thị trường

## 1. Nhu cầu thực tế theo từng nhóm người dùng

### 1.1 Media Producer
Pain points:
1. Nhận feedback mơ hồ, không gắn vị trí cụ thể
2. Mất thời gian tổng hợp comment từ nhiều kênh
3. Không rõ version nào đang được duyệt

Nhu cầu cốt lõi:
1. Feedback có ngữ cảnh (timeline, vùng ảnh)
2. Một nguồn dữ liệu duy nhất cho comment/revision
3. Luồng version rõ ràng, ít nhầm lẫn

### 1.2 Reviewer/Client
Pain points:
1. Khó mô tả chính xác frame hoặc khu vực cần sửa
2. Trải nghiệm xem file lớn chậm hoặc giật
3. Không theo dõi được team đã xử lý feedback đến đâu

Nhu cầu cốt lõi:
1. Comment trực tiếp ngay trên nội dung
2. Playback ổn định
3. Trạng thái phản hồi minh bạch

### 1.3 Project Manager
Pain points:
1. Thiếu dashboard theo dõi vòng review
2. Khó đo hiệu suất team theo deadline

Nhu cầu cốt lõi:
1. Trạng thái review rõ ràng
2. Lịch sử revision có thể audit
3. KPI cơ bản cho tiến độ duyệt

## 2. Benchmark sản phẩm tương tự (tóm tắt định hướng)

### 2.1 Frame.io (định vị enterprise creative review)
Điểm mạnh tham khảo:
1. Timecode comment rất mạnh
2. Version stack rõ ràng
3. Workflow approval tốt

Bài học áp dụng:
1. Timeline comment là tính năng bắt buộc cho video
2. Version history phải dễ truy cập trong cùng màn hình

### 2.2 Vimeo Review
Điểm mạnh:
1. Playback ổn định
2. UX review đơn giản cho client không chuyên

Bài học áp dụng:
1. Onboarding reviewer phải cực ngắn
2. Link chia sẻ và trải nghiệm xem cần tối ưu trước

### 2.3 Filestage
Điểm mạnh:
1. Quy trình phê duyệt theo vòng
2. Quản lý trạng thái phản hồi trực quan

Bài học áp dụng:
1. Trạng thái review và tiến độ xử lý comment là phần giá trị lớn

### 2.4 Figma comments (analogy cho annotation)
Điểm mạnh:
1. Ghim comment trực tiếp vào vùng nội dung
2. Thread rõ ràng, dễ theo dõi

Bài học áp dụng:
1. Annotation ảnh cần trực quan như pin + thread
2. Tránh UI rối khi số lượng comment lớn

## 3. Kết luận nghiên cứu nhu cầu
1. Trục giá trị chính không nằm ở upload, mà ở chất lượng vòng feedback.
2. Timeline comment + annotation vùng ảnh + version workflow là bộ ba bắt buộc.
3. Nếu không có playback/transcode đủ tốt thì toàn bộ luồng review sẽ thất bại.

## 4. Câu hỏi nghiên cứu cần trả lời trong sprint
1. Người dùng có thật sự cần compare version nâng cao ở MVP không?
2. Tỷ lệ reviewer dùng mobile là bao nhiêu để quyết định mức đầu tư UX mobile?
3. Nên ưu tiên in-app notification hay email digest?
4. Chấp nhận độ trễ transcode bao nhiêu để đổi lại chi phí hạ tầng hợp lý?
