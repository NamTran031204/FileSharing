# Project & Folder - UI/UX Screen Designs & User Flows

## 1. User Flow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    MAIN USER JOURNEYS                            │
└─────────────────────────────────────────────────────────────────┘

JOURNEY 1: PRODUCER - Upload & Send for Review
  [Dashboard] → [Select Project] → [Navigate Folder] 
    → [Upload Asset] → [Create Review Session] 
    → [Invite Reviewers] → [Track Status]

JOURNEY 2: REVIEWER - Review & Approve
  [Notifications] → [Open Review Session] 
    → [View Asset] → [Annotate] → [Comment] 
    → [Approve/Reject]

JOURNEY 3: MANAGER - Project Overview
  [Dashboard] → [Project Analytics] 
    → [Team Collaborators] → [Project Settings]

JOURNEY 4: NAVIGATION - Browse Assets
  [Sidebar: Projects] → [Folder Tree] 
    → [Asset List] → [Asset Detail] 
    → [Version History]
```

---

## 1.1 Global App Shell (Applied to all screens)

> **Layout rule bắt buộc:** tất cả layout luôn có **Header + Sidebar**.

### Header (Fixed)
- **Bên trái:** `Logo`, `Breadcrumb menu`
- **Bên phải:** `Search bar`, `Notification icon`, `Setting icon`, `User avatar`

### Sidebar (Fixed)
- `Trang chủ`
- `Dashboard`
- `Projects`
  - Danh sách project con (expand/collapse)
- Các đề mục khác sẽ phát triển sau
- Cuối sidebar: nút `[+ Thêm mới project]`

---

## 2. Screen 1: Dashboard / Home

### 2.1 Layout
_Dùng Global App Shell ở mục 1.1 (Header + Sidebar cố định)._

```
┌─────────────────────────────────────────────────────────────┐
│ Logo | Search Bar | 🔔 Notifications | 👤 User Menu         │
├──────────┬────────────────────────────────────────────────┤
│ SIDEBAR  │ MAIN CONTENT                                   │
│          │                                                │
│ 🏠 Home  │ ┌──────────────────────────────────────────┐  │
│          │ │ WELCOME BACK, JOHN! 👋                   │  │
│          │ └──────────────────────────────────────────┘  │
│          │                                                │
│ 📁 My    │ QUICK STATS:                                   │
│ Projects │ ┌────────────┬───────────┬──────────────────┐ │
│ ├─ Holiday│ │ 3 Pending  │ 5 Ready  │ 2 In Progress   │ │
│ │ Campaign│ │ Reviews    │ to Review│                 │ │
│ │         │ └────────────┴───────────┴──────────────────┘ │
│ ├─ Q1     │                                                │
│ │ Product │ MY RECENT PROJECTS:                            │
│ │         │ ┌────────────────────────────────────────┐    │
│ └─ Brand  │ │ [Card] Holiday Campaign 2026          │    │
│           │ │ 23 assets | 3 pending | Last: 2 min   │    │
│ ⭐ Favs   │ │ [Card] Q1 Product Launch              │    │
│ (2)       │ │ 15 assets | 0 pending | Last: 1 day   │    │
│           │ │ [Card] Brand Refresh                  │    │
│ 🔍 Search │ │ 8 assets  | 1 pending  | Last: 3 days │    │
│           │ └────────────────────────────────────────┘    │
│           │                                                │
│ ⚙️ Settings│ RECENT ACTIVITY:                              │
│           │ • John approved "Banner - Hero" 2 min ago     │
│           │ • Mary uploaded v2 "Icon Set" 1 hour ago      │
│           │ • Review deadline: "Social Media" in 2 days   │
│           │                                                │
└──────────┴────────────────────────────────────────────────┘
```

### 2.2 Actions
- **[+ New Project]** → Modal: Create Project
- **Project Card** → Redirect to Project Detail
- **🔔 Notifications** → Notification panel (overlay)
- **Search** → Global search (assets, projects, folders)

---

## 3. Screen 2: Project List / Sidebar

### 3.1 Sidebar Navigation
```
SIDEBAR MENU (Fixed):

🏠 Trang chủ
📊 Dashboard
📁 Projects
   ├─ Holiday Campaign 2026
   ├─ Q1 Product Launch
   └─ Brand Refresh

(Các đề mục khác sẽ phát triển sau)

[+ Thêm mới project]
```

### 3.2 Interactions
- **Click Project** → Open Project Detail / Folder Browser
- **Right-click Project** → Context menu (Rename, Archive, Settings)
- **Drag Project** → Reorder (pin favorites)
- **[+ Create Project]** → Modal form

---

## 4. Screen 3: Project Detail / Overview

### 4.1 Layout
_Dùng Global App Shell ở mục 1.1 (Header + Sidebar cố định)._

```
┌─────────────────────────────────────────────────────────────┐
│ ◀ Holiday Campaign 2026 | [Edit] [Archive] [Share] [⋯]    │
├─────────────────────────────────────────────────────────────┤
│ Tabs: Overview | Files | Collaborators | Activity | Settings│
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ PROJECT OVERVIEW:                                           │
│ Description: Holiday Campaign for 2026 Q1-Q2              │
│ Category: CAMPAIGN | Start: 2026-02-01 | End: 2026-06-30  │
│ Client: Nike Inc.                                          │
│                                                              │
│ ┌──────────────┬──────────────┬──────────────────┐          │
│ │ 5 Folders    │ 23 Assets    │ 4 Pending Review │          │
│ ├──────────────┼──────────────┼──────────────────┤          │
│ │ 12 Approved  │ 2 Changes    │ 9 Days Left      │          │
│ └──────────────┴──────────────┴──────────────────┘          │
│                                                              │
│ ACTIVITY FEED:                                              │
│ ┌──────────────────────────────────────────────────┐        │
│ │ John approved "Banner - Hero" 2 min ago         │        │
│ │ Mary uploaded v2 "Icon Set" 1 hour ago          │        │
│ │ Review created for "Social Banners" 3 hours ago │        │
│ │ Tom joined as REVIEWER 1 day ago                │        │
│ └──────────────────────────────────────────────────┘        │
│                                                              │
│ [View All Activity]                                        │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Tabs Details

#### **Overview Tab**
- Project summary, description, client, dates
- Stats cards (folders, assets, pending reviews)
- Activity feed

#### **Files Tab**
- Folder browser (same as Screen 5)

#### **Collaborators Tab**
```
Collaborators (3):
┌─────────────────────────────────┐
│ User | Role | Added By | Actions │
├─────────────────────────────────┤
│ John | OWNER (you) | - | (no actions)
│ Mary | EDITOR | John | [Change Role] [Remove]
│ Tom  | REVIEWER | Mary | [Change Role] [Remove]
└─────────────────────────────────┘

[+ Invite Collaborator]
  Input: Email or select from team
  Select: Role (OWNER/EDITOR/REVIEWER/VIEWER)
  [Send Invite]
```

#### **Activity Tab**
- Full audit log of project actions
- Filter by: User, Action Type, Date
- Timeline view

#### **Settings Tab**
- Rename project
- Update description, client, dates
- Privacy settings
- Delete/Archive options

---

## 5. Screen 4: Project Settings / Manage

### 5.1 Layout
_Dùng Global App Shell ở mục 1.1 (Header + Sidebar cố định)._

```
┌─────────────────────────────────────────────────────────────┐
│ Project Settings - Holiday Campaign 2026                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ BASIC INFO:                                                 │
│ Project Name:  [Holiday Campaign 2026____________________] │
│ Project Code:  [HOLIDAY_2026] (auto-generated, editable)   │
│ Description:   [........................                  ] │
│                [........................                  ] │
│ Category:      [CAMPAIGN ▼]                                │
│ Client:        [Nike Inc.________________________]          │
│                                                              │
│ DATES:                                                      │
│ Start Date:    [2026-02-01 📅]                             │
│ End Date:      [2026-06-30 📅]                             │
│ Status:        [ACTIVE ▼]  (ACTIVE | ARCHIVED | COMPLETED)│
│                                                              │
│ ┌────────────────────────────────────────────────┐          │
│ │ [Save Changes] [Reset] [Cancel]                │          │
│ └────────────────────────────────────────────────┘          │
│                                                              │
│ DANGER ZONE:                                                │
│ ┌────────────────────────────────────────────────┐          │
│ │ [Archive Project] - No longer active but keep  │          │
│ │ [Delete Project]  - Permanently remove         │          │
│ └────────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Screen 5: Folder Browser / File Manager

### 6.1 Layout (3-Column)
_Dùng Global App Shell ở mục 1.1 (Header + Sidebar cố định)._

```
┌──────────────────────────────────────────────────────────────┐
│ Holiday Campaign 2026 > Banner Designs > Desktop Variants    │
├────────────────┬──────────────┬──────────────────────────────┤
│ FOLDER TREE    │ BREADCRUMB   │ CONTENT AREA                 │
│                │ & ACTIONS    │                              │
│                │              │ 📁 Variants_2k (folder)      │
│ 📁 Banners     │ [+ New       │ 📁 Variants_4k (folder)      │
│ ├─ Desktop ◀   │ Folder]      │                              │
│ ├─ Mobile      │ [+ Upload]   │ 📄 banner_v1.mp4            │
│ ├─ Tablet      │              │ ✅ APPROVED                 │
│ │ └─ 16:9      │ [Sort: ▼]    │ John approved 2 days ago    │
│ │ └─ 9:16      │ [View: Grid] │ [Download] [Review History] │
│ │             │ [View: List] │                              │
│ 📁 Heroes      │              │ 📄 banner_v2.mp4            │
│ │ ├─ 4K        │              │ ❌ CHANGES REQUESTED         │
│ │ ├─ Standard  │              │ Feedback: Fix color grading │
│ │ └─ Mobile    │              │ [Upload v3] [View Feedback]│
│                │              │                              │
│ 📁 Icons       │              │ 📄 banner_v3.mp4            │
│ 📁 Misc        │              │ ⏳ IN REVIEW (2/3 done)      │
│                │              │ Deadline: 2026-04-10 ⏰     │
│ [📌 Pin this]  │              │ Reviewers: John ✓ Mary ⏳   │
│                │              │ [View Details] [Comments]   │
│                │              │                              │
│                │              │ 📄 new_banner.mp4           │
│                │              │ ⏳ UPLOADING (45%)           │
│                │              │ Est. time: 30s              │
└────────────────┴──────────────┴──────────────────────────────┘
```

### 6.2 Folder Tree Actions
- **Expand/Collapse** folders
- **Right-click folder** → Context menu:
  - [New Subfolder]
  - [Rename]
  - [Delete]
  - [Permissions]
  - [Copy Path]

### 6.3 Content Area Actions
- **Upload** → Drag & drop or [+ Upload] button
- **Create Folder** → [+ New Folder]
- **Asset Card** → Click to open Asset Detail
- **Sort** → By: Name, Date, Status
- **View** → Grid or List view
- **Search** → Filter assets in folder

### 6.4 Status Indicators
- ✅ APPROVED (green)
- ❌ CHANGES REQUESTED (red)
- ⏳ IN_REVIEW (blue)
- ⏳ UPLOADING (progress bar)

---

## 7. Screen 6: Asset Detail Page

### 7.1 Layout (Tabbed)
_Dùng Global App Shell ở mục 1.1 (Header + Sidebar cố định)._

```
┌──────────────────────────────────────────────────────────────┐
│ ◀ Banner - Hero | [Edit] [Rename] [Move] [Delete] [⋯]       │
│ Path: Holiday Campaign > Banners > Desktop > Banner-Hero     │
├──────────────────────────────────────────────────────────────┤
│ Tabs: Preview | Versions | Review | Comments | Activity     │
├──────────────────────────────────────────────────────────────┤
│                          │                                    │
│ PREVIEW PANEL            │ DETAILS PANEL                      │
│ ┌───────────────────┐    │ Status: ⏳ IN_REVIEW               │
│ │                   │    │ Owner: John Smith                 │
│ │ [Video Player]    │    │ Uploaded: 2026-04-08 10:30        │
│ │ or                │    │ Processing: ✅ READY              │
│ │ [Image Viewer]    │    │ File Size: 245 MB                 │
│ │                   │    │ Duration: 5m 30s (video)         │
│ │                   │    │                                   │
│ │ [Full Screen] [⟳] │   │ REVIEW SESSION (v3):              │
│ │                   │    │ Status: ⏳ IN_REVIEW               │
│ └───────────────────┘    │ Assigned to:                       │
│                          │ ├─ John (APPROVER) ✓              │
│ Media Info:              │ └─ Mary (REVIEWER) ⏳              │
│ • Duration: 5:30         │ Deadline: 2026-04-10 (2 days)    │
│ • Resolution: 1920x1080  │ Feedback: "Fix color grading"    │
│ • Codec: H.264           │                                   │
│ • Bitrate: 5000 kbps     │ [View Full Review] [Comments]    │
│                          │                                   │
│                          │ ACTIONS:                          │
│                          │ [🔗 Copy Link] [📥 Download]      │
│                          │ [✎ Annotate]  [💬 Comment]       │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 Preview Tab
- Video player (with timeline, timeline markers for annotations)
- Image viewer with zoom/pan
- Renditions available (HLS stream, thumbnails)

### 7.3 Versions Tab
```
VERSION HISTORY:

v1 - 2026-04-02 | APPROVED ✅
    Uploaded by: John | 150 MB
    Processing: ✅ READY
    Review: Approved by John
    [View] [Download] [Compare]

v2 - 2026-04-05 | REQUEST_CHANGES ❌
    Uploaded by: Mary | 160 MB
    Processing: ✅ READY
    Review: John requested changes
    Feedback: "Fix color grading"
    [View] [Download] [Compare]

v3 - 2026-04-08 | IN_REVIEW ⏳ (CURRENT)
    Uploaded by: Mary | 155 MB
    Processing: ✅ READY
    Review: In progress (2/3 reviewers done)
    Reviewers: John ✓, Mary ⏳
    Deadline: 2026-04-10
    [View] [Download] [Compare]
```

### 7.4 Review Tab
```
REVIEW SESSION #3:
Status: ⏳ IN_REVIEW
Created by: Mary (2026-04-08)
Deadline: 2026-04-10 ⏰
Notes: "Please review color accuracy"

REVIEWERS:
┌──────────────────────────────────────────┐
│ Name  | Role     | Last Viewed | Status  │
├──────────────────────────────────────────┤
│ John  | APPROVER | 2 min ago   | ✓ Done │
│ Mary  | REVIEWER | 1 hour ago  | ⏳ Done│
│ Tom   | REVIEWER | Not yet     | ⏳      │
└──────────────────────────────────────────┘

[Extend Deadline] [Add Reviewer] [Request Update]
```

### 7.5 Comments Tab
```
ANNOTATIONS & COMMENTS:

0:00-0:15 | TIMECODE ANNOTATION (John)
├─ "Music timing feels off"
├─ Replies (2):
│  └─ Mary: "I'll fix this in next version"
│  └─ John: "Thanks!"
└─ Status: OPEN

00:45 | REGION ANNOTATION (Mary)
└─ "Color grading here doesn't match brand guidelines"
   Replies (1):
   └─ Tom: "Agreed, can you provide color reference?"

[Add Annotation] [Filter: Unresolved] [Sort: Timeline]
```

### 7.6 Activity Tab
- Full audit log of this asset
- All version uploads, status changes, reviews
- Comment history

---

## 8. Screen 7: Create Review Session Modal

### 8.1 Step 1 - Select Version
```
┌─────────────────────────────────────────┐
│ Create Review Session                   │
├─────────────────────────────────────────┤
│                                         │
│ Asset: Banner - Hero                    │
│                                         │
│ SELECT VERSION:                         │
│ ○ v1 - APPROVED (2026-04-02)           │
│ ○ v2 - CHANGES (2026-04-05)            │
│ ● v3 - LATEST (2026-04-08) ← Selected  │
│                                         │
│ [Previous] [Next]                       │
│ [Cancel]                                │
└─────────────────────────────────────────┘
```

### 8.2 Step 2 - Add Reviewers
```
┌─────────────────────────────────────────┐
│ ADD REVIEWERS                           │
├─────────────────────────────────────────┤
│                                         │
│ Select reviewers from team:             │
│ ☑ John Smith (APPROVER)                │
│ ☑ Mary Johnson (REVIEWER)               │
│ ☐ Tom Wilson (REVIEWER)                │
│ ☐ Sarah Davis (VIEWER)                 │
│                                         │
│ Or invite new:                          │
│ [john@company.com, mary@...]            │
│ Role: [APPROVER ▼]                     │
│ [+ Add More]                           │
│                                         │
│ [Previous] [Next]                       │
│ [Cancel]                                │
└─────────────────────────────────────────┘
```

### 8.3 Step 3 - Set Details
```
┌─────────────────────────────────────────┐
│ REVIEW DETAILS                          │
├─────────────────────────────────────────┤
│                                         │
│ Title: [Banner - Hero Review_________] │
│                                         │
│ Description:                            │
│ [Please review for color accuracy      │
│  and brand guidelines compliance...    │
│  ...........................]          │
│                                         │
│ Deadline: [2026-04-10 📅 2:00 PM 🕐]  │
│                                         │
│ Notifications:                          │
│ ☑ Notify reviewers immediately         │
│ ☑ Send reminder 1 day before deadline  │
│                                         │
│ [Previous] [Next]                       │
│ [Cancel]                                │
└─────────────────────────────────────────┘
```

### 8.4 Step 4 - Confirm & Send
```
┌─────────────────────────────────────────┐
│ CONFIRM REVIEW SESSION                  │
├─────────────────────────────────────────┤
│                                         │
│ Asset: Banner - Hero                    │
│ Version: v3 (2026-04-08)               │
│ Reviewers: John, Mary                   │
│ Deadline: 2026-04-10                   │
│                                         │
│ Notifications will be sent to:          │
│ • john@company.com (APPROVER)          │
│ • mary@company.com (REVIEWER)          │
│                                         │
│ [Previous] [✓ Create Review Session]   │
│ [Cancel]                                │
└─────────────────────────────────────────┘
```

After Submit:
- ✅ Success message
- Redirect to Review Session page
- Notification sent to reviewers

---

## 9. Screen 8: Review Interface (Reviewer POV)

### 9.1 Layout
_Dùng Global App Shell ở mục 1.1 (Header + Sidebar cố định)._

```
┌──────────────────────────────────────────────────────────────┐
│ Review Session: Banner - Hero | John's Review               │
├──────────────────────────────────────────────────────────────┤
│ Status: ⏳ IN_REVIEW (2/3 reviewers done)                    │
│ Deadline: 2026-04-10 (2 days left)                           │
├────────────────┬──────────────────────────────────────────┤
│ TIMELINE       │ REVIEW PANEL                             │
│                │                                          │
│ ⏱ 00:00 ┣━━┓  │ ┌──────────────────────────────────────┐│
│          ┃ 🔴 │ │ ANNOTATION #1                        ││
│ ⏱ 00:15      │ │ Time: 00:15-00:30                    ││
│          ┣━━┓  │ │ Type: TIMECODE                       ││
│ ⏱ 00:45      │ │ Comment: "Music timing feels off"    ││
│          ┣━━┓  │ │                                      ││
│ ⏱ 01:30      │ │ [Edit] [Resolve] [Reply...]          ││
│          ┣━━┓  │ └──────────────────────────────────────┘│
│ ⏱ 02:00      │ │ Your reply:                           ││
│          ┣━━┓  │ [I'll fix this in next version       │
│ ⏱ 03:00      │ │ ................................       │
│          ┣━━┓  │ .]                                     ││
│ ⏱ 04:00      │ │ [Post Reply] [Cancel]                ││
│          ┣━━┓  │                                         │
│ ⏱ 05:00      │ │ [Next Annotation] [Previous]          ││
│          ┗━━┛  │                                         │
│                │                                          │
│ [Add           │ [Approve] [Request Changes] [Comment]│
│ Annotation]    │                                         │
│                │                                          │
└────────────────┴──────────────────────────────────────────┘
```

### 9.2 Actions on Review Page
- **Play/Pause** video
- **Timeline markers** (click to jump)
- **Add Annotation** → Click on timeline/region
  - TIMECODE: Time range
  - REGION: Draw on image/video frame
- **Comment** on annotations
- **Resolve** annotations (status: RESOLVED)
- **Approve** / **Request Changes** buttons

---

## 10. Screen 9: Notification Center

### 10.1 Layout
_Dùng Global App Shell ở mục 1.1 (Header + Sidebar cố định)._

```
┌─────────────────────────────────────┐
│ 🔔 Notifications (3 new)            │
├─────────────────────────────────────┤
│                                     │
│ NEW REVIEW INVITATION               │
│ John sent you "Banner - Hero"       │
│ for review                          │
│ Deadline: 2026-04-10                │
│ [View] [Dismiss]                    │
│ ─────────────────────────────────   │
│                                     │
│ REVIEW APPROVED ✅                  │
│ Your "Icon Set v2" was approved     │
│ by Mary                             │
│ [View] [Dismiss]                    │
│ ─────────────────────────────────   │
│                                     │
│ CHANGES REQUESTED ❌                │
│ John requested changes on           │
│ "Social Banner"                     │
│ Feedback: "Fix color grading"       │
│ [View] [Dismiss]                    │
│ ─────────────────────────────────   │
│                                     │
│ [Mark All as Read] [Settings]       │
└─────────────────────────────────────┘
```

---

## 11. Screen 10: Search & Filter

### 11.1 Global Search
```
┌─────────────────────────────────────────────────────────┐
│ 🔍 [Search assets, folders, projects...____________]    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ RESULTS FOR: "banner"                                   │
│                                                         │
│ ASSETS (5):                                             │
│ • Banner - Hero (Holiday Campaign)                      │
│ • Banner - Mobile (Holiday Campaign)                    │
│ • Social Banner (Q1 Product)                            │
│ • Seasonal Banner (Brand Refresh)                       │
│                                                         │
│ FOLDERS (2):                                            │
│ • Banners (Holiday Campaign)                            │
│ • Banner Designs (Q1 Product)                           │
│                                                         │
│ PROJECTS (1):                                           │
│ • [None matching]                                       │
└─────────────────────────────────────────────────────────┘
```

### 11.2 Advanced Filter (in Folder View)
```
┌─────────────────────────────────────────────────────────┐
│ Filters:                                                │
│ Status: [All ▼] [In Review] [Approved] [Changes]       │
│ Date: [Last 7 days ▼]                                  │
│ Owner: [All ▼] [Me] [John] [Mary]                      │
│ Sort: [Date (newest) ▼]                                │
│ View: [Grid] [List]                                     │
│ [Apply] [Reset]                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 12. State Transitions & Confirmations

### 12.1 Approve Confirmation
```
┌─────────────────────────────────────────┐
│ APPROVE REVIEW SESSION?                 │
├─────────────────────────────────────────┤
│                                         │
│ You are about to approve:               │
│ "Banner - Hero" (v3)                   │
│                                         │
│ Comments will be locked and the        │
│ producer will be notified.              │
│                                         │
│ [❌ Cancel] [✅ Approve]               │
└─────────────────────────────────────────┘
```

### 12.2 Request Changes Confirmation
```
┌─────────────────────────────────────────┐
│ REQUEST CHANGES?                        │
├─────────────────────────────────────────┤
│                                         │
│ Asset: Banner - Hero                    │
│ Why changes? (required):                │
│ [Fix color grading and timing___      │
│  ................................._]   │
│                                         │
│ Who should fix?                         │
│ [All reviewers] [Producer only]         │
│                                         │
│ Deadline for resubmission:              │
│ [2026-04-15 📅]                        │
│                                         │
│ [❌ Cancel] [📤 Request Changes]       │
└─────────────────────────────────────────┘
```

### 12.3 Delete Folder Confirmation
```
┌─────────────────────────────────────────┐
│ DELETE FOLDER?                          │
├─────────────────────────────────────────┤
│                                         │
│ This will delete folder:                │
│ "Banner Designs / Mobile Variants"     │
│                                         │
│ ⚠️ WARNING:                             │
│ • 5 assets inside will be deleted       │
│ • This action cannot be undone          │
│                                         │
│ Type to confirm: [DELETE_________________]
│                                         │
│ [❌ Cancel] [🗑️ Delete Permanently]   │
└─────────────────────────────────────────┘
```

---

## 13. Mobile Responsive Views

### 13.1 Mobile: Folder Browser (Compact)
```
┌──────────────────────────┐
│ < Holiday Campaign      │
├──────────────────────────┤
│ 📁 Banners              │
│ 📁 Heroes               │
│ 📁 Icons                │
│                          │
│ ASSETS:                  │
│ [Card] banner_v1.mp4    │
│ Status: ✅              │
│                          │
│ [Card] banner_v2.mp4    │
│ Status: ❌ Changes      │
│                          │
│ [Card] banner_v3.mp4    │
│ Status: ⏳ Review       │
│                          │
│ [+ Upload]              │
└──────────────────────────┘
```

### 13.2 Mobile: Notification Stack
```
┌──────────────────────┐
│ 🔔 (3) Notifications │
├──────────────────────┤
│ New Review: Banner   │
│ Deadline: 2026-04-10│
│ [View]               │
│ ─────────────────────│
│ Approved: Icon Set  │
│ by Mary              │
│ [View]               │
│ ─────────────────────│
│ Changes: Social     │
│ Feedback needed     │
│ [View]               │
└──────────────────────┘
```

---

## 14. Error States & Edge Cases

### 14.1 Empty States

**Empty Project**:
```
┌─────────────────────────────────────┐
│ 📁 Holiday Campaign (Empty)         │
├─────────────────────────────────────┤
│                                     │
│ No folders yet.                     │
│ [+ Create First Folder]             │
│                                     │
│ or                                  │
│                                     │
│ [+ Upload Asset Directly]           │
│                                     │
│ 💡 Tip: Organize assets into       │
│    folders for better management.   │
└─────────────────────────────────────┘
```

**Empty Folder**:
```
┌─────────────────────────────────────┐
│ 📁 Banners (Empty)                  │
├─────────────────────────────────────┤
│ This folder has no assets.          │
│ [+ Upload Asset]                    │
│ [+ Create Subfolder]                │
└─────────────────────────────────────┘
```

### 14.2 Loading States
- Skeleton loaders for project list
- Progress bar for file uploads
- Spinner while processing videos

### 14.3 Error States

**Failed Upload**:
```
🔴 Upload Failed
File: banner_large.mp4 (2.5 GB)
Error: File size exceeds 2 GB limit
[Retry] [Dismiss]
```

**Permission Denied**:
```
🔴 Access Denied
You don't have permission to edit this folder.
Contact project owner for access.
[Request Access]
```

---

## 15. Keyboard Shortcuts (Optional)

| Shortcut | Action |
|---|---|
| `Ctrl/Cmd + K` | Global search |
| `Ctrl/Cmd + N` | New project |
| `Ctrl/Cmd + U` | Upload asset |
| `Esc` | Close modal/sidebar |
| `→` / `←` | Next/Previous version |
| `Space` | Play/Pause video |

---

## 16. Accessibility Considerations

- **ARIA labels** on all buttons and icons
- **Keyboard navigation** through folder tree
- **Color contrast** for status badges (not just color)
- **Screen reader** support for complex tables
- **Focus indicators** visible on all interactive elements
- **Alt text** on images and icons

---

## 17. Summary: Key Screen Flows

1. **Onboarding**: Home → Create Project → Create Folder → Upload Asset
2. **Producer**: Project → Folder → Asset → Create Review → Track Status
3. **Reviewer**: Notification → Review Session → Annotate → Approve/Reject
4. **Manager**: Dashboard → Project Overview → Analytics → Collaborators
5. **Navigation**: Sidebar (Projects) → Folder Tree → Assets → Details

---

