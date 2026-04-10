# Danh sách màn hình chi tiết - Media Review Platform

## 1) Phạm vi và nguyên tắc thiết kế

- Nguồn tham chiếu: `ans.md`, `docs/01-product-requirements-prd.md`, `docs/03-core-features-priority-mvp.md`, `docs/09-usecase.md`, `docs/database.md`, `docs/project-folder-structure.md`, `docs/ui-ux-screen-flows.md`.
- Mục tiêu: bao phủ đầy đủ luồng MVP và các use case trọng yếu từ UC-A đến UC-G.
- Quy ước layout chung (app shell): mọi màn hình sau đăng nhập đều có **Header + Sidebar**.
  - Header trái: `Logo + Breadcrumb`.
  - Header phải: `Search bar + Notification icon + Setting icon + User avatar`.
  - Sidebar: `Trang chủ`, `Dashboard`, `Projects (project con)`, cuối sidebar có `[+ Thêm mới project]`.

---

## 2) Danh sách màn hình theo module

## Module A - Truy cập, phân quyền, bảo mật

### SCR-A01 - Đăng nhập

- **Use case mapping**: UC-A01.
- **Mục đích màn hình**: cho phép người dùng xác thực để vào hệ thống review.
- **Chức năng chính**:
  - Đăng nhập email/password.
  - Đăng nhập bằng provider (nếu bật).
  - Điều hướng quên mật khẩu.
- **Nút bấm quan trọng**:
  - `Đăng nhập`
  - `Đăng nhập Google` (tuỳ cấu hình)
  - `Quên mật khẩu`
- **Danh sách input**:
  - `email`
  - `password`
  - `rememberMe` (optional)
- **Parent screen**: Không có (entry screen).
- **Mapping database**:
  - `users.email`, `users.password`, `users.enabled`, `users.emailVerified`, `users.providers[]`.
  - Audit khi đăng nhập: `audit_logs.action = LOGIN`, `audit_logs.actorId`, `audit_logs.timestamp`.

### SCR-A02 - Access Denied / Unauthorized

- **Use case mapping**: UC-A02.
- **Mục đích màn hình**: chặn thao tác vượt quyền và hướng dẫn người dùng xử lý.
- **Chức năng chính**:
  - Hiển thị quyền hiện tại và hành động bị chặn.
  - Cho phép gửi yêu cầu cấp quyền.
- **Nút bấm quan trọng**:
  - `Quay lại`
  - `Yêu cầu quyền`
- **Danh sách input**:
  - `requestReason` (optional khi gửi yêu cầu)
- **Parent screen**: từ mọi màn hình nghiệp vụ khi fail permission check.
- **Mapping database**:
  - Nguồn quyền từ `projects.collaborators[]`, `folder.permissions[]`, metadata visibility.
  - Ghi log từ chối: `audit_logs.action = PERMISSION_CHANGE/UPDATE` (tuỳ triển khai), `requestInfo`.

### SCR-A03 - Chia sẻ asset (Modal/Drawer)

- **Use case mapping**: UC-A03.
- **Mục đích màn hình**: chia sẻ asset an toàn theo quyền.
- **Chức năng chính**:
  - Tạo link chia sẻ.
  - Thiết lập hạn dùng link.
  - Quản lý quyền truy cập link.
- **Nút bấm quan trọng**:
  - `Tạo link`
  - `Copy link`
  - `Thu hồi link`
  - `Lưu`
- **Danh sách input**:
  - `sharePermission` (`READ`/`COMMENT`/`MODIFY`)
  - `shareExpiry`
  - `recipientEmails[]` (nếu share theo email)
- **Parent screen**: SCR-E04 (Asset Detail), SCR-E07 (Review Workspace).
- **Mapping database**:
  - `asset.shareToken`, `asset.shareExpiry`.
  - `notifications` (REVIEW_INVITATION/NEW_COMMENT nếu gửi kèm).
  - `audit_logs.action = SHARE`.

---

## Module B - Dashboard, project, folder, ingest media

### SCR-B01 - Dashboard / Home

- **Use case mapping**: UC-F03, UC-F04 (một phần), UC-B04.
- **Mục đích màn hình**: cung cấp tổng quan công việc review và deadline.
- **Chức năng chính**:
  - Thống kê review pending.
  - Danh sách project gần đây.
  - Activity feed gần nhất.
- **Nút bấm quan trọng**:
  - `Xem project`
  - `Xem tất cả hoạt động`
  - `+ Thêm mới project`
- **Danh sách input**:
  - Bộ lọc thời gian (optional)
- **Parent screen**: Sau SCR-A01.
- **Mapping database**:
  - `projects.stats.pendingReviews`, `projects.stats.assetCount`, `projects.status`.
  - `review_sessions.status`, `review_sessions.dueDate`, `review_sessions.reviewers[]`.
  - `audit_logs` để dựng activity.

### SCR-B02 - Danh sách project (Sidebar + Project list)

- **Use case mapping**: UC-A02, UC-F03.
- **Mục đích màn hình**: truy cập nhanh project mà user sở hữu/cộng tác.
- **Chức năng chính**:
  - Liệt kê project active.
  - Pin/sắp xếp nhanh.
  - Mở chi tiết project.
- **Nút bấm quan trọng**:
  - `Mở project`
  - `Archive`
  - `Đổi tên`
  - `[+ Thêm mới project]`
- **Danh sách input**:
  - Search project keyword.
- **Parent screen**: app shell toàn cục.
- **Mapping database**:
  - `projects.ownerId`, `projects.collaborators.userId`, `projects.status`, `projects.updatedAt`.

### SCR-B03 - Tạo/Sửa project (Modal hoặc full page)

- **Use case mapping**: luồng `project-folder-structure` 3.1, UC-A02.
- **Mục đích màn hình**: tạo mới hoặc cập nhật thông tin project.
- **Chức năng chính**:
  - Tạo project.
  - Sửa thông tin chung.
  - Quản lý trạng thái active/archived/completed.
- **Nút bấm quan trọng**:
  - `Tạo project`
  - `Lưu thay đổi`
  - `Hủy`
  - `Archive project`
- **Danh sách input**:
  - `projectName`
  - `projectCode`
  - `description`
  - `clientName`
  - `category`
  - `startDate`
  - `endDate`
  - `status`
- **Parent screen**: SCR-B01, SCR-B02.
- **Mapping database**:
  - `projects.projectName`, `projectCode`, `description`, `clientName`, `category`, `startDate`, `endDate`, `status`, `isActive`, `trashedAt`.
  - `audit_logs.action = CREATE/UPDATE/STATUS_CHANGE`.

### SCR-B04 - Chi tiết project (Overview)

- **Use case mapping**: UC-F02, UC-F03.
- **Mục đích màn hình**: xem tổng quan dự án, hoạt động, collaborator, điều hướng vào file manager.
- **Chức năng chính**:
  - Hiển thị stats dự án.
  - Tabs: `Overview`, `Files`, `Collaborators`, `Activity`, `Settings`.
  - Mở màn hình folder browser.
- **Nút bấm quan trọng**:
  - `Edit`
  - `Share`
  - `Archive`
  - `View all activity`
- **Danh sách input**:
  - Bộ lọc activity (user/action/date).
- **Parent screen**: SCR-B02.
- **Mapping database**:
  - `projects.*`, `projects.stats.*`, `projects.collaborators[]`.
  - `audit_logs` theo `assetId/project`.
  - `review_sessions` tổng hợp theo `project`.

### SCR-B05 - Quản lý collaborators & vai trò

- **Use case mapping**: UC-A02, UC-F03.
- **Mục đích màn hình**: quản trị thành viên dự án và role.
- **Chức năng chính**:
  - Thêm/xoá collaborator.
  - Đổi role (`PRODUCER`/`REVIEWER`/`VIEWER`).
  - Gửi lại lời mời.
- **Nút bấm quan trọng**:
  - `Invite collaborator`
  - `Change role`
  - `Remove`
- **Danh sách input**:
  - `email`
  - `role`
- **Parent screen**: SCR-B04 (tab Collaborators).
- **Mapping database**:
  - `projects.collaborators[].userId/email/role/addedAt`.
  - `notifications.type = REVIEW_INVITATION` (khi mời vào review flow).
  - `audit_logs.action = PERMISSION_CHANGE`.

### SCR-B06 - Folder Browser / File Manager

- **Use case mapping**: UC-B01, UC-B04, UC-E01.
- **Mục đích màn hình**: tổ chức cây thư mục và danh sách asset trong project.
- **Chức năng chính**:
  - Tree folder trái, content panel phải.
  - Tạo thư mục, đổi tên, xoá mềm, move.
  - Upload asset vào folder.
  - Search/sort/filter theo status.
- **Nút bấm quan trọng**:
  - `+ New Folder`
  - `+ Upload`
  - `Rename`
  - `Delete`
  - `Move`
- **Danh sách input**:
  - `folderName`, `description`, `parentFolderId`
  - `uploadFiles[]`
  - `sortBy`, `viewMode`, `statusFilter`
- **Parent screen**: SCR-B04 (tab Files), SCR-B02.
- **Mapping database**:
  - `folder.folderId/projectId/parentFolderId/folderName/folderPath/level/isActive`.
  - `folder.stats.assetCount/subfoldersCount/pendingReviews`.
  - `asset.assetId/projectId/folderId/assetName/assetStatus/versionCount`.

### SCR-B07 - Upload manager (Panel/Modal)

- **Use case mapping**: UC-B01, UC-B03, UC-B04, UC-B05.
- **Mục đích màn hình**: giám sát tiến trình upload lớn và xử lý media.
- **Chức năng chính**:
  - Theo dõi tiến độ chunk upload.
  - Hiển thị trạng thái processing job.
  - Retry/Cancel upload.
- **Nút bấm quan trọng**:
  - `Upload`
  - `Retry`
  - `Cancel`
  - `View processing detail`
- **Danh sách input**:
  - `files[]`
  - `assetName` (nếu tạo asset mới)
  - `description` (optional)
- **Parent screen**: SCR-B06, SCR-E04.
- **Mapping database**:
  - `metadata.uploadId/status`, `metadata.fileSize/mimeType/mediaType`.
  - `metadata.processingStatus/processingError/processingStartedAt/processingCompletedAt`.
  - `processing_jobs.jobType/status/progress/result/retryCount`.
  - `audit_logs.action = UPLOAD_COMPLETE`.

---

## Module C - Asset, playback, annotation, review workflow

### SCR-C01 - Asset Detail (Tabbed)

- **Use case mapping**: UC-C01, UC-C02, UC-E01, UC-F02.
- **Mục đích màn hình**: trung tâm làm việc trên 1 asset, gồm preview/version/review/comments/activity.
- **Chức năng chính**:
  - Xem trạng thái asset và version hiện tại.
  - Điều hướng sang review session.
  - Mở phiên bản cũ, compare cơ bản.
- **Nút bấm quan trọng**:
  - `Edit`
  - `Upload new version`
  - `Send for review`
  - `Compare`
  - `Share`
- **Danh sách input**:
  - `assetName`, `description`
  - `selectedVersion`
  - Bộ lọc comments/activity
- **Parent screen**: SCR-B06.
- **Mapping database**:
  - `asset.assetName/description/assetStatus/latestReviewSessionId/versionCount`.
  - `metadata.versionNumber/processingStatus/mediaInfo`.
  - `review_sessions` theo `assetId`.
  - `annotations`, `comment_threads`, `audit_logs`.

### SCR-C02 - Trình phát media (Video/Image Preview tab)

- **Use case mapping**: UC-C01, UC-C02, UC-C03, UC-C04.
- **Mục đích màn hình**: cung cấp trải nghiệm xem media ổn định để review.
- **Chức năng chính**:
  - Phát HLS adaptive.
  - Fallback direct URL nếu chưa có HLS.
  - Hover timeline xem thumbnail/sprite.
- **Nút bấm quan trọng**:
  - `Play/Pause`
  - `Seek`
  - `Quality`
  - `Fullscreen`
  - `Toggle markers`
- **Danh sách input**:
  - `qualityProfile` (auto/manual)
  - `playbackSpeed`
  - `volume`
- **Parent screen**: SCR-C01.
- **Mapping database**:
  - `media_renditions.renditionType/profile/manifestKey/segmentPathPrefix/status`.
  - `media_renditions.spriteKey/spriteMetadataKey/thumbnailCount/intervalMs`.
  - `metadata.processingStatus`, `metadata.mediaInfo.durationMs`.
  - Metrics lưu qua backend (tham chiếu NFR và audit/monitoring).

### SCR-C03 - Danh sách version & compare (A/B)

- **Use case mapping**: UC-E01, UC-E04, UC-E05 (future), UC-E03.
- **Mục đích màn hình**: quản lý version và đối chiếu khác biệt.
- **Chức năng chính**:
  - Liệt kê toàn bộ version.
  - Chọn active version cho review.
  - A/B switch hoặc overlay.
- **Nút bấm quan trọng**:
  - `Set active version`
  - `Compare A/B`
  - `Download version`
  - `Open review session`
- **Danh sách input**:
  - `baseVersionId`
  - `targetVersionId`
  - `compareMode` (`AB`/`overlay`/`sideBySide` future)
- **Parent screen**: SCR-C01 (tab Versions), SCR-C06.
- **Mapping database**:
  - `metadata.fileId/versionNumber/processingStatus/createdAt`.
  - `review_sessions.versionId/status`.
  - `asset.versionCount/assetStatus`.
  - `audit_logs.action = STATUS_CHANGE/UPDATE`.

### SCR-C04 - Annotation panel (timecode/region/frame)

- **Use case mapping**: UC-D01, UC-D02.
- **Mục đích màn hình**: tạo và quản lý điểm phản hồi trực quan theo thời gian/vị trí.
- **Chức năng chính**:
  - Tạo annotation timecode.
  - Vẽ region trên ảnh/frame video.
  - Resolve/reopen annotation.
- **Nút bấm quan trọng**:
  - `Add annotation`
  - `Save`
  - `Resolve`
  - `Delete`
- **Danh sách input**:
  - `annotationType` (`TIMECODE`/`REGION`/`FRAME_REGION`)
  - `timecode.startMs`, `timecode.endMs`
  - `region.shape`, `region.points[]`, `strokeColor`, `strokeWidth`, `fillColor`
  - `frameNumber` (optional)
- **Parent screen**: SCR-E07 (Review Workspace), SCR-C01.
- **Mapping database**:
  - `annotations.annotationId/assetId/versionId/annotationType`.
  - `annotations.timecode.*`, `annotations.region.*`, `annotations.frameNumber`.
  - `annotations.status/resolvedAt/resolvedBy/threadId`.

### SCR-C05 - Comment thread panel

- **Use case mapping**: UC-D03, UC-D04, UC-D05.
- **Mục đích màn hình**: trao đổi có ngữ cảnh và theo dõi trạng thái xử lý feedback.
- **Chức năng chính**:
  - Tạo root comment.
  - Reply thread.
  - Mention người phụ trách.
  - Filter open/resolved theo người tạo.
- **Nút bấm quan trọng**:
  - `Post comment`
  - `Reply`
  - `Resolve thread`
  - `Filter`
- **Danh sách input**:
  - `content`
  - `mentions[]`
  - `attachments[]`
  - `statusFilter`, `creatorFilter`, `timeRange`
- **Parent screen**: SCR-E07, SCR-C01.
- **Mapping database**:
  - `comment_threads.threadId/assetId/version/annotations[]`.
  - `comment_threads.rootComment.content/mentions/attachments/createdBy`.
  - `comment_threads.replies[]`, `replyCount`, `participants`, `status/resolvedAt/resolvedBy`.
  - `notifications.type = NEW_COMMENT/MENTION/ANNOTATION_RESOLVED`.

### SCR-C06 - Tạo review session (Wizard 4 bước)

- **Use case mapping**: UC-E03, UC-F01, UC-G01.
- **Mục đích màn hình**: khởi tạo phiên review có reviewer, version và deadline rõ ràng.
- **Chức năng chính**:
  - Chọn version.
  - Thêm reviewer/approver.
  - Thiết lập due date và notes.
  - Gửi thông báo mời review.
- **Nút bấm quan trọng**:
  - `Next`
  - `Previous`
  - `Create review session`
  - `Cancel`
- **Danh sách input**:
  - `versionId`
  - `reviewers[]` (`userId/email`, `role`)
  - `title`
  - `description`
  - `dueDate`
  - `notifyNow` / `reminderBeforeDeadline`
- **Parent screen**: SCR-C01, SCR-B06.
- **Mapping database**:
  - `review_sessions.assetId/versionId/title/description/dueDate`.
  - `review_sessions.reviewers[]`, `status = DRAFT|IN_REVIEW`.
  - `asset.latestReviewSessionId`, `asset.assetStatus`.
  - `projects.stats.pendingReviews`.
  - `notifications.type = REVIEW_INVITATION`.

### SCR-C07 - Review Workspace (Reviewer POV)

- **Use case mapping**: UC-D01, UC-D02, UC-D03, UC-F01, UC-F02.
- **Mục đích màn hình**: nơi reviewer thao tác đầy đủ annotate/comment/approve.
- **Chức năng chính**:
  - Xem media + timeline markers.
  - Tạo/điều hướng annotation và thread.
  - Approve hoặc Request Changes (theo role).
- **Nút bấm quan trọng**:
  - `Add annotation`
  - `Comment`
  - `Resolve`
  - `Approve`
  - `Request changes`
- **Danh sách input**:
  - `statusChangeNote` (khi đổi trạng thái)
  - `requestChangesReason`
  - `resubmissionDueDate` (optional)
- **Parent screen**: SCR-C06, SCR-D01 (notification deep link), SCR-C01.
- **Mapping database**:
  - `review_sessions.status`, `statusHistory[]`, `reviewers[].lastViewedAt/hasCommented`, `completedAt`.
  - `asset.assetStatus`.
  - `annotations`, `comment_threads`.
  - `audit_logs.action = STATUS_CHANGE/UPDATE`.

### SCR-C08 - Review timeline tổng hợp

- **Use case mapping**: UC-F02, UC-F03.
- **Mục đích màn hình**: gom toàn bộ diễn biến review theo thời gian.
- **Chức năng chính**:
  - Timeline event: comment, resolve, status change, version upload.
  - Lọc theo version, actor, loại sự kiện.
- **Nút bấm quan trọng**:
  - `Filter`
  - `Jump to event`
  - `Export` (future)
- **Danh sách input**:
  - `versionFilter`
  - `actorFilter`
  - `eventTypeFilter`
  - `dateRange`
- **Parent screen**: SCR-C01 (tab Activity), SCR-B04 (project activity).
- **Mapping database**:
  - `audit_logs` (source chính).
  - `review_sessions.statusHistory`.
  - `comment_threads.lastActivityAt`, `annotations.createdAt/updatedAt`.

---

## Module D - Notification, search, settings, audit

### SCR-D01 - Notification Center

- **Use case mapping**: UC-G01, UC-G02 (một phần).
- **Mục đích màn hình**: giúp user không bỏ sót phản hồi, mention, deadline.
- **Chức năng chính**:
  - Danh sách thông báo chưa đọc/đã đọc.
  - Deep-link về đúng asset/review/comment.
  - Mark as read/mark all as read.
- **Nút bấm quan trọng**:
  - `View`
  - `Dismiss`
  - `Mark all as read`
  - `Notification settings`
- **Danh sách input**:
  - Filter theo `type`, `isRead`.
- **Parent screen**: từ icon chuông trên Header.
- **Mapping database**:
  - `notifications.userId/type/title/message/link/context/isRead/readAt/deliveryStatus/createdAt`.

### SCR-D02 - Global Search & Advanced Filter

- **Use case mapping**: UC-D04, luồng điều hướng chính.
- **Mục đích màn hình**: tìm nhanh project/folder/asset/comment.
- **Chức năng chính**:
  - Search toàn cục.
  - Bộ lọc nâng cao trong folder/asset context.
- **Nút bấm quan trọng**:
  - `Search`
  - `Apply filter`
  - `Reset`
- **Danh sách input**:
  - `keyword`
  - `entityType` (`PROJECT`/`FOLDER`/`ASSET`/`COMMENT`)
  - `status`, `owner`, `dateRange`, `sortBy`
- **Parent screen**: Header search bar, SCR-B06, SCR-C01.
- **Mapping database**:
  - `projects.projectName/projectCode`
  - `folder.folderName/folderPath`
  - `asset.assetName/assetStatus`
  - `comment_threads.rootComment.content`, `comment_threads.status`, `participants`
  - `annotations.status/createdBy`

### SCR-D03 - User settings & notification preferences

- **Use case mapping**: UC-G01, UC-G02.
- **Mục đích màn hình**: cá nhân hoá nhận thông báo và hồ sơ người dùng.
- **Chức năng chính**:
  - Cập nhật avatar, locale, timezone.
  - Bật/tắt email/in-app notification.
- **Nút bấm quan trọng**:
  - `Save`
  - `Reset`
- **Danh sách input**:
  - `avatar`
  - `locale`
  - `timezone`
  - `emailOnNewComment`
  - `emailOnMention`
  - `emailOnStatusChange`
  - `inAppNotifications`
- **Parent screen**: Header user avatar > Settings.
- **Mapping database**:
  - `users.metadata.avatar/locale/timezone`.
  - `users.notificationPreferences.*`.

### SCR-D04 - Audit log viewer (Admin/Owner/PM)

- **Use case mapping**: UC-A04, UC-F03.
- **Mục đích màn hình**: truy vết hành động nhạy cảm và phục vụ điều tra sự cố.
- **Chức năng chính**:
  - Tra cứu log theo actor/action/target/time.
  - So sánh before/after.
  - Deep link tới asset/review liên quan.
- **Nút bấm quan trọng**:
  - `Filter`
  - `View detail`
  - `Export` (future)
- **Danh sách input**:
  - `actor`
  - `action`
  - `targetType`
  - `targetId`
  - `dateRange`
- **Parent screen**: SCR-D03 (menu quản trị) hoặc SCR-B04.
- **Mapping database**:
  - `audit_logs.actorId/actorEmail/actorType/action/targetType/targetId/changes/requestInfo/timestamp`.

---

## 3) Danh sách modal/confirmation quan trọng

### MOD-01 - Approve confirmation
- **Mục đích**: xác nhận thao tác chốt duyệt.
- **Input**: `note` (optional).
- **Mapping DB**: `review_sessions.statusHistory`, `review_sessions.status=APPROVED`, `asset.assetStatus=APPROVED`, `audit_logs`.

### MOD-02 - Request changes confirmation
- **Mục đích**: bắt buộc nêu lý do yêu cầu sửa.
- **Input**: `reason` (required), `resubmissionDueDate` (optional), `assigneeScope`.
- **Mapping DB**: `review_sessions.status=REQUEST_CHANGES`, `statusHistory.note`, `asset.assetStatus`, `notifications`.

### MOD-03 - Delete folder confirmation
- **Mục đích**: bảo vệ thao tác xoá nhầm.
- **Input**: `confirmText` (DELETE).
- **Mapping DB**: `folder.isActive=false` (soft delete), `audit_logs.action=DELETE`.

---

## 4) Ma trận bao phủ use case -> màn hình

- **UC-A01**: SCR-A01  
- **UC-A02**: SCR-A02, SCR-B05, SCR-B06  
- **UC-A03**: SCR-A03  
- **UC-A04**: SCR-D04  
- **UC-B01/B03/B04/B05**: SCR-B06, SCR-B07  
- **UC-B02**: SCR-C01, SCR-B07  
- **UC-C01/C02/C03/C04**: SCR-C02  
- **UC-D01/D02**: SCR-C04  
- **UC-D03/D04/D05**: SCR-C05  
- **UC-E01/E02/E03/E04/E05**: SCR-C03, SCR-C01, SCR-C06  
- **UC-F01**: SCR-C07, MOD-01, MOD-02  
- **UC-F02/F03/F04**: SCR-C08, SCR-B01, SCR-B04  
- **UC-G01/G02**: SCR-D01, SCR-D03

---

## 5) Lưu ý BA/Technical cho giai đoạn implement

- Nên thống nhất naming `versionId` trong toàn bộ collection liên quan comments/annotations/review để tránh mismatch (`version` vs `versionId`).
- Nên chuẩn hoá rule permission ưu tiên: `folder.permissions` override `projects.collaborators`.
- Với màn hình review workspace, nên khóa thao tác annotate/comment khi `metadata.processingStatus != READY`.
- Cần cơ chế deep-link chuẩn từ `notifications.link` về đúng `asset/version/annotation/thread`.

