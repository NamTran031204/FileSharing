# KonvaJS Cho Người Mới: Từ Cơ Bản Đến Annotation Chính Xác Theo Ảnh

## 0. Mục tiêu tài liệu
Tài liệu này dành cho người mới nhập môn KonvaJS trong bối cảnh Media Review Platform.

Mục tiêu:
1. Nắm toàn bộ kỹ năng cốt lõi để làm việc với Konva trong React + TypeScript.
2. Đi sâu vào 2 bài toán quan trọng nhất:
- Tạo hình với kích thước do người dùng tự định nghĩa và chỉnh sửa hình.
- Render annotation khớp hoàn toàn với ảnh hiển thị, kể cả khi đổi viewport, zoom, pan, đổi rendition.

Nguồn tham khảo nội bộ:
- `client/docs/react-konva-guide.docx` (đã trích xuất nội dung để tổng hợp).
- `docs/database.md`.
- `client/src/mockup/pages/KonvaDemo.tsx`.
- `client/src/mockup/types/shapes.ts`.

---

## 1. KonvaJS là gì và vì sao phù hợp cho annotation
KonvaJS là thư viện canvas 2D hỗ trợ tốt cho tương tác đồ họa: vẽ shape, drag/drop, transform, event, layering.

Trong React, `react-konva` bọc Konva thành component để code theo style React:
- `Stage`: vùng canvas gốc.
- `Layer`: lớp vẽ.
- `Shape`: `Rect`, `Circle`, `Line`, `Text`, `Image`, ...
- `Group`: nhóm shape.

Lý do phù hợp cho annotation:
1. Event pointer chính xác trên canvas.
2. Quản lý nhiều shape theo layer.
3. Hỗ trợ chỉnh sửa hình bằng transform.
4. Tối ưu hiệu năng tốt hơn việc dựng nhiều DOM node overlay.

---

## 2. Toàn bộ kỹ năng Konva cần nắm

## 2.1 Kỹ năng nền tảng (Must-have)
1. Dựng `Stage` và `Layer` đúng cấu trúc.
2. Vẽ các shape cơ bản: `Rect`, `Circle`, `Line`, `Text`, `Image`.
3. Quản lý state shape bằng mảng immutable trong React.
4. Bắt sự kiện pointer và lấy tọa độ qua `getPointerPosition()`.
5. Phân biệt click vào nền và click vào shape.

## 2.2 Kỹ năng tương tác
1. Select shape.
2. Drag shape.
3. Resize, rotate shape.
4. Multi-select (tùy nhu cầu).
5. Hover state, cursor state, hit area.

## 2.3 Kỹ năng chỉnh sửa (Edit workflow)
1. Chuyển trạng thái giữa select mode và draw mode.
2. Dùng `Transformer` để resize/rotate.
3. Commit dữ liệu sau mỗi thao tác drag/transform.
4. Validate để tránh shape âm kích thước hoặc ra ngoài khung ảnh.
5. Hỗ trợ undo/redo.

## 2.4 Kỹ năng render chính xác theo ảnh
1. Quản lý hệ tọa độ chuẩn.
2. Chuyển đổi 2 chiều giữa normalized DB và canvas display.
3. Xử lý aspect ratio, letterbox/pillarbox.
4. Xử lý zoom/pan mà không làm lệch annotation.
5. Đồng bộ khi đổi resolution/rendition.

## 2.5 Kỹ năng hiệu năng
1. Tách layer: nền ảnh và annotation.
2. Chỉ re-render khi state thay đổi.
3. Giảm listeners không cần thiết.
4. Debounce khi đồng bộ API theo thao tác kéo liên tục.
5. Dùng `batchDraw()` trong case cập nhật dày.

## 2.6 Kỹ năng tích hợp dữ liệu
1. Gắn annotation theo `versionId` (version-centric).
2. Lưu points normalized để không lệch theo viewport.
3. Đồng bộ `threadId` với comment thread.
4. Đảm bảo schema status (`OPEN`, `RESOLVED`) đúng vòng đời review.

## 2.7 Kỹ năng tích hợp ảnh thực tế (Local/MinIO)
Theo guide nội bộ:
1. Dùng `use-image` để load ảnh vào `Konva.Image`.
2. Tách component render ảnh nền riêng.
3. Với MinIO: cấu hình CORS đúng, dùng `crossOrigin` phù hợp, cân nhắc presigned URL cho bucket private.

## 2.8 Bản đồ kỹ năng Konva đầy đủ (toàn cảnh)
Mục này giúp bạn thấy đầy đủ những gì Konva có thể làm, kể cả phần nâng cao chưa dùng ngay trong annotation.

1. Shape primitives:
- `Rect`, `Circle`, `Ellipse`, `Line`, `Arrow`, `RegularPolygon`, `Star`, `Ring`, `Arc`, `Wedge`, `Path`.

2. Text và typography:
- `Text`, `TextPath`, đo kích thước text, wrap/ellipsis, align/vertical align.

3. Nhóm và phân cấp node:
- `Group`, `Layer`, `FastLayer`, nesting node, zIndex, moveToTop/moveToBottom.

4. Event system:
- Click, dblclick, mousedown/mousemove/mouseup, touch events, drag events.
- Event bubbling/cancel bubble, delegation.

5. Drag and drop:
- `draggable`, `dragBoundFunc`, drag constraints theo trục hoặc theo vùng.

6. Transform và chỉnh sửa:
- `Transformer`, scale, rotate, skew, offset, mirror.

7. Animation:
- `Konva.Animation`, `Konva.Tween`, easing, timeline animation.

8. Filters và effect:
- Blur, Brighten, Contrast, HSL, RGB, Noise, Pixelate.
- Cần `node.cache()` trước khi apply filter trong nhiều trường hợp.

9. Clipping và masking:
- `clip`, `clipFunc`, vùng hiển thị tùy biến.

10. Hit graph và tương tác chính xác:
- `hitStrokeWidth`, `listening`, custom `hitFunc` cho shape đặc biệt.

11. Performance:
- Batch draw, cache node/layer, tách static layer và dynamic layer, giảm redraw.

12. Serialization và export:
- `toJSON`, `Konva.Node.create`, `toDataURL`, `toImage`, export PNG/JPEG.

13. Custom shape:
- `sceneFunc` và `hitFunc` để tự vẽ hình không có sẵn trong thư viện.

14. Quản lý viewport lớn:
- Zoom/pan, virtual region render, lazy annotation loading.

15. Tích hợp ứng dụng thực tế:
- Đồng bộ API, realtime collaboration, optimistic update, conflict handling.

## 2.9 Kỹ năng nào cần học trước cho người mới
Thứ tự khuyến nghị:
1. Stage/Layer/Shape + pointer events.
2. Draw flow + select/edit flow.
3. Coordinate transform chuẩn.
4. DB mapping version-centric.
5. Tối ưu hiệu năng.
6. Animation/filter/export và custom shape.

---

## 3. Trọng tâm 1: Tạo hình theo kích thước do người dùng định nghĩa + Chỉnh sửa hình

## 3.1 Tư duy đúng: Vẽ theo state machine
Không nên tạo shape cố định ngay khi click. Nên đi theo state machine:
1. `idle`.
2. `drawing`.
3. `editing`.
4. `committed`.

Ví dụ circle 2 bước:
1. Click lần 1: chốt tâm `(cx, cy)`.
2. Di chuyển chuột để preview bán kính.
3. Click lần 2: chốt bán kính `r`.

## 3.2 Công thức cho circle 2-click
Cho tâm `(cx, cy)` và điểm chốt bán kính `(px, py)`:

$$
r = \sqrt{(px-cx)^2 + (py-cy)^2}
$$

Điều kiện hợp lệ:
1. `r >= minRadius`.
2. Tâm và đường tròn vẫn nằm trong vùng ảnh cho phép (nếu có rule boundary).

## 3.3 Công thức cho rectangle kéo-thả hoặc 2-click
Giả sử điểm đầu `(x1, y1)`, điểm cuối `(x2, y2)`:

$$
x = \min(x1, x2),\; y = \min(y1, y2)
$$

$$
width = |x2 - x1|,\; height = |y2 - y1|
$$

Điều kiện hợp lệ:
1. `width >= minWidth`.
2. `height >= minHeight`.

## 3.4 Mẫu data model cho shape runtime
```ts
export type ShapeKind = 'circle' | 'rect' | 'polygon' | 'freeform';

export interface BaseShape {
  id: string;
  kind: ShapeKind;
  stroke: string;
  fill: string;
  strokeWidth: number;
  rotation?: number;
  isSelected?: boolean;
}

export interface CircleShape extends BaseShape {
  kind: 'circle';
  cx: number;
  cy: number;
  radius: number;
}

export interface RectShape extends BaseShape {
  kind: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
}

export type AnyShape = CircleShape | RectShape;
```

## 3.5 Mẫu flow tạo circle (2 click)
```ts
interface DrawingState {
  mode: 'idle' | 'drawing-circle';
  center?: { x: number; y: number };
}

function onStageClick(point: { x: number; y: number }) {
  if (state.mode === 'idle') {
    setState({ mode: 'drawing-circle', center: point });
    return;
  }

  if (state.mode === 'drawing-circle' && state.center) {
    const r = Math.hypot(point.x - state.center.x, point.y - state.center.y);
    if (r < 4) return;

    addShape({
      id: crypto.randomUUID(),
      kind: 'circle',
      cx: state.center.x,
      cy: state.center.y,
      radius: r,
      stroke: '#1d4ed8',
      fill: 'rgba(59,130,246,0.2)',
      strokeWidth: 2,
    });

    setState({ mode: 'idle' });
  }
}
```

## 3.6 Edit shape trong Konva
Có 2 nhóm edit chính:
1. Move: kéo shape.
2. Resize/Rotate: dùng `Transformer`.

Mẫu ý tưởng:
```tsx
<Rect
  x={shape.x}
  y={shape.y}
  width={shape.width}
  height={shape.height}
  draggable
  onDragEnd={(e) => updateShape(shape.id, { x: e.target.x(), y: e.target.y() })}
  onClick={() => setSelectedId(shape.id)}
/>
```

Khi dùng `Transformer`:
1. Chỉ attach vào shape đang selected.
2. Sau `transformend`, quy đổi scale về width/height thật để lưu state sạch.

```ts
const scaleX = node.scaleX();
const scaleY = node.scaleY();
const nextWidth = Math.max(1, node.width() * scaleX);
const nextHeight = Math.max(1, node.height() * scaleY);
node.scaleX(1);
node.scaleY(1);
```

## 3.7 Checklist edit hình chuẩn
1. Select rõ ràng (viền hoặc handles).
2. Drag mượt và commit onDragEnd.
3. Resize không làm méo dữ liệu (không giữ scale ẩn kéo dài qua nhiều lần transform).
4. Có ràng buộc min size.
5. Có undo/redo.

## 3.8 Lỗi thường gặp khi edit
1. Hình "phình" sai sau nhiều lần resize do lưu scale thay vì kích thước thật.
2. Vị trí lưu sai do lấy tọa độ viewport thay vì tọa độ canvas/image.
3. Nhảy shape khi drag do stale state hoặc key không ổn định.

---

## 4. Trọng tâm 2: Render annotation khớp hoàn toàn với ảnh

## 4.1 Nguyên tắc vàng
Dữ liệu annotation phải độc lập với kích thước hiển thị hiện tại.

Cách làm chuẩn:
1. Lưu theo normalized coordinates trong DB (`0..1`).
2. Dùng kích thước ảnh gốc (`metadata.mediaInfo.width`, `metadata.mediaInfo.height`) làm chuẩn quy chiếu.
3. Khi render, convert normalized -> pixel ảnh gốc -> pixel canvas hiển thị.

## 4.2 4 hệ tọa độ cần phân biệt
1. Screen coordinates: tọa độ chuột theo viewport.
2. Stage coordinates: tọa độ trong Konva stage.
3. Image coordinates (pixel gốc): tọa độ theo ảnh gốc.
4. DB normalized coordinates: tọa độ lưu DB trong khoảng `0..1`.

## 4.3 Tính khung ảnh hiển thị trong canvas (fit contain)
Cho:
- Ảnh gốc `origW`, `origH`.
- Vùng viewport `viewW`, `viewH`.

Scale fit:

$$
scale = \min\left(\frac{viewW}{origW},\frac{viewH}{origH}\right)
$$

Kích thước ảnh render:

$$
renderW = origW \cdot scale,\quad renderH = origH \cdot scale
$$

Offset canh giữa:

$$
offsetX = \frac{viewW - renderW}{2},\quad offsetY = \frac{viewH - renderH}{2}
$$

## 4.4 Convert DB -> Canvas để vẽ chính xác
Cho point normalized `(nx, ny)`:

Bước 1, về pixel ảnh gốc:

$$
imgX = nx \cdot origW,\quad imgY = ny \cdot origH
$$

Bước 2, map vào canvas:

$$
canvasX = offsetX + imgX \cdot scale
$$

$$
canvasY = offsetY + imgY \cdot scale
$$

Nếu có zoom/pan runtime:

$$
finalX = panX + canvasX \cdot zoom
$$

$$
finalY = panY + canvasY \cdot zoom
$$

## 4.5 Convert Canvas -> DB khi user vẽ/chỉnh sửa
Đảo ngược pipeline:

1. Bỏ zoom/pan.
2. Trừ offset.
3. Chia scale để về pixel ảnh gốc.
4. Chia `origW`, `origH` để ra normalized.

$$
nx = \frac{(finalX - panX)/zoom - offsetX}{scale \cdot origW}
$$

$$
ny = \frac{(finalY - panY)/zoom - offsetY}{scale \cdot origH}
$$

Clamp:

$$
nx = \max(0, \min(1, nx)),\quad ny = \max(0, \min(1, ny))
$$

## 4.6 Utility functions khuyến nghị
```ts
export interface RenderContext {
  origW: number;
  origH: number;
  viewW: number;
  viewH: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  zoom: number;
  panX: number;
  panY: number;
}

export function normalizedToCanvas(
  p: { x: number; y: number },
  c: RenderContext,
) {
  const imgX = p.x * c.origW;
  const imgY = p.y * c.origH;
  const canvasX = c.offsetX + imgX * c.scale;
  const canvasY = c.offsetY + imgY * c.scale;
  return {
    x: c.panX + canvasX * c.zoom,
    y: c.panY + canvasY * c.zoom,
  };
}

export function canvasToNormalized(
  p: { x: number; y: number },
  c: RenderContext,
) {
  const canvasX = (p.x - c.panX) / c.zoom;
  const canvasY = (p.y - c.panY) / c.zoom;
  const imgX = (canvasX - c.offsetX) / c.scale;
  const imgY = (canvasY - c.offsetY) / c.scale;
  const nx = Math.max(0, Math.min(1, imgX / c.origW));
  const ny = Math.max(0, Math.min(1, imgY / c.origH));
  return { x: nx, y: ny };
}
```

## 4.7 Vì sao phải dựa vào độ phân giải gốc
Nếu lưu theo pixel của viewport hiện tại, annotation sẽ lệch ngay khi:
1. Resize cửa sổ.
2. Đổi thiết bị.
3. Đổi rendition.
4. Đổi zoom level.

Do đó luôn dùng `metadata.mediaInfo.width` và `metadata.mediaInfo.height` làm chuẩn quy chiếu.

## 4.8 Khi đổi rendition (360p/720p/1080p)
Quy tắc:
1. Annotation DB không đổi (vẫn normalized theo ảnh gốc).
2. Chỉ đổi thông số render profile.
3. Chạy lại transform pipeline để ra vị trí mới chính xác.

---

## 5. Mapping database cho annotation chính xác (dựa trên docs/database.md)

## 5.1 Collection `metadata`
Dùng cho thông tin version và media info:
1. `assetId`, `versionNumber`.
2. `mediaInfo.width`, `mediaInfo.height`, `mediaInfo.durationMs`.
3. `processingStatus` để biết đã sẵn sàng render chưa.

## 5.2 Collection `annotations`
Các field quan trọng:
1. `assetId`, `versionId`.
2. `annotationType`: `TIMECODE | REGION | FRAME_REGION`.
3. `region.shape` và `region.points`.
4. `timeCode.startMs`, `timeCode.endMs`.
5. `threadId`, `status`, `createdBy`.

Ghi chú:
- `versionId` là bắt buộc để bảo đảm version-centric.
- `region.points` nên lưu normalized `0..1` cho ảnh/video frame.

## 5.3 Collection `media_renditions`
Dùng cho profile hiển thị:
1. `versionId`, `assetId`.
2. `renditionType` (`HLS`, `THUMBNAIL`, ...).
3. `resolution.width`, `resolution.height`.

Vai trò:
- Không phải nguồn chân lý để lưu tọa độ annotation.
- Chỉ là profile render/stream.

## 5.4 Collection `comment_threads`
Liên kết thảo luận với annotation:
1. `threadId`.
2. `annotations` (mảng annotation id).
3. `status`, `participants`, `lastActivityAt`.

## 5.5 Collection `review_sessions`
Giữ workflow review:
1. `assetId`, `versionId`.
2. `status`, `reviewers`, `metrics`.

Vai trò:
- Điều phối tiến trình review theo từng version.
- Đồng bộ metric khi annotation mở/đóng.

## 5.6 Gợi ý payload lưu annotation region
```json
{
  "annotationId": "...",
  "assetId": "...",
  "versionId": "...",
  "annotationType": "REGION",
  "region": {
    "shape": "RECTANGLE",
    "points": [
      { "x": 0.125, "y": 0.220 },
      { "x": 0.480, "y": 0.620 }
    ],
    "strokeColor": "#1D4ED8",
    "strokeWidth": 2,
    "fillColor": "rgba(59,130,246,0.2)"
  },
  "threadId": "...",
  "status": "OPEN"
}
```

## 5.7 Quy tắc query backend nên tuân thủ
1. Luôn query annotation theo `assetId + versionId`.
2. Không trộn annotation giữa các version.
3. Validate normalized points nằm trong `[0,1]` trước khi lưu.
4. Từ chối update nếu `versionId` không khớp context đang mở.

---

## 6. Luồng end-to-end chuẩn cho màn hình annotation ảnh
1. Lấy metadata version hiện tại.
2. Đọc `mediaInfo.width`, `mediaInfo.height`.
3. Tính render context (scale, offset, zoom, pan).
4. Query annotations theo `assetId + versionId`.
5. Convert normalized -> canvas để render shapes.
6. User vẽ/edit.
7. Convert canvas -> normalized.
8. Gửi API create/update annotation.
9. Reload hoặc optimistic update.

---

## 7. Checklist triển khai cho người mới

## 7.1 Checklist cơ bản
1. Đã cài `react-konva`, `konva`, `use-image`.
2. Dựng Stage/Layer riêng cho nền và annotation.
3. Có mode quản lý thao tác: select/draw.
4. Có cấu trúc shape model rõ ràng.
5. Có flow create + edit + delete.

## 7.2 Checklist bài toán 1 (vẽ + edit)
1. Circle 2-click hoạt động đúng.
2. Rectangle drag hoạt động đúng.
3. Transformer resize/rotate đúng.
4. Commit dữ liệu sau `dragend` và `transformend`.
5. Có validate min size.

## 7.3 Checklist bài toán 2 (render chính xác)
1. Có `origW`, `origH` từ metadata.
2. Có công thức fit contain và offset.
3. Có util chuyển đổi 2 chiều.
4. Không lưu pixel viewport vào DB.
5. Đổi rendition vẫn khớp vị trí annotation.

---

## 8. Lỗi phổ biến và cách khắc phục nhanh
1. Lệch annotation sau resize màn hình.
- Nguyên nhân: lưu theo pixel viewport.
- Cách sửa: lưu normalized.

2. Rect bị lệch tâm so với click.
- Nguyên nhân: quên xử lý top-left.
- Cách sửa: trừ nửa width/height hoặc lưu theo center nhất quán.

3. Resize nhiều lần làm shape bị biến dạng.
- Nguyên nhân: giữ scale tích lũy.
- Cách sửa: convert scale về width/height và reset scale về 1 sau transform.

4. Annotation sai khi zoom/pan.
- Nguyên nhân: thiếu bước inverse transform.
- Cách sửa: chuẩn hóa pipeline và unit test công thức.

5. Ảnh MinIO không lên.
- Nguyên nhân: CORS hoặc URL private.
- Cách sửa: cấu hình CORS đúng, dùng presigned URL nếu bucket private.

---

## 9. Lộ trình học Konva 7 ngày cho người mới
Ngày 1: Stage/Layer/Shape cơ bản, render hình tĩnh.

Ngày 2: Event pointer, click để tạo shape.

Ngày 3: Circle 2-click, Rectangle drag và preview.

Ngày 4: Select + Transformer + edit.

Ngày 5: Zoom/pan + hệ tọa độ + công thức chuyển đổi.

Ngày 6: Gắn API và schema DB theo versionId.

Ngày 7: Tối ưu hiệu năng, test các case lệch tọa độ.

---

## 10. Tóm tắt quyết định kỹ thuật quan trọng
1. Annotation phải version-centric (`versionId` bắt buộc).
2. Lưu tọa độ dạng normalized theo ảnh gốc.
3. `metadata.mediaInfo` là nguồn chân lý về độ phân giải gốc.
4. `media_renditions` chỉ là profile render.
5. Render chính xác phụ thuộc vào transform pipeline nhất quán 2 chiều.

---

## 11. Tài nguyên nên đọc thêm
1. Konva React docs: https://konvajs.org/docs/react/
2. Konva API: https://konvajs.org/api/
3. use-image package: https://www.npmjs.com/package/use-image
4. Tài liệu nội bộ: `client/docs/react-konva-guide.docx`
5. Schema nội bộ: `docs/database.md`
