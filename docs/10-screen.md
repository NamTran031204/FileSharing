
---
## **DANH SÁCH SCREENS CHO MVP MEDIA REVIEW PLATFORM**

---

### **NHÓM 1: AUTHENTICATION & NAVIGATION**

---

## SCREEN: Login Page
- **Mục đích:** Xác thực người dùng trước khi truy cập vào hệ thống review, đảm bảo bảo mật media assets.
- **Chức năng chính:**
  • Đăng nhập email/password
  • Lưu session với JWT & refresh token
  • Forgot password flow
- **Nút bấm quan trọng:** Login, Forgot Password
- **Bố cục đề xuất:** Centered card layout với form đơn giản
- **Parent screen:** ROOT
- **Audience:** All

---

## SCREEN: Main Dashboard
- **Mục đích:** Điểm khởi đầu sau login, tổng quan các media assets và review sessions đang hoạt động.
- **Chức năng chính:**
  • Danh sách media assets với trạng thái review (In Review, Request Changes, Approved)
  • Filter theo trạng thái, người tạo, ngày upload
  • Quick access tới notifications
  • Hiển thị số lượng pending comments/feedback
- **Nút bấm quan trọng:** Upload New Media, View Notifications, Filter/Search
- **Bố cục đề xuất:** Grid/List view với sidebar filter, header với notification bell
- **Parent screen:** ROOT
- **Audience:** All

---

### **NHÓM 2: UPLOAD & MEDIA MANAGEMENT**

---

## SCREEN: Upload Media Flow
- **Mục đích:** Upload video/image dung lượng lớn với tracking tiến độ và metadata.
- **Chức năng chính:**
  • Drag-and-drop hoặc browse file
  • Multipart/chunked upload với progress bar
  • Retry logic khi upload failed
  • Nhập metadata cơ bản (title, description, tags)
  • Magic byte validation
- **Nút bấm quan trọng:** Select File, Upload, Cancel
- **Bố cục đề xuất:** Modal hoặc dedicated page với upload zone và progress indicators
- **Parent screen:** Main Dashboard
- **Audience:** Producer

---

## SCREEN: Media Asset Detail (Library View)
- **Mục đích:** Xem thông tin tổng quan một media asset, quản lý versions và permissions.
- **Chức năng chính:**
  • Hiển thị metadata (title, description, format, size, duration)
  • Danh sách versions (version number, upload date, uploader, processing status)
  • Permission management (chia sẻ với user/team theo quyền READ/COMMENT/MODIFY/OWNER)
  • Share link generation
  • Download original/versions
- **Nút bấm quan trọng:** Upload New Version, Share, Edit Permissions, Delete, Review This Asset
- **Bố cục đề xuất:** Split view - left sidebar versions list, right panel detail & permissions
- **Parent screen:** Main Dashboard
- **Audience:** Producer, PM

---

## SCREEN: Upload New Version Modal
- **Mục đích:** Upload phiên bản mới của media asset để tiếp tục vòng revision mà không mất feedback cũ.
- **Chức năng chính:**
  • Upload file mới cho asset hiện tại
  • Tự động increment version number
  • Nhập change notes/description
  • Giữ nguyên annotations/comments từ version trước
- **Nút bấm quan trọng:** Select File, Upload Version, Cancel
- **Bố cục đề xuất:** Modal với upload zone và version notes input
- **Parent screen:** Media Asset Detail
- **Audience:** Producer

---

### **NHÓM 3: REVIEW & PLAYBACK**

---

## SCREEN: Media Review Workspace (Video)
- **Mục đích:** Workspace chính để review video với playback, timeline, annotations và comments.
- **Chức năng chính:**
  • HLS video player với adaptive bitrate
  • Timeline scrubber với thumbnail previews (P1)
  • Timecode-based comments list
  • Hiển thị annotations/markers trên timeline
  • Version selector dropdown
  • Processing status indicator (nếu đang transcode)
  • Review status badge (In Review/Request Changes/Approved)
- **Nút bấm quan trọng:** Play/Pause, Add Comment at Timecode, Change Review Status, Compare Versions
- **Bố cục đề xuất:** Split view - video player chiếm 60-70% màn hình, sidebar phải chứa comment threads
- **Parent screen:** Main Dashboard hoặc Media Asset Detail
- **Audience:** All

---

## SCREEN: Media Review Workspace (Image)
- **Mục đích:** Workspace chính để review image với annotation tools và comment sidebar.
- **Chức năng chính:**
  • Image viewer với zoom/pan
  • Annotation tools (rectangle, arrow, freehand, text box) để đánh dấu vùng
  • Region-based comments list
  • Version selector dropdown
  • Review status badge
- **Nút bấm quan trọng:** Add Annotation, Add Comment on Region, Change Review Status, Compare Versions
- **Bố cục đề xuất:** Split view - image canvas chiếm 60-70% màn hình, sidebar phải chứa annotations & comments
- **Parent screen:** Main Dashboard hoặc Media Asset Detail
- **Audience:** All

---

## SCREEN: Comment Thread Panel
- **Mục đích:** Hiển thị và quản lý threaded comments, replies, và trạng thái resolution.
- **Chức năng chính:**
  • List tất cả comment threads theo timecode (video) hoặc region (image)
  • Reply to comment (nested threads)
  • Resolve/Reopen comment
  • Mention user (@username)
  • Filter comments: All/Open/Resolved, By User, By Version
  • Search comments
- **Nút bấm quan trọng:** Reply, Resolve, Reopen, Filter, Search
- **Bố cục đề xuất:** Sidebar panel bên phải Review Workspace, threaded list layout
- **Parent screen:** Media Review Workspace (Video/Image)
- **Audience:** All

---

## SCREEN: Add Comment Modal/Inline Form
- **Mục đích:** Tạo comment mới tại timecode (video) hoặc annotated region (image).
- **Chức năng chính:**
  • Text input với rich text support (optional)
  • Attach timecode (video) hoặc annotation coordinates (image)
  • Mention user trong comment
  • Save as draft hoặc post ngay
- **Nút bấm quan trọng:** Post Comment, Save Draft, Cancel, Mention User
- **Bố cục đề xuất:** Inline expandable form trong Comment Thread Panel hoặc modal popup
- **Parent screen:** Media Review Workspace
- **Audience:** Reviewer, Producer, PM

---

## SCREEN: Version Comparison View
- **Mục đích:** So sánh hai versions của cùng media asset để kiểm tra thay đổi giữa các vòng revision.
- **Chức năng chính:**
  • A/B switch: chuyển nhanh giữa version A và B
  • Overlay mode (P1): hiển thị chồng lấp với opacity slider
  • Đồng bộ playback position khi switch (video)
  • Hiển thị metadata diff (resolution, duration, file size)
- **Nút bấm quan trọng:** Switch to Version A, Switch to Version B, Exit Comparison
- **Bố cục đề xuất:** Fullscreen view với toggle controls, có thể split-screen (P2) hoặc single view với A/B toggle (MVP)
- **Parent screen:** Media Review Workspace
- **Audience:** Reviewer, Producer, PM

---

### **NHÓM 4: WORKFLOW & STATUS**

---

## SCREEN: Review Status Change Modal
- **Mục đích:** Thay đổi trạng thái review chính thức (In Review → Request Changes → Approved).
- **Chức năng chính:**
  • Chọn trạng thái mới: In Review, Request Changes, Approved
  • Nhập notes/reason cho status change
  • Ghi audit log
  • Gửi notification cho stakeholders
- **Nút bấm quan trọng:** Approve, Request Changes, Set to In Review, Cancel
- **Bố cục đề xuất:** Modal với status selector và notes input
- **Parent screen:** Media Review Workspace
- **Audience:** Reviewer (có quyền), PM, Owner

---

## SCREEN: Review Timeline (Activity Log)
- **Mục đích:** Hiển thị toàn bộ diễn biến review theo thời gian (comments, status changes, version uploads).
- **Chức năng chính:**
  • Timeline view tất cả activities: comment created, reply added, status changed, version uploaded
  • Filter theo activity type, user, date range
  • Jump to specific comment/annotation from timeline
  • Export audit trail (P1)
- **Nút bấm quan trọng:** Filter, Export Audit Log
- **Bố cục đề xuất:** Vertical timeline layout với icons và timestamps
- **Parent screen:** Media Asset Detail hoặc tab trong Review Workspace
- **Audience:** PM, Producer, Reviewer

---

### **NHÓM 5: COLLABORATION & SHARING**

---

## SCREEN: Share Settings Modal
- **Mục đích:** Chia sẻ media asset hoặc review session với người khác theo permissions cụ thể.
- **Chức năng chính:**
  • Mời user bằng email
  • Chọn permission level: READ, COMMENT, MODIFY, OWNER
  • Generate share link với token bảo mật
  • Set link expiration (optional, P1)
  • Revoke access
- **Nút bấm quan trọng:** Invite User, Generate Link, Copy Link, Revoke Access
- **Bố cục đề xuất:** Modal với user list, permission selector, và link generator
- **Parent screen:** Media Asset Detail hoặc Review Workspace
- **Audience:** Producer, PM, Owner

---

## SCREEN: Notifications Center
- **Mục đích:** Hiển thị in-app notifications khi có feedback mới, mentions, status changes.
- **Chức năng chính:**
  • List notifications: new comment, reply, mention, status change, version uploaded
  • Mark as read/unread
  • Jump to related media/comment từ notification
  • Filter: All/Unread/By Type
- **Nút bấm quan trọng:** Mark as Read, View All, Clear All
- **Bố cục đề xuất:** Dropdown panel từ header bell icon hoặc dedicated page
- **Parent screen:** Main Dashboard (header)
- **Audience:** All

---

### **NHÓM 6: TRACKING & MONITORING (PM-focused)**

---

## SCREEN: Review Status Dashboard
- **Mục đích:** Tổng quan trạng thái review của nhiều assets/projects để PM theo dõi tiến độ.
- **Chức năng chính:**
  • Summary metrics: số asset In Review, Request Changes, Approved
  • List assets với trạng thái, assignee, SLA countdown
  • Filter theo project, team, status, date range
  • Track số lượng open/resolved comments per asset
- **Nút bấm quan trọng:** Filter, View Asset Details, Export Report (P1)
- **Bố cục đề xuất:** Dashboard với summary cards ở top, table/grid view ở bottom
- **Parent screen:** ROOT (tab trong Main Dashboard hoặc separate dashboard)
- **Audience:** PM, Owner

---

## SCREEN: Processing Status Monitor
- **Mục đích:** Theo dõi trạng thái xử lý media (transcode, thumbnail generation) để biết khi nào asset sẵn sàng review.
- **Chức năng chính:**
  • List media assets đang processing: PENDING, PROCESSING, READY, FAILED
  • Progress indicator với estimated time
  • Error details khi processing failed
  • Retry processing job
- **Nút bấm quan trọng:** Retry Processing, View Details, Cancel Job
- **Bố cục đề xuất:** Table/List view với status badges và progress bars
- **Parent screen:** Main Dashboard hoặc Media Asset Detail
- **Audience:** Producer, PM

---

### **TỔNG KẾT SCREENS**

**Tổng số screens MVP:** 16 screens chính

**Phân bố theo audience:**
- **Producer:** 8 screens (Upload, Versions, Review Workspace, Status)
- **Reviewer:** 7 screens (Review Workspace, Comments, Comparison, Status Change)
- **PM:** 9 screens (Dashboard, Timeline, Status Monitor, Notifications)
- **All:** 11 screens (Login, Dashboard, Review Workspaces, Notifications, Share)

**Phân bố theo journey:**
- **Authentication:** 1 screen
- **Upload & Management:** 3 screens + 1 modal
- **Review & Playback:** 5 screens/panels + 1 modal
- **Workflow:** 2 screens + 1 modal
- **Collaboration:** 2 screens/modals
- **Tracking:** 2 screens

**Screens P0 (bắt buộc):** 12 screens  
**Screens bao gồm P1 features:** 4 screens (có đánh dấu P1 trong chức năng)

---

Danh sách này đã bao phủ toàn bộ user journey từ upload → review → collaborate → track với focus vào P0 và P1 features cho MVP. Mỗi screen được thiết kế rõ ràng về mục đích, chức năng và audience để dễ dàng chuyển sang thiết kế wireframe và implementation.