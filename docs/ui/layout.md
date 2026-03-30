# Layout tổng thể cho Media Review (Image Viewer)

## Mục tiêu
- Chuẩn hóa layout và vùng chức năng để tái sử dụng cho trình xem ảnh (ngang và dọc) và mở rộng sang player video.
- Tách rõ các khối: header điều hướng, vùng viewer, overlay công cụ, panel ghi chú/annotation.

## Kiến trúc trang
1) **Header**
   - Logo/brand mark (MR) + tiêu đề trang.
   - Action phải: Back/Close, Export notes (hoặc Save). Có thể thay bằng breadcrumb khi vào project.
2) **Main grid**
   - 2 cột: Viewer (trái) và Side panel (phải). Với màn hẹp, side panel đẩy lên trên (order -1) hoặc collapse theo tab.
   - Gutter: 12–16px; card radius 12–14px; border subtle.
3) **Viewer card**
   - Toolbar (tab chips): View / Annotate / Compare / Info.
   - Stage: nền tối, chứa frame ảnh/video.
   - Image/Video frame: bo góc, viền nhẹ, shadow; fit area (contain với ảnh ngang, aspect 9:16 với ảnh dọc). Poster placeholder khi chưa có media.
   - Floating tools (top-right): “+ Ghi chú”, “+ Hình vẽ”, “Guides/Grid” (tùy chế độ Annotate).
   - Overlay: lớp annotation (pin/shape) pointer-events none; pin có halo.
4) **Side panel (Notes/Annotations)**
   - Header: tiêu đề + chip thống kê (số mở).
   - List: thẻ ghi chú/annotation (id tag, nội dung, tọa độ hoặc timecode, author, trạng thái).
   - Draft area: ô nhập ghi chú mới (bật/tắt theo quyền/chế độ).
   - Footer actions: Cancel / Save.

## Breakpoints & responsive
- >=1080px: 2 cột (viewer ~60–65%, panel ~35–40%).
- <1080px: 1 cột, panel lên trước để ưu tiên thao tác trên mobile; viewer giữ min-height 420–520px.
- Toolbar chuyển sang scroll ngang nếu tràn.

## Màu sắc & theme (palette mới)
- Primary: #4A626A (đậm) cho action, chip active, border focus; #96AFB8 (nhạt) cho hover/secondary.
- Background: #C7ECF8 cho vùng nền lớn dịu mắt; dùng gradient rất nhẹ với #96AFB8 để tránh phẳng.
- Surface/Panel: #FEE0CD cho panel nổi (notes), #C4A997 cho footer/toolbar hoặc nhấn nhẹ.
- Accent: dùng #C4A997 cho tag trạng thái, hoặc chấm annotation; có thể giữ một sắc đậm hơn của #4A626A cho pin/halo.
- Text: ưu tiên text đậm (#1c242a) trên nền sáng; với nền panel màu ấm (#FEE0CD), dùng text #4A626A.

## Khoảng cách & kích thước
- Radius: 12–14px; border: 1px subtle.
- Toolbar chip: 8–12px padding, bold, có trạng thái active.
- Buttons: 10–14px padding, shadow nhẹ; primary dùng gradient.
- Floating tools: group dọc, min-width ~110–120px.

## Hành vi đề xuất
- Tab Annotate bật overlay tương tác; tab View ẩn các công cụ vẽ.
- Compare: toggle A/B (cho image); với video có thể giữ vị trí play đồng bộ ở bước sau.
- Info: hiển thị metadata (kích thước, định dạng, version, quyền, người upload).
- Side panel hỗ trợ filter (Open/Resolved) và tìm kiếm đơn giản trong bước kế tiếp.

## Áp dụng cho video
- Frame giữ tỉ lệ 16:9, thay ảnh bằng video/HLS player.
- Overlay timecode pin gắn currentTime, timeline comment panel (có thể thay side panel hoặc thêm vùng dưới).

## Tham chiếu mockup
- Layout ngang: mockup/mockup-giao-dien.html
- Layout dọc: mockup/mockup-giao-dien-2.html
