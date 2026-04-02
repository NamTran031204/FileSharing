# 📊 BÁO CÁO KỸ THUẬT: WORKFLOW ENCODE VIDEO MP4/MOV SANG HLS

> **Dự án:** Media Review Platform - File Sharing System  
> **Kiến trúc:** Presigned URL + FFmpeg HTTP + mp4box.js Frontend Analysis  
> **Phạm vi:** MP4, MOV (ISO Base Media File Format)  
> **Ngày:** 2026-04-02

---

## MỤC LỤC

1. [Tổng Quan Workflow](#1-tổng-quan-workflow)
2. [Chi Tiết Từng Giai Đoạn](#2-chi-tiết-từng-giai-đoạn)
3. [Database Schema](#3-database-schema)
4. [DTO Specifications](#4-dto-specifications)
5. [API Endpoints](#5-api-endpoints)
6. [Luồng Dữ Liệu End-to-End](#6-luồng-dữ-liệu-end-to-end)

---

## 1. TỔNG QUAN WORKFLOW

### 1.1. Sơ Đồ Tổng Quát

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         VIDEO ENCODING WORKFLOW                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  GIAI ĐOẠN 1: UPLOAD & PARSE MOOV (Frontend)                                │
│  ────────────────────────────────────────────────────────────────────────    │
│  Client → Multipart Upload → MinIO                                           │
│  Client → mp4box.js parse moov → Extract metadata                            │
│  Client → POST /api/video/metadata → Save to MongoDB                         │
│                                                                               │
│  GIAI ĐOẠN 2: SUBMIT ENCODING JOB (Backend)                                 │
│  ────────────────────────────────────────────────────────────────────────    │
│  API → Create EncodingJob entity → MongoDB                                   │
│  API → Generate presigned URL → Return to client                             │
│                                                                               │
│  GIAI ĐOẠN 3: VIDEO ANALYSIS (Backend Worker)                               │
│  ────────────────────────────────────────────────────────────────────────    │
│  Worker → FFprobe từ presigned URL → Extract full metadata                   │
│  Worker → Detect keyframes, duration, bitrate                                │
│  Worker → Update job status → ANALYZED                                       │
│                                                                               │
│  GIAI ĐOẠN 4: SEGMENT PLANNING (Backend Worker)                             │
│  ────────────────────────────────────────────────────────────────────────    │
│  Worker → Calculate segment boundaries based on keyframes                     │
│  Worker → Create SegmentPlan list → Save to job                              │
│  Worker → Update job status → SEGMENTING                                     │
│                                                                               │
│  GIAI ĐOẠN 5: PARALLEL ENCODING (Backend Thread Pool)                       │
│  ────────────────────────────────────────────────────────────────────────    │
│  Thread Pool → Process segments in parallel                                  │
│  FFmpeg → Read from presigned URL with HTTP Range                            │
│  FFmpeg → Encode to HLS variants (original + 720p)                           │
│  Worker → Save .ts segments to local temp                                    │
│                                                                               │
│  GIAI ĐOẠN 6: MANIFEST GENERATION (Backend Worker)                          │
│  ────────────────────────────────────────────────────────────────────────    │
│  Worker → Generate variant playlists (.m3u8)                                 │
│  Worker → Generate master playlist                                           │
│  Worker → Update job status → GENERATING_MANIFEST                            │
│                                                                               │
│  GIAI ĐOẠN 7: UPLOAD HLS TO MINIO (Backend Worker)                          │
│  ────────────────────────────────────────────────────────────────────────    │
│  Worker → Upload all .ts segments to MinIO                                   │
│  Worker → Upload all .m3u8 manifests                                         │
│  Worker → Update VideoMetadata with HLS URLs                                 │
│  Worker → Update job status → COMPLETED                                      │
│                                                                               │
│  GIAI ĐOẠN 8: CLEANUP & NOTIFICATION (Backend Worker)                       │
│  ────────────────────────────────────────────────────────────────────────    │
│  Worker → Delete local temp files                                            │
│  Worker → Emit JobCompletedEvent                                             │
│  Optional → Delete original MP4 if configured                                │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. CHI TIẾT TỪNG GIAI ĐOẠN

### GIAI ĐOẠN 1: UPLOAD & PARSE MOOV (Frontend)

#### Mục đích
Upload file MP4/MOV lên MinIO và phân tích metadata bằng mp4box.js ngay tại frontend để lưu thông tin cấu trúc file vào database.

#### Input

| Tên | Kiểu dữ liệu | Mô tả | Nguồn |
|-----|--------------|-------|-------|
| `file` | `File` (JavaScript) | File MP4/MOV do user chọn | Browser File Input |
| `userId` | `string` | ID người upload | JWT Token |
| `fileName` | `string` | Tên file gốc | `file.name` |
| `fileSize` | `number` | Kích thước file (bytes) | `file.size` |
| `mimeType` | `string` | MIME type | `file.type` |

#### Process Flow (Frontend)

```typescript
// BƯỚC 1.1: Parse file bằng mp4box.js
const mp4boxFile = MP4Box.createFile();
const arrayBuffer = await file.arrayBuffer();
arrayBuffer.fileStart = 0;

mp4boxFile.onReady = (info) => {
  // info chứa toàn bộ metadata từ moov atom
  const moovMetadata = {
    duration: info.duration,
    timescale: info.timescale,
    videoTracks: info.videoTracks.map(track => ({
      id: track.id,
      codec: track.codec,
      width: track.video.width,
      height: track.video.height,
      fps: track.nb_samples / (info.duration / info.timescale)
    })),
    audioTracks: info.audioTracks.map(track => ({
      id: track.id,
      codec: track.codec,
      sampleRate: track.audio.sample_rate,
      channels: track.audio.channel_count
    })),
    brands: info.brands,
    created: info.created,
    modified: info.modified
  };
  
  // BƯỚC 1.2: Initiate multipart upload
  const uploadInitResponse = await fetch('/api/upload/initiate', {
    method: 'POST',
    body: JSON.stringify({
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      moovMetadata: moovMetadata
    })
  });
  
  const { uploadId, partUrls, fileId } = await uploadInitResponse.json();
  
  // BƯỚC 1.3: Upload chunks với presigned URLs
  await uploadChunks(file, partUrls);
  
  // BƯỚC 1.4: Complete upload
  await fetch('/api/upload/complete', {
    method: 'POST',
    body: JSON.stringify({ uploadId, fileId })
  });
  
  // BƯỚC 1.5: Submit video metadata
  await fetch('/api/video/metadata', {
    method: 'POST',
    body: JSON.stringify({
      fileId: fileId,
      moovMetadata: moovMetadata
    })
  });
};

mp4boxFile.appendBuffer(arrayBuffer);
mp4boxFile.flush();
```

#### Output

| Tên | Kiểu dữ liệu | Mô tả | Lưu trữ |
|-----|--------------|-------|---------|
| `fileId` | `string` (UUID) | ID duy nhất của file | MongoDB `metadata.fileId` |
| `objectName` | `string` | Tên object trong MinIO | MongoDB `metadata.objectName` |
| `uploadId` | `string` | S3 Multipart Upload ID | MongoDB `metadata.uploadId` |
| `moovMetadata` | `MoovMetadata` (JSON) | Metadata từ moov atom | MongoDB `videoMetadata.moovInfo` |

#### Luồng Dữ Liệu

```
┌─────────┐     ┌──────────┐     ┌────────┐     ┌─────────┐
│ Browser │ ──► │ mp4box.js│ ──► │  API   │ ──► │ MongoDB │
│  File   │     │  Parser  │     │ Server │     │         │
└─────────┘     └──────────┘     └────────┘     └─────────┘
    │               │                 │               │
    │ File bytes    │ moovMetadata   │ VideoMetadata │
    │               │                 │               │
    └──────────────►└────────────────►└──────────────►
```

---

### GIAI ĐOẠN 2: SUBMIT ENCODING JOB (Backend)

#### Mục đích
Tạo một encoding job trong database để track quá trình encode video sang HLS.

#### Input

| Tên | Kiểu dữ liệu | Mô tả | Nguồn |
|-----|--------------|-------|-------|
| `fileId` | `string` | ID của file cần encode | Request body |
| `userId` | `string` | ID người yêu cầu encode | JWT Token |
| `encodingPresets` | `List<String>` | Danh sách preset cần encode | Request body (default: ["original", "720p"]) |
| `segmentDuration` | `Integer` | Độ dài mỗi segment (giây) | Request body (default: 10) |

#### Process Flow (Backend)

```java
@PostMapping("/api/video/encode")
public ResponseEntity<EncodingJobResponse> submitEncodingJob(
    @RequestBody EncodingJobRequest request
) {
    // BƯỚC 2.1: Validate file exists
    MetadataEntity metadata = metadataRepository.findById(request.getFileId())
        .orElseThrow(() -> new NotFoundException("File not found"));
    
    // BƯỚC 2.2: Check if file is video
    if (!metadata.getMimeType().startsWith("video/")) {
        throw new BadRequestException("File is not a video");
    }
    
    // BƯỚC 2.3: Create encoding job
    EncodingJobEntity job = new EncodingJobEntity();
    job.setJobId(UUID.randomUUID().toString());
    job.setFileId(request.getFileId());
    job.setUserId(getCurrentUserId());
    job.setObjectName(metadata.getObjectName());
    job.setStatus(EncodingStatus.PENDING);
    job.setEncodingPresets(request.getEncodingPresets());
    job.setSegmentDuration(request.getSegmentDuration());
    job.setCreatedAt(Instant.now());
    
    encodingJobRepository.save(job);
    
    // BƯỚC 2.4: Generate presigned URL (7 days expiry for long encoding)
    String presignedUrl = minioService.getPresignedUrl(
        metadata.getObjectName(),
        7 * 24 * 3600  // 7 days
    );
    
    // BƯỚC 2.5: Trigger async processing
    encodingJobOrchestrator.submitJob(job.getJobId(), presignedUrl);
    
    // BƯỚC 2.6: Return response
    return ResponseEntity.ok(new EncodingJobResponse(
        job.getJobId(),
        job.getStatus(),
        presignedUrl
    ));
}
```

#### Output

| Tên | Kiểu dữ liệu | Mô tả | Lưu trữ |
|-----|--------------|-------|---------|
| `jobId` | `string` (UUID) | ID của encoding job | MongoDB `encodingJobs.jobId` |
| `status` | `EncodingStatus` enum | Trạng thái job | MongoDB `encodingJobs.status` |
| `presignedUrl` | `string` | URL để FFmpeg đọc video | Response only (không lưu DB) |

#### Data Transfer Object

```java
// Request DTO
public class EncodingJobRequest {
    @NotBlank
    private String fileId;
    
    private List<String> encodingPresets = List.of("original", "720p");
    
    @Min(5)
    @Max(60)
    private Integer segmentDuration = 10;  // seconds
}

// Response DTO
public class EncodingJobResponse {
    private String jobId;
    private EncodingStatus status;
    private String presignedUrl;
    private Instant createdAt;
}
```

---

### GIAI ĐOẠN 3: VIDEO ANALYSIS (Backend Worker)

#### Mục đích
Sử dụng FFprobe để phân tích chi tiết video và extract các thông tin cần thiết cho việc segment.

#### Input

| Tên | Kiểu dữ liệu | Mô tả | Nguồn |
|-----|--------------|-------|-------|
| `jobId` | `string` | ID của encoding job | Job Queue |
| `presignedUrl` | `string` | URL để FFprobe đọc video | Job entity |

#### Process Flow (Backend Worker)

```java
public void analyzeVideo(String jobId, String presignedUrl) {
    // BƯỚC 3.1: Update job status
    updateJobStatus(jobId, EncodingStatus.ANALYZING);
    
    // BƯỚC 3.2: Run FFprobe
    String[] command = {
        "ffprobe",
        "-v", "error",
        "-show_format",
        "-show_streams",
        "-select_streams", "v:0",  // video stream only
        "-print_format", "json",
        presignedUrl
    };
    
    ProcessResult result = executeCommand(command);
    
    // BƯỚC 3.3: Parse JSON output
    FFprobeOutput ffprobeData = objectMapper.readValue(
        result.getStdout(),
        FFprobeOutput.class
    );
    
    // BƯỚC 3.4: Extract keyframe positions
    String[] keyframeCommand = {
        "ffprobe",
        "-v", "error",
        "-select_streams", "v:0",
        "-show_entries", "packet=pts_time,flags",
        "-of", "csv=print_section=0",
        presignedUrl
    };
    
    ProcessResult keyframeResult = executeCommand(keyframeCommand);
    List<Double> keyframes = parseKeyframes(keyframeResult.getStdout());
    
    // BƯỚC 3.5: Build VideoAnalysisResult
    VideoAnalysisResult analysis = VideoAnalysisResult.builder()
        .duration(ffprobeData.getFormat().getDuration())
        .bitrate(ffprobeData.getFormat().getBitRate())
        .width(ffprobeData.getStreams().get(0).getWidth())
        .height(ffprobeData.getStreams().get(0).getHeight())
        .codec(ffprobeData.getStreams().get(0).getCodecName())
        .fps(parseFrameRate(ffprobeData.getStreams().get(0).getAvgFrameRate()))
        .keyframes(keyframes)
        .hasAudio(hasAudioStream(ffprobeData))
        .audioCodec(extractAudioCodec(ffprobeData))
        .build();
    
    // BƯỚC 3.6: Save to job
    EncodingJobEntity job = encodingJobRepository.findById(jobId).orElseThrow();
    job.setVideoAnalysis(analysis);
    job.setStatus(EncodingStatus.ANALYZED);
    job.setUpdatedAt(Instant.now());
    encodingJobRepository.save(job);
}
```

#### Output

| Tên | Kiểu dữ liệu | Mô tả | Lưu trữ |
|-----|--------------|-------|---------|
| `duration` | `Double` | Độ dài video (giây) | `encodingJobs.videoAnalysis.duration` |
| `bitrate` | `Long` | Bitrate (bits/s) | `encodingJobs.videoAnalysis.bitrate` |
| `width` | `Integer` | Độ rộng video (pixels) | `encodingJobs.videoAnalysis.width` |
| `height` | `Integer` | Độ cao video (pixels) | `encodingJobs.videoAnalysis.height` |
| `codec` | `String` | Video codec (h264, hevc, ...) | `encodingJobs.videoAnalysis.codec` |
| `fps` | `Double` | Frame rate (frames/s) | `encodingJobs.videoAnalysis.fps` |
| `keyframes` | `List<Double>` | Vị trí các keyframe (seconds) | `encodingJobs.videoAnalysis.keyframes` |
| `hasAudio` | `Boolean` | Có audio track không | `encodingJobs.videoAnalysis.hasAudio` |
| `audioCodec` | `String` | Audio codec (aac, mp3, ...) | `encodingJobs.videoAnalysis.audioCodec` |

---

### GIAI ĐOẠN 4: SEGMENT PLANNING (Backend Worker)

#### Mục đích
Tính toán các segment boundaries dựa trên keyframes để đảm bảo mỗi segment bắt đầu tại keyframe.

#### Input

| Tên | Kiểu dữ liệu | Mô tả | Nguồn |
|-----|--------------|-------|-------|
| `jobId` | `string` | ID của encoding job | Previous step |
| `videoAnalysis` | `VideoAnalysisResult` | Kết quả phân tích video | `encodingJobs.videoAnalysis` |
| `segmentDuration` | `Integer` | Target segment duration (seconds) | `encodingJobs.segmentDuration` |

#### Process Flow

```java
public void planSegments(String jobId) {
    // BƯỚC 4.1: Load job data
    EncodingJobEntity job = encodingJobRepository.findById(jobId).orElseThrow();
    updateJobStatus(jobId, EncodingStatus.PLANNING_SEGMENTS);
    
    VideoAnalysisResult analysis = job.getVideoAnalysis();
    Integer targetDuration = job.getSegmentDuration();
    
    // BƯỚC 4.2: Calculate segment boundaries
    List<SegmentPlan> segments = new ArrayList<>();
    List<Double> keyframes = analysis.getKeyframes();
    double totalDuration = analysis.getDuration();
    
    int segmentIndex = 0;
    double currentTime = 0.0;
    
    while (currentTime < totalDuration) {
        // Tìm keyframe gần nhất với currentTime + targetDuration
        double targetTime = currentTime + targetDuration;
        double nextKeyframe = findNearestKeyframe(keyframes, targetTime);
        
        // Nếu không có keyframe nào phía sau, dùng end của video
        if (nextKeyframe == -1 || nextKeyframe > totalDuration) {
            nextKeyframe = totalDuration;
        }
        
        SegmentPlan segment = SegmentPlan.builder()
            .segmentIndex(segmentIndex)
            .startTime(currentTime)
            .endTime(nextKeyframe)
            .duration(nextKeyframe - currentTime)
            .startsAtKeyframe(true)
            .build();
        
        segments.add(segment);
        currentTime = nextKeyframe;
        segmentIndex++;
    }
    
    // BƯỚC 4.3: Save segment plan
    job.setSegmentPlan(segments);
    job.setTotalSegments(segments.size());
    job.setStatus(EncodingStatus.SEGMENTING);
    job.setUpdatedAt(Instant.now());
    encodingJobRepository.save(job);
}

private double findNearestKeyframe(List<Double> keyframes, double target) {
    return keyframes.stream()
        .filter(kf -> kf >= target)
        .min(Double::compareTo)
        .orElse(-1.0);
}
```

#### Output

| Tên | Kiểu dữ liệu | Mô tả | Lưu trữ |
|-----|--------------|-------|---------|
| `segmentPlan` | `List<SegmentPlan>` | Danh sách tất cả segments | `encodingJobs.segmentPlan[]` |
| `totalSegments` | `Integer` | Tổng số segments | `encodingJobs.totalSegments` |

#### SegmentPlan Structure

```java
public class SegmentPlan {
    private Integer segmentIndex;      // 0, 1, 2, ...
    private Double startTime;          // seconds
    private Double endTime;            // seconds
    private Double duration;           // endTime - startTime
    private Boolean startsAtKeyframe;  // always true for HLS
    private String status;             // PENDING, ENCODING, COMPLETED, FAILED
    
    // Transient - chỉ dùng trong quá trình encode
    @Transient
    private Map<String, String> outputPaths;  // {"original": "/tmp/seg_000.ts", "720p": "/tmp/720p/seg_000.ts"}
}
```

---

### GIAI ĐOẠN 5: PARALLEL ENCODING (Backend Thread Pool)

#### Mục đích
Encode tất cả segments song song sử dụng thread pool, mỗi segment được encode thành nhiều variants (original, 720p).

#### Input

| Tên | Kiểu dữ liệu | Mô tả | Nguồn |
|-----|--------------|-------|-------|
| `jobId` | `string` | ID của encoding job | Previous step |
| `presignedUrl` | `string` | URL để FFmpeg đọc video | Job entity |
| `segmentPlan` | `List<SegmentPlan>` | Danh sách segments | `encodingJobs.segmentPlan` |
| `encodingPresets` | `List<String>` | Danh sách variants cần encode | `encodingJobs.encodingPresets` |

#### Process Flow

```java
public void encodeSegments(String jobId, String presignedUrl) {
    // BƯỚC 5.1: Load job
    EncodingJobEntity job = encodingJobRepository.findById(jobId).orElseThrow();
    updateJobStatus(jobId, EncodingStatus.ENCODING);
    
    List<SegmentPlan> segments = job.getSegmentPlan();
    List<String> presets = job.getEncodingPresets();
    
    // BƯỚC 5.2: Create temp output directory
    Path tempDir = Files.createTempDirectory("encoding_" + jobId);
    
    // BƯỚC 5.3: Create thread pool
    int threadCount = Math.min(
        Runtime.getRuntime().availableProcessors() - 2,
        MAX_CONCURRENT_ENCODES
    );
    ExecutorService executor = Executors.newFixedThreadPool(threadCount);
    
    // BƯỚC 5.4: Submit encoding tasks
    List<CompletableFuture<Void>> futures = new ArrayList<>();
    
    for (SegmentPlan segment : segments) {
        CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
            try {
                encodeSegment(
                    jobId,
                    segment,
                    presignedUrl,
                    presets,
                    tempDir
                );
            } catch (Exception e) {
                handleEncodingError(jobId, segment, e);
            }
        }, executor);
        
        futures.add(future);
    }
    
    // BƯỚC 5.5: Wait for all encoding tasks
    CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
        .join();
    
    executor.shutdown();
    
    // BƯỚC 5.6: Update job
    job.setStatus(EncodingStatus.ENCODED);
    job.setTempOutputDir(tempDir.toString());
    job.setUpdatedAt(Instant.now());
    encodingJobRepository.save(job);
}

private void encodeSegment(
    String jobId,
    SegmentPlan segment,
    String presignedUrl,
    List<String> presets,
    Path tempDir
) {
    for (String preset : presets) {
        // BƯỚC 5.7: Build FFmpeg command
        EncodingConfig config = getEncodingConfig(preset);
        
        Path outputPath = tempDir.resolve(preset)
            .resolve(String.format("segment_%03d.ts", segment.getSegmentIndex()));
        
        Files.createDirectories(outputPath.getParent());
        
        String[] command = {
            "ffmpeg",
            "-ss", String.valueOf(segment.getStartTime()),
            "-t", String.valueOf(segment.getDuration()),
            "-i", presignedUrl,
            "-vf", String.format("scale=%s", config.getScale()),
            "-c:v", "libx264",
            "-preset", config.getPreset(),
            "-crf", String.valueOf(config.getCrf()),
            "-b:v", config.getVideoBitrate(),
            "-c:a", "aac",
            "-b:a", config.getAudioBitrate(),
            "-threads", "2",
            "-f", "mpegts",
            outputPath.toString()
        };
        
        // BƯỚC 5.8: Execute FFmpeg
        ProcessResult result = executeCommand(command);
        
        if (result.getExitCode() != 0) {
            throw new EncodingException(
                "FFmpeg failed: " + result.getStderr()
            );
        }
        
        // BƯỚC 5.9: Update segment status
        segment.setStatus("COMPLETED");
        if (segment.getOutputPaths() == null) {
            segment.setOutputPaths(new HashMap<>());
        }
        segment.getOutputPaths().put(preset, outputPath.toString());
    }
    
    // BƯỚC 5.10: Update progress
    updateEncodingProgress(jobId, segment.getSegmentIndex());
}
```

#### Encoding Configuration

```java
@Data
public class EncodingConfig {
    private String preset;          // "original", "720p", "480p"
    private String scale;           // "-1:720" (maintain aspect ratio)
    private String ffmpegPreset;    // "medium", "fast", "slow"
    private Integer crf;            // 23 (quality, 0-51)
    private String videoBitrate;    // "2500k"
    private String audioBitrate;    // "128k"
}

private EncodingConfig getEncodingConfig(String preset) {
    switch (preset) {
        case "original":
            return EncodingConfig.builder()
                .preset("original")
                .scale("-2:-2")  // no scaling
                .ffmpegPreset("medium")
                .crf(23)
                .videoBitrate("8000k")
                .audioBitrate("192k")
                .build();
        
        case "720p":
            return EncodingConfig.builder()
                .preset("720p")
                .scale("-2:720")  // height=720, auto width (divisible by 2)
                .ffmpegPreset("medium")
                .crf(23)
                .videoBitrate("2500k")
                .audioBitrate("128k")
                .build();
        
        case "480p":
            return EncodingConfig.builder()
                .preset("480p")
                .scale("-2:480")
                .ffmpegPreset("fast")
                .crf(25)
                .videoBitrate("1000k")
                .audioBitrate("96k")
                .build();
        
        default:
            throw new IllegalArgumentException("Unknown preset: " + preset);
    }
}
```

#### Output

| Tên | Kiểu dữ liệu | Mô tả | Lưu trữ |
|-----|--------------|-------|---------|
| `tempOutputDir` | `string` (Path) | Thư mục chứa tất cả segments | `encodingJobs.tempOutputDir` |
| `encodedSegments` | `Map<String, List<String>>` | Mapping preset → segment paths | Transient (local disk) |

**Cấu trúc thư mục output:**
```
/tmp/encoding_{jobId}/
├── original/
│   ├── segment_000.ts
│   ├── segment_001.ts
│   └── segment_002.ts
└── 720p/
    ├── segment_000.ts
    ├── segment_001.ts
    └── segment_002.ts
```

---

### GIAI ĐOẠN 6: MANIFEST GENERATION (Backend Worker)

#### Mục đích
Tạo HLS manifest files (.m3u8) cho từng variant và master playlist.

#### Input

| Tên | Kiểu dữ liệu | Mô tả | Nguồn |
|-----|--------------|-------|-------|
| `jobId` | `string` | ID của encoding job | Previous step |
| `segmentPlan` | `List<SegmentPlan>` | Segment metadata | `encodingJobs.segmentPlan` |
| `encodingPresets` | `List<String>` | Danh sách variants | `encodingJobs.encodingPresets` |
| `tempOutputDir` | `string` | Thư mục chứa segments | `encodingJobs.tempOutputDir` |

#### Process Flow

```java
public void generateManifests(String jobId) {
    // BƯỚC 6.1: Load job data
    EncodingJobEntity job = encodingJobRepository.findById(jobId).orElseThrow();
    updateJobStatus(jobId, EncodingStatus.GENERATING_MANIFEST);
    
    Path tempDir = Paths.get(job.getTempOutputDir());
    List<SegmentPlan> segments = job.getSegmentPlan();
    
    Map<String, String> variantPlaylists = new HashMap<>();
    
    // BƯỚC 6.2: Generate variant playlists
    for (String preset : job.getEncodingPresets()) {
        String playlistContent = generateVariantPlaylist(preset, segments);
        
        Path playlistPath = tempDir.resolve(preset + ".m3u8");
        Files.writeString(playlistPath, playlistContent);
        
        variantPlaylists.put(preset, playlistPath.toString());
    }
    
    // BƯỚC 6.3: Generate master playlist
    String masterContent = generateMasterPlaylist(
        job.getEncodingPresets(),
        job.getVideoAnalysis()
    );
    
    Path masterPath = tempDir.resolve("master.m3u8");
    Files.writeString(masterPath, masterContent);
    
    // BƯỚC 6.4: Update job
    job.setVariantPlaylists(variantPlaylists);
    job.setMasterPlaylist(masterPath.toString());
    job.setStatus(EncodingStatus.MANIFEST_GENERATED);
    job.setUpdatedAt(Instant.now());
    encodingJobRepository.save(job);
}

private String generateVariantPlaylist(
    String preset,
    List<SegmentPlan> segments
) {
    StringBuilder m3u8 = new StringBuilder();
    
    // Header
    m3u8.append("#EXTM3U\n");
    m3u8.append("#EXT-X-VERSION:3\n");
    
    // Target duration (max segment duration + 1)
    double maxDuration = segments.stream()
        .mapToDouble(SegmentPlan::getDuration)
        .max()
        .orElse(10.0);
    m3u8.append("#EXT-X-TARGETDURATION:")
        .append((int) Math.ceil(maxDuration))
        .append("\n");
    
    m3u8.append("#EXT-X-MEDIA-SEQUENCE:0\n");
    
    // Segments
    for (SegmentPlan segment : segments) {
        m3u8.append("#EXTINF:")
            .append(String.format("%.3f", segment.getDuration()))
            .append(",\n");
        m3u8.append(preset)
            .append("/segment_")
            .append(String.format("%03d", segment.getSegmentIndex()))
            .append(".ts\n");
    }
    
    // End marker
    m3u8.append("#EXT-X-ENDLIST\n");
    
    return m3u8.toString();
}

private String generateMasterPlaylist(
    List<String> presets,
    VideoAnalysisResult analysis
) {
    StringBuilder m3u8 = new StringBuilder();
    
    m3u8.append("#EXTM3U\n");
    m3u8.append("#EXT-X-VERSION:3\n\n");
    
    for (String preset : presets) {
        EncodingConfig config = getEncodingConfig(preset);
        
        // Calculate bandwidth (bitrate + overhead)
        int bandwidth = parseBandwidth(config.getVideoBitrate()) +
                       parseBandwidth(config.getAudioBitrate());
        
        // Calculate resolution
        String resolution = calculateResolution(
            preset,
            analysis.getWidth(),
            analysis.getHeight()
        );
        
        m3u8.append("#EXT-X-STREAM-INF:")
            .append("BANDWIDTH=").append(bandwidth)
            .append(",RESOLUTION=").append(resolution)
            .append("\n");
        m3u8.append(preset).append(".m3u8\n\n");
    }
    
    return m3u8.toString();
}
```

#### Output

| Tên | Kiểu dữ liệu | Mô tả | Lưu trữ |
|-----|--------------|-------|---------|
| `variantPlaylists` | `Map<String, String>` | Mapping preset → playlist path | `encodingJobs.variantPlaylists` |
| `masterPlaylist` | `string` | Path to master.m3u8 | `encodingJobs.masterPlaylist` |

**Ví dụ Master Playlist (master.m3u8):**
```m3u8
#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=8192000,RESOLUTION=1920x1080
original.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=2628000,RESOLUTION=1280x720
720p.m3u8
```

**Ví dụ Variant Playlist (720p.m3u8):**
```m3u8
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:11
#EXT-X-MEDIA-SEQUENCE:0
#EXTINF:9.800,
720p/segment_000.ts
#EXTINF:9.900,
720p/segment_001.ts
#EXTINF:10.100,
720p/segment_002.ts
#EXT-X-ENDLIST
```

---

### GIAI ĐOẠN 7: UPLOAD HLS TO MINIO (Backend Worker)

#### Mục đích
Upload tất cả HLS files (segments + manifests) lên MinIO và cập nhật metadata.

#### Input

| Tên | Kiểu dữ liệu | Mô tả | Nguồn |
|-----|--------------|-------|-------|
| `jobId` | `string` | ID của encoding job | Previous step |
| `tempOutputDir` | `string` | Thư mục chứa HLS files | `encodingJobs.tempOutputDir` |
| `fileId` | `string` | ID của video gốc | `encodingJobs.fileId` |

#### Process Flow

```java
public void uploadHLSToMinio(String jobId) {
    // BƯỚC 7.1: Load job
    EncodingJobEntity job = encodingJobRepository.findById(jobId).orElseThrow();
    updateJobStatus(jobId, EncodingStatus.UPLOADING_HLS);
    
    Path tempDir = Paths.get(job.getTempOutputDir());
    String hlsBasePath = "hls/" + job.getFileId();
    
    // BƯỚC 7.2: Create thread pool for parallel upload
    ExecutorService uploadExecutor = Executors.newFixedThreadPool(10);
    List<CompletableFuture<Void>> uploadFutures = new ArrayList<>();
    
    // BƯỚC 7.3: Upload manifests
    uploadFutures.add(CompletableFuture.runAsync(() -> {
        uploadFile(
            tempDir.resolve("master.m3u8"),
            hlsBasePath + "/master.m3u8",
            "application/vnd.apple.mpegurl"
        );
    }, uploadExecutor));
    
    for (String preset : job.getEncodingPresets()) {
        String playlistPath = preset + ".m3u8";
        uploadFutures.add(CompletableFuture.runAsync(() -> {
            uploadFile(
                tempDir.resolve(playlistPath),
                hlsBasePath + "/" + playlistPath,
                "application/vnd.apple.mpegurl"
            );
        }, uploadExecutor));
    }
    
    // BƯỚC 7.4: Upload segments
    for (String preset : job.getEncodingPresets()) {
        Path presetDir = tempDir.resolve(preset);
        
        try (Stream<Path> files = Files.list(presetDir)) {
            files.filter(f -> f.toString().endsWith(".ts"))
                .forEach(segmentFile -> {
                    uploadFutures.add(CompletableFuture.runAsync(() -> {
                        String objectPath = hlsBasePath + "/" + preset + "/" + segmentFile.getFileName();
                        uploadFile(segmentFile, objectPath, "video/mp2t");
                    }, uploadExecutor));
                });
        }
    }
    
    // BƯỚC 7.5: Wait for all uploads
    CompletableFuture.allOf(uploadFutures.toArray(new CompletableFuture[0]))
        .join();
    
    uploadExecutor.shutdown();
    
    // BƯỚC 7.6: Generate streaming URLs
    String masterUrl = minioService.getPublicUrl(hlsBasePath + "/master.m3u8");
    
    Map<String, String> variantUrls = new HashMap<>();
    for (String preset : job.getEncodingPresets()) {
        variantUrls.put(
            preset,
            minioService.getPublicUrl(hlsBasePath + "/" + preset + ".m3u8")
        );
    }
    
    // BƯỚC 7.7: Update VideoMetadata
    VideoMetadataEntity videoMetadata = videoMetadataRepository
        .findByFileId(job.getFileId())
        .orElseThrow();
    
    HLSMetadata hlsMetadata = HLSMetadata.builder()
        .masterPlaylistUrl(masterUrl)
        .variantUrls(variantUrls)
        .hlsVersion(3)
        .segmentCount(job.getTotalSegments())
        .targetDuration(job.getSegmentDuration())
        .encodedAt(Instant.now())
        .build();
    
    videoMetadata.setHlsMetadata(hlsMetadata);
    videoMetadata.setHasHLS(true);
    videoMetadataRepository.save(videoMetadata);
    
    // BƯỚC 7.8: Update job
    job.setHlsMasterUrl(masterUrl);
    job.setHlsVariantUrls(variantUrls);
    job.setStatus(EncodingStatus.UPLOADING_HLS_COMPLETED);
    job.setUpdatedAt(Instant.now());
    encodingJobRepository.save(job);
}

private void uploadFile(Path localFile, String objectPath, String contentType) {
    try (InputStream inputStream = Files.newInputStream(localFile)) {
        minioClient.putObject(
            PutObjectArgs.builder()
                .bucket("videos-hls")
                .object(objectPath)
                .stream(inputStream, Files.size(localFile), -1)
                .contentType(contentType)
                .build()
        );
    } catch (Exception e) {
        throw new UploadException("Failed to upload " + objectPath, e);
    }
}
```

#### Output

| Tên | Kiểu dữ liệu | Mô tả | Lưu trữ |
|-----|--------------|-------|---------|
| `hlsMasterUrl` | `string` | URL của master.m3u8 | `videoMetadata.hlsMetadata.masterPlaylistUrl` |
| `hlsVariantUrls` | `Map<String, String>` | URLs của variant playlists | `videoMetadata.hlsMetadata.variantUrls` |
| `hasHLS` | `Boolean` | Flag cho biết video đã có HLS | `videoMetadata.hasHLS` |

**MinIO Structure:**
```
videos-hls/
└── hls/
    └── {fileId}/
        ├── master.m3u8
        ├── original.m3u8
        ├── 720p.m3u8
        ├── original/
        │   ├── segment_000.ts
        │   ├── segment_001.ts
        │   └── segment_002.ts
        └── 720p/
            ├── segment_000.ts
            ├── segment_001.ts
            └── segment_002.ts
```

---

### GIAI ĐOẠN 8: CLEANUP & NOTIFICATION (Backend Worker)

#### Mục đích
Dọn dẹp tài nguyên tạm và thông báo hoàn thành job.

#### Input

| Tên | Kiểu dữ liệu | Mô tả | Nguồn |
|-----|--------------|-------|-------|
| `jobId` | `string` | ID của encoding job | Previous step |
| `tempOutputDir` | `string` | Thư mục cần xóa | `encodingJobs.tempOutputDir` |

#### Process Flow

```java
public void cleanupAndNotify(String jobId) {
    EncodingJobEntity job = encodingJobRepository.findById(jobId).orElseThrow();
    
    try {
        // BƯỚC 8.1: Delete temp directory
        Path tempDir = Paths.get(job.getTempOutputDir());
        if (Files.exists(tempDir)) {
            FileUtils.deleteDirectory(tempDir.toFile());
        }
        
        // BƯỚC 8.2: Update job status
        job.setStatus(EncodingStatus.COMPLETED);
        job.setCompletedAt(Instant.now());
        job.setTempOutputDir(null);
        encodingJobRepository.save(job);
        
        // BƯỚC 8.3: Emit completion event
        JobCompletedEvent event = JobCompletedEvent.builder()
            .jobId(jobId)
            .fileId(job.getFileId())
            .userId(job.getUserId())
            .hlsMasterUrl(job.getHlsMasterUrl())
            .completedAt(Instant.now())
            .build();
        
        applicationEventPublisher.publishEvent(event);
        
        // BƯỚC 8.4: Optional - Delete original file if configured
        if (deleteOriginalAfterEncode) {
            minioService.deleteObject(job.getObjectName());
            
            MetadataEntity metadata = metadataRepository.findById(job.getFileId()).orElseThrow();
            metadata.setIsActive(false);
            metadata.setReplacedByHLS(true);
            metadataRepository.save(metadata);
        }
        
    } catch (Exception e) {
        job.setStatus(EncodingStatus.CLEANUP_FAILED);
        job.setErrorMessage(e.getMessage());
        encodingJobRepository.save(job);
        throw e;
    }
}
```

#### Output

| Tên | Kiểu dữ liệu | Mô tả | Destination |
|-----|--------------|-------|-------------|
| `JobCompletedEvent` | Event object | Thông báo job hoàn thành | Event Bus |
| `status` | `EncodingStatus.COMPLETED` | Final status | `encodingJobs.status` |
| `completedAt` | `Instant` | Thời gian hoàn thành | `encodingJobs.completedAt` |

---

## 3. DATABASE SCHEMA

### 3.1. Collection: `videoMetadata`

Lưu metadata của video gốc và thông tin HLS.

```javascript
{
  "_id": ObjectId("..."),
  "fileId": "uuid-string",  // Liên kết với metadata.fileId
  
  // MOOV Metadata (từ mp4box.js)
  "moovInfo": {
    "duration": 3600.0,      // seconds
    "timescale": 1000,       // ticks per second
    "videoTracks": [
      {
        "id": 1,
        "codec": "avc1.64001f",
        "width": 1920,
        "height": 1080,
        "fps": 30.0
      }
    ],
    "audioTracks": [
      {
        "id": 2,
        "codec": "mp4a.40.2",
        "sampleRate": 48000,
        "channels": 2
      }
    ],
    "brands": ["isom", "iso2", "avc1", "mp41"],
    "created": ISODate("2026-01-01T00:00:00Z"),
    "modified": ISODate("2026-01-15T10:30:00Z")
  },
  
  // HLS Metadata (sau khi encode)
  "hasHLS": true,
  "hlsMetadata": {
    "masterPlaylistUrl": "https://minio.server/videos-hls/hls/{fileId}/master.m3u8",
    "variantUrls": {
      "original": "https://minio.server/videos-hls/hls/{fileId}/original.m3u8",
      "720p": "https://minio.server/videos-hls/hls/{fileId}/720p.m3u8"
    },
    "hlsVersion": 3,
    "segmentCount": 360,
    "targetDuration": 10,
    "encodedAt": ISODate("2026-04-02T05:00:00Z")
  },
  
  "createdAt": ISODate("2026-04-02T04:00:00Z"),
  "updatedAt": ISODate("2026-04-02T05:00:00Z")
}
```

**Indexes:**
```javascript
db.videoMetadata.createIndex({ "fileId": 1 }, { unique: true });
db.videoMetadata.createIndex({ "hasHLS": 1 });
db.videoMetadata.createIndex({ "createdAt": -1 });
```

---

### 3.2. Collection: `encodingJobs`

Lưu thông tin về encoding jobs.

```javascript
{
  "_id": ObjectId("..."),
  "jobId": "uuid-string",
  "fileId": "uuid-string",     // Reference to metadata
  "userId": "user-id",
  "objectName": "uuid_filename.mp4",
  
  "status": "COMPLETED",  // PENDING, ANALYZING, ANALYZED, PLANNING_SEGMENTS, 
                          // SEGMENTING, ENCODING, ENCODED, GENERATING_MANIFEST,
                          // MANIFEST_GENERATED, UPLOADING_HLS, UPLOADING_HLS_COMPLETED,
                          // COMPLETED, FAILED, CLEANUP_FAILED
  
  "encodingPresets": ["original", "720p"],
  "segmentDuration": 10,  // seconds
  
  // Video Analysis Result (Giai đoạn 3)
  "videoAnalysis": {
    "duration": 3600.0,
    "bitrate": 8000000,
    "width": 1920,
    "height": 1080,
    "codec": "h264",
    "fps": 30.0,
    "keyframes": [0.0, 9.8, 19.7, 29.5, ...],  // positions in seconds
    "hasAudio": true,
    "audioCodec": "aac"
  },
  
  // Segment Plan (Giai đoạn 4)
  "segmentPlan": [
    {
      "segmentIndex": 0,
      "startTime": 0.0,
      "endTime": 9.8,
      "duration": 9.8,
      "startsAtKeyframe": true,
      "status": "COMPLETED"
    },
    {
      "segmentIndex": 1,
      "startTime": 9.8,
      "endTime": 19.7,
      "duration": 9.9,
      "startsAtKeyframe": true,
      "status": "COMPLETED"
    }
    // ... more segments
  ],
  
  "totalSegments": 360,
  
  // Output paths (transient during encoding)
  "tempOutputDir": "/tmp/encoding_job-xyz",
  
  // Final results (Giai đoạn 7)
  "hlsMasterUrl": "https://minio.server/videos-hls/hls/{fileId}/master.m3u8",
  "hlsVariantUrls": {
    "original": "https://...",
    "720p": "https://..."
  },
  
  // Progress tracking
  "progress": {
    "totalSegments": 360,
    "completedSegments": 360,
    "percentage": 100.0,
    "currentPhase": "COMPLETED"
  },
  
  // Error handling
  "errorMessage": null,
  "retryCount": 0,
  "maxRetries": 3,
  
  // Timestamps
  "createdAt": ISODate("2026-04-02T04:30:00Z"),
  "updatedAt": ISODate("2026-04-02T05:00:00Z"),
  "completedAt": ISODate("2026-04-02T05:00:00Z")
}
```

**Indexes:**
```javascript
db.encodingJobs.createIndex({ "jobId": 1 }, { unique: true });
db.encodingJobs.createIndex({ "fileId": 1 });
db.encodingJobs.createIndex({ "userId": 1 });
db.encodingJobs.createIndex({ "status": 1 });
db.encodingJobs.createIndex({ "createdAt": -1 });
```

---

### 3.3. Existing Collection: `metadata` (Extended)

Thêm các field liên quan đến video.

```javascript
{
  "_id": ObjectId("..."),
  "fileId": "uuid-string",
  "fileName": "my_video.mp4",
  "objectName": "uuid_my_video.mp4",
  "mimeType": "video/mp4",
  "fileSize": 1073741824.0,  // bytes
  
  // Existing fields...
  "ownerId": "user-id",
  "ownerEmail": "user@example.com",
  "uploadId": "s3-upload-id",
  "status": "COMPLETED",
  
  // NEW: Video-specific flags
  "isVideo": true,
  "hasHLS": true,              // Set to true after HLS encoding completes
  "replacedByHLS": false,      // Set to true if original is deleted after HLS
  
  // Existing sharing/permissions...
  "visibility": "PRIVATE",
  "publicPermission": "READ",
  
  "creationTimestamp": ISODate("2026-04-02T04:00:00Z"),
  "modificationTimestamp": ISODate("2026-04-02T05:00:00Z")
}
```

**New Indexes:**
```javascript
db.metadata.createIndex({ "isVideo": 1 });
db.metadata.createIndex({ "hasHLS": 1 });
db.metadata.createIndex({ "isVideo": 1, "hasHLS": 1 });
```

---

## 4. DTO SPECIFICATIONS

### 4.1. Frontend → Backend DTOs

#### `InitiateUploadRequest`

```typescript
// Frontend
interface InitiateUploadRequest {
  fileName: string;           // "my_video.mp4"
  fileSize: number;           // bytes
  mimeType: string;           // "video/mp4"
  moovMetadata: MoovMetadata; // từ mp4box.js
}

interface MoovMetadata {
  duration: number;           // seconds
  timescale: number;          // ticks/second
  videoTracks: VideoTrack[];
  audioTracks: AudioTrack[];
  brands: string[];
  created: Date;
  modified: Date;
}

interface VideoTrack {
  id: number;
  codec: string;
  width: number;
  height: number;
  fps: number;
}

interface AudioTrack {
  id: number;
  codec: string;
  sampleRate: number;
  channels: number;
}
```

```java
// Backend
@Data
public class InitiateUploadRequest {
    @NotBlank
    private String fileName;
    
    @NotNull
    @Min(1)
    private Long fileSize;
    
    @NotBlank
    private String mimeType;
    
    private MoovMetadata moovMetadata;
}

@Data
public class MoovMetadata {
    private Double duration;
    private Integer timescale;
    private List<VideoTrack> videoTracks;
    private List<AudioTrack> audioTracks;
    private List<String> brands;
    private Instant created;
    private Instant modified;
}
```

---

#### `EncodingJobRequest`

```typescript
// Frontend
interface EncodingJobRequest {
  fileId: string;
  encodingPresets?: string[];      // default: ["original", "720p"]
  segmentDuration?: number;        // default: 10 seconds
}
```

```java
// Backend
@Data
public class EncodingJobRequest {
    @NotBlank
    private String fileId;
    
    private List<String> encodingPresets = List.of("original", "720p");
    
    @Min(5)
    @Max(60)
    private Integer segmentDuration = 10;
}
```

---

### 4.2. Backend → Frontend DTOs

#### `EncodingJobResponse`

```java
@Data
@Builder
public class EncodingJobResponse {
    private String jobId;
    private String fileId;
    private EncodingStatus status;
    private String presignedUrl;           // For debugging purposes
    private Integer totalSegments;
    private ProgressInfo progress;
    private Instant createdAt;
    private Instant estimatedCompletion;   // Calculated based on file size
}

@Data
public class ProgressInfo {
    private Integer totalSegments;
    private Integer completedSegments;
    private Double percentage;
    private String currentPhase;           // "ANALYZING", "ENCODING", etc.
}
```

---

#### `VideoMetadataResponse`

```java
@Data
@Builder
public class VideoMetadataResponse {
    private String fileId;
    private String fileName;
    private Long fileSize;
    private String mimeType;
    
    private MoovMetadata moovInfo;
    
    private Boolean hasHLS;
    private HLSMetadata hlsMetadata;       // null if hasHLS = false
    
    private Instant createdAt;
    private Instant updatedAt;
}

@Data
public class HLSMetadata {
    private String masterPlaylistUrl;
    private Map<String, String> variantUrls;  // {"original": "...", "720p": "..."}
    private Integer hlsVersion;
    private Integer segmentCount;
    private Integer targetDuration;
    private Instant encodedAt;
}
```

---

#### `JobStatusResponse` (for polling)

```java
@Data
@Builder
public class JobStatusResponse {
    private String jobId;
    private EncodingStatus status;
    private ProgressInfo progress;
    
    // Only present when status = COMPLETED
    private String hlsMasterUrl;
    private Map<String, String> hlsVariantUrls;
    
    // Only present when status = FAILED
    private String errorMessage;
    
    private Instant updatedAt;
}
```

---

### 4.3. Internal DTOs (Worker ↔ Service)

#### `VideoAnalysisResult`

```java
@Data
@Builder
public class VideoAnalysisResult {
    private Double duration;
    private Long bitrate;
    private Integer width;
    private Integer height;
    private String codec;
    private Double fps;
    private List<Double> keyframes;
    private Boolean hasAudio;
    private String audioCodec;
}
```

---

#### `SegmentPlan`

```java
@Data
@Builder
@Document
public class SegmentPlan {
    private Integer segmentIndex;
    private Double startTime;
    private Double endTime;
    private Double duration;
    private Boolean startsAtKeyframe;
    private String status;  // PENDING, ENCODING, COMPLETED, FAILED
    
    @Transient
    private Map<String, String> outputPaths;  // Transient - only during encoding
}
```

---

#### `EncodingConfig`

```java
@Data
@Builder
public class EncodingConfig {
    private String preset;           // "original", "720p", "480p"
    private String scale;            // "-2:720" or "-2:-2"
    private String ffmpegPreset;     // "medium", "fast", "slow"
    private Integer crf;             // 23
    private String videoBitrate;     // "2500k"
    private String audioBitrate;     // "128k"
}
```

---

## 5. API ENDPOINTS

### 5.1. Video Upload & Metadata

#### `POST /api/upload/initiate`

Khởi tạo multipart upload và lưu moov metadata.

**Request:**
```json
{
  "fileName": "my_video.mp4",
  "fileSize": 1073741824,
  "mimeType": "video/mp4",
  "moovMetadata": {
    "duration": 3600.0,
    "timescale": 1000,
    "videoTracks": [
      {
        "id": 1,
        "codec": "avc1.64001f",
        "width": 1920,
        "height": 1080,
        "fps": 30.0
      }
    ],
    "audioTracks": [
      {
        "id": 2,
        "codec": "mp4a.40.2",
        "sampleRate": 48000,
        "channels": 2
      }
    ],
    "brands": ["isom", "iso2", "avc1", "mp41"],
    "created": "2026-01-01T00:00:00Z",
    "modified": "2026-01-15T10:30:00Z"
  }
}
```

**Response (200 OK):**
```json
{
  "uploadId": "s3-upload-id-xyz",
  "fileId": "uuid-file-id",
  "objectName": "uuid_my_video.mp4",
  "partUrls": {
    "1": "https://minio.server/bucket/object?uploadId=...&partNumber=1&sig=...",
    "2": "https://minio.server/bucket/object?uploadId=...&partNumber=2&sig=...",
    "3": "..."
  }
}
```

---

#### `POST /api/upload/complete`

Hoàn tất multipart upload.

**Request:**
```json
{
  "uploadId": "s3-upload-id-xyz",
  "fileId": "uuid-file-id",
  "parts": [
    { "partNumber": 1, "etag": "etag-1" },
    { "partNumber": 2, "etag": "etag-2" }
  ]
}
```

**Response (200 OK):**
```json
{
  "fileId": "uuid-file-id",
  "objectName": "uuid_my_video.mp4",
  "status": "COMPLETED"
}
```

---

#### `POST /api/video/metadata`

Lưu video metadata sau khi upload.

**Request:**
```json
{
  "fileId": "uuid-file-id",
  "moovMetadata": { /* same as initiate */ }
}
```

**Response (200 OK):**
```json
{
  "fileId": "uuid-file-id",
  "moovMetadataSaved": true
}
```

---

### 5.2. Encoding Jobs

#### `POST /api/video/encode`

Submit encoding job.

**Request:**
```json
{
  "fileId": "uuid-file-id",
  "encodingPresets": ["original", "720p"],
  "segmentDuration": 10
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "uuid-job-id",
  "fileId": "uuid-file-id",
  "status": "PENDING",
  "presignedUrl": "https://minio.server/...",
  "totalSegments": null,
  "progress": {
    "totalSegments": 0,
    "completedSegments": 0,
    "percentage": 0.0,
    "currentPhase": "PENDING"
  },
  "createdAt": "2026-04-02T04:30:00Z",
  "estimatedCompletion": "2026-04-02T05:30:00Z"
}
```

---

#### `GET /api/video/encode/{jobId}/status`

Poll job status.

**Response (200 OK) - In Progress:**
```json
{
  "jobId": "uuid-job-id",
  "status": "ENCODING",
  "progress": {
    "totalSegments": 360,
    "completedSegments": 180,
    "percentage": 50.0,
    "currentPhase": "ENCODING"
  },
  "updatedAt": "2026-04-02T04:45:00Z"
}
```

**Response (200 OK) - Completed:**
```json
{
  "jobId": "uuid-job-id",
  "status": "COMPLETED",
  "progress": {
    "totalSegments": 360,
    "completedSegments": 360,
    "percentage": 100.0,
    "currentPhase": "COMPLETED"
  },
  "hlsMasterUrl": "https://minio.server/videos-hls/hls/uuid-file-id/master.m3u8",
  "hlsVariantUrls": {
    "original": "https://minio.server/videos-hls/hls/uuid-file-id/original.m3u8",
    "720p": "https://minio.server/videos-hls/hls/uuid-file-id/720p.m3u8"
  },
  "updatedAt": "2026-04-02T05:00:00Z"
}
```

**Response (200 OK) - Failed:**
```json
{
  "jobId": "uuid-job-id",
  "status": "FAILED",
  "progress": {
    "totalSegments": 360,
    "completedSegments": 120,
    "percentage": 33.3,
    "currentPhase": "ENCODING"
  },
  "errorMessage": "FFmpeg encoding failed: Invalid codec parameter",
  "updatedAt": "2026-04-02T04:50:00Z"
}
```

---

#### `GET /api/video/metadata/{fileId}`

Lấy video metadata và HLS info.

**Response (200 OK):**
```json
{
  "fileId": "uuid-file-id",
  "fileName": "my_video.mp4",
  "fileSize": 1073741824,
  "mimeType": "video/mp4",
  "moovInfo": {
    "duration": 3600.0,
    "timescale": 1000,
    "videoTracks": [
      {
        "id": 1,
        "codec": "avc1.64001f",
        "width": 1920,
        "height": 1080,
        "fps": 30.0
      }
    ],
    "audioTracks": [
      {
        "id": 2,
        "codec": "mp4a.40.2",
        "sampleRate": 48000,
        "channels": 2
      }
    ],
    "brands": ["isom", "iso2", "avc1", "mp41"],
    "created": "2026-01-01T00:00:00Z",
    "modified": "2026-01-15T10:30:00Z"
  },
  "hasHLS": true,
  "hlsMetadata": {
    "masterPlaylistUrl": "https://minio.server/videos-hls/hls/uuid-file-id/master.m3u8",
    "variantUrls": {
      "original": "https://minio.server/videos-hls/hls/uuid-file-id/original.m3u8",
      "720p": "https://minio.server/videos-hls/hls/uuid-file-id/720p.m3u8"
    },
    "hlsVersion": 3,
    "segmentCount": 360,
    "targetDuration": 10,
    "encodedAt": "2026-04-02T05:00:00Z"
  },
  "createdAt": "2026-04-02T04:00:00Z",
  "updatedAt": "2026-04-02T05:00:00Z"
}
```

---

#### `DELETE /api/video/encode/{jobId}`

Hủy encoding job (nếu đang chạy).

**Response (200 OK):**
```json
{
  "jobId": "uuid-job-id",
  "cancelled": true,
  "previousStatus": "ENCODING"
}
```

---

## 6. LUỒNG DỮ LIỆU END-TO-END

### 6.1. Sequence Diagram

```
┌────────┐  ┌─────────┐  ┌──────────┐  ┌───────┐  ┌────────┐  ┌────────┐
│ Client │  │mp4box.js│  │   API    │  │ MinIO │  │ MongoDB│  │ Worker │
└───┬────┘  └────┬────┘  └────┬─────┘  └───┬───┘  └───┬────┘  └───┬────┘
    │            │            │            │          │           │
    │ Select file│            │            │          │           │
    │───────────►│            │            │          │           │
    │            │            │            │          │           │
    │   Parse moov            │            │          │           │
    │            │────────┐   │            │          │           │
    │            │        │   │            │          │           │
    │◄───────────│◄───────┘   │            │          │           │
    │ moovMetadata            │            │          │           │
    │                         │            │          │           │
    │ POST /upload/initiate   │            │          │           │
    │────────────────────────►│            │          │           │
    │                         │            │          │           │
    │                         │ Create uploadId       │           │
    │                         │───────────────────────►│           │
    │                         │                       │           │
    │                         │ Save metadata         │           │
    │                         │──────────────────────────────────►│
    │                         │                       │           │
    │  { uploadId, partUrls } │                       │           │
    │◄────────────────────────│                       │           │
    │                         │                       │           │
    │ PUT chunks to partUrls  │                       │           │
    │──────────────────────────────────────────►      │           │
    │                         │                       │           │
    │ POST /upload/complete   │                       │           │
    │────────────────────────►│                       │           │
    │                         │                       │           │
    │                         │ Complete upload       │           │
    │                         │────────────────────►  │           │
    │                         │                       │           │
    │  { fileId, status }     │                       │           │
    │◄────────────────────────│                       │           │
    │                         │                       │           │
    │ POST /video/encode      │                       │           │
    │────────────────────────►│                       │           │
    │                         │                       │           │
    │                         │ Create EncodingJob    │           │
    │                         │──────────────────────────────────►│
    │                         │                       │           │
    │                         │ Generate presignedUrl │           │
    │                         │────────────────────►  │           │
    │                         │                       │           │
    │   { jobId, status }     │                       │           │
    │◄────────────────────────│                       │           │
    │                         │                       │           │
    │                         │                       │    Trigger async
    │                         │                       │  ──────────┤
    │                         │                       │           │
    │                         │                       │    PHASE 3: Analyze
    │                         │                       │  ◄─────────┤
    │                         │                       │           │
    │                         │                       │    Update job
    │                         │                       │  ─────────►│
    │                         │                       │           │
    │                         │                       │    PHASE 4: Plan
    │                         │                       │  ◄─────────┤
    │                         │                       │           │
    │                         │                       │    Update job
    │                         │                       │  ─────────►│
    │                         │                       │           │
    │                         │                       │    PHASE 5: Encode
    │                         │                       │  ◄─────────┤
    │                         │                       │  (parallel)
    │                         │                       │           │
    │ Poll: GET /encode/{jobId}/status                │           │
    │────────────────────────►│                       │           │
    │                         │                       │           │
    │                         │ Query job status      │           │
    │                         │──────────────────────────────────►│
    │                         │                       │           │
    │  { status, progress }   │                       │           │
    │◄────────────────────────│                       │           │
    │                         │                       │           │
    │                         │                       │    PHASE 6: Manifest
    │                         │                       │  ◄─────────┤
    │                         │                       │           │
    │                         │                       │    PHASE 7: Upload HLS
    │                         │                       │  ◄─────────┤
    │                         │  Upload segments      │           │
    │                         │ ◄─────────────────────┼───────────┤
    │                         │                       │           │
    │                         │                       │    Update metadata
    │                         │                       │  ─────────►│
    │                         │                       │           │
    │                         │                       │    PHASE 8: Cleanup
    │                         │                       │  ◄─────────┤
    │                         │                       │           │
    │ Poll: GET /encode/{jobId}/status                │           │
    │────────────────────────►│                       │           │
    │                         │                       │           │
    │  { status: COMPLETED,   │                       │           │
    │    hlsMasterUrl }       │                       │           │
    │◄────────────────────────│                       │           │
    │                         │                       │           │
    │ GET /video/metadata/{fileId}                    │           │
    │────────────────────────►│                       │           │
    │                         │                       │           │
    │                         │ Query metadata        │           │
    │                         │──────────────────────────────────►│
    │                         │                       │           │
    │  { moovInfo, hlsMetadata }                      │           │
    │◄────────────────────────│                       │           │
    │                         │                       │           │
    │ Play HLS video          │                       │           │
    │────────────────────────────────────────────►    │           │
    │  GET master.m3u8        │                       │           │
    │                         │                       │           │
    │◄────────────────────────────────────────────    │           │
    │                         │                       │           │
    │  GET 720p.m3u8          │                       │           │
    │────────────────────────────────────────────►    │           │
    │                         │                       │           │
    │◄────────────────────────────────────────────    │           │
    │                         │                       │           │
    │  GET segment_000.ts     │                       │           │
    │────────────────────────────────────────────►    │           │
    │                         │                       │           │
    │◄────────────────────────────────────────────    │           │
    │  (stream video)         │                       │           │
    │                         │                       │           │
```

---

### 6.2. Data Flow Summary

#### Input → Output Chain

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INPUT → PROCESSING → OUTPUT                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. UPLOAD PHASE                                                    │
│     Input:  File (MP4/MOV) from browser                             │
│     Process: mp4box.js parse → multipart upload                     │
│     Output: fileId + moovMetadata in MongoDB                        │
│                                                                      │
│  2. JOB SUBMISSION                                                  │
│     Input:  fileId + encodingPresets                                │
│     Process: Create EncodingJob + presigned URL                     │
│     Output: jobId + status PENDING                                  │
│                                                                      │
│  3. VIDEO ANALYSIS                                                  │
│     Input:  presignedUrl                                            │
│     Process: FFprobe extract metadata + keyframes                   │
│     Output: VideoAnalysisResult in job                              │
│                                                                      │
│  4. SEGMENT PLANNING                                                │
│     Input:  VideoAnalysisResult + segmentDuration                   │
│     Process: Calculate boundaries at keyframes                      │
│     Output: List<SegmentPlan> in job                                │
│                                                                      │
│  5. PARALLEL ENCODING                                               │
│     Input:  SegmentPlan + presignedUrl + encodingPresets            │
│     Process: FFmpeg encode segments (parallel)                      │
│     Output: .ts files in temp directory                             │
│                                                                      │
│  6. MANIFEST GENERATION                                             │
│     Input:  SegmentPlan + temp directory                            │
│     Process: Generate .m3u8 playlists                               │
│     Output: master.m3u8 + variant playlists                         │
│                                                                      │
│  7. HLS UPLOAD                                                      │
│     Input:  temp directory files                                    │
│     Process: Upload to MinIO videos-hls bucket                      │
│     Output: HLS URLs in VideoMetadata                               │
│                                                                      │
│  8. CLEANUP                                                         │
│     Input:  temp directory path                                     │
│     Process: Delete temp files + emit event                         │
│     Output: status COMPLETED + JobCompletedEvent                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. KẾT LUẬN VÀ KHUYẾN NGHỊ

### 7.1. Ưu Điểm của Workflow

1. **Memory Efficient**: Sử dụng Presigned URL + HTTP Range, không cần download full file
2. **Parallel Processing**: Thread pool encode nhiều segments đồng thời
3. **Frontend Optimization**: mp4box.js parse moov ngay tại client, tiết kiệm bandwidth
4. **Scalable**: Có thể distribute encoding workers ra nhiều servers
5. **Traceable**: Database lưu đầy đủ metadata và job status để debug

### 7.2. Điểm Cần Lưu Ý

1. **Network Dependency**: FFmpeg cần kết nối ổn định đến MinIO
2. **Presigned URL Expiry**: Cần đủ thời gian (khuyến nghị 7 days cho video lớn)
3. **Disk Space**: Temp directory cần đủ chỗ cho tất cả segments trước khi upload
4. **Thread Pool Size**: Cần cân đối giữa CPU cores và concurrent encodes

### 7.3. Khuyến Nghị Triển Khai

#### Resource Limits

```yaml
# application.yml
video-encoding:
  thread-pool:
    core-size: 14  # CPU_CORES - 2
    max-size: 14
    queue-capacity: 100
  
  ffmpeg:
    threads-per-process: 2
    timeout-seconds: 600  # 10 minutes per segment
  
  temp-dir: /tmp/encoding
  
  cleanup:
    delete-on-completion: true
    delete-original-after-hls: false  # configurable
```

#### Error Handling Strategy

1. **Retry Policy**: Tối đa 3 lần retry cho mỗi segment failed
2. **Partial Success**: Nếu > 95% segments thành công, vẫn cho phép complete job
3. **Cleanup on Failure**: Luôn delete temp files kể cả khi job failed

#### Monitoring Metrics

- `encoding_jobs_total` (counter)
- `encoding_duration_seconds` (histogram)
- `segment_encoding_duration_seconds` (histogram)
- `active_encoding_workers` (gauge)
- `failed_segments_total` (counter)

---

**Prepared by:** AI Assistant  
**Date:** 2026-04-02  
**Version:** 1.0
