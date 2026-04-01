# FFmpeg Quick Reference - Cheat Sheet

## 1. Các Lệnh FFmpeg Thường Dùng

### 1.1. Lấy Thông Tin Video

```bash
# Thông tin cơ bản
ffprobe -i input.mp4

# Thông tin chi tiết (JSON format)
ffprobe -v quiet -print_format json -show_format -show_streams input.mp4

# Chỉ lấy resolution
ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=s=x:p=0 input.mp4

# Lấy duration
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 input.mp4
```

### 1.2. Convert Video Format

```bash
# MP4 to WebM
ffmpeg -i input.mp4 -c:v libvpx-vp9 -c:a libopus output.webm

# AVI to MP4
ffmpeg -i input.avi -c:v libx264 -c:a aac output.mp4

# MOV to MP4
ffmpeg -i input.mov -c:v libx264 -c:a aac -strict experimental output.mp4
```

### 1.3. Resize Video

```bash
# Resize to 1280x720
ffmpeg -i input.mp4 -vf scale=1280:720 output.mp4

# Resize giữ nguyên aspect ratio (width 1280, auto height)
ffmpeg -i input.mp4 -vf scale=1280:-1 output.mp4

# Resize to 50% size
ffmpeg -i input.mp4 -vf scale=iw/2:ih/2 output.mp4
```

### 1.4. Cắt Video (Trim)

```bash
# Cắt từ giây thứ 10, lấy 30 giây
ffmpeg -i input.mp4 -ss 00:00:10 -t 00:00:30 -c copy output.mp4

# Cắt từ giây 10 đến giây 40
ffmpeg -i input.mp4 -ss 00:00:10 -to 00:00:40 -c copy output.mp4
```

### 1.5. Encode HLS (Adaptive Bitrate)

```bash
# Basic HLS
ffmpeg -i input.mp4 \
  -c:v libx264 -c:a aac \
  -hls_time 10 \
  -hls_list_size 0 \
  -hls_segment_filename "segment_%03d.ts" \
  output.m3u8

# Multi-bitrate HLS
ffmpeg -i input.mp4 \
  -filter_complex "[0:v]split=2[v1][v2]; [v1]scale=1920:1080[v1out]; [v2]scale=1280:720[v2out]" \
  -map "[v1out]" -c:v:0 libx264 -b:v:0 5000k -maxrate:v:0 5350k -bufsize:v:0 7500k \
  -map "[v2out]" -c:v:1 libx264 -b:v:1 2800k -maxrate:v:1 2996k -bufsize:v:1 4200k \
  -map a:0 -c:a:0 aac -b:a:0 128k \
  -map a:0 -c:a:1 aac -b:a:1 128k \
  -var_stream_map "v:0,a:0 v:1,a:1" \
  -master_pl_name master.m3u8 \
  -f hls -hls_time 6 -hls_list_size 0 \
  -hls_segment_filename "v%v/segment_%03d.ts" \
  v%v/output.m3u8
```

### 1.6. Extract Audio từ Video

```bash
# Extract to MP3
ffmpeg -i input.mp4 -vn -ar 44100 -ac 2 -b:a 192k output.mp3

# Extract to AAC
ffmpeg -i input.mp4 -vn -c:a copy output.aac
```

### 1.7. Ghép Video

```bash
# Tạo file list
echo "file 'video1.mp4'" > list.txt
echo "file 'video2.mp4'" >> list.txt

# Concat
ffmpeg -f concat -safe 0 -i list.txt -c copy output.mp4
```

### 1.8. Add Watermark

```bash
ffmpeg -i input.mp4 -i watermark.png \
  -filter_complex "overlay=W-w-10:H-h-10" \
  output.mp4
```

### 1.9. Speed Up/Slow Down Video

```bash
# Speed up 2x
ffmpeg -i input.mp4 -filter:v "setpts=0.5*PTS" output.mp4

# Slow down 0.5x
ffmpeg -i input.mp4 -filter:v "setpts=2.0*PTS" output.mp4
```

### 1.10. Extract Frames

```bash
# Extract 1 frame per second
ffmpeg -i input.mp4 -vf fps=1 frame_%04d.png

# Extract frame at specific time
ffmpeg -i input.mp4 -ss 00:00:10 -vframes 1 thumbnail.png
```

---

## 2. FFmpeg Commands cho HLS

### 2.1. Tạo HLS với 1 chất lượng

```bash
ffmpeg -i input.mp4 \
  -c:v libx264 -preset medium -crf 23 \
  -c:a aac -b:a 128k \
  -f hls \
  -hls_time 10 \
  -hls_list_size 0 \
  -hls_segment_filename "segment_%03d.ts" \
  output.m3u8
```

### 2.2. Tạo HLS với 2 chất lượng (Original + 720p)

```bash
# 1. Encode original quality
ffmpeg -i input.mp4 \
  -c:v libx264 -preset medium -crf 23 \
  -c:a aac -b:a 128k \
  -f hls -hls_time 10 -hls_list_size 0 \
  -hls_segment_filename "original/segment_%03d.ts" \
  original/output.m3u8

# 2. Encode 720p
ffmpeg -i input.mp4 \
  -vf scale=1280:720 \
  -c:v libx264 -preset medium -crf 23 -b:v 2500k \
  -c:a aac -b:a 128k \
  -f hls -hls_time 10 -hls_list_size 0 \
  -hls_segment_filename "720p/segment_%03d.ts" \
  720p/output.m3u8

# 3. Tạo master playlist (manual)
cat > master.m3u8 << EOF
#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080,NAME="Original"
original/output.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720,NAME="720p"
720p/output.m3u8
EOF
```

### 2.3. Tạo HLS với nhiều chất lượng (1 command)

```bash
ffmpeg -i input.mp4 \
  -filter_complex \
  "[0:v]split=3[v1][v2][v3]; \
   [v1]copy[v1out]; \
   [v2]scale=w=1280:h=720[v2out]; \
   [v3]scale=w=854:h=480[v3out]" \
  -map "[v1out]" -c:v:0 libx264 -b:v:0 5000k \
  -map "[v2out]" -c:v:1 libx264 -b:v:1 2800k \
  -map "[v3out]" -c:v:2 libx264 -b:v:2 1400k \
  -map a:0 -c:a:0 aac -b:a:0 128k \
  -map a:0 -c:a:1 aac -b:a:1 128k \
  -map a:0 -c:a:2 aac -b:a:2 96k \
  -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" \
  -master_pl_name master.m3u8 \
  -f hls -hls_time 10 -hls_list_size 0 \
  -hls_segment_filename "v%v/segment_%03d.ts" \
  v%v/output.m3u8
```

---

## 3. Java Process Builder Examples

### 3.1. Chạy FFmpeg từ Java

```java
ProcessBuilder pb = new ProcessBuilder(
    "ffmpeg",
    "-i", "input.mp4",
    "-c:v", "libx264",
    "-c:a", "aac",
    "output.mp4"
);
pb.redirectErrorStream(true);
Process process = pb.start();

// Đọc output
BufferedReader reader = new BufferedReader(
    new InputStreamReader(process.getInputStream())
);
String line;
while ((line = reader.readLine()) != null) {
    System.out.println(line);
}

int exitCode = process.waitFor();
```

### 3.2. Với Apache Commons Exec

```java
CommandLine cmdLine = new CommandLine("ffmpeg");
cmdLine.addArgument("-i");
cmdLine.addArgument("input.mp4");
cmdLine.addArgument("-c:v");
cmdLine.addArgument("libx264");
cmdLine.addArgument("output.mp4");

DefaultExecutor executor = new DefaultExecutor();
executor.setExitValue(0);

ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
PumpStreamHandler streamHandler = new PumpStreamHandler(outputStream);
executor.setStreamHandler(streamHandler);

int exitValue = executor.execute(cmdLine);
String output = outputStream.toString();
```

---

## 4. FFmpeg Options Explained

### 4.1. Video Codec Options

| Option | Description | Example |
|--------|-------------|---------|
| `-c:v` | Video codec | `libx264`, `libx265`, `libvpx-vp9` |
| `-preset` | Encoding speed | `ultrafast`, `medium`, `slow` |
| `-crf` | Quality (0-51) | `23` (default), `18` (high quality) |
| `-b:v` | Video bitrate | `5000k`, `2500k` |
| `-maxrate` | Max bitrate | `5350k` |
| `-bufsize` | Buffer size | `7500k` |

### 4.2. Audio Codec Options

| Option | Description | Example |
|--------|-------------|---------|
| `-c:a` | Audio codec | `aac`, `libmp3lame`, `libopus` |
| `-b:a` | Audio bitrate | `128k`, `192k` |
| `-ar` | Sample rate | `44100`, `48000` |
| `-ac` | Audio channels | `2` (stereo), `1` (mono) |

### 4.3. HLS Options

| Option | Description | Example |
|--------|-------------|---------|
| `-f hls` | Output format HLS | Required |
| `-hls_time` | Segment duration (s) | `10` |
| `-hls_list_size` | Max segments in playlist | `0` (unlimited) |
| `-hls_segment_filename` | Segment filename pattern | `segment_%03d.ts` |
| `-hls_flags` | HLS flags | `independent_segments` |
| `-master_pl_name` | Master playlist name | `master.m3u8` |

### 4.4. Filter Options

| Filter | Description | Example |
|--------|-------------|---------|
| `scale` | Resize video | `scale=1280:720` |
| `fps` | Change frame rate | `fps=30` |
| `crop` | Crop video | `crop=640:480:0:0` |
| `overlay` | Add overlay | `overlay=10:10` |
| `split` | Split stream | `split=2[v1][v2]` |

---

## 5. Bandwidth & Bitrate Guide

### 5.1. Recommended Bitrates

| Resolution | Video Bitrate | Audio Bitrate | Total Bandwidth |
|------------|---------------|---------------|-----------------|
| 4K (2160p) | 15-25 Mbps | 192 kbps | ~20 Mbps |
| 1080p | 5-8 Mbps | 128 kbps | ~6 Mbps |
| 720p | 2.5-4 Mbps | 128 kbps | ~3 Mbps |
| 480p | 1-1.5 Mbps | 96 kbps | ~1.5 Mbps |
| 360p | 0.5-1 Mbps | 64 kbps | ~0.8 Mbps |

### 5.2. CRF Values

| CRF | Quality | Use Case |
|-----|---------|----------|
| 18-22 | High | Archive, professional |
| 23 | Default | Good balance |
| 24-28 | Medium | Web streaming |
| 29-35 | Low | Small file size |

---

## 6. Error Messages & Solutions

### 6.1. Common Errors

**Error:** `ffmpeg: command not found`
```bash
# Solution: Install FFmpeg
# Windows: choco install ffmpeg
# Linux: sudo apt install ffmpeg
# macOS: brew install ffmpeg
```

**Error:** `Permission denied`
```bash
# Solution: Check file permissions
chmod +x /path/to/ffmpeg
```

**Error:** `Invalid argument`
```bash
# Solution: Check syntax, quote paths with spaces
ffmpeg -i "my video.mp4" output.mp4
```

**Error:** `Conversion failed`
```bash
# Solution: Check codec support
ffmpeg -codecs | grep h264
```

---

## 7. Performance Tips

### 7.1. Encoding Speed Comparison

| Preset | Speed | File Size | CPU Usage |
|--------|-------|-----------|-----------|
| ultrafast | 10x | +50% | Low |
| superfast | 8x | +30% | Medium-Low |
| veryfast | 5x | +15% | Medium |
| faster | 3x | +10% | Medium |
| fast | 2x | +5% | Medium-High |
| medium | 1x | Baseline | High |
| slow | 0.5x | -5% | Very High |
| slower | 0.3x | -10% | Very High |
| veryslow | 0.2x | -15% | Maximum |

### 7.2. Optimization Tips

✅ **Sử dụng `-preset` phù hợp:**
```bash
# Fast encoding, acceptable quality
ffmpeg -i input.mp4 -preset veryfast -crf 23 output.mp4

# Slow encoding, best quality
ffmpeg -i input.mp4 -preset slow -crf 18 output.mp4
```

✅ **Hardware Acceleration:**
```bash
# NVIDIA NVENC
ffmpeg -hwaccel cuda -i input.mp4 -c:v h264_nvenc output.mp4

# Intel Quick Sync
ffmpeg -hwaccel qsv -i input.mp4 -c:v h264_qsv output.mp4
```

✅ **Copy codec khi không cần encode lại:**
```bash
# Cắt video mà không encode lại (very fast)
ffmpeg -i input.mp4 -ss 00:00:10 -t 00:00:30 -c copy output.mp4
```

---

## 8. Master Playlist Format

### 8.1. Basic Master Playlist

```m3u8
#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080,NAME="1080p"
1080p/output.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720,NAME="720p"
720p/output.m3u8
```

### 8.2. Advanced Master Playlist

```m3u8
#EXTM3U
#EXT-X-VERSION:3

#EXT-X-STREAM-INF:BANDWIDTH=5000000,AVERAGE-BANDWIDTH=4500000,RESOLUTION=1920x1080,FRAME-RATE=30.000,CODECS="avc1.640028,mp4a.40.2"
1080p/output.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=2500000,AVERAGE-BANDWIDTH=2250000,RESOLUTION=1280x720,FRAME-RATE=30.000,CODECS="avc1.64001f,mp4a.40.2"
720p/output.m3u8

#EXT-X-STREAM-INF:BANDWIDTH=1000000,AVERAGE-BANDWIDTH=900000,RESOLUTION=854x480,FRAME-RATE=30.000,CODECS="avc1.64001e,mp4a.40.2"
480p/output.m3u8
```

### 8.3. Variant Playlist Format

```m3u8
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0

#EXTINF:10.0,
segment_000.ts
#EXTINF:10.0,
segment_001.ts
#EXTINF:10.0,
segment_002.ts
#EXT-X-ENDLIST
```

---

## 9. Testing Commands

### 9.1. Kiểm tra HLS Playlist

```bash
# Validate m3u8 file
ffprobe -v error master.m3u8

# Check segment duration
ffprobe -v error -show_entries packet=pts_time,duration_time -of csv segment_000.ts
```

### 9.2. Play HLS locally

```bash
# Using ffplay
ffplay http://localhost:8080/videos/master.m3u8

# Using VLC
vlc http://localhost:8080/videos/master.m3u8
```

---

**Tài liệu tham khảo:**
- FFmpeg Official: https://ffmpeg.org/documentation.html
- HLS Authoring Spec: https://developer.apple.com/documentation/http-live-streaming
- Video Encoding Guide: https://trac.ffmpeg.org/wiki/Encode/H.264
