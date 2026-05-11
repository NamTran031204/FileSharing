---
name: flow-analysis-review
description: Phân tích yêu cầu, thiết kế luồng hệ thống (Task 1) và rà soát/sửa lỗi luồng có sẵn (Task 2) cho dự án FileSharing. Bắt buộc dùng skill này khi user gửi mô tả nghiệp vụ mới, yêu cầu thiết kế business/deployment flow, hoặc đưa file/đoạn markdown để kiểm tra tính đúng đắn của luồng so với schema và logic Asset/Metadata.
---

# Flow Analysis & Review

## Mục tiêu
Chuẩn hóa quy trình xử lý 2 nhóm công việc:
- **Task 1:** Phân tích yêu cầu và thiết kế luồng.
- **Task 2:** Rà soát và sửa lỗi luồng hiện có.

## Source of Truth
### 1) `references/schema.md` (Pre-execution Source of Truth)
File này phải chứa tối thiểu các quy tắc

### 2) `references/checklist.md` (Post-execution Source of Truth)
File này phải chứa checklist kiểm tra sau khi hoàn thành task.

## QUY TRÌNH THỰC THI CHÍNH (EXECUTION)

### Bước 1: Phân loại input
- Nếu input là mô tả bài toán/yêu cầu tính năng mới => **Task 1**.
- Nếu input là file markdown có sẵn hoặc đoạn text luồng dán vào chat => **Task 2**.

### TASK 1: PHÂN TÍCH YÊU CẦU & THIẾT KẾ LUỒNG
**Điều kiện kích hoạt:** Input là mô tả vấn đề/yêu cầu tính năng mới.

**Hành động bắt buộc:**
1. Đọc kỹ yêu cầu và tự phân tích nghiệp vụ.
2. Phân loại loại luồng cần tạo:
   - **Luồng nghiệp vụ (Business Flow):** Viết tài liệu theo góc nhìn BA, tập trung xử lý Backend (hoặc Backend + Frontend theo ngữ cảnh).
   - **Luồng triển khai (Deployment Flow):** Bắt buộc có cả:
     - Luồng nghiệp vụ toàn diện (Front to Back)
     - Schema triển khai chi tiết (API, bảng DB tác động, tech stack...)
3. Sinh **file Markdown mới** chứa bản phân tích/thiết kế.

### TASK 2: RÀ SOÁT & SỬA LỖI LUỒNG
**Điều kiện kích hoạt:** Input là markdown flow có sẵn hoặc text flow trong chat.

**Hành động bắt buộc:**
1. Tự xác định đó là luồng nghiệp vụ hay luồng triển khai.
2. Cross-check với:
   - Thực trạng dự án
   - `references/schema.md`
   - Logic Asset/Metadata
   - Database models tại `server/filesharing-filehandler/src/main/java/org/example/filesharing/entities/models/core`
3. Nếu phát hiện sai/không phù hợp:
   - Nếu input là file markdown: sửa trực tiếp file (ghi đè).
   - Nếu input là text: tạo file markdown mới đã chỉnh sửa.
4. Nếu luồng đã đạt yêu cầu hoàn toàn: **không sửa file** và chỉ trả đúng một dòng:
   - `OK, luồng đạt`

## RÀNG BUỘC TỐI THƯỢNG (CRITICAL CONSTRAINTS)
1. **Always Read Schema:** Trước khi bắt đầu Task 1/Task 2, luôn đọc `references/schema.md`.
2. **Always Check:** Trước khi kết thúc, luôn tự đối chiếu `references/checklist.md`.
3. **Markdown Only:** Output cuối cùng phải là `.md` (ngoại lệ duy nhất là câu `OK, luồng đạt` ở Task 2).
4. **Dynamic Schema Update:** Nếu prompt user có schema/entity/quy tắc nghiệp vụ mới, sau khi hoàn tất task phải bổ sung các schema mới đó vào cuối `references/schema.md`.

## Trình tự thực thi bắt buộc cho mỗi lần chạy
1. Đọc `references/schema.md`.
2. Phân loại Task 1 hoặc Task 2.
3. Thực hiện tạo/sửa luồng theo đúng loại task.
4. Nếu có schema mới từ user, append vào cuối `references/schema.md`.
5. Đối chiếu `references/checklist.md`.
6. Trả kết quả đúng định dạng.

## Định dạng trả kết quả
- Task 1: tạo mới 1 file `.md`.
- Task 2:
  - Sai luồng: sửa file markdown hoặc tạo markdown mới (nếu input là text).
  - Đạt luồng: chỉ trả `OK, luồng đạt`.
