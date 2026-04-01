# Kiến Trúc Video Streaming - Spring Boot + FFmpeg + MinIO

## STEP 1: MinIO API & Streaming Analysis

### MinIO Client API Options

**1. GetObjectResponse Stream (Khuyến nghị)**
```java
// MinIO cung cấp GetObjectResponse trả về InputStream trực tiếp
GetObjectResponse response = minioClient.getObject(
    GetObjectArgs.builder()
        .bucket("videos")
        .object("video.mp4")
        .build()
);
InputStream videoStream = response; // Không cần tải toàn bộ file
```

**2. HTTP Range Requests (Tối ưu cho phân đoạn)**
```java
// Sử dụng range để lấy từng phần của file
GetObjectResponse partialResponse = minioClient.getObject(
    GetObjectArgs.builder()
        .bucket("videos")
        .object("video.mp4")
        .offset(startByte)
        .length(chunkSize)
        .build()
);
```

**3. Presigned URL + FFmpeg Direct Access**
```java
// Tạo presigned URL có thời hạn 
String presignedUrl = minioClient.getPresignedObjectUrl(
    GetPresignedObjectUrlArgs.builder()
        .method(Method.GET)
        .bucket("videos")
        .object("video.mp4")
        .expiry(3600) // 1 giờ
        .build()
);
// FFmpeg có thể đọc trực tiếp từ HTTP URL
```

### Câu Trả Lời: On-The-Fly Streaming

**CÓ THỂ** thực hiện "vừa download, vừa chia segment, vừa encode" theo 2 cách:

#### Phương Pháp 1: FFmpeg Direct URL Access (Khuyến nghị cao)
- FFmpeg hỗ trợ đọc trực tiếp từ HTTP URL
- Sử dụng presigned URL từ MinIO
- FFmpeg tự động quản lý buffering và seeking
- Không cần Java xử lý stream

#### Phương Pháp 2: Java Stream Pipeline
- MinIO InputStream → Java Processing → FFmpeg stdin
- Phức tạp hơn, cần quản lý buffer carefully
- Risk của backpressure và memory leak

## STEP 2: Optimal Architecture Design

### Kiến Trúc Tối Ưu Đề Xuất

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐
│   MinIO     │    │  Controller  │    │   FFmpeg Pool   │
│  (Video)    │────│   Service    │────│   (Workers)     │
└─────────────┘    └──────────────┘    └─────────────────┘
                           │                      │
                           ▼                      ▼
                   ┌──────────────┐    ┌─────────────────┐
                   │  Segment     │    │    Output       │
                   │  Metadata    │    │   (MinIO/Local) │
                   │  Manager     │    │                 │
                   └──────────────┘    └─────────────────┘
```

### Chiến Lược Phân Đoạn: FFmpeg Byte-Range vs Stream Processing

#### Option A: FFmpeg Byte-Range (Khuyến nghị)

**Ưu điểm:**
- FFmpeg tự động optimize I/O operations
- Không cần Java buffer management
- Hỗ trợ seeking chính xác frame-level
- Memory footprint cực thấp
- Parallel segment processing tự nhiên

**Nhược điểm:**
- Cần presigned URL có thời hạn dài
- Multiple HTTP connections tới MinIO
- Phụ thuộc vào FFmpeg seeking accuracy

**Implementation Flow:**
```bash
# Mỗi segment được process độc lập
ffmpeg -ss 00:00:00 -t 10 -i $PRESIGNED_URL -c:v libx264 -preset fast segment_001.ts
ffmpeg -ss 00:00:10 -t 10 -i $PRESIGNED_URL -c:v libx264 -preset fast segment_002.ts
# Parallel execution với ThreadPoolExecutor
```

#### Option B: Java Stream Pipeline

**Ưu điểm:**
- Full control over data flow
- Single MinIO connection
- Custom buffering strategy
- Error handling trong Java code

**Nhược điểm:**
- Memory pressure cao
- Complex backpressure handling  
- Java GC overhead
- Slower than native FFmpeg I/O

### Thread Pool & Resource Management

#### Cấu Hình Thread Pool Tối Ưu

```java
@Configuration
public class VideoProcessingConfig {
    
    // CPU-bound tasks (encoding)
    @Bean
    public ThreadPoolTaskExecutor encodingExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(Runtime.getRuntime().availableProcessors());
        executor.setMaxPoolSize(Runtime.getRuntime().availableProcessors() * 2);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("encoder-");
        executor.setRejectedExecutionHandler(new CallerRunsPolicy());
        return executor;
    }
    
    // I/O-bound tasks (MinIO operations)
    @Bean  
    public ThreadPoolTaskExecutor ioExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(50);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("minio-io-");
        return executor;
    }
}
```

#### Memory Management Strategy

**JVM Tuning Parameters:**
```bash
-Xmx4g -Xms2g
-XX:+UseG1GC
-XX:G1HeapRegionSize=16m
-XX:MaxDirectMemorySize=1g
-XX:+DisableExplicitGC
```

**Resource Limits Per Job:**
- Max concurrent encoding jobs: CPU cores
- Max memory per process: 512MB
- FFmpeg process timeout: 30 minutes
- Temporary file cleanup: Automatic after completion

## STEP 3: Implementation Concept

### Logic Flow Chi Tiết

#### Phase 1: Video Analysis & Preparation

```java
@Service
public class VideoProcessingOrchestrator {
    
    public CompletableFuture<HLSOutput> processVideo(String bucketName, String objectKey) {
        
        // 1. Analyze video metadata (duration, resolution, bitrate)
        VideoMetadata metadata = analyzeVideoMetadata(bucketName, objectKey);
        
        // 2. Generate presigned URL (expiry = processing time estimate)  
        String presignedUrl = generatePresignedUrl(bucketName, objectKey, metadata.estimatedProcessingTime);
        
        // 3. Calculate segment boundaries
        List<SegmentInfo> segments = calculateSegments(metadata.duration, SEGMENT_LENGTH);
        
        // 4. Determine output profiles based on source resolution
        List<OutputProfile> profiles = determineOutputProfiles(metadata.resolution);
        
        return processSegmentsAsync(presignedUrl, segments, profiles);
    }
}
```

#### Phase 2: Parallel Segment Processing

```java
private CompletableFuture<HLSOutput> processSegmentsAsync(String presignedUrl, 
                                                         List<SegmentInfo> segments, 
                                                         List<OutputProfile> profiles) {
    
    List<CompletableFuture<SegmentResult>> segmentFutures = new ArrayList<>();
    
    for (SegmentInfo segment : segments) {
        for (OutputProfile profile : profiles) {
            
            CompletableFuture<SegmentResult> segmentFuture = CompletableFuture.supplyAsync(() -> {
                return processSegment(presignedUrl, segment, profile);
            }, encodingExecutor);
            
            segmentFutures.add(segmentFuture);
        }
    }
    
    return CompletableFuture.allOf(segmentFutures.toArray(new CompletableFuture[0]))
            .thenApply(v -> aggregateResults(segmentFutures))
            .thenCompose(this::generateMasterPlaylist);
}
```

#### Phase 3: FFmpeg Process Management

```java
private SegmentResult processSegment(String presignedUrl, SegmentInfo segment, OutputProfile profile) {
    
    ProcessBuilder processBuilder = new ProcessBuilder();
    
    List<String> command = buildFFmpegCommand(presignedUrl, segment, profile);
    processBuilder.command(command);
    
    // Resource constraints
    processBuilder.environment().put("FFREPORT", "file=ffmpeg-%p.log:level=32");
    
    try {
        Process ffmpegProcess = processBuilder.start();
        
        // Monitor process resources
        ProcessMonitor monitor = new ProcessMonitor(ffmpegProcess);
        monitor.setMemoryLimit(512 * 1024 * 1024); // 512MB
        monitor.setCpuLimit(90); // 90% CPU
        
        boolean completed = ffmpegProcess.waitFor(30, TimeUnit.MINUTES);
        
        if (!completed) {
            ffmpegProcess.destroyForcibly();
            throw new ProcessingTimeoutException("Segment processing timeout");
        }
        
        return collectSegmentResult(segment, profile);
        
    } catch (Exception e) {
        throw new SegmentProcessingException("Failed to process segment", e);
    }
}
```

#### Phase 4: Output Management

```java
private List<String> buildFFmpegCommand(String presignedUrl, SegmentInfo segment, OutputProfile profile) {
    
    return Arrays.asList(
        "ffmpeg",
        "-ss", segment.startTime,
        "-t", segment.duration,
        "-i", presignedUrl,
        "-c:v", profile.videoCodec,
        "-preset", profile.preset,
        "-crf", profile.crf,
        "-maxrate", profile.maxBitrate,
        "-bufsize", profile.bufferSize,
        "-s", profile.resolution,
        "-f", "mpegts",
        generateOutputPath(segment, profile)
    );
}
```

### Data Flow Architecture

```
MinIO Video Source
        │
        ▼ (Presigned URL)
┌─────────────────────┐
│   FFmpeg Processes  │ ── Parallel Execution
│   (Segment Workers) │    (CPU Core Count)
└─────────────────────┘
        │
        ▼ (Generated TS files)
┌─────────────────────┐
│   Output Collector  │ ── Playlist Generation
│   (M3U8 Builder)    │    + Metadata Assembly  
└─────────────────────┘
        │
        ▼ (Upload Results)
┌─────────────────────┐
│   MinIO Output      │ ── Final HLS Package
│   (HLS Package)     │    (m3u8 + ts files)
└─────────────────────┘
```

### Performance Optimization Keys

1. **Zero-Copy I/O**: FFmpeg đọc trực tiếp từ HTTP URL
2. **Memory Bounded**: Mỗi process giới hạn 512MB RAM  
3. **CPU Efficient**: Parallel encoding với thread pool sized theo CPU cores
4. **Network Optimal**: Single presigned URL, multiple range requests
5. **Cleanup Automated**: Temporary files được xóa sau completion
6. **Error Recovery**: Timeout và resource monitoring cho mỗi FFmpeg process

### Khuyến Nghị Triển Khai

- **Phase 1**: Implement với presigned URL + FFmpeg direct access
- **Phase 2**: Add resource monitoring và cleanup mechanisms  
- **Phase 3**: Optimize thread pool sizing based on load testing
- **Phase 4**: Add adaptive bitrate logic và quality profiles

Kiến trúc này đảm bảo xử lý video streaming hiệu quả cao với resource utilization tối ưu và khả năng scale horizontal.