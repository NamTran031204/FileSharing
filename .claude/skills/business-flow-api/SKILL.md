---
name: business-flow-api
description: Rà soát và hiện thực luồng nghiệp vụ backend từ use case/luồng nghiệp vụ/phân tích yêu cầu bằng cách đối chiếu API trong \server\filesharing-filehandler\src\main\java\org\example\filesharing\controllers (hoặc thư mục controllers của dự án). Luôn dùng skill này khi user muốn kiểm tra API backend đã đáp ứng nghiệp vụ chưa, cần bổ sung API nào, hoặc cần xác nhận xung đột nghiệp vụ trước khi sửa code.
---

# Business Flow API

## Mục tiêu
Biến yêu cầu nghiệp vụ đầu vào thành quyết định kỹ thuật rõ ràng cho backend:
1. Đã có API phù hợp chưa?
2. Nếu chưa có, implement tại controller tương ứng.
3. Nếu đã có nhưng chưa đúng nghiệp vụ, dừng thay đổi và hỏi user quyết định theo bộ câu hỏi xung đột ngay trong giao diện chat.

## Khi nào bắt buộc dùng skill này
- User đưa **use case**, **luồng nghiệp vụ**, **phân tích yêu cầu**, **BRD/PRD note**, hoặc mô tả thay đổi business logic.
- User muốn rà soát backend API hiện có trước khi code.
- User muốn biết nên sửa API nào hay tạo API mới cho flow nghiệp vụ.

## Input chấp nhận
- Văn bản tự do mô tả nghiệp vụ (tiếng Việt/Anh).
- Danh sách yêu cầu chức năng.
- Use case có actor, pre-condition, main flow, alternative flow.

Nếu input thiếu thông tin quan trọng (actor, điều kiện, expected result, trạng thái thành công/thất bại), hỏi bổ sung ngắn gọn trước khi sửa code.

## Nguồn phân tích API
1. Ưu tiên dùng `\server\filesharing-filehandler\src\main\java\org\example\filesharing\controllers` nếu được cung cấp.
2. Nếu không có tag file, tự tìm thư mục `controllers` trong backend module.
3. Đọc toàn bộ controller liên quan để lập bản đồ endpoint:
   - HTTP method
   - URL
   - DTO request/response
   - Service method được gọi
   - Ràng buộc/validation hiện có

## Quy trình bắt buộc

### Bước 1 - Chuẩn hóa yêu cầu nghiệp vụ
Chuyển input thành checklist triển khai:
- Mục tiêu nghiệp vụ
- Actor và quyền truy cập (nếu có)
- Dữ liệu vào/ra
- Rule bắt buộc
- Điều kiện lỗi/biên

### Bước 2 - Rà soát API hiện có
Lập bảng mapping giữa từng requirement và endpoint hiện có:
- **Covered**: đã có endpoint + logic phù hợp.
- **Partial**: có endpoint nhưng thiếu/khác rule.
- **Missing**: chưa có endpoint.

### Bước 3 - Ra quyết định thực thi

#### 3A. Trường hợp Missing API
Implement đầy đủ tại controller tương ứng theo pattern codebase:
- Thêm endpoint trong controller đúng domain.
- Thêm/chỉnh DTO, service, validation, error handling liên quan.
- Dùng naming, response wrapper, annotation, và cấu trúc package đang có.
- Không sửa lan sang domain không liên quan.

#### 3B. Trường hợp Existing API nhưng chưa đúng nghiệp vụ
**Không được sửa code ngay.** Trước tiên:
1. Tổng hợp toàn bộ điểm xung đột giữa flow mong muốn và flow hiện tại.
2. Tạo bộ câu hỏi quyết định cho user ngay trong giao diện chat.
3. Chỉ tiếp tục code sau khi user trả lời xong các câu hỏi xung đột.

## Cách tạo bộ câu hỏi xung đột
Khi có xung đột/điểm mơ hồ, dùng `ask_user` để hỏi theo nguyên tắc:
- Hỏi **một câu mỗi lần**.
- Ưu tiên multiple choice khi có thể.
- Không gộp nhiều quyết định vào một câu hỏi.
- Mỗi câu hỏi phải gắn với một điểm xung đột cụ thể.

Mẫu câu hỏi nên bao gồm:
- Bối cảnh ngắn (API/flow nào đang mâu thuẫn).
- 2-4 lựa chọn rõ ràng.
- Đề xuất mặc định đặt đầu danh sách, có hậu tố `(Recommended)`.
- Luôn có 1 đề xuất tạo hàm rỗng để user tự quyết định sau nếu không muốn chọn ngay, hàm này khi implement sẽ có comment `// TODO: Implement this function`.

## Nguyên tắc triển khai code
- Bám sát conventions hiện có trong backend module.
- Không tạo fallback im lặng hoặc bỏ qua lỗi.
- Nếu thay đổi contract API, phải nêu rõ lý do và phạm vi ảnh hưởng.
- Nếu cần tạo API mới, đảm bảo route/method nhất quán với controller cùng nhóm.
- Chỉ kết thúc khi flow đã được nối đầy đủ controller -> service -> DTO/rule liên quan.

## Output bắt buộc khi hoàn thành
Trả kết quả theo thứ tự:
1. Kết luận nhanh theo từng yêu cầu: Covered / Partial / Missing.
2. Nếu có xung đột: liệt kê xung đột + trạng thái câu hỏi đã hỏi/chờ trả lời.
3. Nếu đã implement: danh sách file thay đổi và endpoint mới/sửa.
4. Những giả định đã dùng (nếu có).

## Điều kiện dừng an toàn
Nếu còn xung đột nghiệp vụ chưa được user quyết định, dừng ở bước hỏi đáp; không tự ý finalize implementation.
