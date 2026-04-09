# Project & Folder Structure - Business Requirements Document

## 1. Tổng quan

Hệ thống Media Review Platform cần hỗ trợ tổ chức dữ liệu theo mô hình **Project → Folders → Assets** để cho phép:
- Quản lý nhiều dự án riêng biệt
- Tổ chức asset theo thư mục cấp bậc (nested folders)
- Phân quyền linh hoạt theo project/folder
- Tracking workflow review tại project level

---

## 2. Các thực thể chính

### 2.1 PROJECT (Dự án)

**Định nghĩa**: Đơn vị lớn nhất, đại diện cho một chiến dịch/dự án media.

**Ví dụ thực tế**:
- "Holiday Campaign 2026"
- "Q1 Product Launch"
- "Brand Refresh 2026"

**Thuộc tính chính**:
| Thuộc tính | Loại | Ý nghĩa |
|---|---|---|
| `projectId` | ObjectId | Định danh duy nhất |
| `projectName` | String | Tên dự án (vd: "Holiday Campaign 2026") |
| `projectCode` | String | Mã code duy nhất (vd: "HOLIDAY_2026") |
| `description` | String | Mô tả chi tiết dự án |
| `ownerId` | ObjectId | User sở hữu/tạo project |
| `clientName` | String | Tên client (nếu có) |
| `category` | Enum | CAMPAIGN \| BRANDING \| PRODUCT \| OTHER |
| `startDate` | ISODate | Ngày bắt đầu dự án |
| `endDate` | ISODate | Ngày kết thúc dự án |
| `status` | Enum | ACTIVE \| ARCHIVED \| COMPLETED |
| `stats` | Object | folderCount, assetCount, pendingReviews (denormalized) |
| `collaborators[]` | Array | Danh sách người cộng tác (role: EDITOR, REVIEWER, VIEWER) |

---

### 2.2 FOLDER (Thư mục)

**Định nghĩa**: Dùng để tổ chức hierarchical các asset trong một project.

**Ví dụ thực tế**:
```
Holiday Campaign 2026/
├─ Banner Designs/
│  ├─ Desktop Variants/
│  ├─ Mobile Variants/
│  └─ Tablet Variants/
├─ Hero Images/
│  ├─ 4K/
│  └─ Standard/
└─ Social Media/
   ├─ Instagram/
   └─ Facebook/
```

**Thuộc tính chính**:
| Thuộc tính | Loại | Ý nghĩa |
|---|---|---|
| `folderId` | ObjectId | Định danh duy nhất |
| `projectId` | ObjectId | Project mà folder thuộc về |
| `parentFolderId` | ObjectId | Parent folder (null nếu root level) |
| `folderName` | String | Tên folder (vd: "Banner Designs") |
| `folderPath` | String | Full path (vd: "Banner Designs/Desktop") - denormalized |
| `level` | Number | Độ sâu (1=root, 2=subfolder, ...) |
| `description` | String | Mô tả folder |
| `permissions[]` | Array | Override permissions (nếu khác project level) |
| `stats` | Object | assetCount, subfoldersCount, pendingReviews |
| `createdBy` | ObjectId | User tạo folder |
| `createdAt` | ISODate | Thời gian tạo |

**Quy tắc**:
- Folder có thể lồng nhau **không giới hạn độ sâu**
- Mỗi folder có `folderPath` denormalized để query breadcrumb nhanh
- Có thể override permissions từ project level

---

### 2.3 ASSET (Tài sản)

**Định nghĩa**: Đơn vị media (video, image, design) trong một folder, có nhiều versions.

**Ví dụ thực tế**:
- Banner - 1920x1080 (asset)
  - Version 1 (draft)
  - Version 2 (requested changes)
  - Version 3 (approved)

**Thuộc tính chính**:
| Thuộc tính | Loại | Ý nghĩa |
|---|---|---|
| `assetId` | ObjectId | Định danh duy nhất |
| `projectId` | ObjectId | Project mà asset thuộc về |
| `folderId` | ObjectId | Folder chứa asset |
| `assetName` | String | Tên asset (vd: "Banner - Hero") |
| `description` | String | Mô tả chi tiết |
| `assetStatus` | Enum | DRAFT \| IN_REVIEW \| APPROVED \| REQUEST_CHANGES |
| `versionCount` | Number | Tổng số version |
| `latestReviewSessionId` | ObjectId | Review session mới nhất |
| `breadcrumb` | Object | {projectId, projectName, folderPath, assetName} |
| `ownerId` | ObjectId | User sở hữu asset |
| `createdAt` | ISODate | Thời gian tạo |

**Quan hệ**:
- 1 Asset → N Metadata (versions)
- 1 Asset → N Review Sessions
- 1 Asset → N Annotations (qua versions)
- 1 Asset → N Comment Threads (qua versions)

---

## 3. Luồng nghiệp vụ chính

### 3.1 Tạo Project

```
User (Producer/Manager)
    ↓
[Click: Create New Project]
    ↓
[Form: Project Name, Code, Description, Client, Category, Dates]
    ↓
[Insert DB: projects]
    ↓
[Init: Create default folders? - Optional]
    ↓
[Redirect: Project Detail Page]
    ↓
[Display: Project Overview + Empty Folder Tree]
```

**Input validation**:
- projectName: không trống, max 100 chars
- projectCode: unique, alphanumeric + underscore
- dates: startDate ≤ endDate (nếu có)

---

### 3.2 Tạo Folder trong Project

```
User (Producer/Manager) in Project
    ↓
[Click: Create Folder / Right-click in Folder Tree]
    ↓
[Modal: Folder Name, Description, Parent Folder (select)]
    ↓
[Compute: folderPath = parent.folderPath + "/" + folderName]
[Compute: level = parent.level + 1]
    ↓
[Insert DB: folders]
    ↓
[Update: parent folder stats.subfoldersCount]
[Update: project stats.folderCount]
    ↓
[Refresh: Folder Tree]
```

**Quy tắc**:
- Tên folder không trống, max 50 chars
- Không cho nested quá 10 levels (optional limit)
- Tên folder trong cùng parent phải unique

---

### 3.3 Upload Asset vào Folder

```
User (Producer) in Folder
    ↓
[Click: Upload / Drag & Drop]
    ↓
[Select File(s) + Input Asset Name]
    ↓
[Validate: mediaType (VIDEO/IMAGE/DESIGN)]
    ↓
[Insert DB: 
  - assets (assetName, projectId, folderId, status=DRAFT)
  - metadata (fileId, assetId, versionNumber=1, ...)
]
    ↓
[Start: Upload to MinIO + Processing Jobs]
    ↓
[Update: folder.stats.assetCount]
[Update: project.stats.assetCount]
    ↓
[Display: Asset in Folder View (UPLOADING status)]
    ↓
[When Processing Done: Update metadata.processingStatus=READY]
```

---

### 3.4 Tạo Review Session

```
User (Producer) in Asset View
    ↓
[Click: Send for Review]
    ↓
[Form: Select Version, Add Reviewers, Set Deadline, Add Notes]
    ↓
[Insert DB: review_sessions (status=DRAFT)]
    ↓
[Update: asset.latestReviewSessionId]
[Update: asset.assetStatus = IN_REVIEW]
[Update: project.stats.pendingReviews++]
    ↓
[Send Notification: "New Review" to reviewers]
    ↓
[Redirect: Review Session Detail Page]
```

**Reviewers config**:
- Thêm từ project collaborators hoặc type email mới
- Assign role: REVIEWER (chỉ comment) hoặc APPROVER (có quyền approve)

---

### 3.5 Review & Approve Workflow

```
Reviewer/Approver in Review Session
    ↓
[View: Asset version + Annotations + Comments]
    ├─ If REVIEWER role:
    │  ├─ Can: Annotate, Comment, Resolve
    │  └─ Cannot: Approve/Reject
    │
    └─ If APPROVER role:
       ├─ Can: All + Click [Approve] / [Request Changes]
       │
       ├─ [Request Changes] path:
       │  ├─ Set: review_sessions.status = REQUEST_CHANGES
       │  ├─ Update: asset.assetStatus = REQUEST_CHANGES
       │  ├─ Store: statusHistory (why, who, when)
       │  └─ Send: Notification to Producer
       │
       └─ [Approve] path:
          ├─ Set: review_sessions.status = APPROVED
          ├─ Update: asset.assetStatus = APPROVED
          ├─ Set: review_sessions.completedAt = now
          ├─ Update: project.stats.pendingReviews--
          └─ Send: Notification to Producer + Team
```

---

### 3.6 Producer Re-upload & Re-review

```
Producer see REQUEST_CHANGES notification
    ↓
[Click: Go to Asset]
    ↓
[View: Previous version + Feedback/Annotations]
    ↓
[Click: Upload New Version]
    ↓
[Insert DB: metadata (versionNumber=2, assetId=same)]
    ↓
[Option A: Reopen same session]
    └─ Update: review_sessions.versionId = new version
       Clear: review_sessions.statusHistory (keep original)
       
[Option B: Create new session]
    └─ Insert: new review_sessions (for version 2)
       Keep: old session in history
    ↓
[Start: New review workflow]
```

**Recommendation**: Option B (create new session) để track lịch sử rõ ràng.

---

## 4. Luồng Navigation & UI Structure

### 4.1 Main Layout

```
┌─────────────────────────────────────────────────┐
│ TOP NAV: Logo | Search | Notifications | User   │
├─────────┬───────────────────────────────────────┤
│SIDEBAR  │ MAIN CONTENT AREA                     │
│         │                                       │
│🏠 Home  │ ┌─ Breadcrumb ─────────────────────┐ │
│         │ │ Home > Project X > Folder Y       │ │
│📁 My    │ ├─────────────────────────────────┤ │
│  Projects│ │ [Folder Tree]  │ [Content View] │ │
│  ├─ Proj1│ │ ├─ Folder A    │ Files/Folders │ │
│  ├─ Proj2│ │ ├─ Folder B    │ ┌──────────┐  │ │
│  └─ Proj3│ │ └─ Folder C    │ │ Asset 1  │  │ │
│         │ │                 │ │ Status: ✅ │  │ │
│⭐ Fav   │ │                 │ ├──────────┤  │ │
│         │ │                 │ │ Asset 2  │  │ │
│         │ │                 │ │ Status: ⏳ │  │ │
│         │ │                 │ └──────────┘  │ │
│         │ │                                  │ │
└─────────┴───────────────────────────────────────┘
```

---

### 4.2 Project Detail Page

```
┌─────────────────────────────────────────────────┐
│ Project: Holiday Campaign 2026 [Edit] [Archive]│
├─────────────────────────────────────────────────┤
│ Description | Collaborators | Assets | Analytics│
├─────────────────────────────────────────────────┤
│ STATS PANEL:                                    │
│ ├─ 5 Folders  │ 23 Assets │ 4 Pending Reviews   │
│ ├─ 3 Approved │ 2 Changes │ Start: 2026-04-01  │
│ └─ End: 2026-06-30                              │
├─────────────────────────────────────────────────┤
│ RECENT ACTIVITY:                                │
│ ├─ John approved "Banner - Hero" (2 min ago)   │
│ ├─ Mary uploaded v2 of "Icon Set" (1 hour ago) │
│ └─ [View All Activity]                         │
└─────────────────────────────────────────────────┘
```

---

### 4.3 Folder View (File Browser)

```
┌────────────────────────────────────────────────┐
│ 📁 Banner Designs > Desktop Variants            │
├────────────────┬──────────────────────────────┤
│ FOLDER TREE    │ CONTENT PANEL                │
│                │                              │
│ 📁 Banners     │ [+ New Folder] [+ Upload]    │
│   📁 Desktop   │ ──────────────────────────   │
│   📁 Mobile    │ 📁 Variants_2k (folder)     │
│   📁 Tablet    │                              │
│ 📁 Heroes      │ 📄 banner_v1.mp4 ✅ APPROVED │
│ 📁 Icons       │    John approved (2 days)   │
│                │                              │
│ ⚙️ Settings    │ 📄 banner_v2.mp4 ❌ CHANGES  │
│ 🔐 Permissions │    Requested by John         │
│                │    [Upload v3]               │
│                │                              │
│                │ 📄 banner_v3.mp4 ⏳ REVIEW   │
│                │    2/3 reviewers done       │
│                │    Deadline: 2026-04-10     │
└────────────────┴──────────────────────────────┘
```

---

### 4.4 Asset Detail Page

```
┌────────────────────────────────────────────────┐
│ Asset: Banner - Hero [Edit] [Delete]           │
├────────────────────────────────────────────────┤
│ Path: Holiday Campaign > Banners > Desktop     │
├────────────────────────────────────────────────┤
│ CURRENT VERSION (v3):                          │
│ ├─ Status: ⏳ IN_REVIEW                        │
│ ├─ Uploaded: 2026-04-08 by John                │
│ ├─ Processing: ✅ READY                        │
│ └─ Preview: [Video Player/Image Viewer]       │
│                                                │
│ REVIEW SESSION (v3):                           │
│ ├─ Assigned to: John (APPROVER), Mary (REVIEWER)
│ ├─ Deadline: 2026-04-10                        │
│ ├─ Reviewed: John ✅ | Mary ⏳                 │
│ └─ Latest feedback: "Fix color grading"       │
│                                                │
│ VERSIONS HISTORY:                              │
│ ├─ v1: ✅ APPROVED (2026-04-02)                │
│ ├─ v2: ❌ REQUEST_CHANGES (2026-04-05)         │
│ └─ v3: ⏳ IN_REVIEW (2026-04-08) ← CURRENT    │
│                                                │
│ ANNOTATIONS & COMMENTS:                        │
│ ├─ [Show Timeline] [Show Threads]              │
│ └─ 5 annotations, 12 comments                 │
└────────────────────────────────────────────────┘
```

---

## 5. Phân quyền & Permissions Model

### 5.1 Project-level Roles

| Role | Create Folder | Upload Asset | Review | Approve | Share | Archive |
|---|---|---|---|---|---|---|
| **OWNER** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **EDITOR** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **REVIEWER** | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| **VIEWER** | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

### 5.2 Folder-level Overrides

**Scenario**: Project-level EDITOR nhưng Folder này VIEWER-only

```javascript
// Project level
collaborators: [
  { userId: mary, role: "EDITOR" }
]

// Folder level override
folders.permissions: [
  { userId: mary, permissions: ["READ"] }  // Override to READ-only
]

// Query: Can Mary edit assets in this folder?
Answer: NO (folder permission overrides project level)
```

---

### 5.3 Permission Check Flow

```
User wants to [Action] on Asset
    ↓
[Check Asset.projectId → Get project permissions]
    ↓
[Check Asset.folderId → Get folder permissions]
    ↓
Folder permission exists?
    ├─ YES: Use folder permission
    └─ NO: Use project permission
    ↓
Has required permission?
    ├─ YES: Allow action
    └─ NO: Show "Unauthorized"
```

---

## 6. Query Patterns untuk UI

### 6.1 Sidebar: List Projects

```javascript
db.projects.find({
  $or: [
    { ownerId: userId },
    { "collaborators.userId": userId }
  ],
  status: "ACTIVE"
})
.sort({ updatedAt: -1 })
.limit(10)
```

**Result for UI**:
- Holiday Campaign 2026 (3 pending reviews)
- Q1 Product Launch (all approved)
- Brand Refresh (2 folders, 5 assets)

---

### 6.2 Folder Tree: Get Children

```javascript
// Root folders
db.folders.find({
  projectId: projectId,
  parentFolderId: null,
  isActive: true
})

// Subfolders
db.folders.find({
  projectId: projectId,
  parentFolderId: folderId
})
```

---

### 6.3 Folder View: List Assets & Folders

```javascript
// Get folders in current folder
db.folders.find({
  projectId: projectId,
  parentFolderId: currentFolderId
})

// Get assets in current folder
db.assets.find({
  projectId: projectId,
  folderId: currentFolderId,
  isActive: true
})
.sort({ createdAt: -1 })
```

---

### 6.4 Dashboard: Pending Reviews

```javascript
db.review_sessions.find({
  projectId: projectId,
  "reviewers.userId": userId,
  status: { $in: ["DRAFT", "IN_REVIEW"] }
})
.populate("assetId")
.populate("projectId")
.sort({ dueDate: 1 })
```

**Return**:
```javascript
[
  {
    assetName: "Banner - Hero",
    projectName: "Holiday Campaign",
    dueDate: "2026-04-10",
    reviewersLeft: 1,
    status: "IN_REVIEW"
  }
]
```

---

### 6.5 Breadcrumb: Navigate Path

```javascript
// Get full path for breadcrumb
const asset = await db.assets.findOne({ assetId });
// asset.breadcrumb = {
//   projectId, projectName,
//   folderPath: "Banners/Desktop",
//   assetName
// }
```

---

## 7. Edge Cases & Business Rules

### 7.1 Soft Delete

- Delete folder → Set `isActive: false` (không xóa physical)
- Cây folder vẫn tồn tại cho history
- Query mặc định filter `isActive: true`

### 7.2 Move Asset/Folder

```javascript
// Move asset to another folder
await db.assets.updateOne(
  { assetId },
  {
    $set: {
      folderId: newFolderId,
      "breadcrumb.folderPath": newFolderPath
    }
  }
)

// Update stats on both old & new folders
await updateFolderStats(oldFolderId, -1)
await updateFolderStats(newFolderId, +1)
```

### 7.3 Archive Project

```javascript
// Archive project + all folders/assets
await db.projects.updateOne(
  { projectId },
  { $set: { status: "ARCHIVED", archivedAt: now } }
)

// Don't need to update folders/assets, filter by project.status
```

### 7.4 Shared Assets (Cross-project)

**Not supported initially** - Assets belong to exactly 1 project.

If needed later:
- Create `asset_references` collection
- Link same asset to multiple projects
- Handle permission conflict (which project's permission wins?)

---

## 8. Performance Considerations

### 8.1 Indexes Needed

```javascript
// Projects
{ "ownerId": 1, "status": 1, "updatedAt": -1 }
{ "collaborators.userId": 1 }

// Folders
{ "projectId": 1, "parentFolderId": 1 }
{ "projectId": 1, "folderPath": 1 }
{ "folderId": 1 }

// Assets
{ "projectId": 1, "folderId": 1, "createdAt": -1 }
{ "projectId": 1, "assetStatus": 1 }
{ "folderId": 1, "assetName": 1 }
```

### 8.2 Denormalization Strategy

- `folderPath` denormalized vào Assets → breadcrumb lookup nhanh
- `stats` caching ở Project/Folder → tránh count queries
- `projectId` denormalized vào Metadata, ReviewSessions → filter nhanh

### 8.3 Stats Update Pattern

```javascript
// Increment stats (atomic)
await db.projects.updateOne(
  { projectId },
  { $inc: { "stats.assetCount": 1 } }
)

// Periodic refresh (background job)
async function refreshProjectStats(projectId) {
  const assetCount = await db.assets.countDocuments({ projectId });
  const folderCount = await db.folders.countDocuments({ projectId });
  const pendingReviews = await db.review_sessions.countDocuments({
    projectId,
    status: { $in: ["DRAFT", "IN_REVIEW"] }
  });
  
  await db.projects.updateOne(
    { projectId },
    { $set: { stats: { assetCount, folderCount, pendingReviews } } }
  );
}
```

---

## 9. Tóm tắt Use Cases

| Use Case | User Type | Flow |
|---|---|---|
| View My Projects | Producer | Sidebar → Projects List |
| Create Project | Manager | Form → DB Insert → Project Page |
| Organize Assets | Producer | Create Folders → Upload Assets |
| Send for Review | Producer | Select Asset → Add Reviewers → Send |
| Review & Approve | Reviewer | View Asset → Annotate → Approve/Reject |
| Track Reviews | Manager | Dashboard → Pending by Status → Details |
| Search Assets | Producer | Global Search / Folder Search |
| Share Project | Owner | Add Collaborators → Set Role → Send Invite |
| Archive | Manager | Project Settings → Archive |

---

## 10. Data Validation Rules

| Entity | Field | Validation |
|---|---|---|
| PROJECT | projectName | Required, 1-100 chars |
| PROJECT | projectCode | Unique, alphanumeric + underscore |
| PROJECT | startDate, endDate | startDate ≤ endDate |
| FOLDER | folderName | Required, 1-50 chars, unique per parent |
| FOLDER | level | Max 10 (nested limit) |
| ASSET | assetName | Required, 1-100 chars |
| ASSET | mediaType | VIDEO \| IMAGE \| DESIGN |

---

