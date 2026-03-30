# 05. Draft mô hình dữ liệu và hợp đồng API (mức sản phẩm)

## 1. Data model khái niệm

### 1.1 MediaAsset
1. assetId
2. projectId
3. ownerId
4. mediaType (VIDEO, IMAGE)
5. currentVersionId
6. visibility
7. permissionPolicy
8. createdAt, updatedAt

### 1.2 MediaVersion
1. versionId
2. assetId
3. versionNumber
4. objectKeyOriginal
5. uploadStatus
6. processingStatus (PENDING, PROCESSING, READY, FAILED)
7. durationMs, width, height, codec, bitrate
8. createdBy, createdAt

### 1.3 MediaRendition
1. renditionId
2. versionId
3. profileName (360p, 720p, 1080p)
4. manifestKey
5. segmentPathPrefix
6. fileSize

### 1.4 Annotation
1. annotationId
2. assetId, versionId
3. type (TIMECODE, REGION)
4. timeMsStart, timeMsEnd (cho video)
5. regionShape (cho image/video frame)
6. status (OPEN, RESOLVED)
7. createdBy, createdAt

### 1.5 CommentThread
1. threadId
2. annotationId (nullable, nếu comment tự do)
3. rootComment
4. replies
5. participants
6. lastActivityAt

### 1.6 ReviewSession
1. reviewSessionId
2. assetId
3. activeVersionId
4. reviewStatus (IN_REVIEW, REQUEST_CHANGES, APPROVED)
5. dueDate
6. reviewers
7. updatedBy, updatedAt

## 2. API nhóm ingest và processing
1. POST /api/media/assets
Tạo media asset metadata ban đầu.
2. POST /api/media/assets/{assetId}/versions/initiate-upload
Khởi tạo multipart upload cho version mới.
3. POST /api/media/assets/{assetId}/versions/{versionId}/complete
Xác nhận upload hoàn tất, đẩy job processing.
4. GET /api/media/assets/{assetId}/versions/{versionId}/processing-status
Lấy trạng thái transcode/thumbnail.

## 3. API nhóm playback và preview
1. GET /api/media/assets/{assetId}/versions/{versionId}/playback
Trả playback URL (HLS manifest hoặc direct URL fallback).
2. GET /api/media/assets/{assetId}/versions/{versionId}/thumbnails
Trả danh sách thumbnail/sprite metadata.

## 4. API nhóm annotation/comment
1. POST /api/reviews/assets/{assetId}/versions/{versionId}/annotations
Tạo annotation mới.
2. PATCH /api/reviews/annotations/{annotationId}
Cập nhật annotation (move/resize/status).
3. POST /api/reviews/annotations/{annotationId}/comments
Thêm comment vào thread.
4. POST /api/reviews/comments/{commentId}/reply
Trả lời comment.
5. PATCH /api/reviews/annotations/{annotationId}/resolve
Đánh dấu resolved.

## 5. API nhóm review workflow
1. PATCH /api/reviews/assets/{assetId}/status
Đổi trạng thái review.
2. GET /api/reviews/assets/{assetId}/timeline
Lấy timeline tổng hợp annotation/comment theo thời gian.

## 6. Permission matrix (áp lên API)
1. READ:
- Xem playback, xem comment/annotation
2. COMMENT:
- Tạo comment/annotation, reply, resolve comment của mình
3. MODIFY:
- Chỉnh metadata, upload version mới, cập nhật annotation rộng hơn
4. OWNER:
- Toàn quyền + quản lý permission

## 7. Contract principles
1. Mọi payload annotation phải chứa versionId để tránh nhầm chéo version.
2. API playback phải trả thông tin capability (hasMultipleRenditions, fallbackMode).
3. Event quan trọng phải sinh audit record.
4. Response cần có permission snapshot để client bật/tắt action đúng vai trò.
