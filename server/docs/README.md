# 📹 FFmpeg Spring Boot Integration - Complete Guide

Tài liệu hướng dẫn tích hợp FFmpeg vào Spring Boot để xử lý video, tạo HLS streaming với adaptive bitrate.

---

## 📚 Danh Sách Tài Liệu

### 1. [FFMPEG_SPRING_BOOT_GUIDE.md](./FFMPEG_SPRING_BOOT_GUIDE.md)
**Hướng dẫn chi tiết về cấu hình và implementation**

**Nội dung:**
- So sánh các thư viện FFmpeg cho Java (JAVE2, JavaCV, CLI Wrapper)
- Cấu hình dependencies (pom.xml)
- Configuration properties (application.yml)
- Code implementation đầy đủ:
  - FFmpegConfig Bean
  - FFmpegCLIService (CLI Wrapper - Khuyến nghị)
  - Video DTOs (VideoInfo, HlsOutput)
  - VideoController với REST APIs
- Cài đặt FFmpeg trên Windows/Linux/macOS
- Testing guide
- Performance optimization tips
- Troubleshooting
- Best practices

**Đối tượng:** Developers muốn tích hợp FFmpeg từ đầu

---

### 2. [FFMPEG_QUICK_REFERENCE.md](./FFMPEG_QUICK_REFERENCE.md)
**Cheat sheet các lệnh FFmpeg thường dùng**

**Nội dung:**
- Lệnh FFmpeg CLI cơ bản:
  - Lấy thông tin video (ffprobe)
  - Convert format
  - Resize video
  - Cắt video (trim)
  - Extract audio
  - Ghép video
  - Add watermark
  - Speed up/slow down
- Lệnh tạo HLS:
  - Single quality HLS
  - Multi-quality HLS (Original + 720p)
  - Adaptive bitrate streaming
- Java Process Builder examples
- FFmpeg options explained (codec, preset, CRF, bitrate)
- Bandwidth & bitrate recommendations
- Error messages & solutions
- Performance comparison table
- Master playlist format examples

**Đối tượng:** Quick reference khi cần tìm lệnh FFmpeg cụ thể

---

### 3. [FFMPEG_USE_CASES.md](./FFMPEG_USE_CASES.md)
**Ví dụ code cho các use cases thực tế**

**Nội dung:**

#### Use Case 1: Video Upload & HLS Encoding
- Complete workflow: Upload → Encode → MinIO → Database
- VideoProcessingService với async processing
- VideoUploadController
- MongoDB entity (VideoMetadata)

#### Use Case 2: Video Preview Generation
- Generate thumbnail từ video
- Create animated GIF preview
- Storyboard generation (multiple thumbnails)

#### Use Case 3: Token-based Video Sharing
- Share video với expiry token
- VideoShareService
- Frontend integration

#### Use Case 4: Video Analytics
- Track watch time, quality selection
- HLS.js integration
- Send analytics to backend

#### Use Case 5: Batch Processing
- Background job với Spring Scheduler
- Cleanup expired files
- Resource management

#### Best Practices
- ✅ DO: Async processing, cleanup, error handling
- ❌ DON'T: Sync encoding, infinite temp files

**Đối tượng:** Developers muốn xem code mẫu cho tình huống cụ thể

---

## 🚀 Quick Start

### Bước 1: Cài FFmpeg

#### Windows (Chocolatey)
```powershell
choco install ffmpeg
```

#### Linux (Ubuntu)
```bash
sudo apt install ffmpeg
```

#### macOS
```bash
brew install ffmpeg
```

Verify:
```bash
ffmpeg -version
ffprobe -version
```

---

### Bước 2: Thêm Dependencies

**pom.xml:**
```xml
<!-- Apache Commons Exec -->
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-exec</artifactId>
    <version>1.4.0</version>
</dependency>
```

---

### Bước 3: Cấu hình Application

**application.yml:**
```yaml
ffmpeg:
  bin-path: ffmpeg  # Hoặc đường dẫn đầy đủ: C:/ffmpeg/bin/ffmpeg.exe
  output-dir: ./videos/processed
  temp-dir: ./videos/temp
  
  hls:
    segment-duration: 10
    segment-list-size: 0
    
  encoding:
    original:
      codec: libx264
      preset: medium
      crf: 23
      
    hd720:
      codec: libx264
      preset: medium
      crf: 23
      width: 1280
      height: 720
      bitrate: 2500k
      audio-bitrate: 128k
```

---

### Bước 4: Copy Code

1. Copy `FFmpegConfig.java` từ [FFMPEG_SPRING_BOOT_GUIDE.md](./FFMPEG_SPRING_BOOT_GUIDE.md#41-ffmpeg-configuration-bean)
2. Copy `FFmpegCLIService.java` từ [FFMPEG_SPRING_BOOT_GUIDE.md](./FFMPEG_SPRING_BOOT_GUIDE.md#45-ffmpeg-cli-wrapper-service-khuyến-nghị)
3. Copy `VideoController.java` từ [FFMPEG_SPRING_BOOT_GUIDE.md](./FFMPEG_SPRING_BOOT_GUIDE.md#46-video-controller)
4. Copy DTOs (`VideoInfo`, `HlsOutput`) từ [FFMPEG_SPRING_BOOT_GUIDE.md](./FFMPEG_SPRING_BOOT_GUIDE.md#42-video-info-dto)

---

### Bước 5: Test API

```bash
# Upload và encode video
curl -X POST http://localhost:5000/api/videos/upload-and-encode \
  -F "file=@sample.mp4"

# Response:
{
  "masterPlaylistPath": "/videos/processed/abc123/master.m3u8",
  "variants": [
    {
      "quality": "original",
      "playlistPath": "/videos/processed/abc123/output_original.m3u8",
      "width": 1920,
      "height": 1080,
      "bandwidth": "5000000"
    },
    {
      "quality": "720p",
      "playlistPath": "/videos/processed/abc123/output_720p.m3u8",
      "width": 1280,
      "height": 720,
      "bandwidth": "2500000"
    }
  ]
}
```

---

## 📊 Architecture Overview

```
┌─────────────────┐
│  Client Upload  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│   Spring Boot Application       │
│                                  │
│  ┌──────────────────────────┐  │
│  │  VideoController         │  │
│  └──────────┬───────────────┘  │
│             │                   │
│  ┌──────────▼───────────────┐  │
│  │  VideoProcessingService  │  │
│  │  (@Async)                │  │
│  └──────────┬───────────────┘  │
│             │                   │
│  ┌──────────▼───────────────┐  │
│  │  FFmpegCLIService        │  │
│  │  - Encode HLS            │  │
│  │  - Generate thumbnails   │  │
│  └──────────┬───────────────┘  │
└─────────────┼───────────────────┘
              │
     ┌────────┼────────┐
     │        │        │
     ▼        ▼        ▼
┌────────┐ ┌──────┐ ┌──────────┐
│ MinIO  │ │ Disk │ │ MongoDB  │
│ (S3)   │ │(Temp)│ │(Metadata)│
└────────┘ └──────┘ └──────────┘
```

---

## 🎯 API Reference

### 1. Upload và Encode Video
```http
POST /api/videos/upload-and-encode
Content-Type: multipart/form-data

file: <video file>
```

**Response:**
```json
{
  "masterPlaylistPath": "string",
  "variants": [
    {
      "quality": "original|720p",
      "playlistPath": "string",
      "segmentPaths": ["string"],
      "width": 1920,
      "height": 1080,
      "bandwidth": "5000000"
    }
  ]
}
```

---

### 2. Lấy Thông Tin Video
```http
GET /api/videos/info?path={videoPath}
```

**Response:**
```json
{
  "filePath": "string",
  "duration": 120000,
  "width": 1920,
  "height": 1080,
  "codec": "h264",
  "bitrate": 5000000,
  "frameRate": 30.0
}
```

---

### 3. Cắt Video Thành Segments
```http
POST /api/videos/segment?inputPath={path}&segmentDuration=10
```

**Response:**
```json
[
  "/path/to/segment_000.ts",
  "/path/to/segment_001.ts"
]
```

---

## 🎬 HLS Output Structure

```
videos/processed/{videoId}/
├── master.m3u8              # Master playlist
├── output_original.m3u8     # Original quality playlist
├── output_original_000.ts   # Original segments
├── output_original_001.ts
├── ...
├── output_720p.m3u8         # 720p playlist
├── output_720p_000.ts       # 720p segments
├── output_720p_001.ts
└── ...
```

**master.m3u8:**
```m3u8
#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080,NAME="original"
output_original.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720,NAME="720p"
output_720p.m3u8
```

---

## 🔧 Configuration Options

### Encoding Presets

| Preset | Speed | Quality | Use Case |
|--------|-------|---------|----------|
| ultrafast | 10x | Low | Quick preview |
| veryfast | 5x | Medium-Low | Live streaming |
| medium | 1x | Good | **Recommended** |
| slow | 0.5x | High | Archive |

### CRF Values

| CRF | Quality | File Size |
|-----|---------|-----------|
| 18-22 | High | Large |
| **23** | **Default** | **Medium** |
| 24-28 | Medium | Small |
| 29+ | Low | Very Small |

### Bitrate Recommendations

| Resolution | Video Bitrate | Audio Bitrate |
|------------|---------------|---------------|
| 1080p | 5000k | 128k |
| **720p** | **2500k** | **128k** |
| 480p | 1000k | 96k |

---

## 🧪 Frontend Integration (HLS.js)

```html
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
<video id="video" controls></video>

<script>
  const video = document.getElementById('video');
  const hls = new Hls();
  
  hls.loadSource('http://localhost:5000/videos/processed/{id}/master.m3u8');
  hls.attachMedia(video);
  
  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    video.play();
  });
</script>
```

---

## 🐛 Troubleshooting

### FFmpeg not found
```
Error: Cannot run program "ffmpeg"
```

**Solution:**
1. Verify installation: `ffmpeg -version`
2. Add to PATH hoặc cấu hình `ffmpeg.bin-path` trong application.yml

---

### Session Timeout (Kafka issue)
```
session timed out without receiving a heartbeat response
```

**Solution:** Tăng timeout trong `application.yml`:
```yaml
spring:
  kafka:
    consumer:
      properties:
        session.timeout.ms: 120000
        max.poll.interval.ms: 600000
```

---

### Out of Memory
```
java.lang.OutOfMemoryError
```

**Solution:**
1. Tăng heap size: `java -Xmx2G -jar app.jar`
2. Process video theo batch
3. Cleanup temp files thường xuyên

---

## 📈 Performance Tips

### 1. Hardware Acceleration

**NVIDIA GPU:**
```java
commands.addAll(Arrays.asList(
    "-hwaccel", "cuda",
    "-c:v", "h264_nvenc"
));
```

**Intel Quick Sync:**
```java
commands.addAll(Arrays.asList(
    "-hwaccel", "qsv",
    "-c:v", "h264_qsv"
));
```

### 2. Async Processing

```java
@Async
public CompletableFuture<HlsOutput> encodeAsync(String input) {
    // Encoding logic
}
```

### 3. Resource Management

```yaml
spring:
  task:
    execution:
      pool:
        core-size: 2
        max-size: 5
        queue-capacity: 100
```

---

## 📖 Additional Resources

- [FFmpeg Official Documentation](https://ffmpeg.org/documentation.html)
- [HLS Authoring Specification](https://developer.apple.com/documentation/http-live-streaming)
- [HLS.js GitHub](https://github.com/video-dev/hls.js/)
- [Video Encoding Best Practices](https://trac.ffmpeg.org/wiki/Encode/H.264)

---

## 🤝 Contributing

Nếu phát hiện lỗi hoặc muốn cải thiện tài liệu:
1. Tạo issue trong repository
2. Submit pull request với improvements
3. Chia sẻ use cases mới

---

## 📄 License

Tài liệu này được tạo cho mục đích học tập và phát triển dự án FileSharing.

---

**Tác giả:** AI Assistant  
**Ngày tạo:** 2026-04-01  
**Phiên bản:** 1.0  
**Cập nhật lần cuối:** 2026-04-01
