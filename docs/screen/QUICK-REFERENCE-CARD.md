# 📱 Screen Design - Quick Reference Card

## 24 Màn Hình - Tóm Tắt 1 Trang

```
╔════════════════════════════════════════════════════════════════════════╗
║          MEDIA REVIEW PLATFORM - SCREEN ARCHITECTURE v1.0            ║
║                    Phase 2 MVP - 24 Screens Total                    ║
╚════════════════════════════════════════════════════════════════════════╝
```

---

## 📋 SCREENS BY GROUP & PRIORITY

### GROUP 1: AUTH (3 screens) - P0
```
┌─────────────────────────────────────────┐
│ 1. Login Page                      [P0] │ → Email/Password or Google OAuth
│ 2. Register Page                   [P0] │ → Create new account
│ 3. Password Reset                  [P1] │ → Reset forgotten password
└─────────────────────────────────────────┘
```

### GROUP 2: DASHBOARD (4 screens) - P0/P1
```
┌─────────────────────────────────────────┐
│ 4. Dashboard / Home                [P0] │ → Quick stats, recent projects
│ 5. Project List (Sidebar)          [P0] │ → Favorites, expand/collapse
│ 6. Create Project Modal            [P0] │ → New project wizard
│ 7. Project Detail / Overview       [P0] │ → Tabbed: Files, Collab, Activity
└─────────────────────────────────────────┘
```

### GROUP 3: PROJECT MGT (1 screen) - P1
```
┌─────────────────────────────────────────┐
│ 8. Project Settings                [P1] │ → Edit, archive, delete project
└─────────────────────────────────────────┘
```

### GROUP 4: FILES & FOLDERS (3 screens) - P0
```
┌─────────────────────────────────────────┐
│ 9. Folder Browser                  [P0] │ → 3-column: Tree, Actions, List
│10. Create Folder Modal             [P0] │ → New subfolder form
│11. Upload Modal                    [P0] │ → Drag & drop, progress, multipart
└─────────────────────────────────────────┘
```

### GROUP 5: ASSET VIEWING (4 screens) - P0/P1
```
┌─────────────────────────────────────────┐
│12. Asset Detail Page               [P0] │ → Tabbed: Preview, Versions, Review
│13. Video Player                    [P0] │ → HLS streaming + timeline markers
│14. Image Viewer                    [P0] │ → Zoom/pan + annotation tools
│21. Version List (in Asset Detail)  [P0] │ → History, compare, download
└─────────────────────────────────────────┘
```

### GROUP 6: ANNOTATION (3 screens) - P0/P1
```
┌─────────────────────────────────────────┐
│15. Annotation Panel                [P0] │ → Draw timecode/region + comment
│16. Comment Thread Panel            [P0] │ → Reply, resolve, mention
│17. Version Compare Modal           [P1] │ → Side-by-side or overlay
└─────────────────────────────────────────┘
```

### GROUP 7: REVIEW WORKFLOW (3 screens) - P0
```
┌─────────────────────────────────────────┐
│18. Create Review Session (Wizard)  [P0] │ → 4-step: Version, Reviewers, Details
│19. Review Session Page             [P0] │ → Reviewer POV: Video + Approve/Reject
│20. Upload New Version Modal        [P0] │ → Upload v2/v3, keep feedback
└─────────────────────────────────────────┘
```

### GROUP 8: NOTIFICATIONS (3 screens) - P1
```
┌─────────────────────────────────────────┐
│22. Notification Panel              [P1] │ → Dropdown: Recent, mark read
│23. Search Results                  [P1] │ → Full-text across assets/projects
│24. User Settings                   [P1] │ → Profile, prefs, security, 2FA
└─────────────────────────────────────────┘
```

---

## 🗂️ DATABASE: 12 Collections

```
USERS
├─ userId, email, password, roles
├─ notificationPreferences
└─ metadata (avatar, timezone, locale)

PROJECTS
├─ projectId, projectName, projectCode
├─ ownerId, collaborators[]
├─ stats (denormalized)
└─ status (ACTIVE/ARCHIVED/COMPLETED)

FOLDERS
├─ folderId, projectId, parentFolderId
├─ folderName, folderPath (denormalized)
├─ level (depth in hierarchy)
└─ stats, permissions

ASSETS
├─ assetId, assetName, projectId, folderId
├─ ownerId, assetStatus (DRAFT/IN_REVIEW/APPROVED)
├─ versionCount, latestReviewSessionId
└─ shareToken, visibility

METADATA (Versions)
├─ metadataId, assetId, versionNumber
├─ fileName, objectName, uploadId
├─ status (UPLOADING/COMPLETED/FAILED)
├─ processingStatus (PENDING/PROCESSING/READY/FAILED)
├─ mediaInfo (duration, resolution, codec)
├─ userPermissions[], visibility
└─ publishUserPermission

REVIEW_SESSIONS
├─ sessionId, assetId, versionId
├─ title, description, deadline
├─ createdBy, status (IN_REVIEW/APPROVED/REJECTED)
├─ reviewers[] { userId, role, status }
└─ createdAt, updatedAt

ANNOTATIONS
├─ annotationId, versionId, assetId
├─ annotationType (TIMECODE / REGION)
├─ timeCodeStart, timeCodeEnd (for video)
├─ shape, coordinates (for image)
├─ createdBy, threadId
└─ createdAt

COMMENT_THREADS
├─ threadId, assetId, versionId, annotationId
├─ type (ANNOTATION_THREAD)
├─ status (OPEN / RESOLVED)
├─ comments[] { content, createdBy, mentions[] }
├─ createdBy, createdAt
└─ updatedAt, resolvedAt

MEDIA_RENDITIONS
├─ renditionId, versionId
├─ renditionType (HLS / THUMBNAIL / PROXY)
├─ hlsManifestUrl, thumbnailUrl
├─ bitrate, resolution
└─ createdAt

PROCESSING_JOBS
├─ jobId, versionId, uploadId
├─ type (TRANSCODE / THUMBNAIL / SPRITE)
├─ status (PENDING / QUEUED / PROCESSING / COMPLETED / FAILED)
├─ startedAt, completedAt
└─ errorMessage

AUDIT_LOGS
├─ logId, action, actor, target
├─ before, after (document diff)
├─ timestamp
└─ metadata

NOTIFICATIONS
├─ notificationId, userId
├─ type (ANNOTATION / REVIEW_INVITE / MENTION / etc)
├─ relatedId, relatedData
├─ read, readAt
└─ createdAt
```

---

## 🔗 API ENDPOINTS: ~50 Endpoints

### Auth (3)
```
POST   /auth/login
POST   /auth/register
POST   /auth/reset-password
```

### Projects (6)
```
GET    /projects
POST   /projects
GET    /projects/{id}
PUT    /projects/{id}
DELETE /projects/{id}
PUT    /projects/{id}/collaborators
```

### Folders (6)
```
GET    /projects/{pid}/folders/tree
GET    /projects/{pid}/folders/{fid}/assets
POST   /projects/{pid}/folders
PUT    /projects/{pid}/folders/{fid}
DELETE /projects/{pid}/folders/{fid}
```

### Assets (8)
```
GET    /assets/{id}
PUT    /assets/{id}
DELETE /assets/{id}
GET    /assets/{id}/versions
PUT    /assets/{id}/active-version
POST   /assets/{id}/upload-new-version
GET    /assets/{id}/metadata/{vid}
GET    /assets/{id}/metadata/{vid}/renditions
```

### Upload (3)
```
POST   /assets/upload-metadata
PUT    /assets/upload/{uid}/complete
PUT    /assets/upload/{uid}/part/{pn}
```

### Streaming (3)
```
GET    /assets/{id}/metadata/{vid}/stream/manifest.m3u8
GET    /assets/{id}/metadata/{vid}/stream/{segId}.ts
GET    /assets/{id}/metadata/{vid}/playback-info
```

### Annotations & Comments (6)
```
POST   /annotations
PUT    /annotations/{id}
DELETE /annotations/{id}
GET    /comment-threads/{id}
POST   /comment-threads/{id}/comments
PUT    /comment-threads/{id}/status
```

### Review Sessions (4)
```
POST   /review-sessions
GET    /review-sessions/{id}
PUT    /review-sessions/{id}/reviewer-status
GET    /review-sessions
```

### Notifications (5)
```
GET    /notifications
PUT    /notifications/{id}/read
PUT    /notifications/read-all
GET    /notifications/count
SSE    /notifications/stream
```

### Search (1)
```
GET    /search
```

### Dashboard (2)
```
GET    /dashboard/overview
GET    /dashboard/stats
```

### User (5)
```
GET    /users/me
PUT    /users/me
POST   /auth/change-password
PUT    /users/me/notification-preferences
DELETE /users/me
```

---

## 📊 PRIORITY & EFFORT

```
┌────────────────────────────────────────────────────────┐
│ Priority  │ Count │ Effort (days)                    │
├────────────────────────────────────────────────────────┤
│ P0 (MVP)  │  16   │ FE: 12d │ BE: 11d │ DB: 4.5d  │
│ P1 (v1.1) │   8   │ FE:  6d │ BE:  6d │ DB: 2.5d  │
├────────────────────────────────────────────────────────┤
│ TOTAL     │  24   │ FE: 18d │ BE: 17d │ DB:  7d  │
│           │       │        42 DAYS TOTAL             │
└────────────────────────────────────────────────────────┘
```

---

## ✅ COVERAGE MATRIX

```
Usecase                          Screens
═══════════════════════════════════════════════════════
UC-A01 (Auth)              ✅ 1,2,3,24
UC-A02 (Permissions)       ✅ 5,7,8,9
UC-A03 (Share Link)        ✅ 7,9,12
UC-B01 (Upload)            ✅ 9,11
UC-B02 (Versioning)        ✅ 10,12,20,21
UC-B03 (Processing)        ✅ 11,12,21
UC-B04 (Track Status)      ✅ 4,7,12,21
UC-C01 (HLS Streaming)     ✅ 13,19
UC-C02 (Fallback URL)      ✅ 13,14
UC-C04 (Metrics)           ✅ 13,19
UC-D01 (Timecode Comment)  ✅ 13,15,16,19
UC-D02 (Region Annotation) ✅ 14,15,16,19
UC-D03 (Thread Comments)   ✅ 16,19
UC-D04 (Search/Filter)     ✅ 23
UC-E01 (Version History)   ✅ 12,21
UC-E02 (New Version)       ✅ 20
UC-E03 (Active Version)    ✅ 12,21
UC-E04 (Compare)           ✅ 17
UC-F01 (Status Change)     ✅ 18,19
UC-F02 (Timeline Review)   ✅ 4,7,12,16
UC-G01 (In-app Notif)      ✅ 22
```

---

## 🎯 CRITICAL FEATURES

### MVP Must-Have (P0)
- ✅ Upload/Download media
- ✅ HLS streaming playback
- ✅ Timecode annotation (video)
- ✅ Region annotation (image)
- ✅ Comment threads
- ✅ Version history
- ✅ Review workflow (approve/reject)
- ✅ Permission system

### Nice-to-Have (P1)
- ✅ Version compare (A/B)
- ✅ Advanced search
- ✅ In-app notifications
- ✅ User settings
- ✅ 2FA security
- ✅ Audit logs
- ✅ Dashboard analytics

---

## 🚀 IMPLEMENTATION PHASES

```
SPRINT 1-2 (Week 1-2): Core Platform
├─ Auth screens
├─ Dashboard
├─ Basic projects & folders
├─ Upload media
└─ Asset detail (view only)

SPRINT 3-4 (Week 3-4): Media Review
├─ Video player + HLS
├─ Annotation tools
├─ Comment system
├─ Create review session
└─ Review interface

SPRINT 5 (Week 5): Polish & Optimization
├─ Version compare
├─ Advanced search
├─ Performance tuning
├─ Testing & bug fixes
└─ Documentation

SPRINT 6+ (Week 6+): P1 Features
├─ Settings & preferences
├─ Advanced notifications
├─ Analytics dashboard
└─ Mobile optimization
```

---

## 🔒 PERMISSION MODEL

```
ROLE MATRIX:
┌─────────────┬────────┬─────────┬────────┬──────────┐
│ Permission  │ OWNER  │ EDITOR  │ VIEWER │ APPROVER │
├─────────────┼────────┼─────────┼────────┼──────────┤
│ READ        │   ✅   │   ✅    │   ✅   │    ✅    │
│ COMMENT     │   ✅   │   ✅    │   ✅   │    ✅    │
│ MODIFY      │   ✅   │   ✅    │   ❌   │    ❌    │
│ APPROVE     │   ✅   │   ❌    │   ❌   │    ✅    │
│ SHARE       │   ✅   │   ❌    │   ❌   │    ❌    │
│ DELETE      │   ✅   │   ❌    │   ❌   │    ❌    │
└─────────────┴────────┴─────────┴────────┴──────────┘
```

---

## 🎨 UI FRAMEWORK

- **Design System:** Ant Design
- **State Management:** React Context / Redux
- **HTTP Client:** Axios
- **Real-time:** SSE or WebSocket
- **Responsive:** Mobile-first (320px+)
- **Accessibility:** WCAG 2.1 AA

---

## 📊 KEY METRICS & TARGETS

```
Upload Success Rate:           > 99%
Video Playback Quality:        Adaptive bitrate (1-6 Mbps)
Comment Create Latency:        < 300ms P95
Processing Success Rate:       > 98%
User Authentication:           JWT + Refresh token
Error Rate (P95):              < 1%
Page Load Time:                < 2s
Annotation Latency:            < 200ms
```

---

## 📚 RELATED DOCS

```
01-product-requirements-prd.md        (Product vision)
03-core-features-priority-mvp.md      (Feature list)
09-usecase.md                         (Full usecases)
database.md                           (Schema detail)
04-proposed-tech-stack-architecture   (Tech stack)
ui-ux-screen-flows.md                (Flow diagrams)
10-screen-list-detailed.md           (Full spec - 76KB)
11-SCREEN-DATABASE-API-MAPPING.md    (Dev reference - 22KB)
```

---

## ✅ SIGN-OFF CHECKLIST

- [ ] PM: Scope confirmed
- [ ] Designer: UI/UX approved
- [ ] Tech Lead: Architecture validated
- [ ] QA: Test plan started
- [ ] Team: Ready to develop

---

## 🎓 HOW TO USE THIS CARD

**15-second overview:** Read this entire card  
**5-minute deep dive:** Jump to the section you need  
**Development reference:** Use Database + API sections  
**Testing reference:** Use Coverage Matrix + Critical Features  

---

**Version:** 1.0 | **Status:** Complete | **Date:** 2026-04-09  
**Next Step:** Review & Approval → Development Kickoff  

```
╔════════════════════════════════════════════════════════╗
║  Ready to Build! All 24 Screens Designed & Specified  ║
║            Start Development Immediately 🚀           ║
╚════════════════════════════════════════════════════════╝
```
