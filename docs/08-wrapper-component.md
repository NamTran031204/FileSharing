Đề xuất các wrapper/shared component (thuần UI, không gọi API, nhận config/props) phù hợp yêu cầu trong 01-product-requirements-prd.md và 03-core-features-priority-mvp.md:

- MediaPlayerShell: khung player cho video/image; nhận `source` (HLS manifest/direct URL), `poster`, `renditions[]`, `onTimeUpdate`, `onSeek`; chỗ cắm children overlay (annotation, controls bổ sung). Không tự fetch.
- AnnotationLayerWrapper: bọc canvas overlay; nhận `mode` (view/draw), `shapes[]` (type, coords, color, status), `onCreate/onUpdate/onSelect`; hỗ trợ cả image frame và video frame (sync với currentTime do parent cung cấp).
- TimelineCommentPanel: panel comment theo timecode; nhận `comments[]` (timeMs, text, status, user), `onSelect/onAdd/onResolve`, optional filter/sort config; hiển thị list + scrub-to-time callback.
- CommentThreadWrapper: hiển thị thread + reply; nhận `thread`, `onReply/onResolve`, `mentionOptions`; không call API, chỉ emit event.
- VersionSwitcherPanel: danh sách version; nhận `versions[]` (id, label, createdAt, uploader, status), `activeVersionId`, `onSelect`, optional `compareMode` toggle (A/B).
- ReviewStatusBadge + ReviewStatusControl: badge hiển thị trạng thái (In review/Request changes/Approved) và control đổi trạng thái; nhận `status`, `onChange`, `disabledReason`.
- PermissionGuard: wrapper kiểm tra quyền từ prop `permission` (READ/COMMENT/MODIFY/OWNER) để render/disable children; không tự lấy permission.
- UploadWidgetShell: dropzone + progress UI cho file/media; nhận `onFilesSelected`, `uploads[]` (id, name, progress, state), `onCancel/onRetry`; không tự chunk upload.
- ShareLinkBar: hiển thị link chia sẻ + nút copy/expiry info; nhận `link`, `expiresAt`, `onRefresh`; không gọi API.
- DataTableShell (generic): bảng cấu hình cột động; nhận `columns[]`, `rows[]`, `rowActions`, `toolbarConfig` (search/filter) để dùng cho danh sách asset/comment/version.
- SidePanelDrawer: khung drawer dùng lại cho “chi tiết file”, “annotation detail”, “permission panel”; nhận `title`, `open`, `onClose`, `footerConfig`.

Cách dùng: mỗi wrapper chỉ nhận data/callback từ parent; parent chịu trách nhiệm gọi API và truyền config. Nếu cần, mình có thể phác props chi tiết hơn hoặc tạo sẵn stub file trong `client/src/components/shared/`.