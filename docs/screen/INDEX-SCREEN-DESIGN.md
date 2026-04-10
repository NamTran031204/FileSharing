# 📑 INDEX: Danh Sách Màn Hình - Hướng Dẫn & Navigation

**Ngày tạo:** 2026-04-09  
**Phiên bản:** Phase 2 MVP Design Complete  
**Status:** ✅ READY FOR DEVELOPMENT  

---

## 🚀 BẮT ĐẦU NGAY (3 Options)

### Option 1️⃣ - Tôi chỉ có 60 giây
👉 **Read:** `00-EXECUTIVE-BRIEF-60SEC.md` (5 min)
- Tóm tắt 24 screens
- Effort estimate: 42 days
- Usecase coverage: 100%

### Option 2️⃣ - Tôi có 15 phút
👉 **Read:** `QUICK-REFERENCE-CARD.md` (10 min)
- 1-page quick ref
- All 24 screens overview
- Database + API summary
- Priority matrix

### Option 3️⃣ - Tôi là developer/architect
👉 **Read:** 
1. `README-SCREEN-DESIGN.md` (5 min)
2. `11-SCREEN-DATABASE-API-MAPPING.md` (1-2 hours)
3. Refer to `10-screen-list-detailed.md` khi develop

---

## 📚 DANH SÁCH CÁC FILE DESIGN

### 🎯 ENTRY POINT
| File | Kích thước | Mục đích | Đọc trong |
|------|-----------|---------|----------|
| **00-EXECUTIVE-BRIEF-60SEC.md** | 5KB | Tóm tắt cực ngắn cho bận rộn | 1 min |
| **QUICK-REFERENCE-CARD.md** | 13KB | Quick ref 1 trang cho dev | 5 min |
| **README-SCREEN-DESIGN.md** | 12KB | Navigation & hướng dẫn đầu tiên | 5 min |

### 📋 SPECIFICATION DOCUMENTS
| File | Kích thước | Mục đích | Đọc cho |
|------|-----------|---------|---------|
| **10-SCREEN-LIST-SUMMARY.md** | 11KB | Tóm tắt tất cả 24 screens | PM, Designer |
| **10-screen-list-detailed.md** | 76KB | CHI TIẾT MỖI SCREEN (LAYOUT + INPUTS + BUTTONS + DB + API) | Frontend, Designer |
| **11-SCREEN-DATABASE-API-MAPPING.md** | 22KB | Developer reference - Database queries + API endpoints | Backend, Database Architect |

### 🗂️ COMPLEMENTARY DOCS (Already in project)
| File | Kích thước | Content |
|------|-----------|---------|
| **database.md** | 30KB | Detailed database schema |
| **ui-ux-screen-flows.md** | 40KB | User flow diagrams |
| **09-usecase.md** | 20KB | Complete usecase list |
| **project-folder-structure.md** | 21KB | Project hierarchy design |

---

## 🎯 ROLE-BASED READING GUIDE

### 👔 Product Manager
**Time: 15 minutes**
```
1. 00-EXECUTIVE-BRIEF-60SEC.md
   └─ Understand 24 screens, effort, coverage
2. 10-SCREEN-LIST-SUMMARY.md
   └─ See grouped screens by priority
3. README-SCREEN-DESIGN.md (section: Effort Breakdown)
   └─ Confirm timeline
```
**Action:** Approve scope, align team

---

### 🎨 UI/UX Designer
**Time: 2-3 hours**
```
1. QUICK-REFERENCE-CARD.md (5 min)
   └─ Overview
2. README-SCREEN-DESIGN.md (10 min)
   └─ Navigation, component framework
3. 10-SCREEN-LIST-SUMMARY.md (20 min)
   └─ Screen groupings and flows
4. 10-screen-list-detailed.md (1-2 hours)
   └─ Layout diagrams, input fields, button actions
5. ui-ux-screen-flows.md (30 min)
   └─ Reference existing flows, validate design
```
**Action:** Detail UI components, finalize layouts, create wireframes

---

### 💻 Frontend Developer
**Time: 2-3 hours**
```
1. README-SCREEN-DESIGN.md (5 min)
   └─ Understand structure
2. 11-SCREEN-DATABASE-API-MAPPING.md (30 min)
   └─ See what API/DB each screen needs
3. 10-screen-list-detailed.md (1 hour)
   └─ Implement logic from "Buttons & Actions"
4. QUICK-REFERENCE-CARD.md (10 min)
   └─ Reference as you code
```
**Action:** Setup components, integrate APIs, implement forms

---

### 🗄️ Backend / Database Architect
**Time: 1-2 hours**
```
1. QUICK-REFERENCE-CARD.md (Database section, 5 min)
   └─ See 12 collections needed
2. 11-SCREEN-DATABASE-API-MAPPING.md (1 hour)
   └─ See queries + API design for EACH SCREEN
3. database.md (30 min)
   └─ Validate schema against API needs
4. 10-screen-list-detailed.md (reference as needed)
   └─ Understand complex queries
```
**Action:** Finalize schema, design API endpoints, setup indexes

---

### 🧪 QA / Test Engineer
**Time: 1-2 hours**
```
1. 10-SCREEN-LIST-SUMMARY.md (10 min)
   └─ Understand screens & priorities
2. 10-screen-list-detailed.md (1-2 hours)
   └─ Read "Buttons & Actions" sections
   └─ Create test cases from action workflows
3. 11-SCREEN-DATABASE-API-MAPPING.md (30 min)
   └─ Understand API test cases
```
**Action:** Create test cases, test scripts, UAT checklist

---

### 🚀 Tech Lead / Architect
**Time: 2-4 hours**
```
1. README-SCREEN-DESIGN.md (10 min)
   └─ Full overview
2. All 3 main docs: 
   - 10-SCREEN-LIST-SUMMARY.md (15 min)
   - 11-SCREEN-DATABASE-API-MAPPING.md (30 min)
   - 10-screen-list-detailed.md (1-2 hours, skim sections)
3. QUICK-REFERENCE-CARD.md (10 min)
   └─ Final checklist
```
**Action:** Validate architecture, approve design, plan sprints

---

## 📊 QUICK FACTS

```
Total Screens:        24
├─ P0 Priority:       16 (MVP)
└─ P1 Priority:        8 (Phase 2)

Database Collections: 12
├─ Core:              5 (users, projects, folders, assets, metadata)
├─ Review:            3 (review_sessions, annotations, comment_threads)
├─ Processing:        3 (media_renditions, processing_jobs, audit_logs)
└─ Notifications:     1 (notifications)

API Endpoints:        ~50
├─ Auth:              3
├─ Projects:          6
├─ Folders:           6
├─ Assets:            8
├─ Upload:            3
├─ Streaming:         3
├─ Annotations:       6
├─ Reviews:           4
├─ Notifications:     5
├─ Search:            1
├─ Dashboard:         2
└─ User:              5

Total Effort:         42 days
├─ Frontend:          18 days (43%)
├─ Backend:           17 days (40%)
└─ Database:           7 days (17%)

Usecase Coverage:    100% (21/21 P0+P1 usecases)
```

---

## 🔍 FIND SPECIFIC SCREEN

### By Screen Number
→ Open **10-screen-list-detailed.md** → Search "Screen X"

### By Screen Name
→ See table below OR search any MD file (Ctrl+F)

### By Function/Feature
- **Authentication:** Screens 1, 2, 3, 24
- **Project Management:** Screens 4, 5, 6, 7, 8
- **File Handling:** Screens 9, 10, 11
- **Asset Viewing:** Screens 12, 13, 14, 21
- **Annotation:** Screens 15, 16, 17
- **Review Workflow:** Screens 18, 19, 20
- **Notifications:** Screen 22
- **Search:** Screen 23
- **Settings:** Screen 24

### By Usecase
→ See **11-SCREEN-DATABASE-API-MAPPING.md** → Search "UC-X##"

---

## 📱 SCREEN DIRECTORY

| # | Screen Name | Priority | Category | See in |
|---|------------|----------|----------|---------|
| 1 | Login Page | P0 | Auth | Screen 1 |
| 2 | Register Page | P0 | Auth | Screen 2 |
| 3 | Password Reset | P1 | Auth | Screen 3 |
| 4 | Dashboard / Home | P0 | Navigation | Screen 4 |
| 5 | Project List (Sidebar) | P0 | Navigation | Screen 5 |
| 6 | Create Project Modal | P0 | Projects | Screen 6 |
| 7 | Project Detail | P0 | Projects | Screen 7 |
| 8 | Project Settings | P1 | Projects | Screen 8 |
| 9 | Folder Browser | P0 | Files | Screen 9 |
| 10 | Create Folder Modal | P0 | Files | Screen 10 |
| 11 | Upload Modal | P0 | Files | Screen 11 |
| 12 | Asset Detail Page | P0 | Assets | Screen 12 |
| 13 | Video Player | P0 | Media | Screen 13 |
| 14 | Image Viewer | P0 | Media | Screen 14 |
| 15 | Annotation Panel | P0 | Annotation | Screen 15 |
| 16 | Comment Thread Panel | P0 | Annotation | Screen 16 |
| 17 | Version Compare Modal | P1 | Versioning | Screen 17 |
| 18 | Create Review Session | P0 | Review | Screen 18 |
| 19 | Review Session Page | P0 | Review | Screen 19 |
| 20 | Upload New Version Modal | P0 | Versioning | Screen 20 |
| 21 | Version List | P0 | Assets | Screen 21 |
| 22 | Notification Panel | P1 | System | Screen 22 |
| 23 | Search Results | P1 | System | Screen 23 |
| 24 | User Settings | P1 | System | Screen 24 |

---

## 🎓 DOCUMENT STRUCTURE

### Each Screen in 10-screen-list-detailed.md includes:

```
SCREEN X: [Name]
├─ Mức ưu tiên: P0/P1
├─ Loại: Page/Modal/Component
├─ Usecase phục vụ: UC-X##
├─ Mục Đích: [What it does]
├─ Chức Năng Chính: [Key features]
├─ Input Fields & Data Mapping: [Table of inputs]
├─ Buttons & Actions: [Table of buttons & workflows]
├─ Parent/Child Screens: [Screen relationships]
├─ Database Collections: [List of collections needed]
├─ API Endpoints Required: [Detailed endpoints]
└─ Database Operations: [Query examples]
```

---

## 🔗 HOW THESE DOCS RELATE

```
00-EXECUTIVE-BRIEF-60SEC.md (tóm tắt 60 giây)
         ↓
QUICK-REFERENCE-CARD.md (1 trang quick ref)
         ↓
README-SCREEN-DESIGN.md (hướng dẫn đầy đủ)
         ├─→ 10-SCREEN-LIST-SUMMARY.md (grouped by function)
         └─→ 10-screen-list-detailed.md (FULL SPEC - every screen detail)
                 ↓
         11-SCREEN-DATABASE-API-MAPPING.md (dev reference)
         
         Cross-reference:
         ├─→ database.md (schema details)
         ├─→ ui-ux-screen-flows.md (user flows)
         └─→ 09-usecase.md (usecase list)
```

---

## ✅ CHECKLIST BEFORE STARTING DEVELOPMENT

- [ ] Product Manager approved scope (24 screens, 42 days, 100% coverage)
- [ ] Designer finalized UI components & layouts
- [ ] Backend team designed API contracts (50 endpoints)
- [ ] Database team validated schema (12 collections)
- [ ] QA created test cases from screen specs
- [ ] Team aligned on tech stack & architecture
- [ ] Sprint 1 tasks broken down and assigned

---

## 🎬 NEXT STEPS

1. **Review Phase (1-2 days)**
   - PM confirms scope
   - Tech Lead approves architecture
   - Designer signs off on layouts

2. **Planning Phase (1 day)**
   - Break 24 screens into 6-8 sprints
   - Assign tasks to team members
   - Setup project management board

3. **Development Phase (6-8 weeks)**
   - Execute sprints (Sprint 1-6)
   - Daily standups & progress tracking
   - Code reviews on PRs

4. **Testing Phase (1-2 weeks)**
   - UAT testing
   - Bug fixes
   - Performance optimization

5. **Launch Phase (1 week)**
   - Production deployment
   - Post-launch monitoring
   - Support & maintenance

---

## 💡 PRO TIPS

1. **Use Ctrl+F to search** any document for screen name or feature
2. **Keep QUICK-REFERENCE-CARD.md open** while developing
3. **Refer to 11-SCREEN-DATABASE-API-MAPPING.md** for API/DB questions
4. **Cross-check with database.md** for detailed schema
5. **Validate flows against ui-ux-screen-flows.md** for UX consistency

---

## 🚀 YOU'RE READY!

All 24 screens designed ✅  
100% usecase coverage ✅  
Database mapped ✅  
APIs designed ✅  
Effort estimated ✅  

**→ Time to build! Let's go! 🎯**

---

## 📞 QUESTIONS?

**Q: Where do I find details about Screen X?**  
A: Open `10-screen-list-detailed.md` and search "Screen X"

**Q: What database queries does Screen Y need?**  
A: Open `11-SCREEN-DATABASE-API-MAPPING.md` and search "Screen Y"

**Q: How many API endpoints are needed?**  
A: ~50 total (see QUICK-REFERENCE-CARD.md API section)

**Q: What's the effort estimate?**  
A: 42 days total (18 FE + 17 BE + 7 DB)

**Q: Are all usecases covered?**  
A: Yes, 100% of 21 P0+P1 usecases

---

**📄 Document Index Version:** 1.0  
**📅 Last Updated:** 2026-04-09  
**✅ Status:** COMPLETE & READY FOR DEVELOPMENT  

**Next file to read:** Pick your role above and follow the path! 👆

