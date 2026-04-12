---
name: mobx-refactor-skill
description: Refactor React components, pages, and layouts to adopt MobX store-driven state management consistently. Use this whenever the user asks to migrate from local state/props/context/redux to MobX, to "apply MobX" across a page with nested child components, or to audit mixed MobX/non-MobX components and standardize them.
---

# MobX Refactor Skill (React)

## Mục tiêu
Chuẩn hóa một phần UI React (component đơn, group component, page hoặc layout) sang kiến trúc MobX theo hướng dễ bảo trì, reactive đúng, và nhất quán toàn cây component con.

## Khi nào dùng skill này
Kích hoạt skill khi user yêu cầu một trong các tình huống sau:
- "refactor sang MobX", "chuyển state sang store", "apply MobX".
- Một page/layout có nhiều component con, có chỗ đã dùng MobX, có chỗ chưa dùng.
- Cần rà soát thư mục store hiện có và tái sử dụng store trước khi tạo mới.
- Cần chuẩn hóa async action, status/error, observer, computed theo best practices MobX.

## References bắt buộc đọc theo ngữ cảnh
Trong thư mục `references/` có 2 tài liệu nền tảng:

1. `references/mobx.md`
   - Mô tả: **best practices** khi sử dụng MobX trong React.
   - Dùng khi: quyết định cách bọc `observer`, truyền object vs primitive, xử lý async + `runInAction`, dispose reaction, `toJS`, root store pattern.

2. `references/mobx-direction.md`
   - Mô tả: **chỉ dẫn/SOP** triển khai MobX theo cấu trúc chuẩn.
   - Dùng khi: thiết kế store mới, phân tách domain/meta/ui state, chuẩn hóa nhiều API trong cùng screen, checklist review.

Luôn đọc cả hai file trước khi refactor phạm vi lớn (page/layout).

## Quy trình thực thi

### Bước 1 — Khảo sát phạm vi đầu vào
1. Xác định phạm vi user đưa vào: component đơn / page / layout.
2. Liệt kê các component con liên quan trong cây render của phạm vi đó.
3. Đánh dấu component nào đã là `observer` và component nào chưa reactive với MobX.

### Bước 2 — Khảo sát store hiện có (bắt buộc)
1. Tự tìm đến thư mục store của dự án (ví dụ: `/store`, `/stores`, `src/store`, `src/stores`).
2. Rà soát store hiện hữu để:
   - tái sử dụng store phù hợp,
   - tránh tạo duplicate state,
   - giữ naming và cấu trúc đồng nhất với codebase.
3. Chỉ tạo store mới nếu không có store hiện có đáp ứng domain.

### Bước 3 — Thiết kế state theo chuẩn
Áp dụng các nguyên tắc sau:
- Tách bạch:
  - Domain State
  - Meta State (`status` + `error` theo từng API)
  - UI State
- Dùng `computed` (`get`) cho dữ liệu dẫn xuất.
- Async flow: mọi cập nhật state **sau `await`** đặt trong `runInAction`.
- Dữ liệu gửi ra ngoài MobX: cân nhắc `toJS()`.
- Reaction (`autorun`/`reaction`/`when`) phải có cơ chế `dispose()`.

### Bước 4 — Refactor component tree
1. Với từng component chưa dùng MobX trong phạm vi yêu cầu:
   - chuyển đọc/ghi state cục bộ sang store thích hợp,
   - bọc `observer` ở component con nhỏ nhất thực sự đọc observable,
   - ưu tiên truyền object observable thay vì bóc primitive quá sớm.
2. Nếu input là page/layout:
   - áp dụng cho **tất cả component con chưa dùng MobX** trong phạm vi liên quan,
   - giữ behavior hiện tại (không tự ý đổi logic nghiệp vụ ngoài yêu cầu).

### Bước 5 — Chuẩn hóa API actions
- Mỗi API có `status` + `error` riêng.
- Không dùng chung một `isLoading` cho nhiều API độc lập (trừ khi chủ đích block toàn màn hình).
- Nếu nhiều API độc lập: dùng orchestration phù hợp (`Promise.all` khi có thể).

### Bước 6 — Validation trước khi kết luận
Kiểm tra lại nhanh theo checklist:
- Component dùng observable đã được bọc `observer` đúng vị trí.
- Async action sau `await` đã dùng `runInAction`.
- Có `computed` cho biến phụ thuộc thay vì lưu state dư thừa.
- Có dispose cho reactions nếu đã đăng ký.
- Không tạo store mới trùng chức năng với store cũ.

## Nguyên tắc chất lượng
- Ưu tiên tái sử dụng kiến trúc và style hiện có của repo.
- Không mở rộng scope ngoài phần user yêu cầu.
- Không thay đổi UI/behavior không liên quan đến migration MobX.
- Khi cần tạo store mới, tạo theo mẫu đơn giản, rõ trách nhiệm và tương thích với cấu trúc store hiện tại.

## Output mong đợi
Khi hoàn thành, cung cấp:
1. Danh sách file đã sửa/tạo.
2. Tóm tắt store nào tái sử dụng, store nào tạo mới (nếu có).
3. Các điểm refactor chính theo MobX (observer, state split, async/runInAction, computed).