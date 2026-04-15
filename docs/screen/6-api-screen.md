# Screen-to-Database & API Mapping Reference

**Purpose**: Quick reference để developers biết cần query/API gì cho từng screen  
**Format**: Screen → Database Collections → API Endpoints  

---

## Danh sách endpoint draft theo màn hình (chỉ tên + URL)

### Màn 1: Login Page
- Đăng nhập bằng email và mật khẩu: /api/auth/login
- Đăng nhập bằng Google OAuth: /api/auth/google/login
- Gửi yêu cầu quên mật khẩu: /api/auth/password/forgot
- Làm mới phiên đăng nhập: /api/auth/refresh-token

### Màn 2: Register Page
- Đăng ký tài khoản mới: /api/auth/register
- Kiểm tra email đã tồn tại: /api/auth/register/check-email
- Đăng ký qua Google OAuth: /api/auth/google/register

### Màn 3: Password Reset Page
- Xác thực token đặt lại mật khẩu: /api/auth/password/reset-token/verify
- Đặt lại mật khẩu mới: /api/auth/password/reset
- Hủy yêu cầu đặt lại mật khẩu: /api/auth/password/reset/cancel

### Màn 4: Dashboard / Home
- Lấy dữ liệu tổng quan dashboard: /api/dashboard/summary
- Lấy danh sách dự án gần đây: /api/dashboard/recent-projects
- Lấy luồng hoạt động gần đây: /api/dashboard/recent-activities
- Tạo dự án nhanh từ dashboard: /api/projects
- Lấy số thông báo chưa đọc: /api/notifications/unread-count

### Màn 5: Project List
- Lấy danh sách dự án của người dùng: /api/projects
- Tìm kiếm dự án: /api/projects/search
- Đổi thứ tự hoặc ghim dự án: /api/projects/preferences/order
- Đổi tên dự án nhanh: /api/projects/:projectId/rename
- Đánh dấu yêu thích dự án: /api/projects/:projectId/favorite
- Tạo hoặc lấy liên kết chia sẻ dự án: /api/projects/:projectId/share-links
- Lưu trữ dự án: /api/projects/:projectId/archive

### Màn 6: Create Project Modal
- Tạo dự án mới: /api/projects
- Kiểm tra mã dự án khả dụng: /api/projects/check-code
- Tạo thư mục mặc định cho dự án: /api/projects/:projectId/default-folders

### Màn 7: Project Detail / Overview
- Lấy chi tiết dự án: /api/projects/:projectId
- Lấy thống kê dự án: /api/projects/:projectId/stats
- Lấy activity feed của dự án: /api/projects/:projectId/activities
- Lấy danh sách cộng tác viên: /api/projects/:projectId/collaborators
- Mời cộng tác viên: /api/projects/:projectId/collaborators/invite
- Cập nhật vai trò cộng tác viên: /api/projects/:projectId/collaborators/:userId/role
- Gỡ cộng tác viên khỏi dự án: /api/projects/:projectId/collaborators/:userId/remove
- Cập nhật thông tin dự án: /api/projects/:projectId

### Màn 8: Project Settings
- Lấy cài đặt dự án: /api/projects/:projectId/settings
- Cập nhật cài đặt dự án: /api/projects/:projectId/settings
- Lấy phân quyền theo thư mục trong dự án: /api/projects/:projectId/folder-permissions
- Lưu trữ dự án: /api/projects/:projectId/archive
- Xóa dự án: /api/projects/:projectId/delete
- Lấy audit log của dự án: /api/projects/:projectId/audit-logs

### Màn 9: Folder Browser / File Manager
- Lấy cây thư mục của dự án: /api/projects/:projectId/folders/tree
- Lấy danh sách thư mục con: /api/folders/:folderId/children
- Lấy danh sách asset trong thư mục: /api/folders/:folderId/assets
- Tạo thư mục mới: /api/folders
- Đổi tên thư mục: /api/folders/:folderId/rename
- Di chuyển thư mục: /api/folders/:folderId/move
- Cập nhật phân quyền thư mục: /api/folders/:folderId/permissions
- Xóa mềm thư mục: /api/folders/:folderId/trash
- Tìm kiếm asset trong thư mục: /api/folders/:folderId/assets/search
- Lấy danh sách thao tác của asset: /api/assets/:assetId/actions

### Màn 10: Create Folder Modal
- Tạo thư mục: /api/folders
- Kiểm tra trùng tên thư mục trong thư mục cha: /api/folders/check-name
- Lấy danh sách thư mục cha khả dụng: /api/projects/:projectId/folders/parents

### Màn 11: Upload Modal / Drag & Drop
- Tạo metadata upload asset: /api/assets/upload-metadata
- Lấy URL upload từng phần: /api/assets/uploads/:uploadId/parts/presigned-urls
- Hoàn tất multipart upload: /api/assets/uploads/:uploadId/complete
- Lấy tiến độ upload: /api/assets/uploads/:uploadId/progress
- Tạm dừng upload: /api/assets/uploads/:uploadId/pause
- Tiếp tục upload: /api/assets/uploads/:uploadId/resume
- Hủy upload: /api/assets/uploads/:uploadId/cancel
- Lấy lịch sử upload: /api/folders/:folderId/uploads/history

### Màn 12: Asset Detail Page
- Lấy chi tiết asset: /api/assets/:assetId
- Đổi tên asset: /api/assets/:assetId/rename
- Di chuyển asset: /api/assets/:assetId/move
- Lấy dữ liệu preview asset: /api/assets/:assetId/preview
- Lấy danh sách version của asset: /api/assets/:assetId/versions
- Lấy review session hiện tại của asset: /api/assets/:assetId/review-sessions/current
- Lấy comment và annotation của asset: /api/assets/:assetId/comments-annotations
- Tạo liên kết chia sẻ asset: /api/assets/:assetId/share-links
- Xóa mềm asset: /api/assets/:assetId/trash

### Màn 13: Video Player Page
- Lấy manifest HLS theo version: /api/versions/:versionId/stream/hls-manifest
- Lấy URL phát fallback trực tiếp: /api/versions/:versionId/stream/fallback-url
- Lấy danh sách rendition chất lượng: /api/versions/:versionId/renditions
- Lấy marker annotation trên timeline: /api/versions/:versionId/annotations/timeline
- Ghi nhận sự kiện playback: /api/playback-events
- Lấy thống kê chất lượng playback: /api/versions/:versionId/playback-metrics

### Màn 14: Image Viewer Page
- Lấy URL xem ảnh có kiểm soát: /api/versions/:versionId/image/view-url
- Lấy annotation vùng ảnh: /api/versions/:versionId/annotations/regions
- Lưu trạng thái zoom và pan: /api/versions/:versionId/view-state
- Lấy URL tải ảnh: /api/versions/:versionId/image/download-url

### Màn 15: Annotation Panel / Drawing Tools
- Tạo annotation timecode hoặc vùng: /api/annotations
- Cập nhật annotation: /api/annotations/:annotationId
- Xóa annotation: /api/annotations/:annotationId/delete
- Tạo thread comment cho annotation: /api/annotations/:annotationId/comment-threads
- Tìm người dùng để mention: /api/users/mentions/search
- Lấy gợi ý tag annotation: /api/annotations/tags/suggest

### Màn 16: Comment Thread Panel
- Lấy chi tiết thread comment: /api/comment-threads/:threadId
- Lấy danh sách reply của thread: /api/comment-threads/:threadId/replies
- Thêm reply vào thread: /api/comment-threads/:threadId/replies
- Cập nhật comment: /api/comments/:commentId
- Xóa comment: /api/comments/:commentId/delete
- Đổi trạng thái thread OPEN hoặc RESOLVED: /api/comment-threads/:threadId/status
- Điều hướng thread trước hoặc sau: /api/comment-threads/navigation

### Màn 17: Version Compare Modal (A/B)
- Lấy dữ liệu so sánh hai version: /api/assets/:assetId/versions/compare
- Lấy nguồn so sánh version A: /api/versions/:versionIdA/compare/source
- Lấy nguồn so sánh version B: /api/versions/:versionIdB/compare/source
- Lưu tùy chọn so sánh của người dùng: /api/users/me/preferences/version-compare

### Màn 18: Create Review Session Modal
- Khởi tạo bản nháp review session: /api/review-sessions/draft
- Lấy danh sách version có thể review: /api/assets/:assetId/reviewable-versions
- Lấy danh sách reviewer gợi ý: /api/projects/:projectId/reviewers/suggest
- Thêm reviewer ngoài hệ thống: /api/review-sessions/draft/:draftId/external-reviewers
- Cập nhật thông tin wizard review: /api/review-sessions/draft/:draftId
- Xác nhận tạo review session: /api/review-sessions
- Gửi thông báo mời review: /api/review-sessions/:sessionId/notifications/send

### Màn 19: Review Session Page
- Lấy chi tiết phiên review: /api/review-sessions/:sessionId
- Lấy tiến độ reviewer trong phiên: /api/review-sessions/:sessionId/progress
- Lấy timeline annotation của phiên: /api/review-sessions/:sessionId/timeline
- Thêm annotation trong phiên review: /api/review-sessions/:sessionId/annotations
- Phản hồi comment trong phiên review: /api/review-sessions/:sessionId/comments/reply
- Duyệt phiên review: /api/review-sessions/:sessionId/status/approve
- Yêu cầu chỉnh sửa phiên review: /api/review-sessions/:sessionId/status/request-changes
- Đánh dấu pending hoặc lưu nháp review: /api/review-sessions/:sessionId/status/pending

### Màn 20: Upload New Version Modal
- Khởi tạo upload version mới: /api/assets/:assetId/versions/upload-metadata
- Lấy URL upload từng phần cho version mới: /api/assets/:assetId/versions/uploads/:uploadId/parts/presigned-urls
- Hoàn tất upload version mới: /api/assets/:assetId/versions/uploads/:uploadId/complete
- Lưu ghi chú version: /api/assets/:assetId/versions/:versionId/notes
- Kích hoạt xử lý media cho version mới: /api/versions/:versionId/processing/trigger
- Thông báo reviewer có version mới: /api/versions/:versionId/notifications/reviewers

### Màn 21: Version List & Details
- Lấy danh sách version theo asset: /api/assets/:assetId/versions
- Đặt active version cho asset: /api/assets/:assetId/active-version
- Lấy chi tiết một version: /api/versions/:versionId
- Lấy URL tải xuống version: /api/versions/:versionId/download-url
- Lấy feedback theo version: /api/versions/:versionId/feedback
- Tạo review session từ version: /api/versions/:versionId/review-sessions
- Chuyển trạng thái version sang yêu cầu chỉnh sửa: /api/versions/:versionId/status/request-changes

### Màn 22: Notification Panel
- Lấy danh sách thông báo: /api/notifications
- Lấy số lượng thông báo chưa đọc: /api/notifications/unread-count
- Đánh dấu một thông báo đã đọc: /api/notifications/:notificationId/read
- Đánh dấu tất cả thông báo đã đọc: /api/notifications/read-all
- Lấy luồng thông báo thời gian thực SSE: /api/notifications/stream
- Lấy cấu hình thông báo của người dùng: /api/users/me/notification-preferences

### Màn 23: Global Search Results
- Tìm kiếm toàn cục: /api/search
- Gợi ý từ khóa tìm kiếm: /api/search/suggestions
- Lấy bộ lọc tìm kiếm khả dụng: /api/search/filters
- Tìm kiếm trong comments: /api/search/comments
- Tìm kiếm trong assets: /api/search/assets
- Tìm kiếm trong projects: /api/search/projects

### Màn 24: User Settings / Profile
- Lấy hồ sơ người dùng hiện tại: /api/users/me
- Cập nhật hồ sơ người dùng: /api/users/me/profile
- Tạo URL upload avatar: /api/users/me/avatar/upload-url
- Cập nhật tùy chọn thông báo: /api/users/me/notification-preferences
- Đổi mật khẩu: /api/users/me/password/change
- Lấy danh sách phiên đăng nhập hoạt động: /api/users/me/sessions
- Đăng xuất một phiên đăng nhập: /api/users/me/sessions/:sessionId/logout
- Đăng xuất tất cả phiên đăng nhập: /api/users/me/sessions/logout-all
- Khởi tạo thiết lập 2FA: /api/users/me/2fa/setup
- Xác thực bật 2FA: /api/users/me/2fa/verify
- Tắt 2FA: /api/users/me/2fa/disable
- Xóa mềm tài khoản người dùng: /api/users/me/delete

