# 📊 Data Flow Explanation: UserFilePermissionList Component

## 🎯 Kiến trúc: Controlled Component Pattern

Component `UserFilePermissionList` được thiết kế theo **Controlled Component Pattern**, tuân thủ nguyên tắc **One-Way Data Flow** của React.

## 🔄 Luồng dữ liệu (Data Flow)

### **Phase 1: Khởi tạo (Initialization)**

```
FileDetailModal (Parent)
    ↓
    ├─ currentFile: MetadataEntity
    └─ userPermissions: UserPermission[] (state)
```

1. User click "Edit" hoặc "Detail" trên file
2. Parent gọi `fileDetailModalRef.current.open(file)`
3. Parent nhận `file.userFilePermissions` và set vào state: `setUserPermissions(file.userFilePermissions)`

### **Phase 2: Render (Top-Down)**

```
FileDetailModal
    │
    │ props ↓ (users, callbacks)
    │
    └── UserFilePermissionList
            │
            └── Render UI dựa trên props.users
```

**Luồng truyền dữ liệu:**
```typescript
// Parent → Child
<UserFilePermissionList
    users={userPermissions}              // ← State từ parent
    onPermissionChange={handlePermissionChange}  // ← Callback
    onRemoveUser={handleRemoveUser}      // ← Callback
    readOnly={!isEditMode}               // ← Derived state
/>
```

**Child component render:**
- Map qua `props.users`
- Với mỗi user, hiển thị email + Select component
- Select.value = `user.permissionList` (từ props)

### **Phase 3: User Interaction (Event Bubbling Up)**

```
User thay đổi Select
    ↓
UserFilePermissionList.handlePermissionChange
    ↓
    │ Gọi props.onPermissionChange(email, newPermissions)
    ↓
FileDetailModal.handlePermissionChange
    ↓
setUserPermissions(prev => ...)  // Update state
    ↓
Re-render với state mới
    ↓ props
UserFilePermissionList nhận props.users mới
    ↓
UI cập nhật (Select hiển thị giá trị mới)
```

**Chi tiết:**

1. **User action**: User thay đổi permission trong Select
2. **Child callback**: 
   ```typescript
   onChange={(newPermissions) => handlePermissionChange(user.email, newPermissions)}
   ```
3. **Invoke parent callback**:
   ```typescript
   const handlePermissionChange = (email: string, newPermissions: ObjectPermission[]) => {
       onPermissionChange(email, newPermissions); // ← Gọi callback từ props
   };
   ```
4. **Parent updates state**:
   ```typescript
   const handlePermissionChange = (email: string, newPermissions: ObjectPermission[]) => {
       setUserPermissions(prevPermissions =>
           prevPermissions.map(user =>
               user.email === email
                   ? { ...user, permissionList: newPermissions }
                   : user
           )
       );
   };
   ```
5. **Re-render cascade**: State thay đổi → Parent re-render → Child nhận props mới → UI update

### **Phase 4: Submit (Propagation to Server)**

```
User click "Lưu" button
    ↓
FileDetailModal.handleUpdate()
    ↓
    │ Collect form values + userPermissions state
    ↓
API Call: userFileApiResource.updateFileDetail(fileId, updateData)
    ↓
Server updates
    ↓
Success → Close modal / Refresh list
```

## 🧩 Component Relationship Diagram

```
┌─────────────────────────────────────────┐
│      FileDetailModal (Parent)          │
│                                         │
│  State Management:                      │
│  ┌────────────────────────────────┐    │
│  │ userPermissions: []            │    │
│  │ setUserPermissions(...)        │    │
│  └────────────────────────────────┘    │
│                                         │
│  Handlers:                              │
│  ┌────────────────────────────────┐    │
│  │ handlePermissionChange()       │    │
│  │ handleRemoveUser()             │    │
│  │ handleUpdate()                 │    │
│  └────────────────────────────────┘    │
│                                         │
│         │                               │
│         │ Props ↓                       │
│         ▼                               │
│  ┌─────────────────────────────────┐   │
│  │ <UserFilePermissionList         │   │
│  │   users={userPermissions}       │   │
│  │   onPermissionChange={...}      │   │
│  │   onRemoveUser={...}            │   │
│  │   readOnly={!isEditMode}        │   │
│  │ />                              │   │
│  └─────────────────────────────────┘   │
│         │                               │
│         │ Callbacks ↑                   │
│         │                               │
└─────────────────────────────────────────┘
                │
                ▼
    ┌───────────────────────────┐
    │ UserFilePermissionList    │
    │      (Child)              │
    │                           │
    │  NO Internal State        │
    │  (Stateless/Dumb)         │
    │                           │
    │  Render Logic:            │
    │  • Map props.users        │
    │  • Render Select          │
    │  • Select.value = props   │
    │                           │
    │  Event Handlers:          │
    │  • onChange → callback    │
    │  • onClick → callback     │
    └───────────────────────────┘
```

## 🔑 Key Principles

### 1. **Single Source of Truth**
- State chỉ sống ở `FileDetailModal` (parent)
- Child component KHÔNG có state riêng cho danh sách users
- Props là nguồn dữ liệu duy nhất cho child

### 2. **Unidirectional Data Flow**
- Dữ liệu chảy từ trên xuống (parent → child qua props)
- Events chảy từ dưới lên (child → parent qua callbacks)
- Child không bao giờ mutate props trực tiếp

### 3. **Controlled Component**
```typescript
// Child component không tự quản lý value
<Select
    value={user.permissionList}  // ← Từ props (controlled)
    onChange={handleChange}       // ← Báo lên parent
/>

// Parent quản lý state
const [userPermissions, setUserPermissions] = useState([]);
```

### 4. **Immutable Updates**
```typescript
// ✅ Đúng: Tạo array mới
setUserPermissions(prev =>
    prev.map(user =>
        user.email === email
            ? { ...user, permissionList: newPermissions }
            : user
    )
);

// ❌ Sai: Mutate trực tiếp
setUserPermissions(prev => {
    const found = prev.find(u => u.email === email);
    found.permissionList = newPermissions; // WRONG!
    return prev;
});
```

## 📝 Benefits of This Architecture

1. **Predictable**: State luôn sync với UI
2. **Debuggable**: Dễ trace flow qua React DevTools
3. **Testable**: Child component thuần túy, dễ test
4. **Reusable**: Child có thể dùng ở nhiều nơi
5. **Maintainable**: Logic tập trung ở parent

## 🎓 Comparison: Controlled vs Uncontrolled

| Aspect | Controlled (Current) | Uncontrolled |
|--------|---------------------|--------------|
| **State Location** | Parent | Child |
| **Data Flow** | Parent → Child → Parent | Child internal |
| **Sync** | Always in sync | May drift |
| **Flexibility** | High (parent controls) | Low (child decides) |
| **Use Case** | Forms, complex logic | Simple inputs |

## 🚀 Execution Example

**Initial State:**
```typescript
userPermissions = [
    { email: "user@example.com", permissionList: [ObjectPermission.READ] }
]
```

**User Action: Thay đổi permission thành [READ, MODIFY]**

**Step-by-step:**
```typescript
// 1. User thay đổi Select
// 2. Child: onChange triggered
onChange([ObjectPermission.READ, ObjectPermission.MODIFY])

// 3. Child calls: props.onPermissionChange("user@example.com", [READ, MODIFY])

// 4. Parent receives callback:
handlePermissionChange("user@example.com", [READ, MODIFY])

// 5. Parent updates state:
setUserPermissions([
    { email: "user@example.com", permissionList: [READ, MODIFY] }
])

// 6. React re-renders:
<UserFilePermissionList users={[...new state...]} />

// 7. Child re-renders với props mới:
<Select value={[READ, MODIFY]} />  // ← UI updated
```

---

**Kết luận:** Component này minh họa hoàn hảo pattern **Lifting State Up** và **Controlled Component** trong React, đảm bảo data flow rõ ràng, dễ maintain và scale.
