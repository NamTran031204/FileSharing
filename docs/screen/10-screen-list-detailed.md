# Danh Sách Màn Hình Chi Tiết - Media Review Platform

**Phiên bản**: Phase 2 MVP  
**Ngày tạo**: 2026-04-09  
**Trạng thái**: Draft for Review  

---

## Quy Ước Và Ký Hiệu

### Mức Ưu Tiên
- **P0**: Bắt buộc cho MVP
- **P1**: Quan trọng cho trải nghiệm
- **P2**: Nâng cao, phát triển sau

### Loại Màn Hình
- **Page**: Toàn màn hình lớn (sử dụng header + sidebar)
- **Modal**: Cửa sổ popup phía trên trang
- **Panel**: Sidebar hoặc drawer bên cạnh
- **Component**: Thành phần nhỏ (player, annotation tool)

### Database Mapping
- `users` → người dùng, thông tin xác thực
- `projects` → dự án
- `folders` → thư mục trong project
- `assets` → tài sản media (video/image/design)
- `metadata` → phiên bản file (versions)
- `media_renditions` → các bản rendering (HLS, thumbnail)
- `review_sessions` → phiên review của asset
- `annotations` → đánh dấu (timecode/region)
- `comment_threads` → luồng comment
- `processing_jobs` → job xử lý media
- `audit_logs` → lịch sử hành động

---

## PHẦN I: AUTH & ONBOARDING

### Screen 1: Login Page
**Mức ưu tiên:** P0  
**Loại:** Page (không header/sidebar)  
**Usecase phục vụ:** UC-A01

#### Mục Đích
Xác thực người dùng qua email/password hoặc Google OAuth để vào hệ thống.

#### Chức Năng Chính
- Đăng nhập bằng email + password
- Đăng nhập bằng Google OAuth
- "Quên mật khẩu" link
- "Đăng ký" link
- Remember me checkbox

#### Input Fields & Data Mapping
| Field | Type | Validation | Database |
|-------|------|-----------|----------|
| Email | text | email format, required | users.email |
| Password | password | min 8 chars, required | users.password (hashed) |
| Remember Me | checkbox | optional | session storage |

#### Buttons & Actions
- `[Đăng Nhập]` → Validate → JWT token → Redirect to Dashboard
- `[Quên Mật Khẩu]` → Modal: Nhập email → Send reset link
- `[Đăng Ký Tại Đây]` → Redirect to Register page
- `[Đăng Nhập Google]` → OAuth flow → Auto register nếu không tồn tại

#### Parent/Child Screens
- Parent: None (entry point)
- Child: Dashboard (after login)

---

### Screen 2: Register Page
**Mức ưu tiên:** P0  
**Loại:** Page (không header/sidebar)  
**Usecase phục vụ:** UC-A01

#### Mục Đích
Tạo tài khoản người dùng mới cho hệ thống.

#### Chức Năng Chính
- Nhập thông tin người dùng
- Validate email unique
- Tạo password
- Confirm password
- Agree to terms

#### Input Fields & Data Mapping
| Field | Type | Validation | Database |
|-------|------|-----------|----------|
| Full Name | text | 2-100 chars, required | users.publicUserName |
| Email | email | unique, format valid, required | users.email |
| Password | password | min 8 chars, uppercase, number, special | users.password (hashed) |
| Confirm Password | password | must match password field | (validation only) |
| Accept Terms | checkbox | must be checked | (not stored) |

#### Buttons & Actions
- `[Đăng Ký]` → Validate all fields → Create user → Auto login → Redirect Dashboard
- `[Hoặc đăng nhập Google]` → OAuth flow
- `[Quay Lại Đăng Nhập]` → Redirect to Login page

#### Parent/Child Screens
- Parent: Login page
- Child: Dashboard

---

### Screen 3: Password Reset Page
**Mức ưu tiên:** P1  
**Loại:** Page  
**Usecase phục vụ:** UC-A01

#### Mục Đích
Cho phép user đặt lại mật khẩu khi quên.

#### Chức Năng Chính
- Nhập password mới
- Confirm password mới
- Validate token từ link email

#### Input Fields & Data Mapping
| Field | Type | Validation | Database |
|-------|------|-----------|----------|
| New Password | password | min 8 chars, uppercase, number, special | users.password |
| Confirm Password | password | must match new password | (validation only) |
| Reset Token | hidden | from URL query param | (verification only) |

#### Buttons & Actions
- `[Đặt Lại Mật Khẩu]` → Validate token + fields → Update user → Success message → Redirect login
- `[Cancel]` → Redirect to login

#### Parent/Child Screens
- Parent: Email link
- Child: Login page

---

## PHẦN II: GLOBAL LAYOUTS & COMPONENTS

### Layout: App Shell (Header + Sidebar)
**Áp dụng cho:** Tất cả main pages (sau login)

#### Header (Fixed Top)
```
┌──────────────────────────────────────────────────────┐
│ Logo | Breadcrumb | Search | 🔔 🔧 👤 (Menu Avatar) │
└──────────────────────────────────────────────────────┘
```

**Components:**
- **Logo**: Click → Home
- **Breadcrumb**: Path navigation (Project > Folder > Asset)
- **Search**: Global search assets/projects
- **Notification Icon**: Badge count, dropdown
- **Settings Icon**: App settings
- **User Avatar**: Dropdown menu (Profile, Logout, Settings)

---

### Layout: Sidebar (Fixed Left)
```
┌─────────────────┐
│ 🏠 Trang Chủ    │
│ 📊 Dashboard    │
│ 📁 My Projects  │
│    ├─ Project1  │
│    ├─ Project2  │
│    └─ + Add     │
│ ⭐ Favorites    │
│ 🔍 Search       │
│ ⚙️ Settings     │
│ ❓ Help         │
└─────────────────┘
```

---

### Component: Global Modal - Confirm Dialog
**Sử dụng cho:** Delete, Archive, Reject actions

```
┌──────────────────────────────────┐
│ Are you sure?                    │
│                                  │
│ Description of action...         │
│                                  │
│ [Cancel] [Confirm]              │
└──────────────────────────────────┘
```

---

### Component: Global Modal - Error/Success
**Sử dụng cho:** API responses, validations

#### Success
```
✅ Thành công! [Close]
```

#### Error
```
❌ Có lỗi: {error message}
[Retry] [Close]
```

---

## PHẦN III: DASHBOARD & PROJECT MANAGEMENT

### Screen 4: Dashboard / Home
**Mức ưu tiên:** P0  
**Loại:** Page  
**Usecase phục vụ:** UC-A01, UC-B04, UC-F02

#### Mục Đích
Trang chủ hiển thị tổng quan hoạt động, dự án gần đây, thống kê review.

#### Chức Năng Chính
- Chào mừng user
- Quick stats (pending reviews, assets ready, in progress)
- Danh sách project gần đây
- Activity feed
- Create new project button

#### Input Fields & Data Mapping
| Field | Type | Source | Purpose |
|-------|------|--------|---------|
| User Name | display | users.publicUserName | Chào mừng |
| Pending Reviews | counter | review_sessions.status = "IN_REVIEW" | Quick stats |
| Ready to Review | counter | metadata.processingStatus = "READY" | Quick stats |
| In Progress | counter | assets.assetStatus = "IN_REVIEW" | Quick stats |
| Recent Projects | array | projects (ownerId or collaborator) limit 5 | List |
| Project Stats | denormalized | projects.stats | Cards |
| Recent Activity | timeline | audit_logs + comment_threads | Feed |

#### Buttons & Actions
| Button | Action | Navigates To |
|--------|--------|--------------|
| [+ New Project] | Modal: Create Project | Project Detail |
| Project Card | Click | Project Detail |
| 🔔 (Notification) | Dropdown panel | Notification Panel |
| [View All] (Activity) | Redirect | Activity/Audit Log page |

#### Parent/Child Screens
- Parent: None
- Child: Project Detail, Create Project Modal, Notification Panel

---

### Screen 5: Project List (Sidebar Detail)
**Mức ưu tiên:** P0  
**Loại:** Panel/Sidebar  
**Usecase phục vụ:** UC-A02

#### Mục Đích
Hiển thị danh sách project user sở hữu hoặc được invite.

#### Chức Năng Chính
- Xem danh sách project
- Expand/collapse project
- Drag to reorder/pin favorites
- Right-click context menu
- Create new project
- Search project

#### Input Fields & Data Mapping
| Field | Type | Source | Purpose |
|-------|------|--------|---------|
| Project List | array | projects (owned + collaborated) | Display |
| Project Name | string | projects.projectName | Label |
| Unread Count | counter | notifications filtered by project | Badge |
| Favorite Flag | boolean | (local storage hoặc user preference) | UI state |

#### Buttons & Actions
| Action | Trigger | Result |
|--------|---------|--------|
| Click Project | Single click | Navigate to Project Detail |
| Right-click Project | Context menu | Options: Rename, Archive, Settings, Copy Link |
| Drag Project | Drag & drop | Reorder hoặc pin to favorites |
| [+ Add Project] | Click button | Modal: Create Project |
| Double-click | Edit mode | Inline rename project |

#### Context Menu Options
- `[Pin to Favorites]` - Thêm vào favorites
- `[Rename]` - Modal: Nhập tên mới
- `[Settings]` - Redirect to Project Settings
- `[Share]` - Modal: Share project link
- `[Archive]` - Confirm → Archive project
- `[Copy Link]` - Copy share link to clipboard


---

### Screen 6: Create Project Modal
**Mức ưu tiên:** P0  
**Loại:** Modal  
**Usecase phục vụ:** UC-B02

#### Mục Đích
Cho phép user tạo dự án mới.

#### Chức Năng Chính
- Nhập thông tin project cơ bản
- Chọn category
- Set ngày bắt đầu/kết thúc
- Add client info
- Create project

#### Input Fields & Data Mapping
| Field | Type | Validation | Database |
|-------|------|-----------|----------|
| Project Name | text | 2-100 chars, required | projects.projectName |
| Project Code | text | alphanumeric + underscore, unique | projects.projectCode |
| Description | textarea | max 500 chars, optional | projects.description |
| Category | select | CAMPAIGN, BRANDING, PRODUCT, OTHER | projects.category |
| Client Name | text | max 100 chars, optional | projects.clientName |
| Start Date | date | optional, startDate ≤ endDate | projects.startDate |
| End Date | date | optional, startDate ≤ endDate | projects.endDate |
| Create Default Folders | checkbox | optional (default: true) | (post-processing) |

#### Buttons & Actions
| Button | Action |
|--------|--------|
| [Create Project] | Validate → Insert projects → Optionally create root folders → Close modal → Navigate to project |
| [Cancel] | Close modal |

#### Parent/Child Screens
- Parent: Dashboard, Sidebar
- Child: Project Detail

---

### Screen 7: Project Detail / Overview
**Mức ưu tiên:** P0  
**Loại:** Page (Tabbed)  
**Usecase phục vụ:** UC-A02, UC-F02, UC-B04

#### Mục Đích
Hiển thị tổng quan dự án, quản lý collaborator, xem activity.

#### Chức Năng Chính
- Overview tab: Tóm tắt project
- Files tab: Folder browser
- Collaborators tab: Quản lý team
- Activity tab: Audit log
- Settings tab: Cài đặt project

#### Tab 1: Overview
```
┌─────────────────────────────────────────┐
│ Project Name                            │
│ Client: [name] | Category: [type]      │
│ Period: [start] - [end]                │
│                                         │
│ ┌─────────────┬──────────┬────────────┐ │
│ │ 5 Folders   │ 23 Asset │ 4 Pending  │ │
│ ├─────────────┼──────────┼────────────┤ │
│ │ 12 Approved │ 2 Changes│ 9 Days Left│ │
│ └─────────────┴──────────┴────────────┘ │
│                                         │
│ ACTIVITY FEED:                          │
│ • John approved "Banner" 2 min ago     │
│ • Mary uploaded v2 "Icon" 1 hour ago   │
└─────────────────────────────────────────┘
```

#### Tab 2: Files
Hiển thị Folder Browser (Screen 9)

#### Tab 3: Collaborators
```
┌──────────────────────────────────────┐
│ Collaborators (3)                    │
├────────────┬────────┬──────┬────────┤
│ Name       │ Role   │ Added│ Action │
├────────────┼────────┼──────┼────────┤
│ John (You) │ OWNER  │ -    │        │
│ Mary       │ EDITOR │ John │ ⋯      │
│ Tom        │ VIEWER │ Mary │ ⋯      │
└────────────┴────────┴──────┴────────┘

[+ Invite Collaborator]
  Email: [input]
  Role: [EDITOR ▼]
  [Send Invite]
```

#### Tab 4: Activity
Timeline của tất cả actions trong project (upload, status change, comment)

#### Tab 5: Settings
```
PROJECT SETTINGS:
Project Name:  [text input] editable
Project Code:  [text] non-editable display
Description:   [textarea]
Category:      [dropdown]
Client:        [text input]
Start Date:    [date picker]
End Date:      [date picker]
Status:        [ACTIVE ▼]

[Save Changes] [Cancel] [Reset]

DANGER ZONE:
[Archive Project] [Delete Project]
```

#### Input Fields & Data Mapping
| Field | Tab | Type | Database |
|-------|-----|------|----------|
| Project Stats | Overview | denormalized | projects.stats |
| Activity Feed | Overview | array | audit_logs + comment_threads |
| Collaborators List | Collab | array | projects.collaborators |
| Invite Email | Collab | text | (temporary input) |
| Project Settings | Settings | form | projects.* |

#### Buttons & Actions
| Button | Action |
|--------|--------|
| [Edit] (header) | Enable edit mode |
| [Share] (header) | Modal: Share link |
| [⋯] (header) | More options |
| [+ Invite Collaborator] | Form to invite |
| [Change Role] (collaborator) | Dropdown select |
| [Remove] (collaborator) | Confirm remove |
| [Save Changes] (settings) | Update project |
| [Archive Project] | Confirm → Archive |
| [Delete Project] | Confirm → Delete |

#### Parent/Child Screens
- Parent: Dashboard, Sidebar
- Child: Folder Browser, Create Folder Modal, Invite Modal

---

### Screen 8: Project Settings
**Mức ưu tiên:** P1  
**Loại:** Page  
**Usecase phục vụ:** UC-A02

#### Mục Đích
Cấu hình chi tiết project, quản lý quyền, archive/delete.

#### Chức Năng Chính
- Edit project thông tin cơ bản
- Manage collaborators
- Permission override per folder
- Archive/Delete project
- Audit log

#### Input Fields & Data Mapping
(Giống Tab Settings trong Screen 7)

#### Buttons & Actions
(Giống Tab Settings trong Screen 7)

---

## PHẦN IV: FILE & FOLDER MANAGEMENT

### Screen 9: Folder Browser / File Manager
**Mức ưu tiên:** P0  
**Loại:** Page (3-column layout)  
**Usecase phục vụ:** UC-B01, UC-B02, UC-E01, UC-F02

#### Mục Đích
Quản lý folder hierarchy và asset list trong project.

#### Layout
```
┌─────────────────────────────────────────────────────┐
│ Breadcrumb: Project > Folder > Subfolder           │
├──────────────┬────────────────┬────────────────────┤
│ FOLDER TREE  │ ACTIONS PANEL  │ CONTENT AREA       │
│              │                │ (Assets List/Grid) │
│ 📁 Root      │ [+ New Folder] │                    │
│ ├─ Folder1   │ [+ Upload]     │ 📄 asset1_v1.mp4  │
│ │ ├─ Sub1    │ [Sort: ▼]      │ ✅ APPROVED        │
│ │ └─ Sub2    │ [View: Grid]   │                    │
│ ├─ Folder2   │ [View: List]   │ 📄 asset2_v2.mp4  │
│ └─ Folder3   │ [Search: ]     │ ⏳ IN_REVIEW       │
│              │                │                    │
│ [+ New Proj] │                │ 📄 asset3_new.mp4 │
│              │                │ ⏳ UPLOADING (45%) │
└──────────────┴────────────────┴────────────────────┘
```

#### Chức Năng Chính
- Xem folder tree (expand/collapse)
- Navigate giữa folders
- Upload file/folder
- Create subfolder
- List/Grid view assets
- Filter/sort assets
- Drag & drop upload
- Context menu actions

#### Input Fields & Data Mapping
| Field | Type | Source | Purpose |
|-------|------|--------|---------|
| Folder Tree | tree | folders (parentFolderId hierarchy) | Navigation |
| Current Folder Path | breadcrumb | folders (folderPath denormalized) | Context |
| Asset List | array | assets (folderId = current) | Display |
| Sort Order | select | local state | UI |
| View Mode | radio | local state (grid/list) | UI |
| Search Query | text | local state | Filter |

#### Buttons & Actions
| Button | Action | Result |
|--------|--------|--------|
| [+ New Folder] | Click | Modal: Create Folder |
| [+ Upload] | Click | File picker OR drag & drop → Upload progress |
| Folder (tree) | Expand | Load children folders |
| Folder (tree) | Collapse | Hide children |
| Folder (tree) | Right-click | Context menu: New, Rename, Delete, Move, Perms |
| Folder (tree) | Click | Navigate to folder |
| Asset Card | Click | Navigate to Asset Detail |
| Asset Card | Right-click | Context menu: Download, Share, Rename, Move, Delete |
| [Sort: ▼] | Select | Sort by: Name, Date, Status |
| [View: Grid/List] | Toggle | Change layout |
| [Search] | Type | Filter assets by name |

#### Context Menu - Folder
- `[New Subfolder]` → Modal
- `[Rename]` → Inline edit
- `[Move To]` → Modal: Select destination
- `[Permissions]` → Modal: Permission override
- `[Delete]` → Confirm → Soft delete (archive)
- `[Copy Path]` → Copy to clipboard

#### Context Menu - Asset
- `[Open Details]` → Navigate to Asset Detail
- `[Download]` → Start download (latest version)
- `[Share Link]` → Modal: Generate share link
- `[Create Review]` → Modal: Create Review Session
- `[Rename]` → Inline edit (assetName)
- `[Move To]` → Modal: Select folder
- `[Delete]` → Confirm → Move to trash
- `[View Versions]` → Navigate to Versions tab

#### Upload Functionality
**Drag & Drop Upload:**
- User drags file(s) to content area
- Show drop zone highlight
- On drop: Validate file → Create metadata → Initiate multipart upload → Show progress

**Progress Bar:**
```
📄 Banner - Hero (150 MB)
████████░░ 45% | 67 MB / 150 MB
Est. time: 30s | Speed: 4.5 MB/s
[Pause] [Cancel]
```

#### Parent/Child Screens
- Parent: Project Detail (Files tab) or sidebar navigation
- Child: Asset Detail, Create Folder Modal, Upload Modal, Share Modal

---

### Screen 10: Create Folder Modal
**Mức ưu tiên:** P0  
**Loại:** Modal  
**Usecase phục vụ:** UC-B02

#### Mục Đích
Tạo thư mục mới hoặc subfolder.

#### Chức Năng Chính
- Nhập tên folder
- Mô tả (optional)
- Select parent folder (if creating subfolder)
- Create folder

#### Input Fields & Data Mapping
| Field | Type | Validation | Database |
|-------|------|-----------|----------|
| Folder Name | text | 1-100 chars, required, unique within parent | folders.folderName |
| Description | textarea | max 500 chars, optional | folders.description |
| Parent Folder | select | current folder by default, can change | folders.parentFolderId |

#### Buttons & Actions
| Button | Action |
|--------|--------|
| [Create] | Validate → Insert → Reload tree → Close modal |
| [Cancel] | Close modal |

---

### Screen 11: Upload Modal / Drag & Drop
**Mức ưu tiên:** P0  
**Loại:** Modal / Drop Zone  
**Usecase phục vụ:** UC-B01, UC-B03

#### Mục Đích
Upload file media lớn với multipart/chunked mechanism.

#### Chức Năng Chính
- Drag & drop upload
- File picker
- Show upload progress per file
- Batch upload multiple files
- Pause/Resume upload
- Cancel upload
- Show upload history

#### Upload Progress Display
```
┌─────────────────────────────────────┐
│ UPLOADING (2/3)                     │
│                                     │
│ ✅ Completed:                       │
│ • banner_hero.mp4 (150 MB)         │
│                                     │
│ ⏳ In Progress:                      │
│ • design_v2.psd (280 MB)           │
│ ████████░░ 45% (126 MB / 280 MB)   │
│ Speed: 4.5 MB/s | Est: 34s         │
│ [Pause] [Cancel]                    │
│                                     │
│ ⏳ Waiting:                          │
│ • photo_set.zip (512 MB)           │
│ [Waiting to start]                  │
│                                     │
│ [Close] [Done]                      │
└─────────────────────────────────────┘
```

#### Input Fields & Data Mapping
| Field | Type | Source | Purpose |
|-------|------|--------|---------|
| File Input | file[] | File picker / Drop | Get files |
| Target Folder | reference | folderId | Where to upload |
| Upload Session | uuid | Generated | Track upload |

#### Buttons & Actions
| Button | Action |
|--------|--------|
| [+ Select Files] | File picker dialog |
| [Pause] | Pause current upload |
| [Resume] | Resume paused upload |
| [Cancel] | Cancel upload & clean up |
| [Close] | Close modal (after all done) |
| [Done] | Confirm & navigate |

#### Multipart Upload Flow
```
1. User selects file(s)
2. Frontend validates (size, type, name)
3. POST /assets/upload-metadata
   → Get uploadId + presigned URLs for each part
4. For each part:
   PUT presigned_url with chunk data
   → Track progress
   → Retry on failure (3x)
5. POST /assets/upload/{uploadId}/complete
   → Trigger processing job
   → Show processing status
```

#### Parent/Child Screens
- Parent: Folder Browser
- Child: Asset Detail (after upload complete)

---

## PHẦN V: ASSET DETAILS & VIEWING

### Screen 12: Asset Detail Page
**Mức ưu tiên:** P0  
**Loại:** Page (Tabbed)  
**Usecase phục vụ:** UC-B01, UC-E01, UC-E02, UC-F02

#### Mục Đích
Hiển thị chi tiết asset, version history, review session, comment.

#### Layout
```
┌─────────────────────────────────────────────────┐
│ ◀ Asset Name | [Edit] [Rename] [Move] [⋯]      │
│ Path: Project > Folder > AssetName              │
├─────────────────────────────────────────────────┤
│ Tabs: Preview | Versions | Review | Comments   │
├────────────────┬──────────────────────────────┤
│ PREVIEW PANEL  │ DETAILS PANEL                │
│ (Video/Image)  │ Status, Owner, Size,         │
│ + Timeline     │ Processing info, Review info │
└────────────────┴──────────────────────────────┘
```

#### Tab 1: Preview
- Video player (HLS + controls) OR Image viewer (zoom/pan)
- Timeline với annotation markers
- Full screen button
- Rendition info display

#### Tab 2: Versions
```
VERSION HISTORY:

v1 - 2026-04-02 | ✅ APPROVED
  Uploaded by: John | 150 MB
  Processing: ✅ READY
  [View] [Download] [Compare]

v2 - 2026-04-05 | ❌ CHANGES REQUESTED
  Uploaded by: Mary | 160 MB
  Processing: ✅ READY
  [View] [Download] [Compare]

v3 - 2026-04-08 | ⏳ IN_REVIEW (CURRENT)
  Uploaded by: Mary | 155 MB
  Processing: ✅ READY
  [View] [Download] [Compare]
  
[+ Upload New Version]
```

#### Tab 3: Review
```
REVIEW SESSION #3:
Status: ⏳ IN_REVIEW
Created: 2026-04-08
Deadline: 2026-04-10 (2 days)

REVIEWERS:
┌──────────────────────────┐
│ Name | Role | Status     │
├──────────────────────────┤
│ John | APPROVER | ✓      │
│ Mary | REVIEWER | ⏳      │
│ Tom  | REVIEWER | ⏳      │
└──────────────────────────┘

[View Full Review] [Request Update] [+ Add Reviewer]
```

#### Tab 4: Comments & Annotations
Timeline của tất cả comments và annotations (dùng for timeline display)

#### Input Fields & Data Mapping
| Field | Tab | Type | Database |
|-------|-----|------|----------|
| Asset Name | header | text | assets.assetName |
| Asset Path | header | breadcrumb | Derived from hierarchy |
| Preview Content | Preview | media | metadata.objectName (from MinIO) |
| Timeline Markers | Preview | array | annotations.timeCode |
| Version List | Versions | array | metadata (ordered by versionNumber desc) |
| Version Status | Versions | enum | metadata.processingStatus + metadata.assetStatus |
| Review Session | Review | object | review_sessions |
| Reviewer Status | Review | denormalized | review_sessions.reviewers |
| Comments | Comments | array | comment_threads |
| Annotations | Comments | array | annotations |

#### Buttons & Actions
| Button | Tab | Action |
|--------|-----|--------|
| [Edit] | header | Edit mode for assetName |
| [Rename] | header | Rename asset |
| [Move] | header | Modal: Select folder |
| [⋯] More | header | Menu: Download, Delete, Share |
| [Share Link] | header | Modal: Copy link |
| [View] | Versions | Redirect to version preview |
| [Download] | Versions | Download version file |
| [Compare] | Versions | Modal: Version compare (A/B) |
| [+ Upload New Version] | Versions | Modal: Upload new version |
| [View Full Review] | Review | Navigate to Review Session page |
| [Request Update] | Review | Change review status → REQUEST_CHANGES |
| [+ Add Reviewer] | Review | Modal: Invite reviewer |
| [View Full Comments] | Comments | Expand full comment thread |


#### Parent/Child Screens
- Parent: Folder Browser
- Child: Video Player, Image Viewer, Review Session, Compare Modal, Upload Version Modal

---

### Screen 13: Video Player Page
**Mức ưu tiên:** P0  
**Loại:** Component/Page (full screen)  
**Usecase phục vụ:** UC-C01, UC-C02, UC-D01, UC-D02

#### Mục Đích
Phát video streaming với timeline annotation.

#### Chức Năng Chính
- HLS streaming playback (adaptive bitrate)
- Play/Pause/Seek controls
- Timeline visualization
- Annotation markers on timeline
- Volume control
- Quality selection
- Fullscreen toggle
- Speed control (0.5x, 1x, 1.5x, 2x)

#### Layout
```
┌──────────────────────────────────────────┐
│ VIDEO PLAYER (responsive)                │
│ ┌────────────────────────────────────┐   │
│ │                                    │   │
│ │     [Video Content Area]           │   │
│ │                                    │   │
│ └────────────────────────────────────┘   │
│                                          │
│ Timeline with Annotations:               │
│ ◼─────●──────●──────────────────────◼   │
│ 0:00  0:15   0:45              5:30      │
│       [marker] [marker]                 │
│                                          │
│ Controls:                                │
│ [▶] [🔊] [Speed: 1x] [Full Screen]     │
│ Current: 0:45 / Duration: 5:30         │
│                                          │
│ Info:                                    │
│ Resolution: 1920x1080 | Codec: H.264   │
│ Bitrate: 5000 kbps | Status: Ready     │
└──────────────────────────────────────────┘
```

#### Input Fields & Data Mapping
| Field | Type | Source | Purpose |
|-------|------|--------|---------|
| Video Source | url | metadata.renditions[].hlsManifestUrl | HLS stream |
| Thumbnail | image | media_renditions.thumbnailUrl | Preview |
| Annotations | array | annotations for this version | Timeline markers |
| Duration | number | metadata.mediaInfo.durationMs | Timeline max |
| Current Time | number | player state | Timeline position |

#### Buttons & Actions
| Control | Action | Effect |
|---------|--------|--------|
| Play/Pause | Click | Toggle playback |
| Seek Bar | Click/Drag | Jump to time OR create annotation |
| Volume | Slider | Change audio level |
| Speed | Select | Change playback speed |
| Quality | Select | Switch HLS rendition |
| Fullscreen | Click | Enter fullscreen mode |
| Timeline Marker | Click | Jump to time + show annotation |
| [Add Annotation] | Click | Create annotation at current time |

#### Player Events
- `PLAY` → Start playback
- `PAUSE` → Pause playback
- `SEEK` → Jump to time
- `TIME_UPDATE` → Periodically update current time
- `ENDED` → Video ended
- `ERROR` → Playback error (fallback to direct URL)

#### Fallback Mechanism
```
If HLS fails:
1. Try fallback direct URL (presigned URL)
2. Show warning: "HD not available, playing SD"
3. If both fail: Show error + suggest download
```


#### Parent/Child Screens
- Parent: Asset Detail (Preview tab)
- Child: Annotation Panel (overlaid)

---

### Screen 14: Image Viewer Page
**Mức ưu tiên:** P0  
**Loại:** Component/Page  
**Usecase phục vụ:** UC-C02, UC-D02

#### Mục Đích
Xem ảnh zoom/pan, vẽ annotation vùng.

#### Chức Năng Chính
- Display image (zoom to fit / actual size)
- Zoom in/out
- Pan (drag to move)
- Annotation regions (draw rectangle/circle/freehand)
- Fullscreen toggle
- Download image

#### Layout
```
┌────────────────────────────────────┐
│ IMAGE VIEWER                       │
│ ┌──────────────────────────────┐   │
│ │                              │   │
│ │     [Image with Regions]     │   │
│ │     ┌──────────────────┐     │   │
│ │     │ ◆ Region 1       │     │   │
│ │     │ Comment: "..."   │     │   │
│ │     └──────────────────┘     │   │
│ │                              │   │
│ └──────────────────────────────┘   │
│                                    │
│ Controls:                          │
│ [🔍+] [🔍-] [Fit] [100%] [Full]   │
│ [🎨 Draw] [✎ Text] [Clear]       │
│                                    │
│ Regions List:                      │
│ • Region 1: Comment by John       │
│ • Region 2: Comment by Mary       │
└────────────────────────────────────┘
```

#### Input Fields & Data Mapping
| Field | Type | Source | Purpose |
|-------|------|--------|---------|
| Image Source | url | metadata.objectName (presigned URL) | Display |
| Annotations | array | annotations for this version | Draw regions |
| Zoom Level | number | user input | Scale |
| Pan Position | {x, y} | drag state | Translate |

#### Buttons & Actions
| Control | Action | Effect |
|---------|--------|--------|
| [+] Zoom | Click | Zoom in (max 400%) |
| [-] Zoom | Click | Zoom out (min 10%) |
| [Fit] | Click | Fit image to window |
| [100%] | Click | Actual size |
| [Full Screen] | Click | Fullscreen mode |
| [🎨 Draw] | Click | Enter draw mode (select shape) |
| Shape Tools | Select | Rectangle / Circle / Freehand |
| [✎ Add Text] | Click | Add text annotation |
| Draw on image | Click & drag | Create annotation region |
| Region | Click | Select region → Show details |
| [Clear] | Click | Remove all annotations |
| [Download] | Click | Download image file |

#### Parent/Child Screens
- Parent: Asset Detail (Preview tab)
- Child: Annotation Panel (overlaid)

---

## PHẦN VI: ANNOTATION & REVIEW

### Screen 15: Annotation Panel / Drawing Tools
**Mức ưu tiên:** P0  
**Loại:** Component/Overlay  
**Usecase phục vụ:** UC-D01, UC-D02, UC-D03

#### Mục Đích
Công cụ vẽ annotation (timecode / region) trên video hoặc ảnh.

#### Chức Năng Chính
**Cho Video (Timecode):**
- Ghi lại timecode hiện tại (hoặc range: start-end)
- Nhập comment text
- Gắn với thread comment
- Submit annotation

**Cho Image (Region):**
- Vẽ rectangle / circle / freehand
- Nhập comment text
- Adjust region (drag, resize)
- Submit annotation

#### Layout - Video Annotation
```
┌─────────────────────────────────┐
│ ADD ANNOTATION - VIDEO          │
├─────────────────────────────────┤
│                                 │
│ Time: 0:15 - 0:30 (15 sec)      │
│ [Clear Selection]               │
│                                 │
│ Comment:                        │
│ [Text area for comment...]      │
│ (max 1000 chars)                │
│                                 │
│ Type: [Timecode ▼]              │
│ Mention: [@user]                │
│ Tags: [#tag1] [#tag2]           │
│                                 │
│ [Post Annotation] [Cancel]      │
└─────────────────────────────────┘
```

#### Layout - Image Annotation
```
┌─────────────────────────────────┐
│ ADD ANNOTATION - IMAGE          │
├─────────────────────────────────┤
│                                 │
│ Shape: [Rectangle ▼]            │
│ Coordinates: x=100, y=50        │
│ Size: 200x150 px                │
│ [Clear Region] [Adjust]         │
│                                 │
│ Comment:                        │
│ [Text area for comment...]      │
│ (max 1000 chars)                │
│                                 │
│ Mention: [@user]                │
│                                 │
│ [Post Annotation] [Cancel]      │
└─────────────────────────────────┘
```

#### Input Fields & Data Mapping
| Field | Type | For | Validation | Database |
|-------|------|-----|-----------|----------|
| Time Range | [start, end] | Video | 0 ≤ start ≤ end ≤ duration | annotations.timeCodeStart/End |
| Shape Type | select | Image | Rectangle/Circle/Freehand | annotations.shape |
| Coordinates | array | Image | Valid pixel coordinates | annotations.coordinates |
| Comment Text | textarea | Both | max 1000 chars, required | comment_threads.content |
| Mention Users | mentions | Both | Parse @username | comment_threads.mentions[] |
| Tags | tags | Both | #tag format (optional) | annotations.tags[] |

#### Buttons & Actions
| Button | Action | Result |
|--------|--------|--------|
| [Time Controls] | Set start/end | Record timecode range |
| [Rectangle/Circle] | Select | Switch draw mode |
| Draw on Image | Drag | Create region shape |
| [Adjust] | Click | Edit region (drag, resize) |
| [Clear] | Click | Reset annotation |
| [@Mention] | Type | Show user autocomplete |
| [Post Annotation] | Click | Validate → Create annotation + thread → Reload → Close panel |
| [Cancel] | Click | Close panel without saving |
| [Edit] | On existing | Open edit mode |
| [Delete] | On existing | Confirm delete |

#### Parent/Child Screens
- Parent: Video Player OR Image Viewer
- Child: Comment Thread Panel

---

### Screen 16: Comment Thread Panel
**Mức ưu tiên:** P0  
**Loại:** Component/Sidebar  
**Usecase phục vụ:** UC-D03

#### Mục Đích
Xem và trả lời comments trong một thread annotation.

#### Layout
```
┌────────────────────────────────────┐
│ COMMENT THREAD - Annotation #1     │
│ (Timecode: 0:15-0:30)              │
├────────────────────────────────────┤
│                                    │
│ Root Comment (John, 2 hours ago)  │
│ ┌─────────────────────────────────┤
│ │ "Music timing feels off"        │
│ │ [Edit] [Delete] [Copy Link]    │
│ └─────────────────────────────────┤
│                                    │
│ Replies (2):                       │
│ ┌─────────────────────────────────┤
│ │ Mary (1 hour ago):              │
│ │ "I'll fix this in next version" │
│ │ [Reply] [Edit] [Delete]        │
│ └─────────────────────────────────┤
│                                    │
│ ┌─────────────────────────────────┤
│ │ John (30 min ago):              │
│ │ "Thanks!"                       │
│ │ [Reply] [Edit] [Delete]        │
│ └─────────────────────────────────┤
│                                    │
│ ┌─────────────────────────────────┤
│ │ Your Reply:                     │
│ │ [Type reply text...         ]   │
│ │                                 │
│ │ [Post Reply] [Cancel]          │
│ └─────────────────────────────────┤
│                                    │
│ [Resolve Thread]                   │
│ Status: OPEN ▼                     │
│ [OPEN] [RESOLVED]                 │
│                                    │
│ [Close] [Next Thread]             │
└────────────────────────────────────┘
```

#### Chức Năng Chính
- Display root comment + replies (threaded)
- Add reply to thread
- Edit own comment
- Delete own comment
- Resolve/Reopen thread
- Mention user in reply
- Navigate next/previous thread

#### Input Fields & Data Mapping
| Field | Type | Source | Purpose |
|-------|------|--------|---------|
| Thread | object | comment_threads | Root + replies |
| Comments | array | comment_threads.comments | Display |
| Reply Input | textarea | user input | New reply |
| Thread Status | enum | comment_threads.status | OPEN/RESOLVED |

#### Buttons & Actions
| Button | Action | Result |
|--------|--------|--------|
| [Reply] | On comment | Focus reply input |
| [Edit] | Own comment | Inline edit (if < 5 min old) |
| [Delete] | Own comment | Confirm delete → Remove comment |
| [Copy Link] | Comment | Copy permalink to clipboard |
| [Post Reply] | Click | Validate → Insert comment → Reload thread → Notify mentioned |
| [Resolve Thread] | Click | Change status OPEN → RESOLVED |
| [Reopen] | Click | Change status RESOLVED → OPEN |
| [Next Thread] | Click | Jump to next annotation thread |
| [Previous Thread] | Click | Jump to previous annotation thread |
| [Close] | Click | Close panel |


#### Parent/Child Screens
- Parent: Asset Detail (Comments tab) OR Video/Image Player (overlay)
- Child: None

---

### Screen 17: Version Compare Modal (A/B)
**Mức ưu tiên:** P1  
**Loại:** Modal  
**Usecase phục vụ:** UC-E04

#### Mục Đích
So sánh hai phiên bản video/ảnh side-by-side hoặc overlay.

#### Layout - Side by Side
```
┌─────────────────────────────────┐
│ COMPARE VERSIONS                │
├────────────────┬────────────────┤
│ VERSION A:     │ VERSION B:     │
│ v2 (2026-04-05) │ v3 (2026-04-08) │
│                │                │
│ [Player A]     │ [Player B]      │
│ 0:45 / 5:30    │ 0:45 / 5:30    │
│                │                │
│ [Sync Play ☑]  │ [Sync Pause ☑] │
│                │                │
│ [Swap] [Close] │                │
└────────────────┴────────────────┘
```

#### Layout - Overlay
```
┌────────────────────────────────┐
│ COMPARE OVERLAY                │
├────────────────────────────────┤
│                                │
│ [Main Video v3]                │
│ ┌──────────────────────────────┐│
│ │ [Overlay V2] (drag to move)  ││
│ │ Opacity: ░░░░░░░░░░ 50%      ││
│ └──────────────────────────────┘│
│                                │
│ [Previous] [Play] [Next]       │
│ [A/B View] [Close]             │
└────────────────────────────────┘
```

#### Chức Năng Chính
**Side-by-Side:**
- 2 independent players
- Sync play/pause (optional)
- Swap positions
- Switch to overlay view

**Overlay:**
- Main version + transparent overlay
- Drag overlay to reposition
- Opacity slider
- Switch to side-by-side view

#### Input Fields & Data Mapping
| Field | Type | Source | Purpose |
|-------|------|--------|---------|
| Version A | reference | metadata (selected version) | Player A source |
| Version B | reference | metadata (selected version) | Player B source |
| Opacity | slider | 0-100 | Overlay transparency |
| Sync Mode | checkbox | user preference | Link players |

#### Buttons & Actions
| Button | Action |
|--------|--------|
| [Sync Play] | Toggle sync mode |
| [Swap] | Swap Version A ↔ B |
| [A/B View] | Toggle side-by-side / overlay |
| [Opacity Slider] | Adjust overlay transparency |
| [Close] | Close compare modal |

#### Parent/Child Screens
- Parent: Asset Detail (Versions tab)
- Child: None

---

## PHẦN VII: REVIEW WORKFLOW

### Screen 18: Create Review Session Modal (Wizard)
**Mức ưu tiên:** P0  
**Loại:** Modal (4-step wizard)  
**Usecase phục vụ:** UC-F01

#### Mục Đích
Tạo phiên review bằng wizard 4 bước.

#### Step 1: Select Version
```
┌──────────────────────────────────┐
│ CREATE REVIEW SESSION - Step 1/4 │
├──────────────────────────────────┤
│ Asset: Banner - Hero             │
│                                  │
│ SELECT VERSION:                  │
│ ○ v1 - APPROVED (2026-04-02)    │
│ ○ v2 - CHANGES (2026-04-05)     │
│ ● v3 - LATEST (2026-04-08) ✓    │
│                                  │
│ [Previous (disabled)] [Next]     │
│ [Cancel]                         │
└──────────────────────────────────┘
```

#### Step 2: Add Reviewers
```
┌──────────────────────────────────┐
│ CREATE REVIEW SESSION - Step 2/4 │
├──────────────────────────────────┤
│ Add Reviewers                    │
│                                  │
│ From Team:                       │
│ ☑ John Smith (APPROVER)         │
│ ☑ Mary Johnson (REVIEWER)        │
│ ☐ Tom Wilson (REVIEWER)         │
│                                  │
│ Invite External:                 │
│ [new@email.com________]          │
│ Role: [REVIEWER ▼]               │
│ [+ Add More]                     │
│                                  │
│ [Previous] [Next]                │
│ [Cancel]                         │
└──────────────────────────────────┘
```

#### Step 3: Set Details
```
┌──────────────────────────────────┐
│ CREATE REVIEW SESSION - Step 3/4 │
├──────────────────────────────────┤
│ Title:                           │
│ [Banner - Hero Review_______]   │
│                                  │
│ Description:                     │
│ [Please review color accuracy    │
│  and brand compliance...       ]│
│                                  │
│ Deadline:                        │
│ [2026-04-10 📅] [2:00 PM 🕐]    │
│                                  │
│ Notify Reviewers:                │
│ ☑ Send immediately              │
│ ☑ Reminder 1 day before deadline│
│                                  │
│ [Previous] [Next]                │
│ [Cancel]                         │
└──────────────────────────────────┘
```

#### Step 4: Confirm & Send
```
┌──────────────────────────────────┐
│ CREATE REVIEW SESSION - Step 4/4 │
├──────────────────────────────────┤
│ CONFIRM:                         │
│ Asset: Banner - Hero             │
│ Version: v3 (2026-04-08)         │
│ Reviewers: John, Mary            │
│ Deadline: 2026-04-10 2:00 PM     │
│                                  │
│ Emails to send:                  │
│ • john@company.com (APPROVER)   │
│ • mary@company.com (REVIEWER)   │
│                                  │
│ [Previous] [✓ Create Review]     │
│ [Cancel]                         │
└──────────────────────────────────┘
```

#### Input Fields & Data Mapping
| Step | Field | Type | Validation | Database |
|------|-------|------|-----------|----------|
| 1 | Version | select | versionId must exist | review_sessions.versionId |
| 2 | Reviewers | multi-select | min 1 reviewer | review_sessions.reviewers[] |
| 2 | New Email | email | valid format | users (lookup or invite) |
| 3 | Title | text | max 200 chars, optional | review_sessions.title |
| 3 | Description | textarea | max 1000 chars, optional | review_sessions.description |
| 3 | Deadline | datetime | must be in future | review_sessions.deadline |
| 3 | Notifications | checkboxes | optional | (processing logic) |

#### Buttons & Actions
| Button | Step | Action |
|--------|------|--------|
| [Next] | 1-3 | Validate → Go to next step |
| [Previous] | 2-4 | Go to previous step |
| [Create Review] | 4 | Validate all → Insert review_sessions → Send emails → Close modal → Redirect to review page |
| [Cancel] | Any | Confirm → Close modal |


#### Parent/Child Screens
- Parent: Asset Detail (Review tab) OR Folder Browser (context menu)
- Child: Review Session page (after creation)

---

### Screen 19: Review Session Page (Reviewer POV)
**Mức ưu tiên:** P0  
**Loại:** Page  
**Usecase phục vụ:** UC-D01, UC-D02, UC-D03, UC-F01

#### Mục Đích
Phiên review chính - reviewer xem asset, vẽ annotation, comment, approve/reject.

#### Layout
```
┌──────────────────────────────────────────────────────┐
│ Review: Banner - Hero | John's Review                │
├──────────────────────────────────────────────────────┤
│ Status: ⏳ IN_REVIEW (2/3 done) | Deadline: 2 days │
├───────────────────────┬──────────────────────────────┤
│ TIMELINE              │ ANNOTATION PANEL             │
│ ⏱ 0:00 ┣━━┓           │ ┌────────────────────────┐   │
│        ┃ ●            │ │ ADD ANNOTATION         │   │
│ ⏱ 0:15 ┣━━┓           │ │ Time: 0:15 - 0:30      │   │
│        ┃ ●            │ │ Comment: [type...]     │   │
│ ⏱ 0:45 ┣━━┓           │ │ [@Mention] [#Tags]     │   │
│        ┃ ●            │ │ [Post] [Cancel]        │   │
│ ⏱ 1:30 ┣━━┓           │ └────────────────────────┘   │
│        ┃ ●            │ or                           │
│ ...                   │ ┌────────────────────────┐   │
│                       │ │ COMMENTS (5)           │   │
│ [Add Annotation]      │ ├────────────────────────┤   │
│                       │ │ John: "Music timing..."│   │
│                       │ │ └─ Mary: "I'll fix..." │   │
│                       │ │                        │   │
│                       │ │ [Next Annotation]      │   │
│                       │ └────────────────────────┘   │
│                       │                              │
│                       │ ACTIONS:                     │
│                       │ [Approve] [Reject] [More]   │
└───────────────────────┴──────────────────────────────┘
```

#### Chức Năng Chính
- Video player (fullscreen capable)
- Timeline với annotation markers
- Add annotation (timecode)
- View comments on annotations
- Reply to comments
- Resolve comments
- Status actions (Approve / Request Changes / More)
- Reviewer info (progress 2/3)

#### Input Fields & Data Mapping
| Field | Type | Source | Purpose |
|-------|------|--------|---------|
| Asset Info | object | assets + metadata | Header display |
| Review Session | object | review_sessions | Status, deadline, reviewers |
| Reviewers List | array | review_sessions.reviewers | Progress display |
| Video | stream | metadata.renditions[].hlsManifestUrl | Playback |
| Timeline Markers | array | annotations for this version | Timeline dots |
| Annotations | array | annotations + comment_threads | Display |

#### Buttons & Actions
| Button | Action | Result |
|--------|--------|--------|
| [Add Annotation] | Click | Show annotation panel |
| Timeline Marker | Click | Jump to time + show related annotations |
| [Next Annotation] | Click | Jump to next annotation on timeline |
| [Previous Annotation] | Click | Jump to previous annotation |
| [Reply] | On comment | Focus reply input |
| [Resolve] | On thread | Mark thread as RESOLVED |
| [Approve] | Click | Confirm → Mark review status APPROVED → Notify creator → Navigate to next project |
| [Reject / Request Changes] | Click | Modal: Enter feedback → Mark status REQUEST_CHANGES → Notify creator |
| [More] | Click | Menu: Mark as pending, skip, save draft |

#### Parent/Child Screens
- Parent: Notification OR Asset Detail
- Child: Annotation Panel, Comment Thread Panel

---

## PHẦN VIII: VERSION MANAGEMENT

### Screen 20: Upload New Version Modal
**Mức ưu tiên:** P0  
**Loại:** Modal  
**Usecase phục vụ:** UC-B02, UC-E02

#### Mục Đích
Upload phiên bản mới của asset, giữ lại feedback cũ.

#### Layout
```
┌────────────────────────────────────┐
│ UPLOAD NEW VERSION                 │
├────────────────────────────────────┤
│                                    │
│ Asset: Banner - Hero               │
│ Current Version: v3 (2026-04-08)   │
│ New Version: v4                    │
│                                    │
│ Select File:                       │
│ [📁 Choose File] or [Drag & Drop]  │
│ (video/image, max 5GB)             │
│                                    │
│ ┌─ Upload: banner_hero_v4.mp4   │
│ │ 280 MB | Ready to upload        │
│ │ [Clear]                         │
│ └────────────────────────────────┘ │
│                                    │
│ Version Notes (optional):          │
│ [Fixed color grading + music...] │
│                                    │
│ Previous Feedback:                 │
│ ☑ Keep all comments & annotations  │
│ ☑ Notify reviewers of new version  │
│                                    │
│ [Upload] [Cancel]                 │
└────────────────────────────────────┘
```

#### Chức Năng Chính
- File picker / drag & drop
- Validate file (type, size)
- Auto-increment version number
- Add version notes
- Option to keep/discard feedback
- Option to notify reviewers

#### Input Fields & Data Mapping
| Field | Type | Validation | Database |
|-------|------|-----------|----------|
| File | file | video/image format, max 5GB | (to MinIO) |
| Version Notes | textarea | max 500 chars, optional | metadata.description |
| Keep Feedback | checkbox | default: true | (logic) |
| Notify Reviewers | checkbox | default: true | (trigger notifications) |
| Auto Version Number | hidden | auto-increment | metadata.versionNumber |

#### Buttons & Actions
| Button | Action |
|--------|--------|
| [Choose File] | File picker dialog |
| [Drag & Drop] | Drop zone file input |
| [Clear] | Remove selected file |
| [Upload] | Validate → Insert metadata → Initiate multipart → Show progress → Trigger processing → Close modal |
| [Cancel] | Close modal |

#### Parent/Child Screens
- Parent: Asset Detail (Versions tab)
- Child: Asset Detail (Versions tab, updated)

---

### Screen 21: Version List & Details
**Mức ưu tiên:** P0  
**Loại:** Component (within Asset Detail)  
**Usecase phục vụ:** UC-E01, UC-E02, UC-E03

#### Mục Đích
Hiển thị lịch sử version, status xử lý, review info, download/compare buttons.

#### Layout
```
┌──────────────────────────────────────────────────┐
│ VERSION HISTORY                                  │
│ [Set as Active Version: v3 ▼]                   │
├──────────────────────────────────────────────────┤
│                                                  │
│ v3 - 2026-04-08 14:30 | IN_REVIEW (ACTIVE)  │
│ ┌────────────────────────────────────────────┐  │
│ │ Uploaded by: Mary | 155 MB                │  │
│ │ Processing: ✅ READY                       │  │
│ │ Resolution: 1920x1080 | Duration: 5m 30s │  │
│ │                                            │  │
│ │ Review Session: Approved by John ✓        │  │
│ │ Reviewers: John ✓ Mary ⏳ Tom ⏳          │  │
│ │ Deadline: 2026-04-10 (2 days)            │  │
│ │                                            │  │
│ │ [View] [Download] [Compare with v2]      │  │
│ │ [Request Changes] [Create Review]        │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ v2 - 2026-04-05 10:15 | CHANGES_REQUESTED  │
│ ┌────────────────────────────────────────────┐  │
│ │ Uploaded by: Mary | 160 MB                │  │
│ │ Processing: ✅ READY                       │  │
│ │ Resolution: 1920x1080 | Duration: 5m 30s │  │
│ │                                            │  │
│ │ Review: John requested changes            │  │
│ │ Feedback: "Fix color grading"            │  │
│ │                                            │  │
│ │ [View] [Download] [Compare with v1]      │  │
│ │ [View Feedback]                          │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ v1 - 2026-04-02 09:00 | APPROVED            │
│ ┌────────────────────────────────────────────┐  │
│ │ Uploaded by: John | 150 MB                │  │
│ │ Processing: ✅ READY                       │  │
│ │ Resolution: 1920x1080 | Duration: 5m 30s │  │
│ │                                            │  │
│ │ [View] [Download] [Compare with...]      │  │
│ └────────────────────────────────────────────┘  │
│                                                  │
│ [+ Upload New Version]                         │
└──────────────────────────────────────────────────┘
```

#### Chức Năng Chính
- Xem danh sách version sắp xếp mới nhất trước
- Show processing status cho từng version
- Show review status + reviewers
- Download version
- Compare versions
- Set active version
- Create review session từ version cũ

#### Input Fields & Data Mapping
| Field | Type | Source | Purpose |
|-------|------|--------|---------|
| Version List | array | metadata (ordered by versionNumber desc) | Display |
| Processing Status | enum | metadata.processingStatus | Show processing state |
| Review Status | enum | assets.assetStatus OR review_sessions.status | Show review state |
| Reviewers | array | review_sessions.reviewers | Show approval progress |
| Deadline | date | review_sessions.deadline | Show time left |
| Active Version | reference | (from UI state or query param) | Mark as ACTIVE |

#### Buttons & Actions
| Button | Action | Result |
|--------|--------|--------|
| [Set as Active] | Click | Dropdown select version → Update activeVersionId → Reload |
| [View] | Click | Navigate to version playback (read-only) |
| [Download] | Click | Download presigned URL → Browser download |
| [Compare with vX] | Click | Modal: Version compare (side-by-side) |
| [Request Changes] | Click | Change asset status REQUEST_CHANGES → Notify owner |
| [Create Review] | Click | Modal: Create review session for this version |
| [View Feedback] | Click | Show all annotations/comments for this version |
| [+ Upload New Version] | Click | Modal: Upload new version |

#### Parent/Child Screens
- Parent: Asset Detail (Versions tab)
- Child: Video Player, Version Compare Modal, Create Review Modal

---

## PHẦN IX: NOTIFICATIONS & ACTIVITY

### Screen 22: Notification Panel
**Mức ưu tiên:** P1  
**Loại:** Dropdown/Panel  
**Usecase phục vụ:** UC-G01

#### Mục Đích
Hiển thị thông báo real-time (in-app) cho user.

#### Layout
```
┌──────────────────────────────────────┐
│ NOTIFICATIONS (12 unread)           │
├──────────────────────────────────────┤
│ Mark all as read                    │
├──────────────────────────────────────┤
│                                      │
│ 🔴 NEW ANNOTATION                   │
│ John added annotation to Banner Hero│
│ "Music timing feels off"             │
│ 2 minutes ago                        │
│ [View]                              │
│                                      │
│ 🟢 REVIEW APPROVED                  │
│ Banner Hero approved by John         │
│ 1 hour ago                          │
│ [View]                              │
│                                      │
│ 🔵 MENTION                          │
│ Mary mentioned you in Banner review │
│ "@John please check color grading"  │
│ 2 hours ago                         │
│ [View]                              │
│                                      │
│ ├─ More old notifications (9)       │
│                                      │
│ [View All Notifications]            │
│ [Settings]                          │
└──────────────────────────────────────┘
```

#### Chức Năng Chính
- Show notification count badge
- List recent notifications (limit 5)
- Show notification type with icon
- Show time ago
- Mark as read
- Mark all as read
- Navigate to related item
- Notification settings

#### Input Fields & Data Mapping
| Field | Type | Source | Purpose |
|-------|------|--------|---------|
| Notifications | array | notifications (userId, unread first, limit 5) | Display |
| Unread Count | number | notifications.countDocuments({userId, read: false}) | Badge |
| Notification Type | enum | ANNOTATION, REVIEW, MENTION, STATUS_CHANGE | Icon/color |
| Related ID | reference | notifications.relatedId | Navigate to |

#### Buttons & Actions
| Button | Action |
|--------|--------|
| Notification Card | Click | Mark as read → Navigate to related item |
| [Mark as read] | Click | Mark single notification as read |
| [Mark all as read] | Click | Mark all notifications as read |
| [View All] | Click | Navigate to full notification page |
| [Settings] | Click | Navigate to notification preferences |

#### Notification Types
- `NEW_ANNOTATION` - Reviewer added annotation to your asset
- `NEW_COMMENT` - Someone replied to your comment
- `MENTION` - You were mentioned in a comment
- `REVIEW_INVITE` - Invited to review an asset
- `REVIEW_APPROVED` - Your asset was approved
- `REVIEW_REJECTED` - Your asset needs changes
- `MENTION_ANNOTATION` - Someone mentioned you in annotation
- `STATUS_CHANGED` - Asset status changed

#### Real-Time Updates
- Use SSE (Server-Sent Events) atau WebSocket
- Send event on: new annotation, comment, mention, status change
- Client receives → Update notification count → Show toast message

#### Parent/Child Screens
- Parent: Header (global)
- Child: Notification Page, Settings

---

## PHẦN X: SEARCH & ANALYTICS

### Screen 23: Global Search Results
**Mức ưu tiên:** P1  
**Loại:** Page  
**Usecase phục vụ:** UC-D04

#### Mục Đích
Tìm kiếm asset, project, annotation, comments across system.

#### Layout
```
┌────────────────────────────────────────────┐
│ Search: "banner hero"                      │
│ [Filters] [Sort] [Clear]                   │
├────────────────────────────────────────────┤
│                                            │
│ ASSETS (8 results)                         │
│ ├─ Banner - Hero v3 (Project 1)           │
│ │  Status: IN_REVIEW | Owner: John        │
│ │ [View] [Open in Review]                 │
│ │                                          │
│ ├─ Banner - Hero v2 (Project 1)           │
│ │  Status: APPROVED | Owner: John         │
│ └─ ...                                     │
│                                            │
│ PROJECTS (2 results)                       │
│ ├─ Holiday Campaign 2026                   │
│ │  12 assets | Status: ACTIVE             │
│ │ [Open Project]                          │
│ └─ ...                                     │
│                                            │
│ COMMENTS (5 results)                       │
│ ├─ "Fix color grading" by John            │
│ │  In: Banner Hero v2 → [View Context]    │
│ └─ ...                                     │
│                                            │
│ [Show more results...]                     │
└────────────────────────────────────────────┘
```

#### Chức Năng Chính
- Full-text search across assets, projects, comments
- Filter by: Type, Status, Owner, Project
- Sort by: Relevance, Date, Name
- Show context/snippet
- Quick navigate actions

#### Input Fields & Data Mapping
| Field | Type | Source | Purpose |
|-------|------|--------|---------|
| Search Query | text | user input | Search term |
| Result Type | multi-select | filter | ASSET, PROJECT, COMMENT |
| Status Filter | multi-select | filter | APPROVED, IN_REVIEW, etc |
| Owner Filter | multi-select | filter | User IDs |
| Date Range | date-range | filter | createdAt between dates |

---

## PHẦN XI: SETTINGS & PREFERENCES

### Screen 24: User Settings / Profile
**Mức ưu tiên:** P1  
**Loại:** Page  
**Usecase phục vụ:** UC-A01

#### Mục Đích
Quản lý profile user, notification preferences, security settings.

#### Layout
```
┌───────────────────────────────────────┐
│ ACCOUNT SETTINGS                      │
├───────────────────────────────────────┤
│                                       │
│ PROFILE:                              │
│ Avatar: [Upload Avatar]               │
│ Name: [John Smith________]            │
│ Email: john@company.com (verified)   │
│ Timezone: [UTC ▼]                    │
│ Locale: [English ▼]                  │
│                                       │
│ [Save Profile]                        │
│                                       │
│ NOTIFICATIONS:                        │
│ ☑ Email on new annotation             │
│ ☑ Email on mention                    │
│ ☑ Email on status change              │
│ ☑ In-app notifications               │
│ ☑ Digest email (weekly)              │
│                                       │
│ [Save Preferences]                    │
│                                       │
│ SECURITY:                             │
│ Password: [Change Password]           │
│ OAuth Connected: Google               │
│ Sessions: [View Active Sessions]      │
│ Two-Factor Auth: Disable              │
│                                       │
│ [Enable 2FA] [Logout All Sessions]    │
│                                       │
│ DANGER ZONE:                          │
│ [Delete Account]                      │
└───────────────────────────────────────┘
```

#### Input Fields & Data Mapping
| Field | Type | Database | Validation |
|-------|------|----------|-----------|
| Avatar | file/url | users.metadata.avatar | image, max 2MB |
| Name | text | users.publicUserName | 2-100 chars |
| Timezone | select | users.metadata.timezone | Valid timezone |
| Locale | select | users.metadata.locale | Supported language |
| Notification Prefs | checkboxes | users.notificationPreferences | - |
| Password | password | users.password (hashed) | min 8 chars, current required |

#### Buttons & Actions
| Button | Section | Action |
|--------|---------|--------|
| [Upload Avatar] | Profile | File picker |
| [Save Profile] | Profile | Update user profile |
| [Save Preferences] | Notifications | Update preferences |
| [Change Password] | Security | Modal: Enter current + new password |
| [View Active Sessions] | Security | Show list of active sessions with logout option |
| [Enable 2FA] | Security | Modal: Setup 2FA (TOTP) |
| [Logout All Sessions] | Security | Confirm → Invalidate all tokens |
| [Delete Account] | Danger | Confirm → Soft delete account → Redirect login |

---

## SUMMARY TABLE

| # | Screen Name | Priority | Type | Usecase | Parent | Child |
|---|-------------|----------|------|---------|--------|-------|
| 1 | Login | P0 | Page | UC-A01 | - | Dashboard |
| 2 | Register | P0 | Page | UC-A01 | Login | Dashboard |
| 3 | Password Reset | P1 | Page | UC-A01 | Email Link | Login |
| 4 | Dashboard | P0 | Page | UC-A01,B04,F02 | - | Project Detail |
| 5 | Project List | P0 | Panel | UC-A02 | Global | Project Detail |
| 6 | Create Project Modal | P0 | Modal | UC-B02 | Dashboard | Project Detail |
| 7 | Project Detail | P0 | Page | UC-A02,F02,B04 | Dashboard | Files, Create Folder |
| 8 | Project Settings | P1 | Page | UC-A02 | Project Detail | Project Detail |
| 9 | Folder Browser | P0 | Page | UC-B01,B02,E01,F02 | Project Detail | Asset Detail |
| 10 | Create Folder Modal | P0 | Modal | UC-B02 | Folder Browser | Folder Browser |
| 11 | Upload Modal | P0 | Modal | UC-B01,B03 | Folder Browser | Asset Detail |
| 12 | Asset Detail | P0 | Page | UC-B01,E01,E02,F02 | Folder Browser | Video/Image Player |
| 13 | Video Player | P0 | Page | UC-C01,C02,D01,D02 | Asset Detail | Annotation Panel |
| 14 | Image Viewer | P0 | Page | UC-C02,D02 | Asset Detail | Annotation Panel |
| 15 | Annotation Panel | P0 | Component | UC-D01,D02,D03 | Video/Image | Comment Thread |
| 16 | Comment Thread Panel | P0 | Component | UC-D03 | Asset Detail | - |
| 17 | Version Compare Modal | P1 | Modal | UC-E04 | Asset Detail | - |
| 18 | Create Review Session | P0 | Modal | UC-F01 | Asset Detail | Review Session |
| 19 | Review Session | P0 | Page | UC-D01,D02,D03,F01 | Notification | - |
| 20 | Upload New Version | P0 | Modal | UC-B02,E02 | Asset Detail | Asset Detail |
| 21 | Version List | P0 | Component | UC-E01,E02,E03 | Asset Detail | Video/Compare |
| 22 | Notification Panel | P1 | Panel | UC-G01 | Global Header | Notification Page |
| 23 | Search Results | P1 | Page | UC-D04 | Global Search | Asset/Project Detail |
| 24 | User Settings | P1 | Page | UC-A01 | Global Header | - |

---

## Database Collections Checklist

✅ users
✅ projects
✅ folders
✅ assets
✅ metadata (versions)
✅ media_renditions
✅ review_sessions
✅ annotations
✅ comment_threads
✅ processing_jobs
✅ audit_logs
✅ notifications
✅ playback_events (metrics)

---

## Key Points

1. **Permission Check**: Mỗi screen phải check quyền user (READ, COMMENT, MODIFY, OWNER)
2. **Version-Centric**: Annotation + Comments luôn gắn với versionId cụ thể
3. **Async Processing**: Media processing diễn ra background, UI polling/SSE update progress
4. **Soft Delete**: Asset/Folder/Project soft delete (isTrash flag), hard delete after TTL
5. **Audit Trail**: Mọi action quan trọng log vào audit_logs
6. **Real-Time**: Notifications dùng SSE hoặc WebSocket
7. **Responsive**: Tất cả screen phải support mobile + tablet + desktop
