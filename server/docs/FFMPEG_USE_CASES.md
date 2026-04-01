# FFmpeg Integration Examples - Use Cases

## Use Case 1: Video Upload & HLS Encoding

### Workflow
```
User Upload Video → Save to MinIO → Encode HLS → Save output to MinIO → Return streaming URL
```

### Code Example

#### 1.1. Service Layer

```java
package org.example.filesharing.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.entities.dtos.video.HlsOutput;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class VideoProcessingService {
    
    private final FFmpegCLIService ffmpegService;
    private final MinIOService minioService;
    private final VideoMetadataRepository videoRepository;
    
    /**
     * Upload và xử lý video async
     */
    @Async
    public CompletableFuture<VideoMetadata> processVideoAsync(
            MultipartFile file, 
            String userId) {
        
        String videoId = UUID.randomUUID().toString();
        
        try {
            // 1. Lưu file gốc vào temp
            Path tempPath = saveTempFile(file, videoId);
            log.info("Saved temp file: {}", tempPath);
            
            // 2. Upload original video lên MinIO
            String originalKey = uploadOriginalToMinIO(tempPath.toString(), videoId);
            log.info("Uploaded original to MinIO: {}", originalKey);
            
            // 3. Encode thành HLS
            HlsOutput hlsOutput = ffmpegService.encodeToHLS(
                tempPath.toString(),
                videoId
            );
            log.info("HLS encoding completed: {}", hlsOutput.getMasterPlaylistPath());
            
            // 4. Upload HLS files lên MinIO
            String masterPlaylistUrl = uploadHlsToMinIO(hlsOutput, videoId);
            log.info("HLS uploaded to MinIO: {}", masterPlaylistUrl);
            
            // 5. Lưu metadata vào database
            VideoMetadata metadata = VideoMetadata.builder()
                .id(videoId)
                .userId(userId)
                .originalFileName(file.getOriginalFilename())
                .originalSize(file.getSize())
                .hlsMasterPlaylistUrl(masterPlaylistUrl)
                .status("READY")
                .variants(hlsOutput.getVariants().size())
                .build();
            
            videoRepository.save(metadata);
            
            // 6. Cleanup temp files
            cleanupTempFiles(tempPath.toString(), videoId);
            
            return CompletableFuture.completedFuture(metadata);
            
        } catch (Exception e) {
            log.error("Failed to process video {}: {}", videoId, e.getMessage(), e);
            updateVideoStatus(videoId, "FAILED", e.getMessage());
            return CompletableFuture.failedFuture(e);
        }
    }
    
    private Path saveTempFile(MultipartFile file, String videoId) throws IOException {
        String tempDir = "./videos/temp";
        Files.createDirectories(Paths.get(tempDir));
        
        Path tempPath = Paths.get(tempDir, videoId + "_" + file.getOriginalFilename());
        file.transferTo(tempPath.toFile());
        
        return tempPath;
    }
    
    private String uploadOriginalToMinIO(String filePath, String videoId) throws Exception {
        String objectKey = "videos/original/" + videoId + "/" + 
            Paths.get(filePath).getFileName().toString();
        
        minioService.uploadFile(
            "file-sharing-videos",
            objectKey,
            filePath
        );
        
        return objectKey;
    }
    
    private String uploadHlsToMinIO(HlsOutput hlsOutput, String videoId) throws Exception {
        String baseKey = "videos/hls/" + videoId + "/";
        
        // Upload master playlist
        String masterKey = baseKey + "master.m3u8";
        minioService.uploadFile(
            "file-sharing-videos",
            masterKey,
            hlsOutput.getMasterPlaylistPath()
        );
        
        // Upload all variants
        for (HlsOutput.QualityVariant variant : hlsOutput.getVariants()) {
            // Upload variant playlist
            String variantPlaylistKey = baseKey + 
                Paths.get(variant.getPlaylistPath()).getFileName().toString();
            minioService.uploadFile(
                "file-sharing-videos",
                variantPlaylistKey,
                variant.getPlaylistPath()
            );
            
            // Upload all segments
            for (String segmentPath : variant.getSegmentPaths()) {
                String segmentKey = baseKey + variant.getQuality() + "/" +
                    Paths.get(segmentPath).getFileName().toString();
                minioService.uploadFile(
                    "file-sharing-videos",
                    segmentKey,
                    segmentPath
                );
            }
        }
        
        // Return streaming URL
        return minioService.getPresignedUrl("file-sharing-videos", masterKey);
    }
    
    private void cleanupTempFiles(String tempPath, String videoId) {
        try {
            // Delete temp input file
            Files.deleteIfExists(Paths.get(tempPath));
            
            // Delete processed HLS files
            Path processedDir = Paths.get("./videos/processed", videoId);
            if (Files.exists(processedDir)) {
                Files.walk(processedDir)
                    .sorted(Comparator.reverseOrder())
                    .forEach(path -> {
                        try { Files.deleteIfExists(path); }
                        catch (IOException e) { log.warn("Failed to delete: {}", path); }
                    });
            }
        } catch (IOException e) {
            log.warn("Cleanup failed: {}", e.getMessage());
        }
    }
    
    private void updateVideoStatus(String videoId, String status, String error) {
        try {
            VideoMetadata metadata = videoRepository.findById(videoId).orElse(null);
            if (metadata != null) {
                metadata.setStatus(status);
                metadata.setErrorMessage(error);
                videoRepository.save(metadata);
            }
        } catch (Exception e) {
            log.error("Failed to update status: {}", e.getMessage());
        }
    }
}
```

#### 1.2. Controller

```java
package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Slf4j
@RestController
@RequestMapping("/api/videos")
@RequiredArgsConstructor
public class VideoUploadController {
    
    private final VideoProcessingService videoProcessingService;
    
    /**
     * Upload video và tự động encode HLS
     */
    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadVideo(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        // Validate file
        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "File is empty"));
        }
        
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("video/")) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "File must be a video"));
        }
        
        // Start async processing
        CompletableFuture<VideoMetadata> future = videoProcessingService
            .processVideoAsync(file, userDetails.getUsername());
        
        // Return immediately with processing status
        Map<String, String> response = new HashMap<>();
        response.put("status", "PROCESSING");
        response.put("message", "Video is being processed");
        
        // Optionally wait for result (for synchronous response)
        try {
            VideoMetadata metadata = future.get(5, TimeUnit.SECONDS);
            response.put("videoId", metadata.getId());
            response.put("status", metadata.getStatus());
        } catch (TimeoutException e) {
            response.put("message", "Processing in background");
        }
        
        return ResponseEntity.accepted().body(response);
    }
    
    /**
     * Lấy trạng thái xử lý video
     */
    @GetMapping("/{videoId}/status")
    public ResponseEntity<VideoMetadata> getVideoStatus(@PathVariable String videoId) {
        VideoMetadata metadata = videoRepository.findById(videoId)
            .orElseThrow(() -> new ResourceNotFoundException("Video not found"));
        
        return ResponseEntity.ok(metadata);
    }
    
    /**
     * Lấy streaming URL
     */
    @GetMapping("/{videoId}/stream")
    public ResponseEntity<Map<String, String>> getStreamingUrl(@PathVariable String videoId) {
        VideoMetadata metadata = videoRepository.findById(videoId)
            .orElseThrow(() -> new ResourceNotFoundException("Video not found"));
        
        if (!"READY".equals(metadata.getStatus())) {
            return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(Map.of("status", metadata.getStatus()));
        }
        
        return ResponseEntity.ok(Map.of(
            "streamingUrl", metadata.getHlsMasterPlaylistUrl(),
            "status", metadata.getStatus()
        ));
    }
}
```

#### 1.3. MongoDB Entity

```java
package org.example.filesharing.entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "videos")
public class VideoMetadata {
    
    @Id
    private String id;
    
    private String userId;
    private String originalFileName;
    private Long originalSize;
    
    private String hlsMasterPlaylistUrl;
    private Integer variants;  // Số lượng quality variants
    
    private String status;  // PROCESSING, READY, FAILED
    private String errorMessage;
    
    private LocalDateTime uploadedAt;
    private LocalDateTime processedAt;
}
```

---

## Use Case 2: Live Video Streaming Preview

### Workflow
```
Video đang upload → Extract thumbnail → Generate preview GIF
```

### Code Example

```java
package org.example.filesharing.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class VideoPreviewService {
    
    private final FFmpegCLIService ffmpegService;
    
    /**
     * Tạo thumbnail từ video
     */
    public String generateThumbnail(String videoPath, int timestampSeconds) throws IOException {
        String outputPath = videoPath.replace(".mp4", "_thumb.jpg");
        
        List<String> commands = Arrays.asList(
            "-i", videoPath,
            "-ss", String.valueOf(timestampSeconds),
            "-vframes", "1",
            "-vf", "scale=320:-1",  // Width 320, auto height
            "-q:v", "2",  // Quality 1-31, lower is better
            outputPath
        );
        
        ffmpegService.executeFFmpegCommand(commands);
        log.info("Thumbnail created: {}", outputPath);
        
        return outputPath;
    }
    
    /**
     * Tạo animated GIF preview
     */
    public String generatePreviewGif(String videoPath, int startSeconds, int duration) 
            throws IOException {
        
        String outputPath = videoPath.replace(".mp4", "_preview.gif");
        
        List<String> commands = Arrays.asList(
            "-i", videoPath,
            "-ss", String.valueOf(startSeconds),
            "-t", String.valueOf(duration),
            "-vf", "fps=10,scale=320:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
            "-loop", "0",  // Loop forever
            outputPath
        );
        
        ffmpegService.executeFFmpegCommand(commands);
        log.info("Preview GIF created: {}", outputPath);
        
        return outputPath;
    }
    
    /**
     * Tạo nhiều thumbnails (storyboard)
     */
    public List<String> generateStoryboard(String videoPath, int intervalSeconds) 
            throws Exception {
        
        VideoInfo info = ffmpegService.getVideoInfo(videoPath);
        int durationSeconds = (int) (info.getDuration() / 1000);
        
        List<String> thumbnails = new ArrayList<>();
        Path outputDir = Paths.get("./videos/thumbnails", UUID.randomUUID().toString());
        Files.createDirectories(outputDir);
        
        for (int i = 0; i < durationSeconds; i += intervalSeconds) {
            String thumbPath = outputDir.resolve("thumb_" + i + ".jpg").toString();
            
            List<String> commands = Arrays.asList(
                "-i", videoPath,
                "-ss", String.valueOf(i),
                "-vframes", "1",
                "-vf", "scale=160:-1",
                "-q:v", "2",
                thumbPath
            );
            
            ffmpegService.executeFFmpegCommand(commands);
            thumbnails.add(thumbPath);
        }
        
        log.info("Created {} thumbnails", thumbnails.size());
        return thumbnails;
    }
}
```

---

## Use Case 3: Video Sharing với Token-based Access

### Workflow
```
User share video → Generate share token → Return HLS URL với token
→ Frontend play với token authentication
```

### Code Example

#### 3.1. Share Service

```java
package org.example.filesharing.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class VideoShareService {
    
    private final VideoMetadataRepository videoRepository;
    private final ShareTokenRepository tokenRepository;
    
    /**
     * Tạo share token cho video
     */
    public ShareToken createShareToken(String videoId, String userId, int expiryHours) {
        VideoMetadata video = videoRepository.findById(videoId)
            .orElseThrow(() -> new ResourceNotFoundException("Video not found"));
        
        if (!video.getUserId().equals(userId)) {
            throw new ForbiddenException("Not video owner");
        }
        
        ShareToken token = ShareToken.builder()
            .token(UUID.randomUUID().toString())
            .videoId(videoId)
            .userId(userId)
            .expiresAt(LocalDateTime.now().plusHours(expiryHours))
            .build();
        
        tokenRepository.save(token);
        log.info("Share token created: {} for video {}", token.getToken(), videoId);
        
        return token;
    }
    
    /**
     * Lấy streaming URL với token
     */
    public String getStreamingUrlWithToken(String token) {
        ShareToken shareToken = tokenRepository.findByToken(token)
            .orElseThrow(() -> new ResourceNotFoundException("Invalid token"));
        
        if (shareToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ForbiddenException("Token expired");
        }
        
        VideoMetadata video = videoRepository.findById(shareToken.getVideoId())
            .orElseThrow(() -> new ResourceNotFoundException("Video not found"));
        
        if (!"READY".equals(video.getStatus())) {
            throw new IllegalStateException("Video not ready");
        }
        
        // Return URL với token
        return video.getHlsMasterPlaylistUrl() + "?token=" + token;
    }
}
```

#### 3.2. Controller

```java
@RestController
@RequestMapping("/api/videos")
@RequiredArgsConstructor
public class VideoShareController {
    
    private final VideoShareService shareService;
    
    @PostMapping("/{videoId}/share")
    public ResponseEntity<Map<String, String>> shareVideo(
            @PathVariable String videoId,
            @RequestParam(defaultValue = "24") int expiryHours,
            @AuthenticationPrincipal UserDetails userDetails) {
        
        ShareToken token = shareService.createShareToken(
            videoId, 
            userDetails.getUsername(), 
            expiryHours
        );
        
        String shareUrl = "http://localhost:5173/watch/" + token.getToken();
        
        return ResponseEntity.ok(Map.of(
            "shareUrl", shareUrl,
            "token", token.getToken(),
            "expiresAt", token.getExpiresAt().toString()
        ));
    }
    
    @GetMapping("/watch/{token}")
    public ResponseEntity<Map<String, String>> getWatchUrl(@PathVariable String token) {
        String streamingUrl = shareService.getStreamingUrlWithToken(token);
        
        return ResponseEntity.ok(Map.of(
            "streamingUrl", streamingUrl
        ));
    }
}
```

---

## Use Case 4: Video Analytics (Watch Time, Quality Selection)

### Frontend Integration với HLS.js

```html
<!DOCTYPE html>
<html>
<head>
    <title>Video Player with Analytics</title>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
</head>
<body>
    <video id="video" controls width="800"></video>
    
    <div id="analytics">
        <p>Quality: <span id="current-quality">-</span></p>
        <p>Watch Time: <span id="watch-time">0</span>s</p>
        <p>Buffer Events: <span id="buffer-count">0</span></p>
    </div>
    
    <script>
        const video = document.getElementById('video');
        const token = new URLSearchParams(window.location.search).get('token');
        const videoSrc = `http://localhost:5000/api/videos/watch/${token}`;
        
        let watchTime = 0;
        let bufferCount = 0;
        let currentQuality = '';
        
        // Initialize HLS
        if (Hls.isSupported()) {
            const hls = new Hls({
                debug: false,
                enableWorker: true,
                lowLatencyMode: false,
            });
            
            hls.loadSource(videoSrc);
            hls.attachMedia(video);
            
            // Track quality changes
            hls.on(Hls.Events.LEVEL_SWITCHED, function(event, data) {
                const level = hls.levels[data.level];
                currentQuality = `${level.width}x${level.height}`;
                document.getElementById('current-quality').textContent = currentQuality;
                
                sendAnalytics({
                    event: 'quality_change',
                    quality: currentQuality,
                    timestamp: Date.now()
                });
            });
            
            // Track buffering
            hls.on(Hls.Events.BUFFER_STALLED, function() {
                bufferCount++;
                document.getElementById('buffer-count').textContent = bufferCount;
                
                sendAnalytics({
                    event: 'buffer',
                    timestamp: Date.now()
                });
            });
            
            // Ready to play
            hls.on(Hls.Events.MANIFEST_PARSED, function() {
                console.log('Video ready to play');
            });
        }
        
        // Track watch time
        setInterval(() => {
            if (!video.paused) {
                watchTime++;
                document.getElementById('watch-time').textContent = watchTime;
                
                // Send analytics every 10 seconds
                if (watchTime % 10 === 0) {
                    sendAnalytics({
                        event: 'watch_progress',
                        watchTime: watchTime,
                        currentTime: video.currentTime,
                        duration: video.duration
                    });
                }
            }
        }, 1000);
        
        // Send analytics to backend
        function sendAnalytics(data) {
            fetch(`http://localhost:5000/api/videos/analytics/${token}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        }
    </script>
</body>
</html>
```

---

## Use Case 5: Batch Video Processing

### Background Job với Spring Scheduler

```java
package org.example.filesharing.jobs;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class VideoProcessingJob {
    
    private final VideoMetadataRepository videoRepository;
    private final VideoProcessingService processingService;
    
    /**
     * Xử lý các video đang pending mỗi 5 phút
     */
    @Scheduled(fixedDelay = 300000) // 5 minutes
    public void processPendingVideos() {
        log.info("Starting batch video processing...");
        
        List<VideoMetadata> pendingVideos = videoRepository
            .findByStatus("PENDING")
            .stream()
            .limit(10)  // Process max 10 videos per batch
            .toList();
        
        if (pendingVideos.isEmpty()) {
            log.info("No pending videos to process");
            return;
        }
        
        log.info("Found {} pending videos", pendingVideos.size());
        
        for (VideoMetadata video : pendingVideos) {
            try {
                // Update status to processing
                video.setStatus("PROCESSING");
                videoRepository.save(video);
                
                // Process video
                processingService.processVideoAsync(video);
                
            } catch (Exception e) {
                log.error("Failed to process video {}: {}", 
                    video.getId(), e.getMessage(), e);
                
                video.setStatus("FAILED");
                video.setErrorMessage(e.getMessage());
                videoRepository.save(video);
            }
        }
        
        log.info("Batch processing completed");
    }
    
    /**
     * Cleanup expired temp files mỗi ngày
     */
    @Scheduled(cron = "0 0 2 * * *") // 2 AM daily
    public void cleanupExpiredFiles() {
        log.info("Starting cleanup of expired files...");
        
        LocalDateTime cutoff = LocalDateTime.now().minusDays(7);
        
        List<VideoMetadata> oldVideos = videoRepository
            .findByStatusAndProcessedAtBefore("READY", cutoff);
        
        for (VideoMetadata video : oldVideos) {
            try {
                // Delete from MinIO
                minioService.deleteFolder("file-sharing-videos", "videos/hls/" + video.getId());
                
                // Update database
                video.setStatus("ARCHIVED");
                videoRepository.save(video);
                
                log.info("Archived video: {}", video.getId());
                
            } catch (Exception e) {
                log.error("Failed to archive video {}: {}", video.getId(), e.getMessage());
            }
        }
        
        log.info("Cleanup completed");
    }
}
```

---

## Best Practices Summary

### ✅ DO

1. **Xử lý async:** Sử dụng `@Async` cho encoding task
2. **Cleanup:** Xóa temp files sau khi xử lý
3. **Error handling:** Catch exceptions và update status
4. **Progress tracking:** Lưu status vào database
5. **Resource management:** Giới hạn số video xử lý đồng thời
6. **Storage:** Upload output lên cloud storage (MinIO/S3)
7. **Security:** Validate file type, size trước khi xử lý
8. **Monitoring:** Log mỗi bước trong pipeline

### ❌ DON'T

1. Encoding sync trong request handler
2. Giữ file temp mãi mãi
3. Process unlimited videos cùng lúc
4. Lưu output trên local disk lâu dài
5. Trust user input mà không validate
6. Bỏ qua error handling
7. Không có retry mechanism
8. Không monitor disk space

---

**Tài liệu liên quan:**
- [FFMPEG_SPRING_BOOT_GUIDE.md](./FFMPEG_SPRING_BOOT_GUIDE.md)
- [FFMPEG_QUICK_REFERENCE.md](./FFMPEG_QUICK_REFERENCE.md)
