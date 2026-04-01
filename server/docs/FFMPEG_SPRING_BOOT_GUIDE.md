# Hướng dẫn Tích hợp FFmpeg với Spring Boot

## Tổng quan

Tài liệu này hướng dẫn cách tích hợp FFmpeg vào Spring Boot để xử lý video, bao gồm:
- Cắt video thành segments (5-10s)
- Encode video thành nhiều chất lượng (Original + 720p)
- Tạo HLS streaming (m3u8 + ts files)

---

## 1. Các Thư Viện FFmpeg cho Java/Spring Boot

### 1.1. JAVE2 (Java Audio Video Encoder)
**Ưu điểm:**
- ✅ Đóng gói sẵn FFmpeg binary cho Windows/Linux/Mac
- ✅ Không cần cài FFmpeg riêng
- ✅ API Java đơn giản, dễ sử dụng
- ✅ Hỗ trợ đầy đủ encoding, transcoding

**Nhược điểm:**
- ❌ Kích thước dependency lớn (~50MB)
- ❌ Không linh hoạt bằng FFmpeg CLI trực tiếp

### 1.2. JavaCV (Wrapper cho FFmpeg, OpenCV)
**Ưu điểm:**
- ✅ Hỗ trợ nhiều platform
- ✅ API low-level, linh hoạt cao

**Nhược điểm:**
- ❌ Phức tạp hơn JAVE2
- ❌ Kích thước rất lớn

### 1.3. FFmpeg CLI Wrapper (Khuyến nghị cho dự án này)
**Ưu điểm:**
- ✅ Linh hoạt tối đa
- ✅ Sử dụng trực tiếp FFmpeg commands
- ✅ Dễ debug và tùy chỉnh

**Nhược điểm:**
- ❌ Cần cài FFmpeg binary trên server

---

## 2. Cấu hình Dự Án

### 2.1. Thêm Dependencies vào pom.xml

#### **Phương án 1: Sử dụng JAVE2 (Khuyến nghị)**

```xml
<dependencies>
    <!-- JAVE2 - All Platforms (Windows, Linux, macOS) -->
    <dependency>
        <groupId>ws.schild</groupId>
        <artifactId>jave-all-deps</artifactId>
        <version>3.5.0</version>
    </dependency>
    
    <!-- Hoặc chỉ dùng cho Windows -->
    <dependency>
        <groupId>ws.schild</groupId>
        <artifactId>jave-core</artifactId>
        <version>3.5.0</version>
    </dependency>
    <dependency>
        <groupId>ws.schild</groupId>
        <artifactId>jave-nativebin-win64</artifactId>
        <version>3.5.0</version>
    </dependency>
</dependencies>
```

#### **Phương án 2: FFmpeg CLI Wrapper (Tự xây dựng)**

```xml
<dependencies>
    <!-- Apache Commons Exec để chạy FFmpeg CLI -->
    <dependency>
        <groupId>org.apache.commons</groupId>
        <artifactId>commons-exec</artifactId>
        <version>1.4.0</version>
    </dependency>
</dependencies>
```

---

## 3. Cấu hình Application Properties

### 3.1. application.yml

```yaml
ffmpeg:
  # Đường dẫn tới FFmpeg binary (nếu dùng CLI wrapper)
  bin-path: ${FFMPEG_BIN_PATH:ffmpeg}  # Mặc định dùng system PATH
  
  # Đường dẫn lưu output
  output-dir: ${VIDEO_OUTPUT_DIR:./videos/processed}
  temp-dir: ${VIDEO_TEMP_DIR:./videos/temp}
  
  # HLS Configuration
  hls:
    segment-duration: 10  # seconds
    segment-list-size: 0  # 0 = unlimited
    
  # Encoding presets
  encoding:
    # Chất lượng gốc
    original:
      codec: libx264
      preset: medium
      crf: 23  # Constant Rate Factor (18-28, thấp hơn = chất lượng cao hơn)
      
    # Chất lượng 720p
    hd720:
      codec: libx264
      preset: medium
      crf: 23
      width: 1280
      height: 720
      bitrate: 2500k  # Video bitrate
      audio-bitrate: 128k
```

---

## 4. Code Implementation

### 4.1. FFmpeg Configuration Bean

```java
package org.example.filesharing.configurations;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "ffmpeg")
public class FFmpegConfig {
    
    private String binPath = "ffmpeg";
    private String outputDir = "./videos/processed";
    private String tempDir = "./videos/temp";
    
    private HlsConfig hls = new HlsConfig();
    private EncodingConfig encoding = new EncodingConfig();
    
    @Data
    public static class HlsConfig {
        private int segmentDuration = 10;
        private int segmentListSize = 0;
    }
    
    @Data
    public static class EncodingConfig {
        private QualityConfig original = new QualityConfig();
        private QualityConfig hd720 = new QualityConfig();
    }
    
    @Data
    public static class QualityConfig {
        private String codec = "libx264";
        private String preset = "medium";
        private int crf = 23;
        private Integer width;
        private Integer height;
        private String bitrate;
        private String audioBitrate = "128k";
    }
}
```

### 4.2. Video Info DTO

```java
package org.example.filesharing.entities.dtos.video;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoInfo {
    private String filePath;
    private Long duration; // milliseconds
    private Integer width;
    private Integer height;
    private String codec;
    private Long bitrate;
    private Double frameRate;
    private String format;
}
```

### 4.3. HLS Output DTO

```java
package org.example.filesharing.entities.dtos.video;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HlsOutput {
    private String masterPlaylistPath;  // master.m3u8
    private List<QualityVariant> variants;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QualityVariant {
        private String quality;  // "original", "720p"
        private String playlistPath;  // output_720p.m3u8
        private List<String> segmentPaths;  // segment_0.ts, segment_1.ts, ...
        private Integer width;
        private Integer height;
        private String bandwidth;
    }
}
```

### 4.4. FFmpeg Service - Phương án 1: Sử dụng JAVE2

```java
package org.example.filesharing.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.configurations.FFmpegConfig;
import org.example.filesharing.entities.dtos.video.HlsOutput;
import org.example.filesharing.entities.dtos.video.VideoInfo;
import org.springframework.stereotype.Service;
import ws.schild.jave.*;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class FFmpegService {
    
    private final FFmpegConfig ffmpegConfig;
    
    /**
     * Lấy thông tin video
     */
    public VideoInfo getVideoInfo(String inputPath) throws EncoderException {
        File source = new File(inputPath);
        MultimediaObject mediaObject = new MultimediaObject(source);
        MultimediaInfo info = mediaObject.getInfo();
        
        VideoInfo videoInfo = VideoInfo.builder()
            .filePath(inputPath)
            .duration(info.getDuration())
            .format(info.getFormat())
            .build();
        
        if (info.getVideo() != null) {
            VideoInfo videoInfo = videoInfo.toBuilder()
                .width(info.getVideo().getSize().getWidth())
                .height(info.getVideo().getSize().getHeight())
                .codec(info.getVideo().getDecoder())
                .bitrate(info.getVideo().getBitRate().longValue())
                .frameRate(info.getVideo().getFrameRate().doubleValue())
                .build();
        }
        
        log.info("Video Info: {}x{}, duration: {}ms, codec: {}", 
            videoInfo.getWidth(), videoInfo.getHeight(), 
            videoInfo.getDuration(), videoInfo.getCodec());
        
        return videoInfo;
    }
    
    /**
     * Encode video thành HLS với nhiều chất lượng
     */
    public HlsOutput encodeToHLS(String inputPath, String outputBaseName) throws Exception {
        VideoInfo videoInfo = getVideoInfo(inputPath);
        
        // Tạo thư mục output
        Path outputDir = Paths.get(ffmpegConfig.getOutputDir(), outputBaseName);
        Files.createDirectories(outputDir);
        
        List<HlsOutput.QualityVariant> variants = new ArrayList<>();
        
        // 1. Encode chất lượng gốc
        HlsOutput.QualityVariant originalVariant = encodeVariant(
            inputPath, 
            outputDir.toString(), 
            "original",
            null, // Giữ nguyên resolution
            null,
            videoInfo
        );
        variants.add(originalVariant);
        
        // 2. Encode 720p nếu video > 720p
        if (videoInfo.getHeight() != null && videoInfo.getHeight() > 720) {
            HlsOutput.QualityVariant hd720Variant = encodeVariant(
                inputPath,
                outputDir.toString(),
                "720p",
                1280,
                720,
                videoInfo
            );
            variants.add(hd720Variant);
        }
        
        // 3. Tạo master playlist
        String masterPlaylistPath = createMasterPlaylist(outputDir.toString(), variants);
        
        return HlsOutput.builder()
            .masterPlaylistPath(masterPlaylistPath)
            .variants(variants)
            .build();
    }
    
    /**
     * Encode một variant (chất lượng cụ thể)
     * Lưu ý: JAVE2 không hỗ trợ trực tiếp HLS, cần dùng FFmpeg CLI
     * Phương thức này sẽ được implement trong phần CLI Wrapper
     */
    private HlsOutput.QualityVariant encodeVariant(
            String inputPath, 
            String outputDir,
            String quality,
            Integer targetWidth,
            Integer targetHeight,
            VideoInfo videoInfo) throws Exception {
        
        // Sử dụng FFmpeg CLI wrapper (xem phần 4.5)
        throw new UnsupportedOperationException(
            "HLS encoding với JAVE2 yêu cầu FFmpeg CLI. Xem phần 4.5 để implement."
        );
    }
    
    /**
     * Tạo master playlist
     */
    private String createMasterPlaylist(String outputDir, List<HlsOutput.QualityVariant> variants) 
            throws Exception {
        
        Path masterPath = Paths.get(outputDir, "master.m3u8");
        StringBuilder content = new StringBuilder();
        
        content.append("#EXTM3U\n");
        content.append("#EXT-X-VERSION:3\n\n");
        
        for (HlsOutput.QualityVariant variant : variants) {
            content.append(String.format(
                "#EXT-X-STREAM-INF:BANDWIDTH=%s,RESOLUTION=%dx%d\n",
                variant.getBandwidth(),
                variant.getWidth(),
                variant.getHeight()
            ));
            content.append(Paths.get(variant.getPlaylistPath()).getFileName().toString()).append("\n");
        }
        
        Files.write(masterPath, content.toString().getBytes());
        log.info("Master playlist created: {}", masterPath);
        
        return masterPath.toString();
    }
}
```

### 4.5. FFmpeg CLI Wrapper Service (Khuyến nghị)

```java
package org.example.filesharing.services;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.exec.*;
import org.example.filesharing.configurations.FFmpegConfig;
import org.example.filesharing.entities.dtos.video.HlsOutput;
import org.example.filesharing.entities.dtos.video.VideoInfo;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class FFmpegCLIService {
    
    private final FFmpegConfig ffmpegConfig;
    
    /**
     * Chạy FFmpeg command
     */
    private String executeFFmpegCommand(List<String> commands) throws IOException {
        CommandLine cmdLine = new CommandLine(ffmpegConfig.getBinPath());
        commands.forEach(cmdLine::addArgument);
        
        DefaultExecutor executor = new DefaultExecutor();
        executor.setExitValue(0);
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ByteArrayOutputStream errorStream = new ByteArrayOutputStream();
        
        PumpStreamHandler streamHandler = new PumpStreamHandler(outputStream, errorStream);
        executor.setStreamHandler(streamHandler);
        
        try {
            int exitValue = executor.execute(cmdLine);
            String output = errorStream.toString(); // FFmpeg ghi log vào stderr
            log.debug("FFmpeg output: {}", output);
            return output;
        } catch (ExecuteException e) {
            String error = errorStream.toString();
            log.error("FFmpeg error: {}", error);
            throw new IOException("FFmpeg execution failed: " + error, e);
        }
    }
    
    /**
     * Lấy thông tin video bằng ffprobe
     */
    public VideoInfo getVideoInfo(String inputPath) throws IOException {
        List<String> commands = Arrays.asList(
            "-v", "error",
            "-show_entries", "format=duration:stream=width,height,codec_name,bit_rate,r_frame_rate",
            "-of", "default=noprint_wrappers=1",
            inputPath
        );
        
        CommandLine cmdLine = new CommandLine("ffprobe");
        commands.forEach(cmdLine::addArgument);
        
        DefaultExecutor executor = new DefaultExecutor();
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        executor.setStreamHandler(new PumpStreamHandler(outputStream));
        executor.execute(cmdLine);
        
        String output = outputStream.toString();
        return parseVideoInfo(output, inputPath);
    }
    
    private VideoInfo parseVideoInfo(String ffprobeOutput, String filePath) {
        VideoInfo.VideoInfoBuilder builder = VideoInfo.builder().filePath(filePath);
        
        Pattern widthPattern = Pattern.compile("width=(\\d+)");
        Pattern heightPattern = Pattern.compile("height=(\\d+)");
        Pattern durationPattern = Pattern.compile("duration=([\\d.]+)");
        Pattern codecPattern = Pattern.compile("codec_name=(\\w+)");
        Pattern bitratePattern = Pattern.compile("bit_rate=(\\d+)");
        Pattern fpsPattern = Pattern.compile("r_frame_rate=(\\d+)/(\\d+)");
        
        Matcher m;
        if ((m = widthPattern.matcher(ffprobeOutput)).find()) {
            builder.width(Integer.parseInt(m.group(1)));
        }
        if ((m = heightPattern.matcher(ffprobeOutput)).find()) {
            builder.height(Integer.parseInt(m.group(1)));
        }
        if ((m = durationPattern.matcher(ffprobeOutput)).find()) {
            builder.duration((long)(Double.parseDouble(m.group(1)) * 1000));
        }
        if ((m = codecPattern.matcher(ffprobeOutput)).find()) {
            builder.codec(m.group(1));
        }
        if ((m = bitratePattern.matcher(ffprobeOutput)).find()) {
            builder.bitrate(Long.parseLong(m.group(1)));
        }
        if ((m = fpsPattern.matcher(ffprobeOutput)).find()) {
            double fps = Double.parseDouble(m.group(1)) / Double.parseDouble(m.group(2));
            builder.frameRate(fps);
        }
        
        return builder.build();
    }
    
    /**
     * Encode video thành HLS với adaptive bitrate
     */
    public HlsOutput encodeToHLS(String inputPath, String outputBaseName) throws Exception {
        VideoInfo videoInfo = getVideoInfo(inputPath);
        log.info("Processing video: {}x{}, duration: {}s", 
            videoInfo.getWidth(), videoInfo.getHeight(), videoInfo.getDuration() / 1000);
        
        // Tạo thư mục output
        Path outputDir = Paths.get(ffmpegConfig.getOutputDir(), outputBaseName);
        Files.createDirectories(outputDir);
        
        List<HlsOutput.QualityVariant> variants = new ArrayList<>();
        
        // 1. Encode chất lượng gốc
        HlsOutput.QualityVariant originalVariant = encodeHLSVariant(
            inputPath,
            outputDir.toString(),
            "original",
            videoInfo.getWidth(),
            videoInfo.getHeight(),
            null // Giữ nguyên bitrate
        );
        variants.add(originalVariant);
        
        // 2. Encode 720p nếu video > 720p
        if (videoInfo.getHeight() != null && videoInfo.getHeight() > 720) {
            HlsOutput.QualityVariant hd720Variant = encodeHLSVariant(
                inputPath,
                outputDir.toString(),
                "720p",
                1280,
                720,
                "2500k"
            );
            variants.add(hd720Variant);
        }
        
        // 3. Tạo master playlist
        String masterPlaylistPath = createMasterPlaylist(outputDir.toString(), variants);
        
        log.info("HLS encoding completed. Master playlist: {}", masterPlaylistPath);
        return HlsOutput.builder()
            .masterPlaylistPath(masterPlaylistPath)
            .variants(variants)
            .build();
    }
    
    /**
     * Encode một variant HLS
     */
    private HlsOutput.QualityVariant encodeHLSVariant(
            String inputPath,
            String outputDir,
            String quality,
            Integer width,
            Integer height,
            String bitrate) throws IOException {
        
        String outputName = "output_" + quality;
        String playlistPath = Paths.get(outputDir, outputName + ".m3u8").toString();
        String segmentPattern = Paths.get(outputDir, outputName + "_%03d.ts").toString();
        
        FFmpegConfig.QualityConfig config = quality.equals("original") 
            ? ffmpegConfig.getEncoding().getOriginal()
            : ffmpegConfig.getEncoding().getHd720();
        
        List<String> commands = new ArrayList<>(Arrays.asList(
            "-i", inputPath,
            "-c:v", config.getCodec(),
            "-preset", config.getPreset(),
            "-crf", String.valueOf(config.getCrf()),
            "-c:a", "aac",
            "-b:a", config.getAudioBitrate()
        ));
        
        // Thêm scale nếu cần resize
        if (width != null && height != null) {
            commands.addAll(Arrays.asList(
                "-vf", String.format("scale=%d:%d", width, height)
            ));
        }
        
        // Thêm video bitrate nếu có
        if (bitrate != null) {
            commands.addAll(Arrays.asList("-b:v", bitrate));
        }
        
        // HLS options
        commands.addAll(Arrays.asList(
            "-f", "hls",
            "-hls_time", String.valueOf(ffmpegConfig.getHls().getSegmentDuration()),
            "-hls_list_size", String.valueOf(ffmpegConfig.getHls().getSegmentListSize()),
            "-hls_segment_filename", segmentPattern,
            "-hls_flags", "independent_segments",  // Mỗi segment có thể play độc lập
            playlistPath
        ));
        
        log.info("Encoding {} variant: {}x{}", quality, width, height);
        executeFFmpegCommand(commands);
        
        // Đọc danh sách segments từ playlist
        List<String> segments = parseSegmentsFromPlaylist(playlistPath);
        
        return HlsOutput.QualityVariant.builder()
            .quality(quality)
            .playlistPath(playlistPath)
            .segmentPaths(segments)
            .width(width)
            .height(height)
            .bandwidth(estimateBandwidth(bitrate))
            .build();
    }
    
    /**
     * Parse danh sách segments từ m3u8 playlist
     */
    private List<String> parseSegmentsFromPlaylist(String playlistPath) throws IOException {
        List<String> segments = new ArrayList<>();
        Path baseDir = Paths.get(playlistPath).getParent();
        
        Files.lines(Paths.get(playlistPath))
            .filter(line -> line.endsWith(".ts"))
            .forEach(line -> segments.add(baseDir.resolve(line).toString()));
        
        log.info("Found {} segments in playlist", segments.size());
        return segments;
    }
    
    /**
     * Ước tính bandwidth từ bitrate
     */
    private String estimateBandwidth(String bitrate) {
        if (bitrate == null) return "5000000"; // Default 5 Mbps
        
        // Convert "2500k" -> 2500000
        String numeric = bitrate.replaceAll("[^0-9]", "");
        int bps = Integer.parseInt(numeric) * 1000;
        return String.valueOf(bps);
    }
    
    /**
     * Tạo master playlist
     */
    private String createMasterPlaylist(String outputDir, List<HlsOutput.QualityVariant> variants) 
            throws IOException {
        
        Path masterPath = Paths.get(outputDir, "master.m3u8");
        StringBuilder content = new StringBuilder();
        
        content.append("#EXTM3U\n");
        content.append("#EXT-X-VERSION:3\n\n");
        
        for (HlsOutput.QualityVariant variant : variants) {
            content.append(String.format(
                "#EXT-X-STREAM-INF:BANDWIDTH=%s,RESOLUTION=%dx%d,NAME=\"%s\"\n",
                variant.getBandwidth(),
                variant.getWidth(),
                variant.getHeight(),
                variant.getQuality()
            ));
            
            // Chỉ lấy tên file, không lấy full path
            String playlistFileName = Paths.get(variant.getPlaylistPath()).getFileName().toString();
            content.append(playlistFileName).append("\n\n");
        }
        
        Files.write(masterPath, content.toString().getBytes());
        log.info("Master playlist created: {}", masterPath);
        
        return masterPath.toString();
    }
    
    /**
     * Cắt video thành segments mà không encode lại (fast)
     */
    public List<String> segmentVideo(String inputPath, String outputDir, int segmentDuration) 
            throws IOException {
        
        Files.createDirectories(Paths.get(outputDir));
        String segmentPattern = Paths.get(outputDir, "segment_%03d.ts").toString();
        
        List<String> commands = Arrays.asList(
            "-i", inputPath,
            "-c", "copy",  // Copy codec, không encode lại
            "-f", "segment",
            "-segment_time", String.valueOf(segmentDuration),
            "-reset_timestamps", "1",
            segmentPattern
        );
        
        log.info("Segmenting video into {}s chunks", segmentDuration);
        executeFFmpegCommand(commands);
        
        // Tìm tất cả segments
        List<String> segments = new ArrayList<>();
        Files.list(Paths.get(outputDir))
            .filter(path -> path.toString().endsWith(".ts"))
            .sorted()
            .forEach(path -> segments.add(path.toString()));
        
        log.info("Created {} segments", segments.size());
        return segments;
    }
}
```

### 4.6. Video Controller

```java
package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.entities.dtos.video.HlsOutput;
import org.example.filesharing.entities.dtos.video.VideoInfo;
import org.example.filesharing.services.FFmpegCLIService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/videos")
@RequiredArgsConstructor
public class VideoController {
    
    private final FFmpegCLIService ffmpegService;
    
    /**
     * Upload và encode video thành HLS
     */
    @PostMapping("/upload-and-encode")
    public ResponseEntity<HlsOutput> uploadAndEncode(
            @RequestParam("file") MultipartFile file) throws Exception {
        
        // Lưu file upload
        String originalFileName = file.getOriginalFilename();
        String videoId = UUID.randomUUID().toString();
        String tempFileName = videoId + "_" + originalFileName;
        
        Path tempPath = Paths.get("./videos/temp", tempFileName);
        Files.createDirectories(tempPath.getParent());
        file.transferTo(tempPath.toFile());
        
        log.info("Video uploaded: {}", tempPath);
        
        // Encode thành HLS
        HlsOutput output = ffmpegService.encodeToHLS(
            tempPath.toString(),
            videoId
        );
        
        // Xóa file temp (optional)
        // Files.deleteIfExists(tempPath);
        
        return ResponseEntity.ok(output);
    }
    
    /**
     * Lấy thông tin video
     */
    @GetMapping("/info")
    public ResponseEntity<VideoInfo> getVideoInfo(@RequestParam String path) throws Exception {
        VideoInfo info = ffmpegService.getVideoInfo(path);
        return ResponseEntity.ok(info);
    }
    
    /**
     * Cắt video thành segments
     */
    @PostMapping("/segment")
    public ResponseEntity<List<String>> segmentVideo(
            @RequestParam String inputPath,
            @RequestParam(defaultValue = "10") int segmentDuration) throws Exception {
        
        String outputDir = "./videos/segments/" + UUID.randomUUID();
        List<String> segments = ffmpegService.segmentVideo(
            inputPath,
            outputDir,
            segmentDuration
        );
        
        return ResponseEntity.ok(segments);
    }
}
```

---

## 5. API Reference

### 5.1. Upload và Encode Video

**Endpoint:** `POST /api/videos/upload-and-encode`

**Request:**
```
Content-Type: multipart/form-data
file: <video file>
```

**Response:**
```json
{
  "masterPlaylistPath": "/videos/processed/abc123/master.m3u8",
  "variants": [
    {
      "quality": "original",
      "playlistPath": "/videos/processed/abc123/output_original.m3u8",
      "segmentPaths": [
        "/videos/processed/abc123/output_original_000.ts",
        "/videos/processed/abc123/output_original_001.ts"
      ],
      "width": 1920,
      "height": 1080,
      "bandwidth": "5000000"
    },
    {
      "quality": "720p",
      "playlistPath": "/videos/processed/abc123/output_720p.m3u8",
      "segmentPaths": [
        "/videos/processed/abc123/output_720p_000.ts",
        "/videos/processed/abc123/output_720p_001.ts"
      ],
      "width": 1280,
      "height": 720,
      "bandwidth": "2500000"
    }
  ]
}
```

### 5.2. Lấy Thông Tin Video

**Endpoint:** `GET /api/videos/info?path={videoPath}`

**Response:**
```json
{
  "filePath": "/videos/sample.mp4",
  "duration": 120000,
  "width": 1920,
  "height": 1080,
  "codec": "h264",
  "bitrate": 5000000,
  "frameRate": 30.0,
  "format": "mp4"
}
```

### 5.3. Cắt Video Thành Segments

**Endpoint:** `POST /api/videos/segment?inputPath={path}&segmentDuration=10`

**Response:**
```json
[
  "/videos/segments/xyz/segment_000.ts",
  "/videos/segments/xyz/segment_001.ts",
  "/videos/segments/xyz/segment_002.ts"
]
```

---

## 6. Cài Đặt FFmpeg

### 6.1. Windows

#### **Cách 1: Chocolatey (Khuyến nghị)**
```powershell
choco install ffmpeg
```

#### **Cách 2: Manual Download**
1. Tải FFmpeg từ: https://www.gyan.dev/ffmpeg/builds/
2. Giải nén vào `C:\ffmpeg`
3. Thêm `C:\ffmpeg\bin` vào System PATH

### 6.2. Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

### 6.3. macOS
```bash
brew install ffmpeg
```

### 6.4. Kiểm tra cài đặt
```bash
ffmpeg -version
ffprobe -version
```

---

## 7. Testing

### 7.1. Test với cURL

```bash
# Upload và encode video
curl -X POST http://localhost:5000/api/videos/upload-and-encode \
  -F "file=@sample.mp4"

# Lấy thông tin video
curl "http://localhost:5000/api/videos/info?path=/path/to/video.mp4"

# Cắt video
curl -X POST "http://localhost:5000/api/videos/segment?inputPath=/path/to/video.mp4&segmentDuration=10"
```

### 7.2. Test HLS Playback

Tạo file HTML để test:

```html
<!DOCTYPE html>
<html>
<head>
    <title>HLS Video Player</title>
    <script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
</head>
<body>
    <video id="video" controls width="800"></video>
    <script>
        const video = document.getElementById('video');
        const videoSrc = 'http://localhost:5000/videos/processed/{videoId}/master.m3u8';
        
        if (Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(videoSrc);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, function() {
                video.play();
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = videoSrc;
        }
    </script>
</body>
</html>
```

---

## 8. Performance Tips

### 8.1. Tối ưu Encoding Speed

```yaml
ffmpeg:
  encoding:
    original:
      preset: ultrafast  # ultrafast, superfast, veryfast, faster, fast, medium, slow
      crf: 28  # Tăng CRF để giảm chất lượng, encode nhanh hơn
```

**Presets:**
- `ultrafast` - Nhanh nhất, chất lượng thấp
- `medium` - Cân bằng (khuyến nghị)
- `slow` - Chậm, chất lượng cao nhất

### 8.2. Hardware Acceleration

**NVIDIA GPU (NVENC):**
```java
commands.addAll(Arrays.asList(
    "-c:v", "h264_nvenc",  // Thay vì libx264
    "-preset", "p4",  // p1-p7, p4 = medium
    "-b:v", "5M"
));
```

**Intel Quick Sync:**
```java
commands.addAll(Arrays.asList(
    "-c:v", "h264_qsv",
    "-preset", "medium"
));
```

### 8.3. Async Processing

Sử dụng `@Async` để encode không chặn request:

```java
@Service
public class AsyncVideoService {
    
    @Async
    public CompletableFuture<HlsOutput> encodeVideoAsync(String inputPath, String outputName) {
        try {
            HlsOutput result = ffmpegService.encodeToHLS(inputPath, outputName);
            return CompletableFuture.completedFuture(result);
        } catch (Exception e) {
            return CompletableFuture.failedFuture(e);
        }
    }
}
```

---

## 9. Troubleshooting

### 9.1. FFmpeg not found

**Lỗi:** `java.io.IOException: Cannot run program "ffmpeg"`

**Giải pháp:**
1. Kiểm tra FFmpeg đã cài đặt: `ffmpeg -version`
2. Thêm đường dẫn vào application.yml:
```yaml
ffmpeg:
  bin-path: C:/ffmpeg/bin/ffmpeg.exe  # Windows
  # hoặc
  bin-path: /usr/bin/ffmpeg  # Linux
```

### 9.2. Out of Memory

**Lỗi:** `java.lang.OutOfMemoryError`

**Giải pháp:**
1. Tăng heap size: `java -Xmx2G -jar app.jar`
2. Xử lý video theo batch nhỏ
3. Xóa file temp sau khi encode

### 9.3. Encoding quá chậm

**Giải pháp:**
1. Sử dụng preset nhanh hơn: `ultrafast`, `veryfast`
2. Giảm CRF: 28-30
3. Sử dụng hardware acceleration
4. Giảm resolution output

---

## 10. Best Practices

### 10.1. File Organization

```
videos/
├── temp/           # Upload temp files
├── processed/      # HLS output
│   └── {videoId}/
│       ├── master.m3u8
│       ├── output_original.m3u8
│       ├── output_original_000.ts
│       ├── output_720p.m3u8
│       └── output_720p_000.ts
└── segments/       # Raw segments
```

### 10.2. Error Handling

```java
try {
    HlsOutput output = ffmpegService.encodeToHLS(input, output);
} catch (IOException e) {
    // FFmpeg execution error
    log.error("FFmpeg failed: {}", e.getMessage());
    throw new VideoProcessingException("Encoding failed", e);
} catch (Exception e) {
    // Unexpected error
    log.error("Unexpected error: {}", e.getMessage());
    throw new InternalServerException(e);
}
```

### 10.3. Resource Cleanup

```java
@PreDestroy
public void cleanup() {
    // Xóa file temp khi shutdown
    try {
        Files.walk(Paths.get(ffmpegConfig.getTempDir()))
            .sorted(Comparator.reverseOrder())
            .forEach(path -> {
                try { Files.deleteIfExists(path); }
                catch (IOException e) { log.warn("Failed to delete: {}", path); }
            });
    } catch (IOException e) {
        log.error("Cleanup failed", e);
    }
}
```

---

## 11. Tổng kết

### Khuyến nghị cho dự án:

✅ **Sử dụng FFmpeg CLI Wrapper** vì:
- Linh hoạt tối đa với FFmpeg commands
- Dễ debug và tùy chỉnh
- Hỗ trợ đầy đủ HLS features

✅ **Cấu hình encoding:**
- Original: giữ nguyên resolution, CRF 23
- 720p: nếu source > 720p, bitrate 2500k
- Segment duration: 10s

✅ **Performance:**
- Sử dụng `@Async` cho long-running tasks
- Hardware acceleration nếu có GPU
- Cleanup temp files định kỳ

---

**Tác giả:** AI Assistant  
**Ngày tạo:** 2026-04-01  
**Phiên bản:** 1.0
