# Thiết kế Phân quyền (RBAC) — Báo cáo cập nhật

> Phiên bản: 2.0 | Cập nhật dựa trên phân tích hệ thống media quản lý theo mô hình Project/Folder

---

## 1. Tổng quan thay đổi so với phiên bản cũ

| Hạng mục              | Phiên bản cũ           | Phiên bản mới                                   |
|-----------------------|------------------------|-------------------------------------------------|
| `PROJECT_APPROVE`     | Tồn tại, chưa rõ nghĩa | **Xóa bỏ** hoàn toàn                            |
| `UPDATE`              | Dùng chung cho mọi cấp | cập nhật thông tin project, hoặc folder         |
| Permission cấp Folder | Chưa có                | **Định nghĩa mới** với tập permission riêng     |
| Folder Visibility     | Chưa có                | **3 trạng thái**: INHERIT / RESTRICTED / PUBLIC |
| Nested Folder         | Chưa xử lý             | **Cascade check** theo chuỗi ancestor           |

---

## 2. Phân loại lại Permission theo cấp áp dụng

### 2.1 Nhóm Project-only
Các permission chỉ có nghĩa ở cấp Project, không áp dụng xuống Folder.

| Permission  | Mô tả                                                 |
|-------------|-------------------------------------------------------|
| `UPDATE`    | Cập nhật thông tin project (tên, mô tả, thời gian...) |
| `ARCHIVE`   | Đưa project vào trạng thái lưu trữ                    |
| `AUDIT_LOG` | Xem nhật ký hoạt động toàn project                    |

### 2.2 Nhóm Content — áp dụng được cho cả Project lẫn Folder

| Permission            | Tại Project                              | Tại Folder                                     |
|-----------------------|------------------------------------------|------------------------------------------------|
| `READ`                | Xem project và toàn bộ nội dung          | Xem folder và asset bên trong                  |
| `DOWNLOAD`            | Tải asset trong project                  | Tải asset trong folder                         |
| `COMMENT`             | Bình luận trên asset                     | Bình luận trên asset trong folder              |
| `SELECT_AND_SUBMIT`   | Chọn và gửi danh sách ảnh                | Chọn và gửi danh sách ảnh trong folder         |
| `CREATE_FOLDER_ASSET` | Tạo folder hoặc upload asset vào project | Tạo subfolder hoặc upload asset vào folder     |
| `DELETE`              | Xóa asset hoặc folder                    | Xóa asset hoặc subfolder bên trong             |
| `ADD_USER`            | Thêm member vào project                  | Thêm member vào danh sách folder collaborators |

> **Lưu ý `ADD_USER` tại Folder:** Người được grant `ADD_USER` ở folder chỉ được *chọn* member từ danh sách đã có trong project. Không thể thêm người ngoài project vào folder.

---

## 3. Permission Matrix — Cấp Project

| Permission            | OWNER | PRODUCER | REVIEWER | GUEST | VIEWER |
|-----------------------|:-----:|:--------:|:--------:|:-----:|:------:|
| `READ`                |   ✅   |    ✅     |    ✅     |   ✅   |   ✅    |
| `DOWNLOAD`            |   ✅   |    ✅     |    ✅     |   ❌   |   ❌    |
| `COMMENT`             |   ✅   |    ✅     |    ✅     |   ❌   |   ❌    |
| `SELECT_AND_SUBMIT`   |   ✅   |    ✅     |    ✅     |   ✅   |   ❌    |
| `CREATE_FOLDER_ASSET` |   ✅   |    ✅     |    ❌     |   ❌   |   ❌    |
| `DELETE`              |   ✅   |    ✅     |    ❌     |   ❌   |   ❌    |
| `ADD_USER`            |   ✅   |    ✅     |    ❌     |   ❌   |   ❌    |
| `UPDATE`              |   ✅   |    ❌     |    ❌     |   ❌   |   ❌    |
| `ARCHIVE`             |   ✅   |    ❌     |    ❌     |   ❌   |   ❌    |
| `AUDIT_LOG`           |   ✅   |    ❌     |    ❌     |   ❌   |   ❌    |

---

## 4. Folder Visibility — 3 trạng thái

### INHERIT (Mặc định)
Folder kế thừa visibility của parent (project hoặc folder cha trực tiếp). Không lưu thêm dữ liệu. Ai thấy được parent thì thấy được folder này.

### RESTRICTED
Folder chỉ mở cho một subset member được chỉ định từ danh sách project. Cần lưu `folderCollaborators` kèm danh sách permission cụ thể cho từng người.

### PUBLIC
Bất kỳ ai có link đều truy cập được folder, kể cả khi project đang PRIVATE. Đây là cơ chế cho phép chia sẻ một folder ra ngoài mà không cần public cả project.

### Ma trận kết hợp Project × Folder Visibility

| Visibility Project | Visibility Folder | Ai truy cập được?                      |
|--------------------|-------------------|----------------------------------------|
| PRIVATE            | INHERIT           | Members của project                    |
| PRIVATE            | RESTRICTED        | Chỉ folder collaborators được chỉ định |
| PRIVATE            | PUBLIC            | Bất kỳ ai có link                      |
| PUBLIC             | INHERIT           | Bất kỳ ai có link vào project          |
| PUBLIC             | RESTRICTED        | Chỉ folder collaborators được chỉ định |
| PUBLIC             | PUBLIC            | Bất kỳ ai có link                      |

---

## 5. Permission Matrix — Cấp Folder

Folder không có khái niệm "Role" riêng. Permission được lưu trực tiếp theo từng user trong `folderCollaborators`, và **phải là subset** của permission user đó đang có tại project.

### Tập permission hợp lệ tại Folder

| Permission            | Áp dụng tại Folder | Ghi chú                                  |
|-----------------------|:------------------:|------------------------------------------|
| `READ`                |         ✅          |                                          |
| `DOWNLOAD`            |         ✅          |                                          |
| `COMMENT`             |         ✅          |                                          |
| `SELECT_AND_SUBMIT`   |         ✅          |                                          |
| `CREATE_FOLDER_ASSET` |         ✅          | Tạo subfolder hoặc upload vào folder này |
| `DELETE`              |         ✅          | Xóa asset/subfolder bên trong            |
| `ADD_USER`            |         ✅          | Chỉ add member đã có trong project       |
| `UPDATE`              |         ❌          | Chỉ có nghĩa ở cấp project               |
| `ARCHIVE`             |         ❌          | Chỉ có nghĩa ở cấp project               |
| `AUDIT_LOG`           |         ❌          | Chỉ có nghĩa ở cấp project               |

### Ví dụ: Folder RESTRICTED với custom permission

```
Project: user A là PRODUCER → có [READ, DOWNLOAD, COMMENT, CREATE_FOLDER_ASSET, DELETE, ADD_USER]

Folder "Raw Files" (RESTRICTED):
  → user A được add vào với permissions: [READ, DOWNLOAD]
  → Effective permission của A trong folder = [READ, DOWNLOAD]
  → A KHÔNG thể upload hay xóa trong folder này dù là PRODUCER ở project
```

---

## 6. Nguyên tắc tính Effective Permission

### Công thức
```
Effective Permission = Project Permission ∩ Folder Permission
```

Folder chỉ được **thu hẹp** quyền so với project. Không bao giờ được mở rộng.

### Luồng kiểm tra

```
User truy cập Folder X
        │
        ▼
[1] Tính Project Permission
    → Từ role trong project: projectPerms
        │
        ▼
[2] Kiểm tra Folder Visibility
    ├── INHERIT   → folderPerms = projectPerms (không thay đổi)
    ├── RESTRICTED → User có trong folderCollaborators?
    │               Có  → folderPerms = folderCollaborators[user].permissions
    │               Không → DENIED
    └── PUBLIC    → User trong project? folderPerms = projectPerms
                    User ngoài project? folderPerms = [READ]
        │
        ▼
[3] Effective = projectPerms ∩ folderPerms
        │
        ▼
[4] Nested Folder → lặp bước 2–3 cho từng ancestor
    Effective cuối = giao của tất cả các cấp trong chuỗi
```

---

## 7. Nested Folder — Quy tắc cascade

### Nguyên tắc

- **INHERIT** leo lên tìm ancestor gần nhất không phải INHERIT để xác định visibility thực tế.
- **RESTRICTED** chỉ kiểm tra danh sách của chính folder đó, không kế thừa danh sách folder cha.
- **PUBLIC** override hoàn toàn mọi ancestor — ai có link vào được folder đó và tất cả INHERIT con bên dưới (trừ khi con là RESTRICTED).

### Ví dụ minh họa

```
Project (PRIVATE)
└── Folder A  [INHERIT → private]
    ├── Folder B  [RESTRICTED → chỉ 3 người]
    │   ├── Folder C  [INHERIT → kế thừa RESTRICTED của B → chỉ 3 người đó]
    │   └── Folder D  [PUBLIC → ai có link đều vào được]
    └── Folder E  [INHERIT → kế thừa private của A]
        └── Folder F  [RESTRICTED → chỉ 2 người]
```

### Lưu trữ ancestor để tránh recursive query

Mỗi folder nên lưu `ancestorIds[]` — toàn bộ chuỗi từ root đến folder cha. Khi cần check quyền, query một lần lấy toàn bộ ancestor thay vì đệ quy.

```
Folder D:
  parentId: "B"
  ancestorIds: ["A", "B"]   ← thứ tự từ root đến cha trực tiếp
```

---

## 8. Xử lý User vãng lai (Guest / Viewer) với Folder

| Loại user            | Folder INHERIT                  | Folder RESTRICTED | Folder PUBLIC                          |
|----------------------|---------------------------------|-------------------|----------------------------------------|
| **VIEWER** (ẩn danh) | Chỉ xem được nếu project PUBLIC | ❌ Không vào được  | ✅ Chỉ có `READ`                        |
| **GUEST** (nhập tên) | Quyền của GUEST trong project   | ❌ Không vào được  | ✅ Chỉ có `READ` và `SELECT_AND_SUBMIT` |

> Guest và Viewer **không bao giờ** được add vào `folderCollaborators` của folder RESTRICTED. RESTRICTED chỉ dành cho user đã có tài khoản trong project.

---

## 9. Quy tắc đảm bảo tính nhất quán

**Quy tắc 1 — Project là nguồn sự thật về danh sách người dùng.**
Folder không thể tự thêm người ngoài project. `folderCollaborators` chỉ được chứa userId đã tồn tại trong `project.collaborators`.

**Quy tắc 2 — Folder chỉ thu hẹp quyền, không mở rộng.**
`folderCollaborators[user].permissions` phải là subset của permission user đó có tại project. Server validate điều này khi lưu.

**Quy tắc 3 — Xóa member khỏi project tự động vô hiệu hóa quyền folder.**
Không cần cleanup thủ công trong `folderCollaborators`. Mọi permission check đều bắt đầu từ bước kiểm tra project membership.

**Quy tắc 4 — PUBLIC folder không kéo theo PUBLIC asset.**
Visibility chỉ áp dụng cho khả năng thấy folder. Việc download hay thao tác asset vẫn bị kiểm tra bởi effective permission.
