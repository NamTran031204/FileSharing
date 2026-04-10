# Screen-to-Database & API Mapping Reference

**Purpose**: Quick reference để developers biết cần query/API gì cho từng screen  
**Format**: Screen → Database Collections → API Endpoints  

---

## Screen 1: Login Page

### Database Collections
- `users` (read: email, password check)

### API Endpoints
```
POST /auth/login
  Input: { email, password }
  Output: { accessToken, refreshToken, user: { userId, email, roles } }
  
POST /auth/google
  Input: { googleToken }
  Output: { accessToken, refreshToken, user: {...} }
  
POST /auth/reset-password
  Input: { email }
  Output: { message: "Link sent to email" }
```

### Key Operations
- Hash password + compare
- Generate JWT tokens
- Store refresh token

---

## Screen 2: Register Page

### Database Collections
- `users` (create new)

### API Endpoints
```
POST /auth/register
  Input: { email, password, publicUserName }
  Output: { accessToken, refreshToken, user: {...} }
  Validations: 
    - email unique
    - password strength (min 8, uppercase, number, special)
    
POST /auth/reset-password-confirm
  Input: { token, newPassword }
  Output: { message: "Password reset successful" }
```

---

## Screen 4: Dashboard / Home

### Database Collections
```javascript
db.review_sessions.countDocuments({
  "reviewers.userId": userId,
  "status": "IN_REVIEW"
})

db.metadata.countDocuments({
  "processingStatus": "READY",
  "userPermissions.userId": userId
})

db.assets.countDocuments({
  "ownerId": userId,
  "assetStatus": "IN_REVIEW"
})

db.projects.find({
  $or: [
    { "ownerId": userId },
    { "collaborators.userId": userId }
  ]
}).sort({ "updatedAt": -1 }).limit(5)

db.audit_logs.find({
  $or: [
    { "actorId": userId },
    { "targetOwnerId": userId }
  ]
}).sort({ "timestamp": -1 }).limit(10)
```

### API Endpoints
```
GET /dashboard/overview
  Output: {
    userStats: {
      pendingReviews: number,
      readyToReview: number,
      inProgress: number
    },
    recentProjects: Project[],
    activityFeed: AuditLog[]
  }
  
GET /dashboard/stats
  Output: { pending, ready, inProgress }
```

---

## Screen 5: Project List (Sidebar)

### Database Collections
```javascript
db.projects.find({
  $or: [
    { "ownerId": userId },
    { "collaborators.userId": userId }
  ]
}).sort({ "updatedAt": -1 })
```

### API Endpoints
```
GET /projects
  Query: { page=1, limit=50, search?, sort=-updatedAt }
  Output: { items: Project[], total, page, pageSize }
  
GET /projects/{projectId}
  Output: Project
```

---

## Screen 6: Create Project Modal

### Database Collections
```javascript
// Create
db.projects.insertOne({
  projectId: ObjectId,
  projectName, projectCode, description, category,
  clientName, startDate, endDate,
  ownerId: userId, ownerEmail,
  collaborators: [],
  stats: { folderCount: 0, assetCount: 0, ... },
  status: "ACTIVE",
  createdAt, updatedAt
})

// Check unique projectCode
db.projects.findOne({ projectCode })
```

### API Endpoints
```
POST /projects
  Input: {
    projectName,
    projectCode,
    description?,
    category,
    clientName?,
    startDate?,
    endDate?,
    createDefaultFolders?: true
  }
  Output: { projectId, projectName, ... }
  Validation: projectCode unique
  
POST /projects/{projectId}/folders (default)
  Create root folders if flag set
```

---

## Screen 7: Project Detail / Overview

### Database Collections
```javascript
// Get project
db.projects.findById(projectId)

// Get stats
db.folders.countDocuments({ projectId })
db.assets.countDocuments({ projectId })
db.review_sessions.countDocuments({
  projectId,
  status: "IN_REVIEW"
})

// Get activity
db.audit_logs.find({ projectId })
  .sort({ timestamp: -1 })
  .limit(20)
```

### API Endpoints
```
GET /projects/{projectId}
  Output: {
    project: Project,
    stats: {
      folderCount,
      assetCount,
      pendingReviews,
      approvedAssets
    },
    activity: AuditLog[]
  }
  
PUT /projects/{projectId}
  Input: { projectName, description, ... }
  Output: Project
  
GET /projects/{projectId}/collaborators
  Output: Collaborator[]
  
POST /projects/{projectId}/collaborators
  Input: { email, role }
  Output: Collaborator
  
DELETE /projects/{projectId}/collaborators/{userId}
  Output: { message: "Removed" }
```

---

## Screen 8: Project Settings

### Database Collections (same as Screen 7)

### API Endpoints (same as Screen 7)

---

## Screen 9: Folder Browser

### Database Collections
```javascript
// Get folder tree
db.folders.find({ projectId }).sort({ level: 1, folderName: 1 })

// Get assets in folder
db.assets.find({
  folderId: currentFolderId,
  isTrash: false
}).sort({ assetStatus: 1, createdAt: -1 })
  .limit(50)
  .with({
    versions: {
      $lookup: {
        from: "metadata",
        localField: "assetId",
        foreignField: "assetId",
        as: "versions"
      }
    },
    reviews: {
      $lookup: {
        from: "review_sessions",
        localField: "assetId",
        foreignField: "assetId",
        as: "reviews"
      }
    }
  })

// Get current folder path (breadcrumb)
db.folders.findById(folderId)  // folderPath denormalized
```

### API Endpoints
```
GET /projects/{projectId}/folders/tree
  Output: { folders: Folder[] } (hierarchical)
  
GET /projects/{projectId}/folders/{folderId}/assets
  Query: { page=1, limit=50, sort=-createdAt, view=grid|list }
  Output: {
    assets: Asset[],
    total,
    page,
    pageSize
  }
  
POST /projects/{projectId}/folders
  Input: { folderName, description, parentFolderId }
  Output: Folder
  
PUT /projects/{projectId}/folders/{folderId}
  Input: { folderName, description }
  Output: Folder
  
DELETE /projects/{projectId}/folders/{folderId}
  Output: { message: "Deleted" }
```

---

## Screen 10: Create Folder Modal

### Database Collections
```javascript
db.folders.insertOne({
  folderId: ObjectId,
  projectId, parentFolderId,
  folderName, description,
  folderPath, level,
  permissions: [],
  stats: { assetCount: 0, subfoldersCount: 0 },
  createdBy: userId,
  createdAt, updatedAt
})
```

### API Endpoints
```
POST /projects/{projectId}/folders
  Input: { folderName, description, parentFolderId }
  Output: Folder
  Validation: folderName unique within parentFolder
```

---

## Screen 11: Upload Modal

### Database Collections
```javascript
// Create upload session
db.metadata.insertOne({
  metadataId: ObjectId,
  assetId: newId,
  fileName, objectName: `${uuid}-${fileName}`,
  uploadId: multipartUploadId,
  status: "UPLOADING",
  processingStatus: "PENDING",
  mimeType, fileSize,
  ownerId: userId, ownerEmail,
  visibility: "PRIVATE",
  createdAt
})

// Create processing job
db.processing_jobs.insertOne({
  jobId: ObjectId,
  uploadId,
  type: "TRANSCODE",
  status: "QUEUED",
  createdAt
})

// Create asset
db.assets.insertOne({
  assetId,
  assetName: fileName,
  projectId, folderId,
  ownerId, ownerEmail,
  assetStatus: "DRAFT",
  versionCount: 1,
  createdAt
})
```

### API Endpoints
```
POST /assets/upload-metadata
  Input: { fileName, fileSize, mimeType, folderId, projectId }
  Output: {
    uploadId,
    metadataId,
    assetId,
    presignedUrls: { [partNumber]: "signed-url" }
  }
  Processing: Initiate S3 multipart upload

PUT /assets/upload/{uploadId}/part/{partNumber}
  Input: binary chunk data
  Output: { etag }
  Route to: S3 presigned URL (client direct)

PUT /assets/upload/{uploadId}/complete
  Input: { parts: [{ partNumber, etag }] }
  Output: { metadataId }
  Processing:
    - Complete S3 multipart
    - Queue processing job
    - Update metadata status → COMPLETED

POST /assets/{assetId}/upload-complete-notification
  (Webhook from MinIO if using events)
```

---

## Screen 12: Asset Detail Page

### Database Collections
```javascript
// Get asset with all data
db.assets.findById(assetId)
  .lookup({
    from: "metadata",
    localField: "assetId",
    foreignField: "assetId",
    as: "versions"
  })
  .lookup({
    from: "review_sessions",
    localField: "assetId",
    foreignField: "assetId",
    as: "reviews"
  })

// Get annotations for current version
db.annotations.find({ versionId: activeVersionId })
  .sort({ createdAt: 1 })

// Get comments for current version
db.comment_threads.find({ versionId: activeVersionId })
```

### API Endpoints
```
GET /assets/{assetId}
  Output: {
    asset: Asset,
    versions: Metadata[],
    reviews: ReviewSession[],
    activeVersion: Metadata
  }
  
GET /assets/{assetId}/metadata/{versionId}
  Output: Metadata (with mediaInfo, renditions)
  
GET /assets/{assetId}/metadata/{versionId}/renditions
  Output: MediaRendition[] (HLS, thumbnail, etc)
  
GET /assets/{assetId}/annotations?versionId=...
  Output: Annotation[]
  
GET /assets/{assetId}/comments?versionId=...
  Output: CommentThread[]
  
PUT /assets/{assetId}
  Input: { assetName, description }
  Output: Asset
  
DELETE /assets/{assetId}
  Output: { message: "Moved to trash" }
  Processing: Set isTrash: true, trashedAt: now
```

---

## Screen 13: Video Player

### Database Collections
```javascript
// Get renditions
db.media_renditions.findOne({
  versionId,
  renditionType: "HLS"
})
// Returns: { hlsManifestUrl, thumbnailUrl, ... }

// Log playback event
db.playback_events.insertOne({
  playbackEventId: ObjectId,
  userId, versionId,
  startedAt: ISODate,
  duration: number (milliseconds),
  quality, bitrate,
  completionRate, timestamp
})
```

### API Endpoints
```
GET /assets/{assetId}/metadata/{versionId}/stream/manifest.m3u8
  Output: HLS manifest (m3u8 file)
  Note: Each segment returned from CDN

GET /assets/{assetId}/metadata/{versionId}/stream/{segmentId}.ts
  Output: HLS segment (video chunk)
  Served from: CDN (cached)

GET /assets/{assetId}/metadata/{versionId}/playback-info
  Output: {
    hlsUrl,
    fallbackUrl (presigned direct),
    duration,
    resolution,
    quality options
  }

POST /playback-events
  Input: { versionId, quality, duration, completionRate }
  Output: { recorded: true }
```

---

## Screen 14: Image Viewer

### Database Collections
```javascript
// Get image metadata
db.metadata.findById(versionId)

// Get annotations for image
db.annotations.find({
  versionId,
  annotationType: "REGION"
})
```

### API Endpoints
```
GET /assets/{assetId}/metadata/{versionId}/image
  Output: Presigned URL with expiry
  Redirect or return URL for client to fetch

GET /assets/{assetId}/metadata/{versionId}/download
  Output: Presigned URL (same as above)
```

---

## Screen 15: Annotation Panel

### Database Collections
```javascript
// Create annotation
db.annotations.insertOne({
  annotationId: ObjectId,
  versionId, assetId,
  annotationType: "TIMECODE" | "REGION",
  // For video:
  timeCodeStart: number,
  timeCodeEnd: number,
  // For image:
  shape: "rectangle" | "circle" | "freehand",
  coordinates: [{ x, y }, ...],
  createdBy: userId,
  createdAt,
  threadId: ObjectId
})

// Create comment thread
db.comment_threads.insertOne({
  threadId: ObjectId,
  assetId, versionId, annotationId,
  type: "ANNOTATION_THREAD",
  status: "OPEN",
  createdBy: userId,
  comments: [{
    content, createdBy, createdAt, mentions: []
  }],
  createdAt, updatedAt
})

// Log audit
db.audit_logs.insertOne({
  action: "ANNOTATION_CREATED",
  actor: userId,
  target: annotationId,
  data: { type, timeCode, region, content },
  timestamp: ISODate
})
```

### API Endpoints
```
POST /annotations
  Input: {
    versionId,
    annotationType,
    timeCodeStart?, timeCodeEnd?,
    shape?, coordinates?,
    comment: { content, mentions? }
  }
  Output: { annotationId, threadId }
  Processing:
    - Create annotation
    - Create thread
    - Send notifications

PUT /annotations/{annotationId}
  Input: { comment, coordinates, ... }
  Output: Annotation

DELETE /annotations/{annotationId}
  Output: { message: "Deleted" }
```

---

## Screen 16: Comment Thread Panel

### Database Collections
```javascript
// Get thread
db.comment_threads.findById(threadId)
  .lookup({
    from: "comments",
    localField: "_id",
    foreignField: "threadId",
    as: "comments"
  })

// Add reply
db.comment_threads.updateOne(
  { _id: threadId },
  {
    $push: {
      comments: {
        content, createdBy, createdAt, mentions
      }
    },
    $set: { updatedAt: ISODate }
  }
)
```

### API Endpoints
```
GET /comment-threads/{threadId}
  Output: CommentThread (with all comments)

POST /comment-threads/{threadId}/comments
  Input: { content, mentions? }
  Output: { commentId }
  Processing: Send notifications to mentioned users

PUT /comments/{commentId}
  Input: { content }
  Output: Comment

DELETE /comments/{commentId}
  Output: { message: "Deleted" }

PUT /comment-threads/{threadId}/status
  Input: { status: "OPEN" | "RESOLVED" }
  Output: CommentThread
```

---

## Screen 17: Version Compare Modal

### Database Collections
```javascript
// Get both versions
db.metadata.find({
  assetId,
  versionNumber: { $in: [vA, vB] }
})

// Get renditions for both
db.media_renditions.find({
  versionId: { $in: [vAId, vBId] }
})
```

### API Endpoints
```
GET /assets/{assetId}/metadata/{versionId}/renditions
  Output: MediaRendition[] (for both versions)
```

---

## Screen 18: Create Review Session Modal

### Database Collections
```javascript
// Get asset & version
db.assets.findById(assetId)
db.metadata.findById(versionId)

// Get team members
db.users.find({ roles: ["USER", "ADMIN"] })  // or collaborators in project

// Create review session
db.review_sessions.insertOne({
  sessionId: ObjectId,
  assetId, versionId,
  title, description,
  deadline: ISODate,
  createdBy: userId,
  createdAt,
  status: "IN_REVIEW",
  reviewers: [
    {
      userId, email, role: "APPROVER" | "REVIEWER",
      status: "PENDING",
      invitedAt: ISODate
    },
    ...
  ]
})

// Create notifications
db.notifications.insertMany([
  {
    userId: reviewerUserId,
    type: "REVIEW_INVITE",
    relatedId: sessionId,
    createdAt
  },
  ...
])

// Audit log
db.audit_logs.insertOne({
  action: "REVIEW_SESSION_CREATED",
  actor: userId,
  target: sessionId,
  data: { version, reviewers, deadline },
  timestamp: ISODate
})
```

### API Endpoints
```
GET /projects/{projectId}/team
  Output: User[] (collaborators)

POST /review-sessions
  Input: {
    assetId, versionId,
    title?, description,
    deadline,
    reviewers: [{ userId | email, role }]
  }
  Output: { sessionId }
  Processing:
    - Create session
    - Create notifications
    - Send emails

GET /review-sessions/{sessionId}
  Output: ReviewSession (with all reviewers & details)
```

---

## Screen 19: Review Session Page (Reviewer POV)

### Database Collections (see Annotation Panel + Comment Thread Panel)

### API Endpoints
```
GET /review-sessions/{sessionId}
  Output: {
    session: ReviewSession,
    asset: Asset,
    version: Metadata,
    annotations: Annotation[],
    comments: CommentThread[],
    reviewerStatus: string
  }

PUT /review-sessions/{sessionId}/reviewer-status
  Input: { status: "APPROVED" | "REJECTED", feedback? }
  Output: ReviewSession
  Processing:
    - Update reviewer status
    - Check if all done
    - Update asset status if needed
    - Send notifications
    - Create audit log

POST /annotations (for adding annotation during review)
POST /comment-threads/{threadId}/comments (for replying)
```

---

## Screen 20: Upload New Version Modal

### Database Collections
```javascript
// Get latest version number
db.metadata.findOne({ assetId }, { versionNumber: 1 })
  .sort({ versionNumber: -1 })

// Create new version
db.metadata.insertOne({
  metadataId: ObjectId,
  assetId,
  versionNumber: nextVersion,
  fileName, objectName,
  uploadId: multipartUploadId,
  status: "UPLOADING",
  processingStatus: "PENDING",
  description: versionNotes,
  createdBy: userId,
  createdAt
})

// Copy permissions from previous version
db.metadata.findOne({ assetId, versionNumber: currentVersion })
  .then(prev => {
    newVersion.userPermissions = prev.userPermissions
  })
```

### API Endpoints
```
POST /assets/{assetId}/upload-new-version
  Input: {
    fileName, fileSize,
    versionNotes?,
    keepFeedback: true,
    notifyReviewers: true
  }
  Output: {
    uploadId,
    metadataId,
    versionNumber,
    presignedUrls
  }

PUT /assets/{assetId}/upload/{uploadId}/complete
  (Same as Screen 11)

POST /notifications/notify-new-version
  Input: { assetId, versionId }
  Processing: Send notifications to reviewers
```

---

## Screen 21: Version List & Details

### Database Collections (see Screen 12)

### API Endpoints
```
GET /assets/{assetId}/versions
  Output: {
    versions: Metadata[],
    activeVersion: Metadata
  }
  
PUT /assets/{assetId}/active-version
  Input: { versionId }
  Output: { activeVersion: Metadata }
```

---

## Screen 22: Notification Panel

### Database Collections
```javascript
// Get unread notifications
db.notifications.find({
  userId,
  read: false
}).sort({ createdAt: -1 }).limit(5)

// Mark as read
db.notifications.updateOne(
  { _id: notificationId },
  { $set: { read: true, readAt: ISODate } }
)
```

### API Endpoints
```
GET /notifications
  Query: { limit=5, unreadOnly=true }
  Output: Notification[]

PUT /notifications/{notificationId}/read
  Output: { read: true }

PUT /notifications/read-all
  Output: { updated: number }

GET /notifications/count
  Output: { unreadCount: number }
```

### Real-Time (WebSocket/SSE)
```
// Subscribe to notifications
SSE /notifications/stream
  Emits: {
    type: "ANNOTATION_ADDED" | "REVIEW_INVITE" | etc,
    data: { ... }
  }
```

---

## Screen 23: Search Results

### Database Collections
```javascript
// Full-text search
db.assets.find({
  $text: { $search: queryString },
  projectId: { $in: userProjects }
})
.limit(20)

db.projects.find({
  $text: { $search: queryString },
  $or: [
    { ownerId: userId },
    { "collaborators.userId": userId }
  ]
})

db.comment_threads.find({
  "comments.content": { $regex: queryString, $options: "i" },
  assetId: { $in: accessibleAssets }
})
```

### API Endpoints
```
GET /search
  Query: {
    q: string,
    type: "asset" | "project" | "comment",
    status?, ownerId?, dateFrom?, dateTo?,
    sort: "relevance" | "date" | "name",
    page, limit
  }
  Output: {
    results: SearchResult[],
    total, page, pageSize
  }
```

---

## Screen 24: User Settings

### Database Collections
```javascript
// Get user
db.users.findById(userId)

// Update profile
db.users.updateOne(
  { _id: userId },
  {
    $set: {
      "metadata.avatar": avatarUrl,
      "metadata.timezone": timezone,
      "metadata.locale": locale,
      "notificationPreferences": preferences
    }
  }
)

// Update password
db.users.updateOne(
  { _id: userId },
  { $set: { password: hashedNewPassword } }
)
```

### API Endpoints
```
GET /users/me
  Output: User

PUT /users/me
  Input: { publicUserName?, timezone?, locale?, avatar? }
  Output: User

POST /auth/change-password
  Input: { currentPassword, newPassword }
  Output: { message: "Changed" }

PUT /users/me/notification-preferences
  Input: {
    emailOnNewComment,
    emailOnMention,
    emailOnStatusChange,
    inAppNotifications,
    digestEmail
  }
  Output: User

POST /auth/2fa/enable
  Output: { secret, qrCode }

POST /auth/2fa/verify
  Input: { code }
  Output: { backupCodes: [] }

DELETE /users/me
  Input: { password }
  Output: { message: "Account scheduled for deletion" }
```

---

## Common Query Patterns

### Permission Check
```javascript
// User has access to asset?
const asset = db.assets.findById(assetId)
const metadata = db.metadata.findById(versionId)

// Check permission
if (userId === asset.ownerId) return "OWNER"
if (metadata.visibility === "PUBLIC") return metadata.publicPermission
const userPerm = metadata.userPermissions.find(u => u.userId === userId)
return userPerm?.permissions || "NO_ACCESS"
```

### Version-Centric Query
```javascript
// All data for a specific version
db.metadata.findById(versionId)
db.annotations.find({ versionId })
db.comment_threads.find({ versionId })
db.review_sessions.find({ versionId })
```

### Pagination
```javascript
// Standard pagination
db.collection.find(filter)
  .sort(sortSpec)
  .skip((page - 1) * limit)
  .limit(limit)
  .toArray()
```

### Denormalized Updates
```javascript
// Update asset stats after new annotation
db.assets.updateOne(
  { assetId },
  {
    $set: {
      "stats.annotationCount": ...,
      "stats.lastAnnotationAt": ISODate
    }
  }
)
```

---

## Performance Optimization Tips

### Indexes
```javascript
// Essential indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.projects.createIndex({ ownerId: 1, createdAt: -1 })
db.assets.createIndex({ projectId: 1, folderId: 1, assetStatus: 1 })
db.metadata.createIndex({ assetId: 1, versionNumber: -1 })
db.annotations.createIndex({ versionId: 1, createdAt: 1 })
db.comment_threads.createIndex({ versionId: 1, status: 1 })
db.review_sessions.createIndex({ assetId: 1, status: 1 })
db.notifications.createIndex({ userId: 1, read: 1, createdAt: -1 })
```

### Caching Strategy
- Cache metadata (5 min TTL)
- Cache user permissions (10 min TTL)
- Cache project tree (2 hour TTL)
- Invalidate on write

### Query Optimization
- Always use pagination (default limit: 50)
- Use field projections (don't fetch all fields)
- Use compound indexes for frequent filters
- Denormalize frequently accessed data (stats, latest version)

