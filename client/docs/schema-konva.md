# Schema và Hướng dẫn Konva trong React

Tài liệu này tổng hợp schema và kiến thức vận hành Konva để đảm bảo hình vẽ hiển thị chính xác, đồng bộ trên mọi thiết bị và độ phân giải.

---

## 1. Schema Cách tạo Shape
Khi tạo shape (Circle, Rect, v.v.), chúng ta cần tính toán tọa độ dựa trên **World Coordinates** (tọa độ thực tế trên ảnh gốc) thay vì tọa độ chuột trên màn hình.

### Công thức tính World Position:
```typescript
const transform = stage.getAbsoluteTransform().copy().invert();
const worldPos = transform.point(pointerPosition);
```

### Schema dữ liệu lưu trữ (Shape Object):
```typescript
type ShapeType = 'circle' | 'rect';

interface BaseShape {
  id: string;
  type: ShapeType;
  x: number;          // Tọa độ X trên ảnh gốc
  y: number;          // Tọa độ Y trên ảnh gốc
  rotation: number;   // Góc xoay (độ)
  stroke: string;     // Mã màu Hex
  strokeWidth: number;// Độ dày viền chuẩn hóa
}

interface CircleShape extends BaseShape {
  type: 'circle';
  radius: number;     // Bán kính chuẩn hóa
}

interface RectShape extends BaseShape {
  type: 'rect';
  width: number;      // Chiều rộng chuẩn hóa
  height: number;     // Chiều cao chuẩn hóa
}
```

---

## 2. Thông số quan trọng cần lưu trữ
Để phục vụ việc render lại ở bất kỳ đâu, Backend cần nhận được các thông tin sau:


```
Mình đã thêm thanh chọn màu bằng `react-colorful` và lưu màu vào từng hình. Chi tiết ở KonvaDemo.tsx.

- `image.src`  
  Đường dẫn ảnh nền để tải đúng ảnh gốc.
- `image.naturalWidth`, `image.naturalHeight`  
  Kích thước gốc của ảnh. Dùng làm “hệ tọa độ chuẩn” để scale đúng khi responsive.
- `shapes[]`  
  Danh sách hình vẽ theo world coordinates (tọa độ gốc theo ảnh), không phụ thuộc zoom.
- `shape.type`  
  Phân biệt circle/rect để render đúng loại hình.
- `shape.x`, `shape.y`  
  Vị trí tâm (circle) hoặc góc (rect) trong hệ tọa độ gốc.
- `shape.radius` (circle) / `shape.width`, `shape.height` (rect)  
  Kích thước hình trong hệ tọa độ gốc.
- `shape.rotation`  
  Góc xoay (độ), để render đúng hướng.
- `shape.stroke`  
  Màu viền đã chọn bằng color picker.
```

---

## 3. Cách Render đúng trên mọi kích thước (Responsive)
Để hình luôn nằm đúng vị trí trên ảnh dù màn hình to hay nhỏ, chúng ta sử dụng kỹ thuật **Scaling Stage**.

### Quy trình:
1. **Xác định tỷ lệ (Scale):**
   ```typescript
   const scale = Math.min(
     containerWidth / imageNaturalWidth,
     containerHeight / imageNaturalHeight
   );
   ```
2. **Cấu hình Stage:**
   - `width`: Theo kích thước container hoặc `imageNaturalWidth * scale`.
   - `height`: Theo kích thước container hoặc `imageNaturalHeight * scale`.
   - `scaleX`, `scaleY`: Gán bằng giá trị `scale` vừa tính.
3. **Render Shapes:**
   - Truyền trực tiếp các thông số `x, y, width, height` từ database vào component Konva (`<Rect />`, `<Circle />`).
   - Vì Stage đã được scale, Konva sẽ tự động nhân tọa độ gốc với scale để hiển thị đúng vị trí trên màn hình.

---

## 4. Tổng hợp cách sử dụng Konva trong React

### Cấu trúc cơ bản:
- **Stage:** Là canvas chính (tương đương với thẻ `<svg>` hoặc `<div>` bọc ngoài).
- **Layer:** Các lớp vẽ (nên tách Layer cho ảnh nền và Layer cho hình vẽ để tối ưu render).
- **Component (Rect, Circle, v.v.):** Các đối tượng đồ họa.

### Lưu ý quan trọng:
- **Ref:** Sử dụng `useRef` để truy cập trực tiếp vào nodes của Konva (cần thiết cho Transformer hoặc can thiệp trực tiếp vào canvas).
- **Event Handling:** Konva cung cấp các sự kiện như `onMouseDown`, `onMouseMove`, `onWheel` giống DOM nhưng trả về `KonvaEventObject`. Luôn dùng `stage.getPointerPosition()` để lấy tọa độ chuột chính xác.
- **Transformer:** Sử dụng component `<Transformer />` để tạo khung điều khiển (xoay, kéo giãn) cho một hoặc nhiều hình.
- **Performance:** Khi có quá nhiều hình, hãy sử dụng `listening={false}` cho các hình không cần tương tác để giảm tải tính toán hit-detection của Konva.
