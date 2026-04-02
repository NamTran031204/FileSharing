# 📋 BÁO CÁO KỸ THUẬT: WORKFLOW ENCODE VIDEO VỚI FFMPEG + HLS

> **Tài liệu thiết kế chi tiết luồng xử lý video từ upload đến streaming HLS**  
> **Phương án: Presigned URL + FFmpeg HTTP + mp4box.js Frontend Parsing**  
> **Phiên bản:** 1.0  
> **Ngày tạo:** 2026-04-02

---

## Mục Lục

1. [Tổng Quan Kiến Trúc](#1-tổng-quan-kiến-trúc)
2. [Workflow Tổng Thể](#2-workflow-tổng-thể)
3. [Chi Tiết Từng Giai Đoạn](#3-chi-tiết-từng-giai-đoạn)
4. [Database Schema Đề Xuất](#4-database-schema-đề-xuất)
5. [DTO/Interface Definitions](#5-dtointerface-definitions)
6. [API Endpoints](#6-api-endpoints)
7. [Error Handling & Recovery](#7-error-handling--recovery)
8. [Phụ Lục](#8-phụ-lục)

---

## 1. Tổng Quan Kiến Trúc

### 1.1. Techstack Hiện Tại

| Layer | Technology |
|-------|------------|
| **Frontend** | React + TypeScript + Vite + Ant Design |
| **Backend** | Spring Boot (Java) + Spring Security + JWT |
| **Storage** | MinIO (S3-compatible) + MongoDB |
| **Video Processing** | FFmpeg (Server-side) |
| **Container Parsing** | mp4box.js (Client-side) |

### 1.2. Phạm Vi Hỗ Trợ

| Định dạng | Container | Codec Video | Codec Audio | Trạng thái |
|-----------|-----------|-------------|-------------|------------|
| MP4 | ISO Base Media | H.264, H.265 | AAC, MP3 | ✅ Ưu tiên |
| MOV | QuickTime | H.264, ProRes | AAC, PCM | ✅ Ưu tiên |
| MKV | Matroska | - | - | ⏳ Phase 2 |
| AVI | RIFF | - | - | ⏳ Phase 2 |

### 1.3. Kiến Trúc High-Level

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              VIDEO ENCODE WORKFLOW                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   ┌──────────────┐                                                                  │
│   │   FRONTEND   │                                                                  │
│   │   (React)    │                                                                  │
│   │              │                                                                  │
│   │ ┌──────────┐ │    1. Parse Container    ┌─────────────────────────────────┐    │
│   │ │mp4box.js │─┼──────────────────────────►│ VideoContainerInfo              │    │
│   │ │  Parser  │ │    (moov atom analysis)  │ - moovPosition: "start"|"end"   │    │
│   │ └──────────┘ │                          │ - duration, resolution, codec   │    │
│   │              │                          │ - tracks[], keyframes[]         │    │
│   │ ┌──────────┐ │    2. Upload Chunks      └───────────────┬─────────────────┘    │
│   │ │ Chunked  │─┼───────────────────────────────────────────┼──────────────────►   │
│   │ │ Uploader │ │    (Presigned URLs)                       │                      │
│   │ └──────────┘ │                                           │                      │
│   └──────────────┘                                           │                      │
│                                                              │                      │
│   ┌──────────────────────────────────────────────────────────┼──────────────────┐   │
│   │                         BACKEND (Spring Boot)            │                  │   │
│   │                                                          ▼                  │   │
│   │  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────────────┐ │   │
│   │  │  Upload     │───►│ Video       │───►│ VideoMetadata Document          │ │   │
│   │  │  Controller │    │ Service     │    │ (MongoDB)                       │ │   │
│   │  └─────────────┘    └──────┬──────┘    └─────────────────────────────────┘ │   │
│   │                            │                                                │   │
│   │                            │ 3. Trigger Encode Job                          │   │
│   │                            ▼                                                │   │
│   │  ┌─────────────────────────────────────────────────────────────────────┐   │   │
│   │  │                    ENCODING SERVICE                                  │   │   │
│   │  │  ┌───────────────┐   ┌───────────────┐   ┌───────────────────────┐  │   │   │
│   │  │  │ Job           │   │ FFmpeg        │   │ HLS                   │  │   │   │
│   │  │  │ Orchestrator  │──►│ Executor      │──►│ Generator             │  │   │   │
│   │  │  │               │   │ (Presigned    │   │                       │  │   │   │
│   │  │  │               │   │  URL Input)   │   │                       │  │   │   │
│   │  │  └───────────────┘   └───────────────┘   └───────────────────────┘  │   │   │
│   │  └─────────────────────────────────────────────────────────────────────┘   │   │
│   │                                                                             │   │
│   └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│   ┌──────────────┐                                                                  │
│   │    MinIO     │  4. Store HLS Output                                             │
│   │   Storage    │◄─────────────────────────────────────────────────────────────    │
│   │              │                                                                  │
│   │  /originals/ │  Source videos                                                   │
│   │  /hls/       │  Encoded HLS segments + manifests                                │
│   └──────────────┘                                                                  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Workflow Tổng Thể

### 2.1. Diagram Luồng Xử Lý

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           COMPLETE WORKFLOW DIAGRAM                                  │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ╔═══════════════════════════════════════════════════════════════════════════════╗  │
│  ║  STAGE 1: CLIENT-SIDE CONTAINER PARSING (mp4box.js)                           ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                               ║  │
│  ║  User selects file → mp4box.js parses first 50MB                             ║  │
│  ║  → Extract moov atom → Determine moov position                               ║  │
│  ║  → Extract video/audio tracks → Get keyframe positions                       ║  │
│  ║                                                                               ║  │
│  ║  OUTPUT: VideoContainerInfo                                                   ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════════╝  │
│                                         │                                            │
│                                         ▼                                            │
│  ╔═══════════════════════════════════════════════════════════════════════════════╗  │
│  ║  STAGE 2: CHUNKED UPLOAD                                                      ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                               ║  │
│  ║  1. POST /api/upload/init-video → Get uploadId + presigned URLs              ║  │
│  ║  2. PUT chunks to MinIO via presigned URLs                                   ║  │
│  ║  3. POST /api/upload/complete-video → Finalize + Save metadata               ║  │
│  ║                                                                               ║  │
│  ║  OUTPUT: VideoMetadata (MongoDB document)                                     ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════════╝  │
│                                         │                                            │
│                                         ▼                                            │
│  ╔═══════════════════════════════════════════════════════════════════════════════╗  │
│  ║  STAGE 3: CREATE ENCODE JOB                                                   ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                               ║  │
│  ║  Auto-triggered hoặc manual request                                          ║  │
│  ║  → Create EncodeJob document (status: PENDING)                               ║  │
│  ║  → Push to Job Queue                                                         ║  │
│  ║                                                                               ║  │
│  ║  OUTPUT: EncodeJob                                                            ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════════╝  │
│                                         │                                            │
│                                         ▼                                            │
│  ╔═══════════════════════════════════════════════════════════════════════════════╗  │
│  ║  STAGE 4: FFPROBE ANALYSIS (Server-side validation)                           ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                               ║  │
│  ║  Generate presigned URL → FFprobe via HTTP                                   ║  │
│  ║  → Validate/enrich metadata from client                                      ║  │
│  ║  → Extract precise keyframe timestamps (nếu client không gửi)               ║  │
│  ║                                                                               ║  │
│  ║  OUTPUT: EnrichedVideoMetadata                                                ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════════╝  │
│                                         │                                            │
│                                         ▼                                            │
│  ╔═══════════════════════════════════════════════════════════════════════════════╗  │
│  ║  STAGE 5: SEGMENT PLANNING                                                    ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                               ║  │
│  ║  Based on keyframes → Plan segment boundaries                                ║  │
│  ║  → Create SegmentTask for each segment × each quality                        ║  │
│  ║                                                                               ║  │
│  ║  OUTPUT: List<SegmentTask>                                                    ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════════╝  │
│                                         │                                            │
│                                         ▼                                            │
│  ╔═══════════════════════════════════════════════════════════════════════════════╗  │
│  ║  STAGE 6: PARALLEL ENCODING                                                   ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                               ║  │
│  ║  Thread Pool processes SegmentTasks                                          ║  │
│  ║  → FFmpeg reads from presigned URL (-ss, -t)                                 ║  │
│  ║  → Output .ts segments to temp directory                                     ║  │
│  ║                                                                               ║  │
│  ║  OUTPUT: Encoded .ts files (local temp)                                       ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════════╝  │
│                                         │                                            │
│                                         ▼                                            │
│  ╔═══════════════════════════════════════════════════════════════════════════════╗  │
│  ║  STAGE 7: MANIFEST GENERATION                                                 ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                               ║  │
│  ║  Generate variant playlists (original.m3u8, 720p.m3u8, ...)                  ║  │
│  ║  → Generate master playlist (master.m3u8)                                    ║  │
│  ║                                                                               ║  │
│  ║  OUTPUT: HLS Manifest files (.m3u8)                                           ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════════╝  │
│                                         │                                            │
│                                         ▼                                            │
│  ╔═══════════════════════════════════════════════════════════════════════════════╗  │
│  ║  STAGE 8: UPLOAD TO MINIO                                                     ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                               ║  │
│  ║  Parallel upload segments + manifests to MinIO /hls/{videoId}/               ║  │
│  ║                                                                               ║  │
│  ║  OUTPUT: HLS content available on MinIO                                       ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════════╝  │
│                                         │                                            │
│                                         ▼                                            │
│  ╔═══════════════════════════════════════════════════════════════════════════════╗  │
│  ║  STAGE 9: CLEANUP & FINALIZE                                                  ║  │
│  ╠═══════════════════════════════════════════════════════════════════════════════╣  │
│  ║                                                                               ║  │
│  ║  Delete temp files → Update EncodeJob status → Update VideoMetadata          ║  │
│  ║  → Notify client (WebSocket/Polling)                                         ║  │
│  ║                                                                               ║  │
│  ║  OUTPUT: Ready for streaming                                                  ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════════╝  │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Chi Tiết Từng Giai Đoạn

### 3.1. STAGE 1: Client-Side Container Parsing

#### 3.1.1. Mô Tả

Sử dụng **mp4box.js** tại frontend để parse container MP4/MOV, trích xuất thông tin quan trọng TRƯỚC KHI upload. Điều này giúp:
- Xác định vị trí `moov` atom (đầu hay cuối file)
- Lấy thông tin video tracks, audio tracks
- Tính toán keyframe positions (tùy chọn - có thể để backend làm)
- Validate file trước khi upload

#### 3.1.2. Input

| Field | Type | Description |
|-------|------|-------------|
| `file` | `File` | File object từ `<input type="file">` |
| `parseOptions` | `ParseOptions` | Tùy chọn parse (optional) |

```typescript
interface ParseOptions {
  extractKeyframes?: boolean;     // Default: false (tốn performance)
  maxBytesToRead?: number;        // Default: 50MB (đủ để đọc moov)
}
```

#### 3.1.3. Process (mp4box.js)

```typescript
// Frontend: VideoParser.ts

import MP4Box from 'mp4box';

interface VideoContainerInfo {
  // Container Info
  containerFormat: 'mp4' | 'mov';
  moovPosition: 'start' | 'end' | 'fragmented';
  moovSize: number;               // bytes
  mdatPosition: number;           // byte offset
  
  // Video Track
  videoTrack: {
    trackId: number;
    codec: string;                // "avc1.64001f" (H.264 High Profile)
    codecFriendly: string;        // "H.264"
    width: number;
    height: number;
    frameRate: number;
    bitrate: number;              // estimated bps
    duration: number;             // seconds
    timescale: number;
    sampleCount: number;
  } | null;
  
  // Audio Track
  audioTrack: {
    trackId: number;
    codec: string;                // "mp4a.40.2" (AAC-LC)
    codecFriendly: string;        // "AAC"
    sampleRate: number;
    channelCount: number;
    bitrate: number;
    duration: number;
  } | null;
  
  // Keyframes (optional - expensive to extract)
  keyframes?: number[];           // timestamps in seconds
  
  // Validation
  isValid: boolean;
  issues: string[];               // Any detected problems
}
```

#### 3.1.4. Output

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `containerFormat` | `string` | Loại container | `"mp4"` |
| `moovPosition` | `string` | Vị trí moov atom | `"start"` hoặc `"end"` |
| `moovSize` | `number` | Kích thước moov (bytes) | `52428800` |
| `videoTrack.codec` | `string` | Video codec string | `"avc1.64001f"` |
| `videoTrack.width` | `number` | Chiều rộng (pixels) | `1920` |
| `videoTrack.height` | `number` | Chiều cao (pixels) | `1080` |
| `videoTrack.frameRate` | `number` | FPS | `29.97` |
| `videoTrack.duration` | `number` | Thời lượng (giây) | `3600.5` |
| `audioTrack.codec` | `string` | Audio codec | `"mp4a.40.2"` |
| `audioTrack.sampleRate` | `number` | Sample rate | `48000` |
| `isValid` | `boolean` | File hợp lệ | `true` |

---

### 3.2. STAGE 2: Chunked Upload

#### 3.2.1. Input

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `file` | `File` | User | File video gốc |
| `containerInfo` | `VideoContainerInfo` | Stage 1 | Thông tin đã parse |
| `uploadOptions` | `UploadOptions` | Config | Tùy chọn upload |

```typescript
interface VideoUploadRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
  containerInfo: VideoContainerInfo;
  
  // Options
  autoEncode?: boolean;           // Auto-trigger encode after upload
  targetQualities?: string[];     // ["original", "720p", "480p"]
}
```

#### 3.2.2. Sub-steps

##### Step 2.1: Initialize Upload

**Request:**
```
POST /api/video/upload/init
Content-Type: application/json

{
  "fileName": "my_video.mp4",
  "fileSize": 1073741824,
  "mimeType": "video/mp4",
  "containerInfo": {
    "containerFormat": "mp4",
    "moovPosition": "start",
    "moovSize": 52428800,
    "videoTrack": {
      "codec": "avc1.64001f",
      "width": 1920,
      "height": 1080,
      "frameRate": 29.97,
      "duration": 3600.5
    },
    "audioTrack": {
      "codec": "mp4a.40.2",
      "sampleRate": 48000,
      "channelCount": 2
    }
  },
  "autoEncode": true,
  "targetQualities": ["original", "720p"]
}
```

**Response:**
```typescript
interface InitUploadResponse {
  uploadId: string;               // S3 multipart upload ID
  videoId: string;                // Our internal video ID
  objectName: string;             // MinIO object path
  partUrls: {                     // Presigned URLs for each part
    [partNumber: number]: string;
  };
  partSize: number;               // Recommended part size
  expiresAt: string;              // URL expiration time (ISO8601)
}
```

##### Step 2.2: Upload Parts

**Process:** Frontend uploads chunks directly to MinIO using presigned URLs.

```
PUT {presignedUrl}
Content-Type: application/octet-stream

[binary chunk data]
```

**Response per part:**
```
HTTP/1.1 200 OK
ETag: "abc123def456"
```

##### Step 2.3: Complete Upload

**Request:**
```
POST /api/video/upload/complete
Content-Type: application/json

{
  "uploadId": "abc123",
  "videoId": "vid_xyz789",
  "parts": [
    { "partNumber": 1, "eTag": "abc123def456" },
    { "partNumber": 2, "eTag": "def789ghi012" },
    ...
  ]
}
```

#### 3.2.3. Output

| Field | Type | Storage | Description |
|-------|------|---------|-------------|
| `videoId` | `string` | MongoDB | Unique video identifier |
| `objectName` | `string` | MinIO | Path trong MinIO bucket |
| `status` | `string` | MongoDB | `"UPLOADED"` |
| `containerInfo` | `object` | MongoDB | Parsed container info |

---

### 3.3. STAGE 3: Create Encode Job

#### 3.3.1. Input

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `videoId` | `string` | Stage 2 | Video ID |
| `targetQualities` | `string[]` | Request | Danh sách chất lượng cần encode |
| `priority` | `number` | Request | Độ ưu tiên (1-10) |

```typescript
interface CreateEncodeJobRequest {
  videoId: string;
  targetQualities: QualityPreset[];
  priority?: number;              // Default: 5
  callbackUrl?: string;           // Webhook khi hoàn thành
}

type QualityPreset = 
  | 'original'                    // Copy codec, just segment
  | '1080p'                       // 1920x1080, 5000kbps
  | '720p'                        // 1280x720, 2500kbps
  | '480p'                        // 854x480, 1000kbps
  | '360p';                       // 640x360, 600kbps
```

#### 3.3.2. Process

```java
// Backend: EncodeJobService.java

public EncodeJob createJob(CreateEncodeJobRequest request) {
    VideoMetadata video = videoRepository.findById(request.getVideoId())
        .orElseThrow(() -> new NotFoundException("Video not found"));
    
    EncodeJob job = EncodeJob.builder()
        .jobId(UUID.randomUUID().toString())
        .videoId(request.getVideoId())
        .sourceObjectName(video.getObjectName())
        .targetQualities(request.getTargetQualities())
        .status(EncodeJobStatus.PENDING)
        .priority(request.getPriority())
        .createdAt(Instant.now())
        .build();
    
    encodeJobRepository.save(job);
    jobQueue.enqueue(job);
    
    return job;
}
```

#### 3.3.3. Output

```typescript
interface EncodeJob {
  jobId: string;
  videoId: string;
  sourceObjectName: string;
  targetQualities: QualityPreset[];
  status: EncodeJobStatus;
  priority: number;
  
  // Progress tracking
  totalSegments: number;
  completedSegments: number;
  failedSegments: number;
  
  // Timestamps
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  
  // Error info
  errorMessage?: string;
  errorDetails?: object;
}

type EncodeJobStatus = 
  | 'PENDING'       // In queue
  | 'ANALYZING'     // FFprobe running
  | 'PLANNING'      // Creating segment tasks
  | 'ENCODING'      // FFmpeg encoding
  | 'UPLOADING'     // Uploading to MinIO
  | 'COMPLETED'     // Success
  | 'FAILED'        // Error occurred
  | 'CANCELLED';    // User cancelled
```

---

### 3.4. STAGE 4: FFprobe Analysis

#### 3.4.1. Input

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `sourceObjectName` | `string` | EncodeJob | MinIO object path |
| `containerInfo` | `object` | VideoMetadata | Client-parsed info |

#### 3.4.2. Process

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              FFPROBE ANALYSIS FLOW                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  1. Generate Presigned URL (expiry: 2 hours)                                        │
│     ─────────────────────────────────────────                                       │
│     String presignedUrl = minioClient.getPresignedObjectUrl(                        │
│         GetPresignedObjectUrlArgs.builder()                                         │
│             .bucket(videoBucket)                                                    │
│             .object(sourceObjectName)                                               │
│             .method(Method.GET)                                                     │
│             .expiry(2, TimeUnit.HOURS)                                              │
│             .build()                                                                │
│     );                                                                              │
│                                                                                      │
│  2. Execute FFprobe Commands                                                        │
│     ────────────────────────                                                        │
│                                                                                      │
│     Command 1: Get format + streams info                                            │
│     ┌─────────────────────────────────────────────────────────────────────────┐    │
│     │ ffprobe -v quiet -print_format json                                      │    │
│     │         -show_format -show_streams                                       │    │
│     │         "{presignedUrl}"                                                 │    │
│     └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│     Command 2: Get keyframe timestamps (nếu chưa có từ client)                      │
│     ┌─────────────────────────────────────────────────────────────────────────┐    │
│     │ ffprobe -v quiet -select_streams v:0                                     │    │
│     │         -show_entries frame=pts_time,pict_type                           │    │
│     │         -of csv=p=0                                                      │    │
│     │         "{presignedUrl}"                                                 │    │
│     │         | grep ",I"                                                      │    │
│     │         | cut -d',' -f1                                                  │    │
│     └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                      │
│  3. Validate & Merge with Client Data                                               │
│     ─────────────────────────────────────                                           │
│     - Compare duration: |ffprobe - client| < 1s → OK                               │
│     - Compare resolution: exact match required                                      │
│     - Compare codec: allow minor variations                                         │
│     - If mismatch > threshold → Trust ffprobe                                       │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

#### 3.4.3. Output

```typescript
interface FFprobeResult {
  // Format info
  format: {
    formatName: string;           // "mov,mp4,m4a,3gp,3g2,mj2"
    formatLongName: string;       // "QuickTime / MOV"
    duration: number;             // 3600.523
    size: number;                 // 1073741824
    bitRate: number;              // 8000000
    probeScore: number;           // 100
  };
  
  // Video stream
  videoStream: {
    index: number;
    codecName: string;            // "h264"
    codecLongName: string;        // "H.264 / AVC / MPEG-4 Part 10"
    profile: string;              // "High"
    level: number;                // 42
    width: number;
    height: number;
    displayAspectRatio: string;   // "16:9"
    pixelFormat: string;          // "yuv420p"
    frameRate: number;            // 29.97
    avgFrameRate: string;         // "30000/1001"
    bitRate: number;
    bitsPerRawSample: string;     // "8"
    
    // Calculated from frame analysis
    gopSize: number;              // Average GOP size
    keyframeInterval: number;     // Average seconds between keyframes
  };
  
  // Audio stream
  audioStream: {
    index: number;
    codecName: string;            // "aac"
    profile: string;              // "LC"
    sampleRate: number;           // 48000
    channels: number;             // 2
    channelLayout: string;        // "stereo"
    bitRate: number;
  } | null;
  
  // Keyframe list
  keyframes: number[];            // [0, 2.002, 4.004, 6.006, ...]
  
  // Validation status
  validationStatus: 'VALID' | 'VALID_WITH_WARNINGS' | 'INVALID';
  validationMessages: string[];
}
```

---

### 3.5. STAGE 5: Segment Planning

#### 3.5.1. Input

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `ffprobeResult` | `FFprobeResult` | Stage 4 | Analyzed video info |
| `targetQualities` | `QualityPreset[]` | EncodeJob | Qualities to encode |
| `segmentDuration` | `number` | Config | Target segment length (seconds) |

```typescript
interface SegmentPlanningInput {
  duration: number;
  keyframes: number[];
  targetSegmentDuration: number;  // Default: 10 seconds
  targetQualities: QualityPreset[];
}
```

#### 3.5.2. Process: Keyframe-Aligned Segment Planning

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         SEGMENT PLANNING ALGORITHM                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  INPUT:                                                                             │
│  ─────────                                                                          │
│  duration = 60.5 seconds                                                            │
│  keyframes = [0, 2.0, 4.0, 6.0, 8.0, 10.0, 12.0, ..., 58.0, 60.0]                  │
│  targetSegmentDuration = 10 seconds                                                │
│                                                                                      │
│  ALGORITHM:                                                                         │
│  ────────────                                                                       │
│                                                                                      │
│  Timeline:  |----|----|----|----|----|----|----|----|----|----|----|----|----│     │
│  Seconds:   0    5    10   15   20   25   30   35   40   45   50   55   60        │
│  Keyframes: *    *    *    *    *    *    *    *    *    *    *    *    *          │
│             ↑                   ↑                   ↑                   ↑          │
│  Target:    0                   10                  20                  30...      │
│                                                                                      │
│  STEP 1: Xác định target cut points                                                │
│          targets = [10, 20, 30, 40, 50, 60]                                        │
│                                                                                      │
│  STEP 2: Với mỗi target, tìm keyframe gần nhất                                     │
│          findNearestKeyframe(10) → 10.0                                            │
│          findNearestKeyframe(20) → 20.0                                            │
│          ...                                                                        │
│                                                                                      │
│  STEP 3: Tạo segments                                                              │
│          Segment 0: start=0, end=10.0, duration=10.0                               │
│          Segment 1: start=10.0, end=20.0, duration=10.0                            │
│          ...                                                                        │
│          Segment 6: start=60.0, end=60.5, duration=0.5                             │
│                                                                                      │
│  OUTPUT: List<SegmentPlan>                                                          │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

#### 3.5.3. Output

```typescript
interface SegmentPlan {
  segmentIndex: number;
  startTime: number;              // seconds
  endTime: number;                // seconds
  duration: number;               // seconds (endTime - startTime)
  estimatedSize: number;          // bytes (based on bitrate)
}

interface SegmentTask {
  taskId: string;
  jobId: string;
  segmentIndex: number;
  quality: QualityPreset;
  
  // Timing
  startTime: number;
  duration: number;
  
  // FFmpeg params
  ffmpegParams: FFmpegParams;
  
  // Output
  outputPath: string;             // Local temp path
  expectedOutputSize: number;
  
  // Status
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  attempts: number;
  errorMessage?: string;
}

interface FFmpegParams {
  inputUrl: string;               // Presigned URL
  seekTime: number;               // -ss value
  duration: number;               // -t value
  videoCodec: string;             // libx264
  videoPreset: string;            // medium
  videoBitrate?: string;          // 2500k (null for original)
  videoCrf?: number;              // 23
  videoScale?: string;            // 1280:720
  audioCodec: string;             // aac
  audioBitrate: string;           // 128k
  threads: number;                // 2
  outputFormat: string;           // mpegts
}

// Example output
const segmentTasks: SegmentTask[] = [
  {
    taskId: "task_001",
    jobId: "job_xyz",
    segmentIndex: 0,
    quality: "original",
    startTime: 0,
    duration: 10.0,
    ffmpegParams: {
      inputUrl: "https://minio/...",
      seekTime: 0,
      duration: 10.0,
      videoCodec: "libx264",
      videoPreset: "medium",
      videoCrf: 23,
      audioCodec: "aac",
      audioBitrate: "128k",
      threads: 2,
      outputFormat: "mpegts"
    },
    outputPath: "/tmp/job_xyz/original/segment_000.ts",
    status: "PENDING",
    attempts: 0
  },
  {
    taskId: "task_002",
    jobId: "job_xyz",
    segmentIndex: 0,
    quality: "720p",
    startTime: 0,
    duration: 10.0,
    ffmpegParams: {
      inputUrl: "https://minio/...",
      seekTime: 0,
      duration: 10.0,
      videoCodec: "libx264",
      videoPreset: "medium",
      videoBitrate: "2500k",
      videoScale: "1280:720",
      audioCodec: "aac",
      audioBitrate: "128k",
      threads: 2,
      outputFormat: "mpegts"
    },
    outputPath: "/tmp/job_xyz/720p/segment_000.ts",
    status: "PENDING",
    attempts: 0
  },
  // ... more tasks
];
```

---

### 3.6. STAGE 6: Parallel Encoding

#### 3.6.1. Input

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `segmentTasks` | `SegmentTask[]` | Stage 5 | Tasks to execute |
| `presignedUrl` | `string` | MinIO | URL to source video |
| `threadPoolSize` | `number` | Config | Max concurrent encodes |

#### 3.6.2. Thread Pool Configuration

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                          THREAD POOL CONFIGURATION                                   │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  SERVER SPECS      │ POOL SIZE  │ THREADS/WORKER │ QUEUE SIZE │ MAX MEM/WORKER     │
│  ──────────────────┼────────────┼────────────────┼────────────┼───────────────────  │
│  4 cores, 8GB      │     2      │       1        │     4      │     2GB            │
│  8 cores, 16GB     │     6      │       1        │    12      │     2GB            │
│  16 cores, 32GB    │    14      │       2        │    28      │     2GB            │
│                                                                                      │
│  FORMULA:                                                                           │
│  ─────────                                                                          │
│  pool_size = CPU_CORES - 2                                                          │
│  queue_size = pool_size × 2                                                         │
│  max_memory_per_worker = (TOTAL_RAM - 4GB) / pool_size                             │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

#### 3.6.3. FFmpeg Command Template

```bash
# Original quality (copy + segment)
ffmpeg -ss {startTime} -t {duration} \
       -i "{presignedUrl}" \
       -c:v libx264 -preset medium -crf 23 \
       -c:a aac -b:a 128k \
       -threads 2 \
       -f mpegts \
       "{outputDir}/original/segment_{index:03d}.ts"

# 720p quality
ffmpeg -ss {startTime} -t {duration} \
       -i "{presignedUrl}" \
       -vf "scale=1280:720" \
       -c:v libx264 -preset medium -crf 23 -b:v 2500k \
       -c:a aac -b:a 128k \
       -threads 2 \
       -f mpegts \
       "{outputDir}/720p/segment_{index:03d}.ts"
```

#### 3.6.4. Output

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `outputFiles` | `Map<Quality, List<String>>` | Encoded segment files | `{original: [...], 720p: [...]}` |
| `encodingStats` | `EncodingStats` | Statistics | Speed, duration, etc. |

```typescript
interface EncodingResult {
  taskId: string;
  status: 'SUCCESS' | 'FAILED';
  outputPath: string;
  outputSize: number;             // bytes
  encodingTime: number;           // milliseconds
  ffmpegLogs?: string;            // For debugging
  errorMessage?: string;
}

interface EncodingStats {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalEncodingTime: number;      // ms
  averageEncodingSpeed: number;   // x realtime
  totalOutputSize: number;        // bytes
}
```

---

### 3.7. STAGE 7: Manifest Generation

#### 3.7.1. Input

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `segmentPlans` | `SegmentPlan[]` | Stage 5 | Segment boundaries |
| `qualities` | `QualityPreset[]` | EncodeJob | Available qualities |
| `videoId` | `string` | VideoMetadata | Unique identifier |

#### 3.7.2. Process

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           MANIFEST GENERATION                                        │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  1. VARIANT PLAYLISTS (per quality)                                                 │
│  ────────────────────────────────────                                               │
│                                                                                      │
│  original.m3u8:                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ #EXTM3U                                                                      │   │
│  │ #EXT-X-VERSION:3                                                             │   │
│  │ #EXT-X-TARGETDURATION:11                                                     │   │
│  │ #EXT-X-MEDIA-SEQUENCE:0                                                      │   │
│  │ #EXT-X-PLAYLIST-TYPE:VOD                                                     │   │
│  │ #EXTINF:10.000,                                                              │   │
│  │ original/segment_000.ts                                                      │   │
│  │ #EXTINF:10.000,                                                              │   │
│  │ original/segment_001.ts                                                      │   │
│  │ #EXTINF:10.000,                                                              │   │
│  │ original/segment_002.ts                                                      │   │
│  │ ...                                                                          │   │
│  │ #EXTINF:0.500,                                                               │   │
│  │ original/segment_360.ts                                                      │   │
│  │ #EXT-X-ENDLIST                                                               │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
│  2. MASTER PLAYLIST                                                                 │
│  ─────────────────────                                                              │
│                                                                                      │
│  master.m3u8:                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │
│  │ #EXTM3U                                                                      │   │
│  │ #EXT-X-VERSION:3                                                             │   │
│  │                                                                              │   │
│  │ #EXT-X-STREAM-INF:BANDWIDTH=8000000,RESOLUTION=1920x1080,CODECS="avc1..."   │   │
│  │ original.m3u8                                                                │   │
│  │                                                                              │   │
│  │ #EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720,CODECS="avc1..."    │   │
│  │ 720p.m3u8                                                                    │   │
│  └─────────────────────────────────────────────────────────────────────────────┘   │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

#### 3.7.3. Output

```typescript
interface HLSManifests {
  masterPlaylist: {
    fileName: 'master.m3u8';
    content: string;
    path: string;
  };
  variantPlaylists: {
    quality: QualityPreset;
    fileName: string;             // "original.m3u8", "720p.m3u8"
    content: string;
    path: string;
    bandwidth: number;
    resolution: string;
    codecs: string;
  }[];
}
```

---

### 3.8. STAGE 8: Upload to MinIO

#### 3.8.1. Input

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `manifests` | `HLSManifests` | Stage 7 | Playlist files |
| `segments` | `Map<Quality, List<File>>` | Stage 6 | Encoded segments |
| `videoId` | `string` | VideoMetadata | Target directory |

#### 3.8.2. Process

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              PARALLEL UPLOAD                                         │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  Upload Thread Pool: 10 concurrent connections                                      │
│                                                                                      │
│  Content-Type Mapping:                                                              │
│  ─────────────────────                                                              │
│  .m3u8 → application/vnd.apple.mpegurl                                             │
│  .ts   → video/mp2t                                                                 │
│                                                                                      │
│  Target Structure in MinIO:                                                         │
│  ─────────────────────────────                                                      │
│                                                                                      │
│  hls-bucket/                                                                        │
│  └── {videoId}/                                                                     │
│      ├── master.m3u8                                                                │
│      ├── original.m3u8                                                              │
│      ├── 720p.m3u8                                                                  │
│      ├── original/                                                                  │
│      │   ├── segment_000.ts                                                         │
│      │   ├── segment_001.ts                                                         │
│      │   └── ...                                                                    │
│      └── 720p/                                                                      │
│          ├── segment_000.ts                                                         │
│          ├── segment_001.ts                                                         │
│          └── ...                                                                    │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

#### 3.8.3. Output

```typescript
interface UploadResult {
  hlsBasePath: string;            // "hls/{videoId}"
  masterPlaylistUrl: string;      // Full URL to master.m3u8
  uploadedFiles: {
    path: string;
    size: number;
    contentType: string;
  }[];
  totalSize: number;
  uploadDuration: number;         // ms
}
```

---

### 3.9. STAGE 9: Cleanup & Finalize

#### 3.9.1. Input

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `jobId` | `string` | EncodeJob | Job identifier |
| `uploadResult` | `UploadResult` | Stage 8 | Upload info |
| `tempDir` | `string` | Config | Local temp directory |

#### 3.9.2. Process

1. **Delete local temp files**: `rm -rf /tmp/job_{jobId}/`
2. **Update EncodeJob**: status → `COMPLETED`
3. **Update VideoMetadata**: Add HLS info
4. **Send notification**: WebSocket or callback URL

#### 3.9.3. Output

```typescript
interface EncodeJobCompletion {
  jobId: string;
  videoId: string;
  status: 'COMPLETED';
  
  // Results
  hlsReady: true;
  masterPlaylistUrl: string;
  availableQualities: QualityPreset[];
  
  // Stats
  totalDuration: number;          // Total processing time (ms)
  encodingDuration: number;       // Pure encoding time (ms)
  uploadDuration: number;         // Upload time (ms)
  
  // Sizes
  sourceSize: number;             // Original file size
  outputSize: number;             // Total HLS output size
  compressionRatio: number;       // outputSize / sourceSize
  
  completedAt: string;            // ISO8601
}
```

---

## 4. Database Schema Đề Xuất

### 4.1. MongoDB Collections

#### 4.1.1. Collection: `video_metadata`

```typescript
interface VideoMetadataDocument {
  _id: ObjectId;
  
  // === IDENTIFICATION ===
  videoId: string;                // Unique video ID (UUID)
  fileId: string;                 // Link to MetadataEntity nếu cần
  
  // === FILE INFO ===
  fileName: string;
  objectName: string;             // MinIO path: "originals/{uuid}_{filename}"
  mimeType: string;               // "video/mp4", "video/quicktime"
  fileSize: number;               // bytes
  
  // === OWNERSHIP ===
  ownerId: string;
  ownerEmail: string;
  
  // === CONTAINER INFO (from mp4box.js) ===
  containerInfo: {
    containerFormat: 'mp4' | 'mov';
    moovPosition: 'start' | 'end' | 'fragmented';
    moovSize: number;
    
    videoTrack: {
      trackId: number;
      codec: string;              // "avc1.64001f"
      codecFriendly: string;      // "H.264"
      width: number;
      height: number;
      frameRate: number;
      bitrate: number;
      duration: number;
      timescale: number;
    } | null;
    
    audioTrack: {
      trackId: number;
      codec: string;
      codecFriendly: string;
      sampleRate: number;
      channelCount: number;
      bitrate: number;
    } | null;
  };
  
  // === FFPROBE ENRICHED DATA (optional) ===
  ffprobeData?: {
    duration: number;
    bitrate: number;
    videoCodecProfile: string;
    videoCodecLevel: number;
    pixelFormat: string;
    gopSize: number;
    keyframeInterval: number;
    validatedAt: Date;
  };
  
  // === HLS INFO (populated after encoding) ===
  hlsInfo?: {
    ready: boolean;
    masterPlaylistPath: string;   // "hls/{videoId}/master.m3u8"
    availableQualities: string[]; // ["original", "720p"]
    totalHlsSize: number;
    segmentCount: number;
    targetSegmentDuration: number;
    encodedAt: Date;
  };
  
  // === STATUS ===
  uploadStatus: 'UPLOADING' | 'UPLOADED' | 'FAILED';
  encodeStatus: 'NONE' | 'PENDING' | 'ENCODING' | 'COMPLETED' | 'FAILED';
  
  // === TIMESTAMPS ===
  createdAt: Date;
  updatedAt: Date;
  
  // === INDEXES ===
  // db.video_metadata.createIndex({ videoId: 1 }, { unique: true })
  // db.video_metadata.createIndex({ ownerId: 1 })
  // db.video_metadata.createIndex({ encodeStatus: 1 })
}
```

#### 4.1.2. Collection: `encode_jobs`

```typescript
interface EncodeJobDocument {
  _id: ObjectId;
  
  // === IDENTIFICATION ===
  jobId: string;                  // Unique job ID (UUID)
  videoId: string;                // Reference to video_metadata
  
  // === SOURCE ===
  sourceObjectName: string;       // MinIO path to original
  sourceDuration: number;         // seconds
  sourceResolution: {
    width: number;
    height: number;
  };
  
  // === CONFIGURATION ===
  targetQualities: string[];      // ["original", "720p"]
  segmentDuration: number;        // target seconds per segment
  priority: number;               // 1-10
  
  // === PRESIGNED URL (temporary) ===
  presignedUrl?: string;
  presignedUrlExpiry?: Date;
  
  // === SEGMENT PLANNING ===
  segmentPlan?: {
    totalSegments: number;
    segments: {
      index: number;
      startTime: number;
      endTime: number;
      duration: number;
    }[];
    keyframes: number[];
  };
  
  // === PROGRESS ===
  status: EncodeJobStatus;
  progress: {
    totalTasks: number;           // segments × qualities
    completedTasks: number;
    failedTasks: number;
    currentPhase: 'ANALYZING' | 'PLANNING' | 'ENCODING' | 'UPLOADING';
  };
  
  // === RESULTS ===
  result?: {
    hlsBasePath: string;
    masterPlaylistUrl: string;
    totalOutputSize: number;
    qualities: {
      name: string;
      playlistPath: string;
      segmentCount: number;
      totalSize: number;
      bandwidth: number;
      resolution: string;
    }[];
  };
  
  // === ERROR INFO ===
  error?: {
    message: string;
    phase: string;
    taskId?: string;
    stackTrace?: string;
    occurredAt: Date;
  };
  
  // === TIMESTAMPS ===
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  // === CALLBACK ===
  callbackUrl?: string;
  callbackSent?: boolean;
  
  // === INDEXES ===
  // db.encode_jobs.createIndex({ jobId: 1 }, { unique: true })
  // db.encode_jobs.createIndex({ videoId: 1 })
  // db.encode_jobs.createIndex({ status: 1, priority: -1, createdAt: 1 })
}

type EncodeJobStatus = 
  | 'PENDING'
  | 'ANALYZING'
  | 'PLANNING'
  | 'ENCODING'
  | 'UPLOADING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';
```

#### 4.1.3. Collection: `segment_tasks`

```typescript
interface SegmentTaskDocument {
  _id: ObjectId;
  
  // === IDENTIFICATION ===
  taskId: string;
  jobId: string;                  // Reference to encode_jobs
  
  // === SEGMENT INFO ===
  segmentIndex: number;
  quality: string;                // "original", "720p", etc.
  
  // === TIMING ===
  startTime: number;              // seconds
  duration: number;               // seconds
  
  // === FFMPEG CONFIG ===
  ffmpegConfig: {
    seekTime: number;
    duration: number;
    videoCodec: string;
    videoPreset: string;
    videoBitrate?: string;
    videoCrf?: number;
    videoScale?: string;
    audioCodec: string;
    audioBitrate: string;
    threads: number;
  };
  
  // === OUTPUT ===
  outputPath: string;             // Local temp path
  minioPath?: string;             // Final MinIO path after upload
  outputSize?: number;            // bytes
  
  // === STATUS ===
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  workerId?: string;              // Which worker is processing
  
  // === RETRY ===
  attempts: number;
  maxAttempts: number;            // Default: 3
  lastAttemptAt?: Date;
  
  // === METRICS ===
  metrics?: {
    encodingTime: number;         // ms
    encodingSpeed: number;        // x realtime
    ffmpegExitCode: number;
  };
  
  // === ERROR ===
  error?: {
    message: string;
    ffmpegOutput?: string;
  };
  
  // === TIMESTAMPS ===
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  // === INDEXES ===
  // db.segment_tasks.createIndex({ taskId: 1 }, { unique: true })
  // db.segment_tasks.createIndex({ jobId: 1, status: 1 })
  // db.segment_tasks.createIndex({ status: 1, createdAt: 1 })
}
```

---

## 5. DTO/Interface Definitions

### 5.1. Frontend DTOs (TypeScript)

```typescript
// ========================================
// VIDEO CONTAINER PARSING (mp4box.js)
// ========================================

interface VideoContainerInfo {
  containerFormat: 'mp4' | 'mov';
  moovPosition: 'start' | 'end' | 'fragmented';
  moovSize: number;
  mdatPosition: number;
  
  videoTrack: VideoTrackInfo | null;
  audioTrack: AudioTrackInfo | null;
  
  keyframes?: number[];
  isValid: boolean;
  issues: string[];
}

interface VideoTrackInfo {
  trackId: number;
  codec: string;
  codecFriendly: string;
  width: number;
  height: number;
  frameRate: number;
  bitrate: number;
  duration: number;
  timescale: number;
  sampleCount: number;
}

interface AudioTrackInfo {
  trackId: number;
  codec: string;
  codecFriendly: string;
  sampleRate: number;
  channelCount: number;
  bitrate: number;
  duration: number;
}

// ========================================
// UPLOAD
// ========================================

interface InitVideoUploadRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
  containerInfo: VideoContainerInfo;
  autoEncode?: boolean;
  targetQualities?: QualityPreset[];
}

interface InitVideoUploadResponse {
  uploadId: string;
  videoId: string;
  objectName: string;
  partUrls: Record<number, string>;
  partSize: number;
  expiresAt: string;
}

interface CompleteVideoUploadRequest {
  uploadId: string;
  videoId: string;
  parts: PartInfo[];
}

interface PartInfo {
  partNumber: number;
  eTag: string;
}

interface CompleteVideoUploadResponse {
  videoId: string;
  status: 'UPLOADED';
  encodeJobId?: string;
  hlsReady: boolean;
}

// ========================================
// ENCODE JOB
// ========================================

type QualityPreset = 'original' | '1080p' | '720p' | '480p' | '360p';

interface CreateEncodeJobRequest {
  videoId: string;
  targetQualities: QualityPreset[];
  priority?: number;
}

interface EncodeJobResponse {
  jobId: string;
  videoId: string;
  status: EncodeJobStatus;
  progress: EncodeProgress;
  result?: EncodeResult;
  error?: EncodeError;
  createdAt: string;
  completedAt?: string;
}

interface EncodeProgress {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  currentPhase: string;
  percentage: number;
}

interface EncodeResult {
  hlsReady: boolean;
  masterPlaylistUrl: string;
  qualities: QualityInfo[];
  totalDuration: number;
  totalOutputSize: number;
}

interface QualityInfo {
  name: string;
  playlistUrl: string;
  bandwidth: number;
  resolution: string;
}

interface EncodeError {
  message: string;
  phase: string;
  details?: string;
}

// ========================================
// VIDEO PLAYBACK
// ========================================

interface VideoStreamInfo {
  videoId: string;
  title: string;
  duration: number;
  thumbnailUrl?: string;
  hlsReady: boolean;
  masterPlaylistUrl?: string;
  availableQualities: QualityInfo[];
}
```

### 5.2. Backend DTOs (Java)

```java
// ========================================
// VIDEO CONTAINER INFO (from frontend)
// ========================================

@Data
@Builder
public class VideoContainerInfoDTO {
    private String containerFormat;       // "mp4" | "mov"
    private String moovPosition;          // "start" | "end" | "fragmented"
    private Long moovSize;
    private Long mdatPosition;
    
    private VideoTrackInfoDTO videoTrack;
    private AudioTrackInfoDTO audioTrack;
    
    private List<Double> keyframes;
    private Boolean isValid;
    private List<String> issues;
}

@Data
@Builder
public class VideoTrackInfoDTO {
    private Integer trackId;
    private String codec;
    private String codecFriendly;
    private Integer width;
    private Integer height;
    private Double frameRate;
    private Long bitrate;
    private Double duration;
    private Long timescale;
    private Long sampleCount;
}

@Data
@Builder
public class AudioTrackInfoDTO {
    private Integer trackId;
    private String codec;
    private String codecFriendly;
    private Integer sampleRate;
    private Integer channelCount;
    private Long bitrate;
    private Double duration;
}

// ========================================
// UPLOAD REQUESTS/RESPONSES
// ========================================

@Data
public class InitVideoUploadRequest {
    @NotBlank
    private String fileName;
    
    @NotNull
    @Positive
    private Long fileSize;
    
    @NotBlank
    private String mimeType;
    
    @NotNull
    @Valid
    private VideoContainerInfoDTO containerInfo;
    
    private Boolean autoEncode = false;
    private List<String> targetQualities;
}

@Data
@Builder
public class InitVideoUploadResponse {
    private String uploadId;
    private String videoId;
    private String objectName;
    private Map<Integer, String> partUrls;
    private Integer partSize;
    private Instant expiresAt;
}

@Data
public class CompleteVideoUploadRequest {
    @NotBlank
    private String uploadId;
    
    @NotBlank
    private String videoId;
    
    @NotEmpty
    @Valid
    private List<PartInfoDTO> parts;
}

@Data
public class PartInfoDTO {
    @NotNull
    @Positive
    private Integer partNumber;
    
    @NotBlank
    private String eTag;
}

// ========================================
// ENCODE JOB
// ========================================

@Data
public class CreateEncodeJobRequest {
    @NotBlank
    private String videoId;
    
    @NotEmpty
    private List<String> targetQualities;
    
    @Min(1)
    @Max(10)
    private Integer priority = 5;
    
    private String callbackUrl;
}

@Data
@Builder
public class EncodeJobResponse {
    private String jobId;
    private String videoId;
    private String status;
    private EncodeProgressDTO progress;
    private EncodeResultDTO result;
    private EncodeErrorDTO error;
    private Instant createdAt;
    private Instant completedAt;
}

@Data
@Builder
public class EncodeProgressDTO {
    private Integer totalTasks;
    private Integer completedTasks;
    private Integer failedTasks;
    private String currentPhase;
    private Double percentage;
}

@Data
@Builder
public class EncodeResultDTO {
    private Boolean hlsReady;
    private String masterPlaylistUrl;
    private List<QualityInfoDTO> qualities;
    private Long totalDuration;
    private Long totalOutputSize;
}

@Data
@Builder
public class QualityInfoDTO {
    private String name;
    private String playlistUrl;
    private Long bandwidth;
    private String resolution;
}

// ========================================
// INTERNAL: SEGMENT PLANNING
// ========================================

@Data
@Builder
public class SegmentPlan {
    private Integer segmentIndex;
    private Double startTime;
    private Double endTime;
    private Double duration;
    private Long estimatedSize;
}

@Data
@Builder
public class SegmentTask {
    private String taskId;
    private String jobId;
    private Integer segmentIndex;
    private String quality;
    private Double startTime;
    private Double duration;
    private FFmpegParams ffmpegParams;
    private String outputPath;
    private String status;
    private Integer attempts;
}

@Data
@Builder
public class FFmpegParams {
    private String inputUrl;
    private Double seekTime;
    private Double duration;
    private String videoCodec;
    private String videoPreset;
    private String videoBitrate;
    private Integer videoCrf;
    private String videoScale;
    private String audioCodec;
    private String audioBitrate;
    private Integer threads;
    private String outputFormat;
}
```

---

## 6. API Endpoints

### 6.1. Video Upload APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/video/upload/init` | Khởi tạo multipart upload |
| POST | `/api/video/upload/complete` | Hoàn thành upload |
| DELETE | `/api/video/upload/{uploadId}` | Hủy upload đang thực hiện |

### 6.2. Encode Job APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/encode/jobs` | Tạo encode job mới |
| GET | `/api/encode/jobs/{jobId}` | Lấy thông tin job |
| GET | `/api/encode/jobs/{jobId}/progress` | Lấy tiến độ job |
| DELETE | `/api/encode/jobs/{jobId}` | Hủy job |
| GET | `/api/encode/videos/{videoId}/jobs` | Danh sách jobs của video |

### 6.3. Streaming APIs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stream/{videoId}/info` | Thông tin stream |
| GET | `/api/stream/{videoId}/master.m3u8` | Master playlist (proxy) |
| GET | `/api/stream/{videoId}/{quality}.m3u8` | Variant playlist (proxy) |

---

## 7. Error Handling & Recovery

### 7.1. Error Categories

| Category | Description | Recovery Strategy |
|----------|-------------|-------------------|
| `UPLOAD_FAILED` | Upload không thành công | Retry từ part lỗi |
| `PROBE_FAILED` | FFprobe không đọc được | Check file validity |
| `SEGMENT_FAILED` | Encode segment thất bại | Retry segment đó |
| `UPLOAD_HLS_FAILED` | Upload HLS thất bại | Retry upload |
| `PRESIGNED_EXPIRED` | URL hết hạn | Generate new URL |

### 7.2. Retry Policy

```java
@Configuration
public class RetryConfig {
    public static final int MAX_SEGMENT_RETRIES = 3;
    public static final int MAX_UPLOAD_RETRIES = 3;
    public static final Duration RETRY_BACKOFF = Duration.ofSeconds(5);
    public static final Duration PRESIGNED_URL_EXPIRY = Duration.ofHours(2);
}
```

---

## 8. Phụ Lục

### 8.1. Quality Presets

| Preset | Resolution | Video Bitrate | Audio Bitrate | CRF |
|--------|------------|---------------|---------------|-----|
| original | Source | Source | 128k | 23 |
| 1080p | 1920×1080 | 5000k | 128k | 23 |
| 720p | 1280×720 | 2500k | 128k | 23 |
| 480p | 854×480 | 1000k | 96k | 25 |
| 360p | 640×360 | 600k | 64k | 27 |

### 8.2. FFmpeg Command Reference

```bash
# Probe video metadata
ffprobe -v quiet -print_format json -show_format -show_streams "{url}"

# Extract keyframes
ffprobe -v quiet -select_streams v:0 \
        -show_entries frame=pts_time,pict_type -of csv=p=0 "{url}" \
        | grep ",I" | cut -d',' -f1

# Encode segment
ffmpeg -ss {start} -t {duration} -i "{url}" \
       -c:v libx264 -preset medium -crf 23 \
       [-vf "scale=1280:720"] [-b:v 2500k] \
       -c:a aac -b:a 128k \
       -threads 2 -f mpegts "{output}.ts"
```

### 8.3. MinIO Bucket Structure

```
video-bucket/
├── originals/
│   └── {videoId}_{filename}        # Source videos
│
└── hls/
    └── {videoId}/
        ├── master.m3u8
        ├── original.m3u8
        ├── 720p.m3u8
        ├── original/
        │   ├── segment_000.ts
        │   ├── segment_001.ts
        │   └── ...
        └── 720p/
            ├── segment_000.ts
            ├── segment_001.ts
            └── ...
```

---

**Tài liệu này phục vụ cho dự án FileSharing - Media Review Platform**  
**Tác giả:** AI System Architect  
**Phiên bản:** 1.0  
**Ngày cập nhật:** 2026-04-02