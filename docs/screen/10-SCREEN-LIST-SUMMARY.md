# 📱 Danh Sách Màn Hình - Media Review Platform (Executive Summary)

**Ngày:** 2026-04-09  
**Phiên bản:** Phase 2 MVP  
**Trạng thái:** ✅ Complete Design  

---

## 🎯 Tổng Quan

Hệ thống Media Review Platform bao gồm **24 màn hình chính**, hỗ trợ đầy đủ workflow review từ upload media → annotation → approval.

### Số Liệu
- **24 Màn hình** (1 page login, 23 pages/modals chính)
- **P0 Priority:** 16 màn hình (MVP bắt buộc)
- **P1 Priority:** 8 màn hình (trải nghiệm nâng cao)
- **12 Database Collections** để hỗ trợ
- **44 API Endpoints** cần develop

---

## 📋 Danh Sách Màn Hình (Phân Nhóm)

### GROUP 1: Authentication & Onboarding (3 màn hình)
| # | Tên | Priority | Mục Đích |
|---|-----|----------|---------|
| 1 | **Login Page** | P0 | Xác thực người dùng qua email/password hoặc Google OAuth |
| 2 | **Register Page** | P0 | Tạo tài khoản mới |
| 3 | **Password Reset** | P1 | Đặt lại mật khẩu quên mất |

**Usecase phục vụ:** UC-A01

---

### GROUP 2: Dashboard & Navigation (4 màn hình)
| # | Tên | Priority | Mục Đích |
|---|-----|----------|---------|
| 4 | **Dashboard / Home** | P0 | Trang chủ: Quick stats, recent projects, activity feed |
| 5 | **Project List (Sidebar)** | P0 | Quản lý danh sách project, expand/collapse, favorites |
| 6 | **Create Project Modal** | P0 | Tạo dự án mới |
| 7 | **Project Detail Page** | P0 | Tổng quan project: overview, files, collaborators, activity |

**Usecase phục vụ:** UC-A01, UC-A02, UC-B04, UC-F02

---

### GROUP 3: Project Management (1 màn hình)
| # | Tên | Priority | Mục Đích |
|---|-----|----------|---------|
| 8 | **Project Settings** | P1 | Edit project info, manage collaborators, archive/delete |

**Usecase phục vụ:** UC-A02

---

### GROUP 4: File & Folder Management (3 màn hình)
| # | Tên | Priority | Mục Đích |
|---|-----|----------|---------|
| 9 | **Folder Browser** | P0 | 3-column layout: Tree, Actions, Content (assets list/grid) |
| 10 | **Create Folder Modal** | P0 | Tạo subfolder |
| 11 | **Upload Modal** | P0 | Upload media (drag & drop, multipart, progress tracking) |

**Usecase phục vụ:** UC-B01, UC-B02, UC-B03, UC-E01, UC-F02

---

### GROUP 5: Asset Viewing (4 màn hình)
| # | Tên | Priority | Mục Đích |
|---|-----|----------|---------|
| 12 | **Asset Detail Page** | P0 | Tabbed: Preview, Versions, Review, Comments, Activity |
| 13 | **Video Player** | P0 | HLS streaming + timeline markers + annotation controls |
| 14 | **Image Viewer** | P0 | Zoom/pan + draw annotation regions |
| 21 | **Version List** | P0 | History của tất cả version với status và review info |

**Usecase phục vụ:** UC-B01, UC-C01, UC-C02, UC-E01, UC-E02, UC-E03, UC-F02

---

### GROUP 6: Annotation & Collaboration (3 màn hình)
| # | Tên | Priority | Mục Đích |
|---|-----|----------|---------|
| 15 | **Annotation Panel** | P0 | Vẽ annotation (timecode video / region ảnh) + comment |
| 16 | **Comment Thread Panel** | P0 | View & reply comments trong thread, resolve |
| 17 | **Version Compare Modal** | P1 | A/B compare hoặc overlay 2 version |

**Usecase phục vụ:** UC-D01, UC-D02, UC-D03, UC-D04, UC-E04

---

### GROUP 7: Review Workflow (3 màn hình)
| # | Tên | Priority | Mục Đích |
|---|-----|----------|---------|
| 18 | **Create Review Session** | P0 | 4-step wizard: select version, add reviewers, set deadline |
| 19 | **Review Session Page** | P0 | Reviewer POV: video + timeline + annotations + approve/reject |
| 20 | **Upload New Version Modal** | P0 | Upload version mới, keep feedback, notify reviewers |

**Usecase phục vụ:** UC-F01, UC-E02, UC-B02

---

### GROUP 8: Notifications & System (3 màn hình)
| # | Tên | Priority | Mục Đích |
|---|-----|----------|---------|
| 22 | **Notification Panel** | P1 | Dropdown: Recent notifications, mark read, navigate |
| 23 | **Search Results** | P1 | Full-text search across assets, projects, comments |
| 24 | **User Settings** | P1 | Profile, notification prefs, security, 2FA |

**Usecase phục vụ:** UC-A01, UC-D04, UC-G01

---

## 🗂️ Database Collections (12 Collections)

```
CORE:
├─ users (xác thực, profile)
├─ projects (dự án)
├─ folders (thư mục hierarchy)
├─ assets (media item)
└─ metadata (phiên bản file)

REVIEW & ANNOTATION:
├─ review_sessions (phiên review)
├─ annotations (timecode/region marks)
├─ comment_threads (discussion threads)

PROCESSING & OPERATIONS:
├─ media_renditions (HLS, thumbnail)
├─ processing_jobs (transcode queue)
├─ audit_logs (action history)

NOTIFICATIONS:
└─ notifications (user notifications)
```

---

## 🔄 Key User Flows

### Producer Workflow (Upload → Send Review)
```
Login 
  → Dashboard 
  → Create Project 
  → Create Folders 
  → Folder Browser 
  → Upload Media 
  → Asset Detail (wait for processing)
  → Create Review Session (invite reviewers)
  → Monitor status
```

### Reviewer Workflow (Review → Approve)
```
Login 
  → Dashboard 
  → Notification 
  → Review Session 
  → Video Player
  → Add Annotation (timecode)
  → Comment Thread
  → Approve/Request Changes
```

### PM Workflow (Project Management)
```
Login 
  → Dashboard 
  → Project Detail 
  → View Activity Feed
  → Folder Browser
  → Monitor review progress
  → See analytics/timeline
```

---

## 📊 Feature Coverage by Usecase

| Usecase | Màn hình | Status |
|---------|----------|--------|
| **UC-A01** (Login/Auth) | 1, 2, 3, 24 | ✅ Complete |
| **UC-A02** (Permissions) | 5, 7, 8, 9 | ✅ Complete |
| **UC-A03** (Share Link) | 7, 9, 12 | ✅ Complete |
| **UC-B01** (Upload) | 9, 11 | ✅ Complete |
| **UC-B02** (Versioning) | 10, 12, 20, 21 | ✅ Complete |
| **UC-B03** (Processing) | 11, 12, 21 | ✅ Complete |
| **UC-B04** (Track Status) | 4, 7, 12, 21 | ✅ Complete |
| **UC-C01** (HLS Streaming) | 13, 19 | ✅ Complete |
| **UC-C02** (Fallback URL) | 13, 14 | ✅ Complete |
| **UC-C04** (Metrics) | 13, 19 | ✅ Complete |
| **UC-D01** (Timecode Comment) | 13, 15, 16, 19 | ✅ Complete |
| **UC-D02** (Region Annotation) | 14, 15, 16, 19 | ✅ Complete |
| **UC-D03** (Thread Comments) | 16, 19 | ✅ Complete |
| **UC-D04** (Search/Filter) | 23 | ✅ Complete |
| **UC-E01** (Version History) | 12, 21 | ✅ Complete |
| **UC-E02** (Upload New Version) | 20 | ✅ Complete |
| **UC-E03** (Active Version) | 12, 21 | ✅ Complete |
| **UC-E04** (Compare) | 17 | ✅ Complete |
| **UC-F01** (Change Status) | 18, 19 | ✅ Complete |
| **UC-F02** (Timeline Review) | 4, 7, 12, 16 | ✅ Complete |
| **UC-G01** (In-app Notification) | 22 | ✅ Complete |

---

## 🎨 UI/UX Design Standards

### Layout Structure
- **App Shell**: Header (fixed top) + Sidebar (fixed left) + Main Content
- **Header**: Logo, Breadcrumb, Search, Notifications, Settings, User Avatar
- **Sidebar**: Navigation tree (Projects, Dashboard, Search, Settings)
- **Responsive**: Mobile-first, tablet & desktop support

### Color Scheme
- **Primary**: Blue (#1890FF)
- **Success**: Green (#52C41A)
- **Error**: Red (#F5222D)
- **Warning**: Orange (#FAAD14)
- **Neutral**: Gray (#8C8C8C)

### Component Framework
- **Design System**: Ant Design (already in project)
- **Icons**: Ant Design Icons
- **Styling**: CSS-in-JS (Emotion/Styled Components)
- **State Management**: React Context / Redux (project choice)

---

## 📈 Estimated Development Effort

| Group | Màn hình | Frontend (days) | Backend (days) | Database (days) |
|-------|----------|-----------------|-----------------|-----------------|
| Auth | 3 | 2 | 2 | 0.5 |
| Dashboard | 4 | 1.5 | 1 | 0.5 |
| Projects | 1 | 0.5 | 0.5 | 0.5 |
| Files/Folders | 3 | 2 | 2 | 1 |
| Asset Viewing | 4 | 3 | 3 | 1.5 |
| Annotation | 3 | 4 | 3 | 1.5 |
| Review Workflow | 3 | 3 | 3 | 1 |
| Notifications | 3 | 1.5 | 2 | 0.5 |
| **TOTAL** | **24** | **~18 days** | **~17 days** | **~7 days** |

---

## ⚠️ Critical Implementation Points

### 1. Permission System
- Check quyền (READ, COMMENT, MODIFY, OWNER) mỗi khi access resource
- Permission inheritance: Project → Folder → Asset
- Share token encode/decode bảo mật

### 2. Version-Centric Data Model
- Annotation/Comments luôn gắn versionId cụ thể
- Khi upload version mới → không xóa annotation cũ
- Active version tracking cho review workflow

### 3. Media Processing Pipeline
- Async background job (transcode, thumbnail generation)
- Status tracking: PENDING → PROCESSING → READY / FAILED
- Fallback khi HLS fail (direct URL playback)

### 4. Real-Time Features
- Notification system (SSE hoặc WebSocket)
- Progress tracking (upload, processing)
- Activity feed updates

### 5. Audit Trail
- Log mọi action: upload, status change, review, comment
- Store actor, action, target, timestamp, before/after
- QueryAPI cho audit report

### 6. Performance Optimization
- Lazy loading cho folder tree
- Pagination cho asset list (default 50 items/page)
- Index database cho frequently queried fields
- CDN cho media renditions (HLS segments)
- Cache metadata ngắn hạn (5 phút)

---

## 🚀 MVP Launch Checklist

### Phase 1 Prioritization (Sprint 1-2)
- [ ] Auth screens (Login, Register)
- [ ] Dashboard
- [ ] Project Management (List, Create, Detail)
- [ ] Folder Browser (basic)
- [ ] Upload Media
- [ ] Asset Detail (Preview tab)
- [ ] Video Player (basic)

### Phase 2 Prioritization (Sprint 3-4)
- [ ] Annotation (timecode + region)
- [ ] Comment Threads
- [ ] Create Review Session
- [ ] Review Interface (Reviewer POV)
- [ ] Version management
- [ ] Notification Panel

### Phase 3 Prioritization (Sprint 5+)
- [ ] Advanced features (Compare, Search, Settings)
- [ ] Performance optimization
- [ ] Testing & QA
- [ ] Documentation

---

## 📚 File Reference

**Detailed Specification:** `docs/10-screen-list-detailed.md`
- Full layout diagrams
- Complete input/output fields
- Database operations SQL-equivalent
- API endpoints detailed
- Button actions & workflows
- Parent/child screen relationships

**Database Design:** `docs/database.md`
**UI/UX Flow:** `docs/ui-ux-screen-flows.md`
**Technical Stack:** `docs/04-proposed-tech-stack-architecture.md`

---

## ✅ Signoff

**Màn hình design:** Hoàn thành đầy đủ  
**Coverage:** 100% usecase từ Phase 1 review document  
**Database mapping:** Chi tiết từng collection  
**API design:** Ready for backend team  
**Sẵn sàng:** Bắt đầu development ngay

---

**Tài liệu này phải được review bởi:**
- [ ] Product Manager (Scope confirmation)
- [ ] Tech Lead (Architecture validation)
- [ ] Designer (UI/UX approval)
- [ ] QA Lead (Test coverage planning)
