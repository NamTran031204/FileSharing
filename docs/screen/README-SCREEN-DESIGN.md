# 📊 Screen Design - Complete Index & Navigation

**Tài liệu thiết kế màn hình cho Media Review Platform Phase 2**  
**Ngày cập nhật:** 2026-04-09  
**Phiên bản:** Complete Design Draft  
**Trạng thái:** ✅ Ready for Review & Development  

---

## 📚 Danh Sách Tài Liệu

### 1. 📋 **10-SCREEN-LIST-SUMMARY.md** (Executive Summary)
- **Kích thước:** 10KB
- **Mục đích:** Tóm tắt toàn bộ 24 màn hình cho quản lý và stakeholders
- **Nội dung:**
  - Overview 24 screens grouped by function
  - Priority matrix (P0/P1/P2)
  - Usecase coverage mapping
  - Development effort estimates (18 FE days, 17 BE days, 7 DB days)
  - MVP launch checklist
- **Đọc cho:** PM, Tech Lead, Designer, Team Lead

---

### 2. 🎨 **10-screen-list-detailed.md** (Complete Specification)
- **Kích thước:** 76KB
- **Mục đích:** Chi tiết đầy đủ từng màn hình
- **Cấu trúc từng screen:**
  ```
  - Mục đích
  - Chức năng chính
  - Input fields & data mapping
  - Buttons & actions
  - Parent/child screens
  - Database operations
  - API endpoints required
  ```
- **Các phần chính:**
  - **Part I:** Authentication & Onboarding (3 screens)
  - **Part II:** Global Layouts & Components (App Shell, Modals)
  - **Part III:** Dashboard & Project Management (4 screens)
  - **Part IV:** File & Folder Management (3 screens)
  - **Part V:** Asset Details & Viewing (4 screens)
  - **Part VI:** Annotation & Review (3 screens)
  - **Part VII:** Review Workflow (3 screens)
  - **Part VIII:** Version Management (2 screens)
  - **Part IX:** Notifications & Activity (3 screens)
  - **Part X:** Search & Analytics (1 screen)
  - **Part XI:** Settings & Preferences (1 screen)
- **Đọc cho:** Frontend developer, UI/UX designer, Backend architect

---

### 3. 🔗 **11-SCREEN-DATABASE-API-MAPPING.md** (Developer Reference)
- **Kích thước:** 22KB
- **Mục đích:** Quick reference cho developers - cái gì query/API cho từng screen
- **Format:** Screen → Database → API
- **Nội dung:**
  - Mỗi screen → Collections cần query
  - Mỗi screen → API endpoints (input/output)
  - Database operations (INSERT, UPDATE, DELETE)
  - Common query patterns
  - Performance optimization tips
  - Index recommendations
- **Đọc cho:** Backend developer, Database architect

---

## 🎯 Cách Sử Dụng Tài Liệu

### 👔 Cho Product Manager / Stakeholder
1. Đọc **10-SCREEN-LIST-SUMMARY.md** (10 phút)
   - Hiểu overview 24 screens
   - Check usecase coverage
   - Xem effort estimate
2. Chia sẻ với team để confirm scope

### 🎨 Cho Designer / Product Designer
1. Đọc **10-SCREEN-LIST-SUMMARY.md** (overview)
2. Chi tiết nghiên cứu **10-screen-list-detailed.md**
   - Layout diagrams
   - Input fields
   - Button actions
   - Parent/child relationships
3. Reference với **ui-ux-screen-flows.md** (existing design)

### 💻 Cho Frontend Developer
1. Quick start: **11-SCREEN-DATABASE-API-MAPPING.md**
   - Cần API gì cho screen này?
   - Cần query database gì?
2. Detail spec: **10-screen-list-detailed.md**
   - Exact input fields
   - Button actions & workflows
   - Form validations
   - Error handling

### 🗄️ Cho Backend / Database Architect
1. Reference: **11-SCREEN-DATABASE-API-MAPPING.md**
   - Collections needed
   - Query patterns
   - Index strategy
   - API design
2. Cross-check: **database.md** (schema details)

### 🧪 Cho QA / Test Engineer
1. Read: **10-SCREEN-LIST-SUMMARY.md** (understand scope)
2. Create test cases from:
   - **10-screen-list-detailed.md** (Buttons & Actions section)
   - **11-SCREEN-DATABASE-API-MAPPING.md** (API test cases)
3. Use as acceptance criteria

---

## 📊 Quick Reference Tables

### Screen Prioritization

| Priority | Count | Screens | MVP? |
|----------|-------|---------|------|
| **P0** | 16 | Auth, Dashboard, Projects, Files, Assets, Annotation, Review, Versioning | ✅ Yes |
| **P1** | 8 | Settings, Advanced features, Analytics | ⏳ Phase 2 |
| **P2** | - | (Future phases) | ❌ No |

### Effort Breakdown (Total: ~42 days)

| Component | Effort | Days |
|-----------|--------|------|
| Frontend | ~60% | 18 days |
| Backend | ~41% | 17 days |
| Database | ~17% | 7 days |
| **TOTAL** | - | **42 days** |

### Database Collections (12 total)

**Core:**
- `users` - User accounts & auth
- `projects` - Project/campaign management
- `folders` - Folder hierarchy
- `assets` - Media items
- `metadata` - Version tracking

**Review & Annotation:**
- `review_sessions` - Review workflow
- `annotations` - Timecode/region marks
- `comment_threads` - Discussion threads

**Processing:**
- `media_renditions` - HLS, thumbnails
- `processing_jobs` - Transcode queue
- `audit_logs` - Action history

**Notifications:**
- `notifications` - User notifications

---

## 🗺️ Screen Dependency Map

```
LOGIN / REGISTER
  ↓
DASHBOARD
  ├─→ PROJECT LIST (sidebar)
  ├─→ PROJECT DETAIL
  │    ├─→ FOLDER BROWSER
  │    │    ├─→ UPLOAD MODAL
  │    │    ├─→ CREATE FOLDER
  │    │    └─→ ASSET DETAIL
  │    │         ├─→ VIDEO PLAYER ──→ ANNOTATION PANEL ──→ COMMENT THREAD
  │    │         ├─→ IMAGE VIEWER ──→ ANNOTATION PANEL
  │    │         ├─→ VERSION LIST
  │    │         │    └─→ VERSION COMPARE MODAL
  │    │         ├─→ UPLOAD NEW VERSION
  │    │         └─→ CREATE REVIEW SESSION ──→ REVIEW SESSION PAGE
  │    │
  │    ├─→ PROJECT SETTINGS
  │    └─→ COLLABORATORS
  │
  ├─→ NOTIFICATION PANEL ──→ (navigate to related screen)
  ├─→ SEARCH RESULTS ──→ (asset or project)
  └─→ USER SETTINGS

REVIEW SESSION PAGE (from notification)
  └─→ [VIDEO PLAYER → ANNOTATION → COMMENT THREAD]
```

---

## 📝 Database Schema Quick Reference

### Entity Relationships

```
User (1) ──── (N) Project
         ──── (N) Asset
         ──── (N) ReviewSession

Project (1) ──── (N) Folder
        ──── (N) Asset
        ──── (N) ReviewSession

Folder (1) ──── (N) Asset
       ├── (N) SubFolder (self-referential)
       └── (N) Annotation

Asset (1) ──── (N) Metadata (versions)
      ──── (N) ReviewSession
      ──── (N) Annotation
      ──── (N) CommentThread

Metadata (1) ──── (N) MediaRendition
         ──── (N) Annotation
         ──── (N) CommentThread
         ──── (N) ReviewSession

Annotation (1) ──── (1) CommentThread

CommentThread (1) ──── (N) Comment
              ├── (1) Annotation
              └── (1) Metadata

ReviewSession (1) ──── (N) Reviewer
             ──── (N) CommentThread

ReviewSession (N) ──── (1) Metadata

User (N) ──── (N) ReviewSession (many-to-many via reviewer)
```

---

## 🔄 API Endpoint Categories

### Authentication (3 endpoints)
```
POST /auth/login
POST /auth/register
POST /auth/reset-password
```

### Projects (6 endpoints)
```
GET /projects
POST /projects
GET /projects/{id}
PUT /projects/{id}
DELETE /projects/{id}
PUT /projects/{id}/collaborators
```

### Folders (6 endpoints)
```
GET /projects/{id}/folders/tree
GET /projects/{id}/folders/{id}/assets
POST /projects/{id}/folders
PUT /projects/{id}/folders/{id}
DELETE /projects/{id}/folders/{id}
```

### Assets & Versions (8 endpoints)
```
GET /assets/{id}
PUT /assets/{id}
DELETE /assets/{id}
GET /assets/{id}/versions
PUT /assets/{id}/active-version
POST /assets/{id}/upload-new-version
GET /assets/{id}/metadata/{versionId}
```

### Upload (3 endpoints)
```
POST /assets/upload-metadata
PUT /assets/upload/{uploadId}/complete
PUT /assets/upload/{uploadId}/part/{partNumber}
```

### Media Streaming (3 endpoints)
```
GET /assets/{id}/metadata/{versionId}/stream/manifest.m3u8
GET /assets/{id}/metadata/{versionId}/stream/{segmentId}.ts
GET /assets/{id}/metadata/{versionId}/playback-info
```

### Annotations & Comments (6 endpoints)
```
POST /annotations
PUT /annotations/{id}
DELETE /annotations/{id}
GET /comment-threads/{id}
POST /comment-threads/{id}/comments
PUT /comment-threads/{id}/status
```

### Review Sessions (4 endpoints)
```
POST /review-sessions
GET /review-sessions/{id}
PUT /review-sessions/{id}/reviewer-status
GET /review-sessions (list)
```

### Notifications (5 endpoints)
```
GET /notifications
PUT /notifications/{id}/read
PUT /notifications/read-all
GET /notifications/count
SSE /notifications/stream (WebSocket)
```

### Search (1 endpoint)
```
GET /search
```

### User Settings (5 endpoints)
```
GET /users/me
PUT /users/me
POST /auth/change-password
PUT /users/me/notification-preferences
DELETE /users/me
```

### Dashboard (2 endpoints)
```
GET /dashboard/overview
GET /dashboard/stats
```

**TOTAL: ~50 API Endpoints**

---

## ✅ Validation Checklist

- [x] Tất cả 24 màn hình được thiết kế chi tiết
- [x] Tất cả P0 usecase được cover (16 screens)
- [x] Database schema mapping hoàn thành
- [x] API design hoàn thành (50 endpoints)
- [x] Input/output validation specs
- [x] Permission model rõ ràng
- [x] Error handling flows
- [x] Real-time features (notifications, progress)
- [x] Performance optimization tips

---

## 🚀 Next Steps

1. **Design Review** (1-2 days)
   - Product & Design team review screens
   - Adjust if needed
   - Sign-off on scope

2. **Backend Planning** (2-3 days)
   - Architecture finalization
   - Database schema implementation
   - API specification finalization

3. **Frontend Planning** (2-3 days)
   - Component architecture design
   - State management strategy
   - UI component library setup

4. **Development Sprint Planning** (1 day)
   - Break down into sprints (5-6 sprints estimated)
   - Assign tasks
   - Start development

---

## 📞 Questions & Clarifications

### Frequently Asked Questions

**Q1: Có bao nhiêu màn hình cần develop ngay?**  
A: 16 màn hình P0 cho MVP. Các P1 screens phát triển sau khi MVP stable.

**Q2: Database design có ready chưa?**  
A: Có, xem `database.md` để chi tiết schema. File này chỉ provide query examples.

**Q3: API design đã final chưa?**  
A: Đây là design specification. Backend team có thể adjust nếu cần, nhưng structure này là foundation.

**Q4: Có cần animation/micro-interactions không?**  
A: Đó là responsibility của designer. Tài liệu này focus vào functionality.

**Q5: Mobile responsiveness?**  
A: Tất cả screens phải responsive (mobile-first approach).

---

## 📖 Related Documents

- `01-product-requirements-prd.md` - Product vision & goals
- `03-core-features-priority-mvp.md` - Feature priority list
- `09-usecase.md` - Full usecase documentation
- `database.md` - Database schema details
- `04-proposed-tech-stack-architecture.md` - Technology choices
- `ui-ux-screen-flows.md` - Existing flow diagrams
- `project-folder-structure.md` - Project/folder hierarchy design

---

## 👥 Document Owners

- **Design:** Product Designer / UI/UX Lead
- **Specification:** BA / Product Manager
- **Database:** Database Architect
- **API Design:** Backend Tech Lead
- **Implementation:** Full Development Team

---

## 📋 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-09 | Initial complete design |
| (draft) | - | Under review |

---

## 🎓 How to Read This Documentation

### If you have 15 minutes:
→ Read **10-SCREEN-LIST-SUMMARY.md**

### If you have 1 hour:
→ Read **10-SCREEN-LIST-SUMMARY.md** + skim **10-screen-list-detailed.md** table of contents

### If you have 2-3 hours:
→ Read all 3 files completely

### If you're implementing:
→ Keep **11-SCREEN-DATABASE-API-MAPPING.md** open as reference while coding

---

## ✨ Key Highlights

✅ **Complete Coverage**: 100% của 32 P0+P1 usecases  
✅ **Detailed Specifications**: Mỗi screen có layout, actions, DB operations  
✅ **Developer Ready**: Concrete API endpoints, database queries, validations  
✅ **Dependency Clear**: Screen relationships fully documented  
✅ **Effort Estimated**: 42 total days (18 FE + 17 BE + 7 DB)  
✅ **Priority Clear**: P0 (MVP) vs P1 (phase 2) distinct  

---

**Prepared by:** System Architect + BA Engineering  
**Status:** ✅ Complete & Ready for Development  
**Last Updated:** 2026-04-09 23:39 UTC  

---

**🎯 Ready to build! Let's get started! 🚀**
