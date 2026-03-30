# Palette màu cho Media Review UI

## Bảng màu
- Primary Deep: #4A626A — hành động chính, chip active, focus/border.
- Primary Soft: #96AFB8 — hover, secondary button, subtle backgrounds.
- Background Base: #C7ECF8 — nền tổng thể dịu, có thể pha gradient nhẹ với #96AFB8.
- Surface / Panel: #FEE0CD — panel nội dung, thẻ ghi chú.
- Accent Warm: #C4A997 — tag trạng thái, nhấn nhẹ, icon/annotation pin viền.

## Vai trò sử dụng
1) Nền
- Body: #C7ECF8 với gradient rất mờ sang #96AFB8.
- Card/Panel: #FEE0CD, viền mỏng màu #96AFB8 với alpha ~20%.

2) Text
- Chính: #1C242A (đậm trên nền sáng) hoặc kế thừa #4A626A trên panel ấm.
- Phụ/Muted: #4A626A với opacity 70%.

3) Action & Controls
- Button primary: nền #4A626A, hover #3d5259; text trắng hoặc #FEE0CD.
- Button secondary: nền #96AFB8 nhạt/transparent, border #4A626A.
- Chip/tabs active: nền #4A626A, text #FEE0CD; inactive: viền #96AFB8, text #4A626A.

4) Annotation & Tag
- Pin/halo: lõi #4A626A, viền/halo #C4A997 alpha 25%.
- Tag trạng thái: nền #C4A997, text #1C242A; trạng thái "Open" có thể dùng #4A626A.

5) States & Borders
- Border chuẩn: #4A626A với opacity 15–20%.
- Divider mỏng: #96AFB8 với opacity 20%.
- Focus ring: #4A626A với halo mờ 30%.

## Gợi ý áp dụng cho mockup hiện có
- Thay nền gradient tối bằng base sáng (#C7ECF8 → #96AFB8).
- Panel viewer/notes: dùng #FEE0CD, border mờ #96AFB8, shadow nhẹ màu #4A626A với alpha thấp.
- Buttons: chuyển primary sang #4A626A, secondary viền #4A626A trên nền trong suốt.
- Pin annotation: lõi #4A626A, halo #C4A997.
- Tag: #C4A997; chip active #4A626A.
