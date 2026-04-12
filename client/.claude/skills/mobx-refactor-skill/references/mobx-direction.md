Dưới đây là bộ chỉ dẫn tiêu chuẩn (SOP - Standard Operating Procedure) được tổng hợp lại để bạn dễ dàng áp dụng làm tài liệu nội bộ hoặc cẩm nang tra cứu nhanh khi làm việc với React và MobX.

---

# 📘 CHỈ DẪN: KIẾN TRÚC VÀ QUẢN LÝ STORE TRONG MOBX

**Mục đích:** Hướng dẫn cách phân chia biến, xử lý đa API và quản lý state phức tạp trong một màn hình lớn để giữ cho Store luôn sạch sẽ, dễ bảo trì và tối ưu hiệu suất.

## 1. Nguyên tắc Phân loại Biến (Separation of Concerns)

Tuyệt đối không để lẫn lộn các loại dữ liệu trong Store. Mọi biến phải thuộc về 1 trong 3 nhóm sau:

* **📦 Domain State (Dữ liệu Nghiệp vụ):**
    * Dữ liệu thực tế lấy từ server/database.
    * *Ví dụ:* `userProfile`, `orderList`, `productDetails`.
* **⚙️ Meta State (Trạng thái Tiến trình):**
    * Biến dùng để theo dõi quá trình xử lý bất đồng bộ (API).
    * **Bắt buộc:** Dùng State Machine (Union Type: `'idle' | 'pending' | 'success' | 'error'`) thay vì dùng các biến boolean rời rạc (`isLoading`, `isError`).
    * **Bắt buộc:** Mỗi API có một cặp `status` + `error` riêng — không dùng chung một biến lỗi toàn cục cho nhiều API, vì khi 2 API lỗi cùng lúc, thông báo lỗi sẽ bị ghi đè lẫn nhau.
    * *Ví dụ:* `fetchUserStatus`, `fetchUserError`, `submitOrderStatus`, `submitOrderError`.
* **🎨 UI State (Trạng thái Giao diện):**
    * Dữ liệu chỉ phục vụ cho việc hiển thị của màn hình hiện tại, sẽ mất đi khi F5.
    * *Ví dụ:* `activeTab`, `isModalOpen`, `searchKeyword`.

## 2. Quy trình Xử lý Đa API trên một Màn hình

Khi một màn hình (Screen) cần gọi nhiều API, hãy tuân thủ các bước sau:

1. **Cách ly Trạng thái (Isolate Meta State):** Mỗi API quan trọng phải có một cặp biến `status` và `error` riêng biệt. Không dùng chung một biến `isLoading` toàn cục trừ khi có chủ đích block toàn màn hình.
2. **Đồng bộ hóa (Orchestration):**
    * Tạo một hàm khởi tạo chung (ví dụ: `initScreen()`).
    * Nếu các API không phụ thuộc nhau: Dùng `Promise.all([api1(), api2()])` để gọi song song.
    * Nếu API 2 cần kết quả của API 1: Gọi tuần tự bằng `await api1()` rồi đến `await api2()`.
3. **Bảo vệ Scope bằng `runInAction`:** Sau lệnh `await`, bối cảnh (context) của MobX action bị phá vỡ. **Bắt buộc** bọc mọi dòng code gán lại state sau `await` vào bên trong khối `runInAction(() => { ... })`. Quy tắc dễ nhớ: **trước `await` — gán tự do, sau `await` — bắt buộc `runInAction`**.

## 3. Quản lý Biến Phụ Thuộc

* **Quy tắc:** Nếu biến B có thể được tính toán từ biến A, **không bao giờ** tạo biến B thành một state lưu trữ riêng biệt.
* **Giải pháp:** Sử dụng **`computed`** (thông qua từ khóa `get` trong Class).
* *Cơ chế:* MobX sẽ tự động tính toán lại giá trị của hàm `get` khi biến gốc thay đổi và cache kết quả lại, giúp đảm bảo dữ liệu luôn đồng bộ tuyệt đối mà không tốn công cập nhật thủ công.

## 4. Dọn dẹp Reaction (Dispose) — Bắt buộc để tránh Memory Leak

Các hàm `autorun`, `reaction`, `when` trả về một **dispose function**. Nếu không gọi dispose khi Store không còn sử dụng, reaction sẽ tiếp tục chạy ngầm và giữ reference đến object trong bộ nhớ mãi mãi.

**Quy tắc:**
* Luôn lưu trả về của `autorun`/`reaction`/`when` vào một mảng `disposers`.
* Tạo hàm `dispose()` trên Store để dọn sạch toàn bộ.
* Gọi `store.dispose()` khi component unmount (trong `useEffect` cleanup).

```typescript
class MyStore {
  private disposers: Array<() => void> = [];

  constructor() {
    makeAutoObservable(this);
    this.disposers.push(
      autorun(() => syncToLocalStorage(this.activeTab))
    );
  }

  dispose() {
    this.disposers.forEach(d => d());
  }
}

// Trong React Component
useEffect(() => {
  const store = new MyStore();
  return () => store.dispose(); // ✅ Gọi khi unmount
}, []);
```

## 5. Xuất Dữ liệu ra ngoài MobX với `toJS()`

Observable object của MobX là Proxy object. Khi truyền trực tiếp cho thư viện bên ngoài (API call, form library, logging tool...), dữ liệu có thể bị serialize sai hoặc gây lỗi không tường minh. **Luôn dùng `toJS()`** để convert sang plain JavaScript object trước khi gửi ra ngoài.

```typescript
import { toJS } from "mobx";

// ❌ Gửi observable trực tiếp → có thể serialize sai
await api.saveUser(this.user);

// ✅ Convert sang plain object trước khi gửi
await api.saveUser(toJS(this.user));
await api.saveOrders(toJS(this.orders));
```

---

## 6. Template Cấu trúc Store Chuẩn

Hãy sao chép và sử dụng bộ khung (boilerplate) dưới đây mỗi khi tạo một Store mới:

```typescript
import { makeAutoObservable, runInAction, toJS } from "mobx";

// 1. Định nghĩa Types
type RequestStatus = 'idle' | 'pending' | 'success' | 'error';
// import { User, Order } from './types';

export class FeatureStore {
  // ==========================================
  // A. STATE DECLARATION
  // ==========================================

  // 1. Domain State
  user: User | null = null;
  orders: Order[] = [];

  // 2. Meta State — Mỗi API có status + error riêng
  fetchUserStatus: RequestStatus = 'idle';
  fetchUserError: string = '';

  fetchOrdersStatus: RequestStatus = 'idle';
  fetchOrdersError: string = '';

  // 3. UI State
  activeTab: 'profile' | 'orders' = 'profile';

  // 4. Disposers — Dọn dẹp reaction
  private disposers: Array<() => void> = [];

  constructor() {
    makeAutoObservable(this);
    // Đăng ký reaction nếu cần, luôn lưu vào disposers
    // this.disposers.push(autorun(() => { ... }));
  }

  // ==========================================
  // B. COMPUTED VALUES (Biến phụ thuộc)
  // ==========================================

  get isScreenLoading() {
    return this.fetchUserStatus === 'pending' || this.fetchOrdersStatus === 'pending';
  }

  get totalOrderAmount() {
    return this.orders.reduce((sum, order) => sum + order.amount, 0);
  }

  // ==========================================
  // C. SYNCHRONOUS ACTIONS (Thay đổi UI State)
  // ==========================================

  setActiveTab = (tab: 'profile' | 'orders') => {
    this.activeTab = tab;
  }

  clearErrors = () => {
    this.fetchUserError = '';
    this.fetchOrdersError = '';
  }

  // ==========================================
  // D. ASYNCHRONOUS ACTIONS (Gọi API — async/await + runInAction)
  // ==========================================

  // Quy tắc: trước await → gán tự do | sau await → bắt buộc runInAction
  fetchUser = async () => {
    this.fetchUserStatus = 'pending'; // ✅ Trước await: gán tự do
    this.fetchUserError = '';
    try {
      const data = await api.getUser();
      runInAction(() => {             // ✅ Sau await: bắt buộc runInAction
        this.user = data;
        this.fetchUserStatus = 'success';
      });
    } catch (error: any) {
      runInAction(() => {             // ✅ Catch cũng phải bọc runInAction
        this.fetchUserStatus = 'error';
        this.fetchUserError = error.message;
      });
    }
  }

  fetchOrders = async () => {
    this.fetchOrdersStatus = 'pending'; // ✅ Trước await: gán tự do
    this.fetchOrdersError = '';
    try {
      const data = await api.getOrders();
      runInAction(() => {               // ✅ Sau await: bắt buộc runInAction
        this.orders = data;
        this.fetchOrdersStatus = 'success';
      });
    } catch (error: any) {
      runInAction(() => {
        this.fetchOrdersStatus = 'error';
        this.fetchOrdersError = error.message;
      });
    }
  }

  // ==========================================
  // E. ORCHESTRATION (Điều phối)
  // ==========================================

  initFeature = async () => {
    this.clearErrors();
    // Gọi song song các API độc lập
    await Promise.all([
      this.fetchUser(),
      this.fetchOrders()
    ]);
  }

  // ==========================================
  // F. Gửi data ra ngoài (luôn dùng toJS)
  // ==========================================

  saveUser = async () => {
    // ✅ Convert sang plain object trước khi gửi API
    await api.saveUser(toJS(this.user));
  }

  // ==========================================
  // G. DISPOSE (Dọn dẹp khi Store bị destroy)
  // ==========================================

  dispose() {
    this.disposers.forEach(d => d());
  }
}
```

---

## ✅ Checklist Code Review:

- [ ] Store đã bọc `makeAutoObservable(this)` trong constructor chưa?
- [ ] Các biến phụ thuộc đã được chuyển thành hàm `get` (computed) chưa?
- [ ] Async action dùng `async/await`, mọi phép gán sau `await` đã nằm trong `runInAction` chưa?
- [ ] Mỗi API đã có cặp `status` + `error` riêng biệt, không dùng chung chưa?
- [ ] Có tái sử dụng biến loading chung cho các API độc lập làm nghẽn UI không cần thiết không?
- [ ] Data observable đã được convert bằng `toJS()` trước khi gửi ra ngoài MobX chưa?
- [ ] Tất cả `autorun`/`reaction`/`when` đã được lưu vào `disposers` và có hàm `dispose()` chưa?
- [ ] Component gọi Store đã được bọc HOC `observer` chưa?