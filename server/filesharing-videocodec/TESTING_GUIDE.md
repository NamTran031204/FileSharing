# Quick Start & Testing Guide

## 🚀 Khởi Động Application

### 1. Kiểm tra Prerequisites
```bash
# Java 21
java -version

# Kafka broker running
# MinIO server running on localhost:9000

# FFmpeg available
src/main/resources/ffmpeg/ffmpeg.exe -version
```

### 2. Build & Run
```bash
# Build project
mvnw.cmd clean package -DskipTests

# Run application
mvnw.cmd spring-boot:run
```

---

## 🧪 Test Encoding Pipeline

### Option 1: Kafka Console Producer
```bash
# Create topic (nếu chưa có)
kafka-topics.bat --create --topic filesharing_encode_video --bootstrap-server localhost:9092

# Send test message
kafka-console-producer.bat --broker-list localhost:9092 --topic filesharing_encode_video

# Paste pre-signed URL từ MinIO (ví dụ):
http://localhost:9000/file-sharing/sample-video.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&...
```

### Option 2: Programmatic Test
Tạo file test trong `src/test/java`:

```java
@SpringBootTest
class VideoEncodingIntegrationTest {
    
    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;
    
    @Test
    void testSendEncodingMessage() {
        String presignedUrl = "http://localhost:9000/file-sharing/test.mp4?...";
        kafkaTemplate.send("filesharing_encode_video", presignedUrl);
        
        // Wait và check logs
        Thread.sleep(30000);
    }
}
```

---

## 📊 Monitor Progress

### Xem Logs
```bash
# Application logs sẽ hiển thị:
[Encoding Started] JobId: xxx, Profile: original, URL: http://...
[Segment Complete] JobId: xxx, Profile: original, Segments: 12
[Upload Started] JobId: xxx, Profile: original, Files: 0
[Upload Complete] JobId: xxx, Profile: original, Files uploaded: 13
[Profile Complete] JobId: xxx, Profile: original, Duration: 5234ms, M3U8: videos/xxx/original/master.m3u8
[Job Complete] JobId: xxx, Total Duration: 10567ms, Profiles: 2
```

### Check MinIO Bucket
```bash
# Browser: http://localhost:9000
# Login → file-sharing bucket → videos/{jobId}/
# Kiểm tra folders: original/, 720p/
# Mỗi folder có: master.m3u8 + segment_*.ts files
```

---

## 🔍 Troubleshooting

### 1. FFmpeg Not Found
**Symptom**: `Cannot run program "ffmpeg"`

**Solution**: 
- Kiểm tra đường dẫn trong application.yml
- Hoặc set environment variable:
  ```bash
  set FFMPEG_PATH=E:\DaiCuongBK\Project3\FileSharing\server\filesharing-videocodec\src\main\resources\ffmpeg\ffmpeg.exe
  ```

### 2. Kafka Connection Error
**Symptom**: `Connection refused: localhost:9092`

**Solution**:
```bash
# Start Zookeeper
zookeeper-server-start.bat config\zookeeper.properties

# Start Kafka
kafka-server-start.bat config\server.properties
```

### 3. MinIO Upload Error
**Symptom**: `The specified bucket does not exist`

**Solution**:
```bash
# Create bucket trong MinIO console
# Hoặc MinIOConfig sẽ tự tạo bucket "videos" khi khởi động
```

### 4. Thread Pool Full
**Symptom**: Warning logs về rejected tasks

**Solution**: Tăng queue-capacity trong application.yml:
```yaml
video:
  encoding:
    thread-pool:
      queue-capacity: 200  # Tăng từ 100
```

---

## 🎬 Sample FFmpeg Command Generated

```bash
ffmpeg -i http://localhost:9000/file-sharing/video.mp4?... \
  -c:v libx264 \
  -b:v 5000k \
  -c:a aac \
  -b:a 128k \
  -f hls \
  -hls_time 5 \
  -hls_list_size 0 \
  -hls_segment_filename /tmp/video-encoding/jobId/original/segment_%03d.ts \
  /tmp/video-encoding/jobId/original/master.m3u8
```

---

## 📈 Performance Tips

1. **Parallel Encoding**: Kafka partitions → nhiều consumer instances
2. **Disk I/O**: Đặt temp-dir trên SSD nếu có
3. **Network**: Đảm bảo bandwidth tốt tới MinIO
4. **Memory**: JVM heap size: `-Xmx2G` cho encoding workload

---

## ✅ Expected Output

### Successful Encoding Log:
```
INFO  [video-encoder-1] - [Encoding Started] JobId: abc-123, Profile: original
INFO  [video-encoder-1] - Executing FFmpeg command for job abc-123: ffmpeg -i ...
INFO  [video-encoder-1] - [Segment Complete] JobId: abc-123, Profile: original, Segments: 15
INFO  [video-encoder-1] - [Upload Started] JobId: abc-123, Profile: original, Files: 0
INFO  [video-encoder-1] - [Upload Complete] JobId: abc-123, Profile: original, Files uploaded: 16
INFO  [video-encoder-1] - [Profile Complete] JobId: abc-123, Profile: original, Duration: 8432ms
INFO  [video-encoder-2] - [Encoding Started] JobId: abc-123, Profile: 720p
...
INFO  [video-encoder-1] - [Job Complete] JobId: abc-123, Total Duration: 16234ms, Profiles: 2
INFO  [kafka-consumer] - Encoding task completed successfully. JobId: abc-123
```

---

## 🎯 Test Checklist

- [ ] Application starts without errors
- [ ] Kafka consumer connects và subscribes topic
- [ ] Thread pool initialized (3 core threads)
- [ ] Send test message → task submitted
- [ ] FFmpeg executes và generates .m3u8 + .ts
- [ ] Files upload to MinIO successfully
- [ ] Temp directory cleaned up
- [ ] Kafka message acknowledged
- [ ] Check MinIO: videos/{jobId}/original/ và videos/{jobId}/720p/
- [ ] Play .m3u8 file với HLS player (VLC, HLS.js)

---

**Happy Testing! 🎉**
