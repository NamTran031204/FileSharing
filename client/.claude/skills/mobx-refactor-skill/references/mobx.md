# ⚛️ Cẩm Nang React & MobX: Tiêu Chuẩn & Thực Hành Tốt Nhất

> **Dành cho:** Người mới học và Lập trình viên cấp trung muốn tối ưu hóa kiến trúc React + MobX.

## 1. Tổng quan về MobX trong React

MobX là một thư viện quản lý trạng thái (state management) cực kỳ mạnh mẽ, dựa trên cơ chế phản ứng (reactivity) minh bạch. Khác với Redux yêu cầu boilerplate code lớn, MobX cho phép bạn viết code theo phong cách hướng đối tượng, tự nhiên và dễ bảo trì hơn rất nhiều.

* 🎯 **Đơn giản:** Viết ít code hơn. Không cần reducers, actions types phức tạp. Bạn thay đổi dữ liệu, UI tự cập nhật.
* ⚡ **Hiệu suất cao:** MobX tự động theo dõi chính xác component nào cần re-render dựa trên dữ liệu nó thực sự sử dụng.
* 🧩 **Linh hoạt:** Hỗ trợ tốt lập trình hướng đối tượng (OOP). Dễ dàng phân chia logic thành các Class Store độc lập.

---

## 2. Ba khái niệm cốt lõi ("Tam giác vàng")

Mọi ứng dụng MobX đều xoay quanh luồng dữ liệu của 3 khái niệm sau:

### 📦 1. State (Trạng thái)
Dữ liệu gốc định hình ứng dụng của bạn (Mảng, Objects, Primitives). Được đánh dấu là **Observable**.
```javascript
class TodoStore {
  todos = []; // Observable state
  
  constructor() {
    makeAutoObservable(this);
  }
}
```

### 🛠️ 2. Actions (Hành động)
Bất kỳ đoạn code nào làm thay đổi State. MobX yêu cầu mọi thay đổi state phải nằm trong Action.
```javascript
// Bên trong class TodoStore
addTodo(text) {
  this.todos.push({ text, done: false });
}
```

### ✨ 3. Derivations (Dẫn xuất)
Bất cứ thứ gì có thể tự động tính toán lại khi State thay đổi. Gồm **Computed values** và **Reactions** (như React Components).
```javascript
// Computed value
get completedCount() {
  return this.todos.filter(t => t.done).length;
}

// Reaction (React Component)
const TodoView = observer(({ store }) => /* UI logic */)
```

---

## ⭐ 6. Best Practices chuyên sâu (Trọng tâm)

Áp dụng những nguyên tắc này giúp ứng dụng React + MobX của bạn đạt hiệu suất tối đa, không bị re-render thừa và dễ dàng mở rộng.

### 6.1. Bọc `observer` càng sâu càng tốt

Bọc `observer` ở component con nhỏ nhất có trách nhiệm hiển thị dữ liệu observable. MobX chỉ track những gì được **đọc trực tiếp** trong hàm render của một `observer` component. Vì vậy, nếu component con không phải `observer`, nó sẽ **không bao giờ tự re-render** khi dữ liệu bên trong object thay đổi, dù component cha có là `observer`.

**❌ Cách làm chưa tốt (Bad):** `TodoItem` không phải `observer` → hoàn toàn không reactive, `todo.title` thay đổi mà UI không cập nhật
```javascript
const TodoList = observer(({ todos }) => (
  <div>
    {todos.map(todo => (
      // TodoItem không bao giờ tự re-render vì không phải observer
      <TodoItem key={todo.id} todo={todo} />
    ))}
  </div>
));

const TodoItem = ({ todo }) => (
  <div>{todo.title} - {todo.done ? 'Done' : 'Pending'}</div>
);
```

**✅ Cách làm chuẩn (Good):** Chỉ `TodoView` re-render khi đúng item đó thay đổi, `TodoList` không bị ảnh hưởng
```javascript
// Container không cần observer vì không đọc thuộc tính bên trong todo
const TodoList = ({ todos }) => (
  <div>
    {todos.map(todo => (
      <TodoView key={todo.id} todo={todo} />
    ))}
  </div>
);

// Bọc observer ở component con nhỏ nhất — nơi thực sự đọc dữ liệu
const TodoView = observer(({ todo }) => (
  <div>{todo.title} - {todo.done ? 'Done' : 'Pending'}</div>
));
```

### 6.2. Truyền cả Object thay vì thuộc tính nguyên thủy

Khi bạn truyền primitive (string, boolean, number) xuống component con, MobX đã "bóc" giá trị ra khỏi observable tại thời điểm đó. Component con nhận được một giá trị tĩnh — nó không có cách nào biết giá trị gốc đã thay đổi. Hệ quả là để cập nhật UI, **component cha phải re-render trước** rồi mới truyền prop mới xuống, thay vì component con tự cập nhật độc lập.

Ngược lại, khi truyền nguyên object observable, component con được bọc `observer` sẽ tự theo dõi và cập nhật đúng lúc, đúng chỗ.

**❌ Cách làm chưa tốt (Bad):** `UserCard` phụ thuộc vào việc `UserProfile` re-render để nhận props mới
```javascript
const UserProfile = observer(({ user }) => (
  // Bóc primitive ra → UserCard chỉ nhận string/number tĩnh
  <UserCard name={user.name} age={user.age} />
));

const UserCard = ({ name, age }) => (
  <div>{name} - {age}</div>
);
```

**✅ Cách làm chuẩn (Good):** `UserCard` tự cập nhật độc lập khi `user` thay đổi
```javascript
const UserProfile = ({ user }) => (
  // Truyền nguyên object observable xuống
  <UserCard user={user} />
);

// UserCard tự theo dõi object, re-render độc lập
const UserCard = observer(({ user }) => (
  <div>{user.name} - {user.age}</div>
));
```

### 6.3. Phân biệt rõ Domain State và UI State
Domain state là dữ liệu thực tế (Products, Users). UI State là trạng thái hiển thị (isModalOpen, selectedTab). Hãy tách chúng ra các Store khác nhau để dễ quản lý.

**❌ Cách làm chưa tốt (Bad):**
```javascript
class UserStore {
  users = []; // Domain
  isLoading = false; // UI
  isDropdownOpen = false; // UI
  constructor() { makeAutoObservable(this); }
}
```

**✅ Cách làm chuẩn (Good):**
```javascript
class UserStore { // Domain Store
  users = [];
  constructor() { makeAutoObservable(this); }
}

class UIStore { // UI Store
  isLoading = false;
  isDropdownOpen = false;
  constructor() { makeAutoObservable(this); }
}
```

### 6.4. Cẩn thận với Destructuring
Destructuring (phân rã) một observable object trước khi render sẽ làm mất tính reactivity của các thuộc tính nguyên thủy bên trong nó.

**❌ Cách làm chưa tốt (Bad):** `name` và `age` mất kết nối với MobX sau khi destructure
```javascript
const UserView = observer(({ user }) => {
  const { name, age } = user; // ❌ Bóc ra khỏi observable tại đây
  return <div>{name} ({age})</div>;
});
```

**✅ Cách làm chuẩn (Good):** Truy cập trực tiếp trong JSX để MobX có thể track
```javascript
const UserView = observer(({ user }) => {
  return <div>{user.name} ({user.age})</div>;
});
```

### 6.5. Bắt buộc dùng `runInAction` sau mỗi `await`
 
Khi dùng `async/await` trong MobX, mỗi lần `await` hoàn thành, JavaScript tiếp tục chạy ở một **microtask mới** — MobX mất đi context của action ban đầu tại thời điểm đó. Vì vậy, bất kỳ dòng code nào **gán lại state sau `await`** đều phải được bọc trong `runInAction`, nếu không MobX sẽ cảnh báo và state có thể không cập nhật đúng.
 
> **Quy tắc đơn giản để nhớ:** Trước `await` — gán tự do. Sau `await` — bắt buộc `runInAction`.
 
**❌ Cách làm chưa tốt (Bad):** Gán state trực tiếp sau `await` → MobX warning, không reactive
```typescript
fetchUser = async () => {
  this.status = 'pending'; // ✅ Trước await: OK
  try {
    const data = await api.getUser();
    this.user = data;         // ❌ Sau await: vi phạm MobX action context
    this.status = 'success';  // ❌ Sau await: vi phạm MobX action context
  } catch (e: any) {
    this.status = 'error';    // ❌ Sau await: vi phạm MobX action context
  }
}
```
 
**✅ Cách làm chuẩn (Good):** Bọc toàn bộ phần gán state sau `await` vào `runInAction`
```typescript
import { makeAutoObservable, runInAction } from "mobx";
 
class UserStore {
  user: User | null = null;
  status: RequestStatus = 'idle';
 
  constructor() { makeAutoObservable(this); }
 
  fetchUser = async () => {
    this.status = 'pending'; // ✅ Trước await: gán tự do
    try {
      const data = await api.getUser();
      runInAction(() => {       // ✅ Sau await: bọc runInAction
        this.user = data;
        this.status = 'success';
      });
    } catch (e: any) {
      runInAction(() => {       // ✅ Catch cũng phải bọc runInAction
        this.status = 'error';
      });
    }
  }
}
```

### 6.6. Dùng `toJS()` trước khi truyền data ra ngoài MobX

Observable object của MobX là Proxy object — khi bạn gửi chúng trực tiếp cho thư viện bên ngoài (API call, form library, logging...), có thể gây lỗi không mong muốn hoặc serialize không đúng. Luôn dùng `toJS()` để convert sang plain JavaScript object trước.

```typescript
import { toJS } from "mobx";

// ❌ Gửi observable trực tiếp → thư viện bên ngoài có thể xử lý sai
await api.saveUser(this.user);

// ✅ Convert sang plain object trước khi gửi ra ngoài
await api.saveUser(toJS(this.user));

// ✅ Tương tự với array
await api.saveOrders(toJS(this.orders));
```

### 6.7. Luôn dọn dẹp Reaction để tránh memory leak

`autorun`, `reaction`, `when` trả về một **dispose function**. Nếu không gọi dispose khi Store/Component bị unmount, reaction sẽ tiếp tục chạy ngầm và giữ reference đến object — đây là nguồn gốc của memory leak trong MobX.

**❌ Cách làm chưa tốt (Bad):** Reaction tồn tại mãi mãi, không bao giờ được dọn
```typescript
class MyStore {
  constructor() {
    makeAutoObservable(this);
    // ❌ Không lưu dispose function → memory leak
    autorun(() => {
      console.log("Value changed:", this.someValue);
    });
  }
}
```

**✅ Cách làm chuẩn (Good):** Lưu dispose và gọi khi không dùng nữa
```typescript
class MyStore {
  private disposers: Array<() => void> = [];

  constructor() {
    makeAutoObservable(this);
    // ✅ Lưu lại dispose function
    this.disposers.push(
      autorun(() => {
        console.log("Value changed:", this.someValue);
      })
    );
  }

  // Gọi hàm này khi Store bị destroy (component unmount, route leave...)
  dispose() {
    this.disposers.forEach(dispose => dispose());
  }
}

// Trong React Component:
useEffect(() => {
  const store = new MyStore();
  return () => store.dispose(); // ✅ Dọn dẹp khi unmount
}, []);
```

---

## 7. Cấu trúc thư mục Store lớn (RootStore Pattern)

Khi dự án lớn lên, bạn không thể nhét tất cả vào một Store. Việc chia nhỏ và quản lý chúng thông qua một **RootStore** là mẫu thiết kế chuẩn nhất.

### Cấu trúc thư mục đề xuất:
```text
📁 src/stores/
 ├── 📄 RootStore.ts         // Kết nối các store con
 ├── 📄 StoreProvider.tsx    // Khởi tạo React Context
 ├── 📁 domain/
 │   ├── 📄 UserStore.ts
 │   └── 📄 ProductStore.ts
 └── 📁 ui/
     ├── 📄 ThemeStore.ts
     └── 📄 ModalStore.ts
```

### Ví dụ file `RootStore.ts`:
RootStore là nơi khởi tạo tất cả các child store và cho phép chúng giao tiếp với nhau (bằng cách truyền `this` vào constructor của child store).

```typescript
import { UserStore } from './domain/UserStore';
import { UIStore } from './ui/UIStore';

export class RootStore {
    userStore: UserStore;
    uiStore: UIStore;

    constructor() {
        this.userStore = new UserStore(this);
        this.uiStore = new UIStore(this);
    }
}
```

### Setup React Context (`StoreProvider.tsx`):
Truyền RootStore xuống Component Tree một lần duy nhất bằng React Context.

```typescript
import React, { createContext, useContext } from 'react';
import { RootStore } from './RootStore';

const rootStore = new RootStore();
const StoreContext = createContext<RootStore>(rootStore);

export const StoreProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    return (
        <StoreContext.Provider value={rootStore}>
            {children}
            </StoreContext.Provider>
    );
};

// Custom Hook để lấy store ra dùng
export const useStore = () => useContext(StoreContext);
```