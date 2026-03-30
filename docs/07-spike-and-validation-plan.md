# 07. Kế hoạch spike và xác minh

## 1. Mục tiêu
Giảm rủi ro kỹ thuật cao nhất trước khi triển khai: playback ổn định, processing khả thi, annotation đủ chính xác, và permission đúng hành vi.

## 2. Danh sách spike bắt buộc

### Spike A - FFmpeg to HLS on MinIO
Mục tiêu:
1. Xác minh pipeline transcode tạo nhiều rendition
2. Lưu output vào MinIO đúng layout

Input mẫu:
1. Video 1080p 2-5 phút
2. Video bitrate cao với cảnh chuyển động nhanh

Pass criteria:
1. Sinh manifest và segment đầy đủ
2. Processing time trong ngưỡng chấp nhận (định nghĩa theo hạ tầng test)
3. Playback mở được từ URL ký tạm

### Spike B - HLS playback integration
Mục tiêu:
1. Xác minh player trên frontend phát mượt các rendition
2. Đo startup time và rebuffer rate cơ bản

Pass criteria:
1. Time-to-first-frame đạt ngưỡng mục tiêu P50/P95
2. Không lỗi decode nghiêm trọng trên browser mục tiêu

### Spike C - Annotation overlay
Mục tiêu:
1. Xác minh annotation vùng ảnh và timecode comment video
2. Kiểm tra lưu/đọc lại giữ đúng tọa độ và thời điểm

Pass criteria:
1. Annotation render đúng sau reload
2. Sai lệch tọa độ dưới ngưỡng chấp nhận trên viewport chuẩn
3. Thread comment gắn đúng annotation/version

### Spike D - Permission behavior
Mục tiêu:
1. Xác minh READ/COMMENT/MODIFY/OWNER map đúng hành vi

Pass criteria:
1. User không đủ quyền không thể thao tác bị cấm
2. UI ẩn/disable action tương ứng quyền
3. API trả lỗi authorization nhất quán

## 3. Bộ chỉ số xác minh ban đầu
1. Upload success rate
2. Transcode success rate
3. Playback startup time
4. Rebuffer count/session
5. Annotation create latency
6. API error rate

## 4. Quy tắc quyết định sau spike
1. Nếu Spike A hoặc B fail -> chưa vào implementation chính thức, cần điều chỉnh kiến trúc.
2. Nếu Spike C fail về UX -> ưu tiên đơn giản hóa annotation trước khi mở rộng tính năng.
3. Nếu Spike D fail -> khóa release MVP cho đến khi permission chuẩn.

## 5. Đầu ra bắt buộc từ mỗi spike
1. Mô tả setup môi trường test
2. Input dataset và thông số chạy
3. Kết quả đo + nhận xét
4. Quyết định kỹ thuật kéo theo
