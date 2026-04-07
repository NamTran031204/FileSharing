# Database Design - Media Review Platform

## 1. Tổng quan

Thiết kế database cho hệ thống Media Review Platform dựa trên MongoDB, kế thừa từ hệ thống File Sharing cũ và mở rộng để hỗ trợ đầy đủ các tính năng review media chuyên nghiệp.

### 1.1 Nguyên tắc thiết kế
1. **Kế thừa hợp lý**: Giữ nguyên collections đã ổn định (user), mở rộng/tái cấu trúc metadata thành media_assets + media_versions
2. **Denormalization có kiểm soát**: Embed dữ liệu khi access pattern rõ ràng (annotation → region/timecode), reference khi cần truy vấn độc lập
3. **Version-centric**: Mọi annotation, comment đều gắn với versionId cụ thể để tránh nhầm lẫn khi có nhiều phiên bản
4. **Audit-ready**: Các action quan trọng đều có timestamp và actor để phục vụ audit trail

### 1.2 Danh sách Collections

| Collection | Mô tả | Kế thừa từ Phase 1 |
|------------|-------|-----------------|
| `users` | Thông tin người dùng | Giữ nguyên |
| `media_assets` | Media asset (video/image) | Mở rộng từ metadata |
| `media_versions` | Các phiên bản của asset |  Mới |
| `media_renditions` | Các rendition (HLS profiles) | Mới |
| `annotations` | Đánh dấu/comment theo vị trí | Mới |
| `comment_threads` | Luồng comment và replies | Mới |
| `review_sessions` | Phiên review với workflow |  Mới |
| `processing_jobs` | Job queue cho media processing |Mới |
| `audit_logs` | Lịch sử thao tác quan trọng | Mới |
| `notifications` | Thông báo cho người dùng | Mới |

---

## 2. Chi tiết Collections

### 2.1 Collection: `users`

**Mục đích**: Quản lý thông tin người dùng, xác thực và phân quyền hệ thống.

**Kế thừa**: Giữ nguyên từ Phase 1, bổ sung một số field cho notification preferences.

```javascript
{
  "_id": ObjectId,  
  "email": String,  
  "password": String,   
  "publicUserName": String,  
  "roles": ["USER", "ADMIN"], 
  "enabled": Boolean,    
  "emailVerified": Boolean,  
  
  // OAuth providers
  "providers": [
    {
      "provider": "LOCAL" | "GOOGLE",
      "providerId": String,  
      "linkedAt": ISODate
    }
  ],
  "metadata": {
    "avatar": String,   
    "locale": String,     
    "timezone": String 
  },
  "notificationPreferences": {
    "emailOnNewComment": Boolean, 
    "emailOnMention": Boolean,   
    "emailOnStatusChange": Boolean, 
    "inAppNotifications": Boolean  
  },
  "createdAt": ISODate,
  "updatedAt": ISODate,
  "lastLoginAt": ISODate
}
```

**Indexes**:
```javascript
"email", "providers.provider", "providers.providerId"
```

---

### 2.2 Collection: `media_assets`

**Mục đích**: Đại diện cho một media item (video/image), quản lý metadata tổng quan và permissions.

**Chuyển đổi từ Phase 1**: Tách từ `MetadataEntity`, giữ thông tin asset-level, version-specific chuyển sang `media_versions`.

```javascript
{
  "_id": ObjectId,
  "name": String,  
  "description": String,
  "mediaType": "VIDEO" | "IMAGE",
  
  "projectId": ObjectId,  
  "folderId": ObjectId,
  
  "ownerId": ObjectId,  
  "ownerEmail": String,  
  
  "currentVersionId": ObjectId,  
  "versionCount": Number,
  
  "visibility": "PRIVATE" | "PUBLIC",
  "publicPermission": "READ" | "COMMENT" | "MODIFY",
  "userPermissions": [
    {
      "userId": ObjectId,
      "email": String,
      "permissions": ["READ", "COMMENT", "MODIFY"]
    }
  ],
  
  "shareToken": String, 
  "shareExpiry": ISODate,  
  
  "isActive": Boolean,   
  "isTrash": Boolean,  
  "trashedAt": ISODate, 
  
  "latestReviewStatus": "DRAFT" | "IN_REVIEW" | "REQUEST_CHANGES" | "APPROVED",
  "latestReviewSessionId": ObjectId,
  
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

**Indexes**:
```javascript
{ "ownerId", "isTrash", "createdAt" } 
{ "shareToken" } 
{ "projectId" }  
{ "visibility", "publicPermission"} 
{ "userPermissions.userId" } 
{ "latestReviewStatus" }  
```

---

### 2.3 Collection: `media_versions`

**Mục đích**: Mỗi lần upload mới tạo một version, giữ nguyên version cũ để truy vết lịch sử.

```javascript
{
  "_id": ObjectId,
  "assetId": ObjectId, 
  "versionNumber": Number,
  "versionLabel": String, 
  
  "originalFileName": String, 
  "objectKey": String,      
  "mimeType": String, 
  "fileSize": Number, 
  "checksum": String,  
  
  "mediaInfo": {
    "durationMs": Number,        
    "width": Number,
    "height": Number,
    "frameRate": Number, 
    "codec": String,      
    "bitrate": Number,  
    
    "colorSpace": String,
    "hasAlpha": Boolean 
  },
  
  "uploadId": String,   
  "uploadStatus": "UPLOADING" | "COMPLETED" | "FAILED" | "ABORTED",
  
  "processingStatus": "PENDING" | "PROCESSING" | "READY" | "FAILED",
  "processingError": String,  
  "processingStartedAt": ISODate,
  "processingCompletedAt": ISODate,
  
  "virusScanStatus": "PENDING" | "CLEAN" | "INFECTED" | "SKIPPED",
  "virusScanResult": String,  
  
  "renditionCount": Number,
  
  "createdBy": ObjectId,  
  "createdByEmail": String, 
  
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

**Indexes**:
```javascript
{ "assetId", "versionNumber"} 
{ "assetId", "uploadStatus"}  
{ "processingStatus", "createdAt"}  
{ "uploadId"}  
```

---

### 2.4 Collection: `media_renditions`

**Mục đích**: Lưu thông tin các bản rendition (HLS profiles, thumbnails) được tạo từ FFmpeg.

```javascript
{
  "_id": ObjectId,  
  "versionId": ObjectId,       
  "assetId": ObjectId,            
  
  "renditionType": "HLS" | "THUMBNAIL" | "SPRITE" | "WAVEFORM" | "POSTER",
  
  // HLS specific
  "profile": String,          
  "manifestKey": String,       
  "segmentPathPrefix": String,  
  "bandwidth": Number,            
  "resolution": {
    "width": Number,
    "height": Number
  },
  
  // Thumbnail/Sprite specific
  "thumbnailCount": Number,  // số thumbnail trong sprite
  "intervalMs": Number,  // khoảng cách giữa các thumbnail
  "spriteKey": String, // vi du thumbnails/{assetId}/{versionId}/sprite.jpg
  "spriteMetadataKey": String,  // thumbnails/{assetId}/{versionId}/sprite.vtt
  
  // Poster spec
  "posterKey": String,   // thumbnails/{assetId}/{versionId}/poster.jpg
  "posterTimestamp": Number,   // ms - vị trí lấy poster
  
  "fileSize": Number,     // bytes
  "status": "PENDING" | "PROCESSING" | "READY" | "FAILED",
  
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

**Indexes**:
```javascript
{ "versionId": 1, "renditionType": 1 }      
{ "assetId": 1 }    
{ "status": 1 }    
```

---

### 2.5 Collection: `annotations`

**Mục đích**: Đánh dấu vị trí trên video (timecode) hoặc vùng trên image để gắn comment.

```javascript
{
  "_id": ObjectId,  // annotationId
  "assetId": ObjectId, // ref → media_assets
  "versionId": ObjectId,  // ref → media_versions (quan trọng!)
  
  "annotationType": "TIMECODE" | "REGION" | "FRAME_REGION",
  
  "timecode": {
    "startMs": Number, // mốc bắt đầu (ms)
    "endMs": Number // mốc kết thúc (ms), có thể = startMs nếu point
  },
  
  // Region annotation (image hoặc video frame)
  "region": {
    "shape": "RECTANGLE" | "CIRCLE" | "POLYGON" | "FREEFORM",
    "points": [
      { "x": Number, "y": Number }  
    ],          
    "strokeColor": String,   
    "strokeWidth": Number, 
    "fillColor": String    
  },
  
  "frameNumber": Number,      
  
  "status": "OPEN" | "RESOLVED",
  "resolvedAt": ISODate,
  "resolvedBy": ObjectId,   
  
  "threadId": ObjectId, 
  
  "createdBy": ObjectId,  
  "createdByEmail": String,  
  
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

---

### 2.6 Collection: `comment_threads`

**Mục đích**: Quản lý luồng comment với replies, hỗ trợ threaded discussion.

```javascript
{
  "_id": ObjectId, // threadId
  "assetId": ObjectId,  // ref → media_assets
  "versionId": ObjectId, // ref → media_versions
  "annotationId": ObjectId, // ref → annotations (nullable nếu general comment)
  
  // Root comment
  "rootComment": {
    "commentId": ObjectId,  // unique ID cho comment
    "content": String,  // nội dung text (có thể chứa @mentions)
    "mentions": [ObjectId], // danh sách userId được mention
    "attachments": [ // file đính kèm (optional)
      {
        "type": "IMAGE" | "FILE",
        "objectKey": String,
        "fileName": String,
        "fileSize": Number
      }
    ],
    "createdBy": ObjectId,
    "createdByEmail": String, // denormalized
    "createdByName": String, // denormalized
    "createdAt": ISODate,
    "editedAt": ISODate  // null nếu chưa edit
  },
  
  // Replies
  "replies": [
    {
      "commentId": ObjectId,
      "content": String,
      "mentions": [ObjectId],
      "attachments": [],
      "createdBy": ObjectId,
      "createdByEmail": String,
      "createdByName": String,
      "createdAt": ISODate,
      "editedAt": ISODate
    }
  ],
  
  // Thread metadata
  "replyCount": Number,  // cached count
  "participants": [ObjectId], // unique users in thread
  "lastActivityAt": ISODate, // thời điểm hoạt động cuối
  
  "status": "OPEN" | "RESOLVED",
  "resolvedAt": ISODate,
  "resolvedBy": ObjectId,
  
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

---

### 2.7 Collection: `review_sessions`

**Mục đích**: Quản lý phiên review với workflow status, tracking người review.

```javascript
{
  "_id": ObjectId,  
  "assetId": ObjectId,     
  "activeVersionId": ObjectId, 
  
  "title": String,  
  "description": String,  
  "dueDate": ISODate,   
  
  "status": "DRAFT" | "IN_REVIEW" | "REQUEST_CHANGES" | "APPROVED",
  "statusHistory": [
    {
      "status": String,
      "changedBy": ObjectId,
      "changedByEmail": String,
      "changedAt": ISODate,
      "note": String   
    }
  ],
  
  // Reviewers
  "reviewers": [
    {
      "userId": ObjectId,
      "email": String,
      "role": "REVIEWER" | "APPROVER",
      "invitedAt": ISODate,
      "lastViewedAt": ISODate,  
      "hasCommented": Boolean 
    }
  ],
  
  // Metrics 
  "metrics": {
    "totalAnnotations": Number,
    "openAnnotations": Number,
    "resolvedAnnotations": Number,
    "totalComments": Number
  },
  
  // Creator
  "createdBy": ObjectId,
  "createdByEmail": String,
  
  "createdAt": ISODate,
  "updatedAt": ISODate,
  "completedAt": ISODate    
}
```

---

### 2.8 Collection: `processing_jobs`

**Mục đích**: Queue cho media processing jobs (transcode, thumbnail generation).

```javascript
{
  "_id": ObjectId,                    // jobId
  "versionId": ObjectId,              // ref → media_versions
  "assetId": ObjectId,                // denormalized
  
  "jobType": "TRANSCODE_HLS" | "GENERATE_THUMBNAILS" | "GENERATE_SPRITE" | 
             "GENERATE_POSTER" | "GENERATE_WAVEFORM" | "VIRUS_SCAN",
  
  // Job config
  "config": {
    "profiles": ["360p", "720p", "1080p"],
    
    // Thumbnail specific
    "intervalSeconds": Number,
    "maxThumbnails": Number,
    
    // Virus scan specific
    "scanEngine": String
  },
  
  "status": "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED",
  "priority": Number,                 // 1 (cao nhat) - 10 (thap nhat)
  
  // Result
  "result": {
    "success": Boolean,
    "outputKeys": [String],      
    "errorMessage": String,
    "errorDetails": Object
  },
  
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

---

### 2.9 Collection: `notifications`

**Mục đích**: Lưu trữ thông báo cho người dùng (in-app notifications).

```javascript
{
  "_id": ObjectId,   
  "userId": ObjectId, 
  
  "type": "NEW_COMMENT" | "MENTION" | "STATUS_CHANGE" | "NEW_VERSION" | 
          "REVIEW_INVITATION" | "ANNOTATION_RESOLVED" | "DEADLINE_REMINDER",
  
  "title": String,     
  "message": String,  
  "link": String,   
  
  "context": {
    "assetId": ObjectId,
    "assetName": String,
    "versionId": ObjectId,
    "annotationId": ObjectId,
    "commentId": ObjectId,
    "reviewSessionId": ObjectId,
    "actorId": ObjectId,    
    "actorName": String
  },
  
  "isRead": Boolean, 
  "readAt": ISODate,
  
  "deliveryStatus": {
    "inApp": "DELIVERED",
    "email": "PENDING" | "SENT" | "FAILED" | "SKIPPED"
  },
  
  "createdAt": ISODate,
  "expiresAt": ISODate    
}
```

---

## 3. Quan hệ giữa các Collections

```
┌─────────────┐     1:N     ┌──────────────────┐     1:N     ┌───────────────────┐
│   users     │────────────▶│   media_assets   │────────────▶│  media_versions   │
└─────────────┘             └──────────────────┘             └───────────────────┘
      │                            │                                  │
      │                            │ 1:N                              │ 1:N
      │                            ▼                                  ▼
      │                     ┌──────────────────┐              ┌───────────────────┐
      │                     │ review_sessions  │              │ media_renditions  │
      │                     └──────────────────┘              └───────────────────┘
      │                            │
      │                            │ 1:N (via versionId)
      │                            ▼
      │                     ┌──────────────────┐     1:1     ┌───────────────────┐
      │                     │   annotations    │────────────▶│  comment_threads  │
      │                     └──────────────────┘             └───────────────────┘
      │
      │ 1:N
      ▼
┌─────────────┐
│notifications│
└─────────────┘

     ┌───────────────────┐
     │  processing_jobs  │  (ref → media_versions)
     └───────────────────┘
     
     ┌───────────────────┐
     │    audit_logs     │  (ref → multiple collections)
     └───────────────────┘
```

---

## 4. Migration từ Database cũ

### 4.1 Collection `metadata` → `media_assets` + `media_versions`

**Mapping fields**:

| metadata (cũ) | media_assets (mới) | media_versions (mới) |
|---------------|-------------------|---------------------|
| fileId | _id | - |
| fileName | name | originalFileName |
| objectName | - | objectKey |
| mimeType | mediaType (derived) | mimeType |
| fileSize | - | fileSize |
| ownerId | ownerId | - |
| ownerEmail | ownerEmail | - |
| uploadId | - | uploadId |
| status | - | uploadStatus |
| shareToken | shareToken | - |
| visibility | visibility | - |
| publicPermission | publicPermission | - |
| userFilePermissions | userPermissions | - |
| isActive | isActive | - |
| isTrash | isTrash | - |
| creationTimestamp | createdAt | createdAt |
| modificationTimestamp | updatedAt | updatedAt |

**Migration script (pseudo-code)**:
```javascript
// 1. Tạo media_asset từ mỗi metadata document
// 2. Tạo media_version (version 1) với file info
// 3. Set currentVersionId của asset = versionId vừa tạo
// 4. Xóa collection metadata cũ (sau khi verify)
```

### 4.2 Collection `user` → `users`

**Không thay đổi cấu trúc**, chỉ bổ sung:
- `notificationPreferences` với default values

---

## 5. Access Patterns và Query Examples

### 5.1 List assets của user
```javascript
db.media_assets.find({
  $or: [
    { ownerId: userId },
    { "userPermissions.userId": userId }
  ],
  isTrash: false,
  isActive: true
}).sort({ updatedAt: -1 })
```

### 5.2 Get asset với version history
```javascript
// Asset
const asset = db.media_assets.findOne({ _id: assetId })

// Versions
const versions = db.media_versions.find({ 
  assetId: assetId 
}).sort({ versionNumber: -1 })
```

### 5.3 Get annotations timeline cho video
```javascript
db.annotations.find({
  versionId: versionId,
  annotationType: "TIMECODE"
}).sort({ "timecode.startMs": 1 })
```

### 5.4 Get unresolved annotations
```javascript
db.annotations.find({
  versionId: versionId,
  status: "OPEN"
})
```

### 5.5 Get threads với replies
```javascript
db.comment_threads.find({
  versionId: versionId
}).sort({ lastActivityAt: -1 })
```

### 5.6 Get review sessions pending approval
```javascript
db.review_sessions.find({
  "reviewers.userId": userId,
  status: { $in: ["IN_REVIEW", "REQUEST_CHANGES"] }
}).sort({ dueDate: 1 })
```

### 5.7 Get pending processing jobs
```javascript
db.processing_jobs.find({
  status: "PENDING"
}).sort({ priority: 1, scheduledAt: 1 }).limit(10)
```

---

## 6. Performance Considerations

### 6.1 Denormalization Strategy
- **Email/Name**: Duplicate vào documents thường xuyên hiển thị để tránh joins
- **Counts**: Cache `replyCount`, `versionCount`, `annotationCount` và update via `$inc`
- **Latest Status**: `latestReviewStatus` trên asset để filter nhanh

### 6.2 Index Recommendations
- Compound indexes cho common query patterns
- Partial indexes cho sparse fields (e.g., `trashedAt` chỉ index khi not null)
- TTL indexes cho audit_logs và notifications

### 6.3 Sharding Considerations (future)
- Shard key candidate: `ownerId` hoặc `assetId`
- Cân nhắc khi vượt 100GB data hoặc 10K requests/sec

---

## 7. Data Validation Rules

### 7.1 Required Fields per Collection
- **media_assets**: name, mediaType, ownerId, visibility
- **media_versions**: assetId, versionNumber, objectKey, mimeType
- **annotations**: assetId, versionId, annotationType, createdBy
- **comment_threads**: assetId, versionId, rootComment
- **review_sessions**: assetId, activeVersionId, status

### 7.2 Enum Constraints
```javascript
// mediaType
["VIDEO", "IMAGE"]

// visibility  
["PRIVATE", "PUBLIC"]

// permission
["READ", "COMMENT", "MODIFY"]

// uploadStatus
["UPLOADING", "COMPLETED", "FAILED", "ABORTED"]

// processingStatus
["PENDING", "PROCESSING", "READY", "FAILED"]

// reviewStatus
["DRAFT", "IN_REVIEW", "REQUEST_CHANGES", "APPROVED"]

// annotationType
["TIMECODE", "REGION", "FRAME_REGION"]

// annotationStatus
["OPEN", "RESOLVED"]
```

---

## 8. Backup và Retention

### 8.1 Backup Strategy
- **Daily**: Full backup MongoDB
- **Hourly**: Oplog backup cho point-in-time recovery
- **MinIO**: Enable versioning + replication

### 8.2 Data Retention
| Collection | Retention | Policy |
|------------|-----------|--------|
| media_assets | Permanent (until delete) | Trash → 30 days → permanent delete |
| media_versions | Permanent | Giữ tất cả versions |
| annotations | Permanent | Giữ với version |
| audit_logs | 1 year | TTL index on `expiresAt` |
| notifications | 90 days | TTL index on `expiresAt` |
| processing_jobs | 30 days (completed) | Clean up via cron |

---

## 9. Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-XX-XX | - | Initial database design for Media Review Platform |
