## 📋 **Plan: Triển Khai Module Encode Video với FFmpeg & Kafka**

### **Tóm tắt (TL;DR)**
Xây dựng video encoding pipeline cho module `filesharing-videocodec` sử dụng:
- **FFmpeg**: Mã hoá video thành HLS (.m3u8 + .ts segments, 5 giây/segment)
- **Kafka**: Consumer nhận pre-signed URL từ topic "filesharing_encode_video"
- **ThreadPool**: 3-5 worker threads xử lý parallel encode jobs
- **MinIO**: Lưu trữ output segments
- **Retry Logic**: 3 lần retry tự động nếu encode fail

---

### **5 Phases Triển Khai**

#### **Phase 1️⃣: Infrastructure & Configuration Setup**

| Step | Chi Tiết |
|------|---------|
| **1.1** | Cấu hình `application.yml`: Kafka broker, video segment config (duration=5s, profiles=[original,720p]), retry attempts |
| **1.2** | Tạo `VideoEncodingConfig` bean: ThreadPoolTaskExecutor (core=3, max=5, queue=100, CallerRunsPolicy) |
| **1.3** | Implement `FfmpegConfig`: FFmpeg executor bean sử dụng commons-exec để run subprocess |

#### **Phase 2️⃣: Kafka Consumer Configuration**

| Step | Chi Tiết |
|------|---------|
| **2.1** | Tạo `VideoEncodingKafkaListener`: @KafkaListener(topic="filesharing_encode_video"), manual ACK |
| **2.2** | Tạo `VideoEncodingTask` (Runnable): Nhận URL + Ack callback, submit vào thread pool, handle retry |

#### **Phase 3️⃣: Core Video Encoding Service**

| Step | Chi Tiết |
|------|---------|
| **3.1** | `VideoEncodingService`: Xây dựng FFmpeg command, execute, output .m3u8 + .ts segments |
| **3.2** | `VideoUploadService`: Upload segments vào MinIO bucket `videos/{jobId}/{profile}/` |
| **3.3** | `EncodingOrchestrationService`: Orchestrate multiple profiles (original + 720p), cleanup temp, retry logic |

#### **Phase 4️⃣: Integration & Task Submission**

| Step | Chi Tiết |
|------|---------|
| **4.1** | Integrate `VideoEncodingTask` với orchestration service, retry + logging |
| **4.2** | Integrate `VideoEncodingKafkaListener` → submit task vào executor |

#### **Phase 5️⃣: Model Classes & Utilities**

| Step | Chi Tiết |
|------|---------|
| **5.1** | DTO/Models: `EncodingProfile` (enum), `EncodingResult`, `ProfileResult` |
| **5.2** | Utilities: `EncodingException`, `EncodingLogger` |

---

### **Critical Technical Details**

**FFmpeg Command Pattern** (pseudocode):
```
ffmpeg -i {inputUrl} 
  -c:v libx264 -b:v {bitrate} -s {resolution}  # Video codec + bitrate
  -c:a aac -b:a 128k                            # Audio codec
  -f hls -hls_time 5                            # HLS format, 5s segments
  -hls_list_size 0                              # Keep all segments in playlist
  output/%03d.ts                                # Segment output pattern
  output/master.m3u8                            # Master playlist
```

**Profiles**:
- **Original**: không scale resolution, bitrate ~5Mbps
- **720p**: scale to 1280x720, bitrate ~2Mbps

**Thread Pool Behavior**:
- Kafka consumer submit task → nếu có free worker, task execute ngay
- Nếu pool full → task queue (max 100), nếu queue full → CallerRunsPolicy block consumer
- Kafka broker sẽ hold message tạm thời

**Retry Strategy**:
- Fail → log error + retry (max 3 lần)
- Sau 3 lần fail → NACK message → Kafka requeue (hoặc dead-letter queue)

---

### **Relevant Files to Modify/Create**

**🔧 Modify:**
- `application.yml` — Kafka + video config

**➕ New Classes:**
```
config/
  ├── VideoEncodingConfig.java          (TaskExecutor bean)
  ├── FfmpegConfig.java                  (FFmpeg executor impl)
listener/
  └── VideoEncodingKafkaListener.java   (Kafka consumer)
service/
  ├── VideoEncodingService.java         (FFmpeg encoding logic)
  ├── VideoUploadService.java           (MinIO upload)
  └── EncodingOrchestrationService.java (Orchestration + retry)
task/
  └── VideoEncodingTask.java            (Runnable task)
model/
  └── EncodingProfile.java              (Enum)
dto/
  ├── EncodingResult.java
  └── ProfileResult.java
exception/
  └── EncodingException.java
util/
  └── EncodingLogger.java
```

---

### **Verification Checklist**

✅ **Unit Tests:**
- FFmpeg command builder (mock execution)
- MinIO upload (mock client)
- Retry logic
- Kafka listener (mock Kafka)

✅ **Integration Tests:**
- End-to-end: Kafka message → encode → MinIO (mock)
- Thread pool: concurrent tasks (verify max 5 threads)
- Error handling: simulate encode fail → verify retry

✅ **Manual Tests:**
- Send test message → verify thread pool activity
- Check MinIO bucket for segments
- Verify .m3u8 format (HLS.js compatible)

---

### **Key Decisions**

| Quyết định | Giá trị | Lý do |
|-----------|--------|------|
| Output Storage | MinIO | Reuse existing config + minioClient bean |
| Retry Strategy | Auto-retry 3 lần | Improve reliability, avoid message loss |
| Monitoring | Log file only | Yêu cầu người dùng, giảm complexity |
| Temp Storage | System /tmp | Cleanup sau upload |
| Segment Duration | 5 giây | Config từ requirements |
| Thread Pool | 3-5 workers | Config từ requirements, CallerRunsPolicy prevent memory blow-up |

---

### **⚠️ Critical Considerations**

1. **Shell Injection Risk**: FFmpeg input URL → escape properly hoặc use ProcessBuilder array
2. **URL Expiry**: Pre-signed Minio URL (~7 ngày expiry) → log warning nếu expiry sắp hết
3. **Large Files**: Stream download không load vào memory → avoid OOM
4. **HLS Compatibility**: Test output playlist với HLS.js client

---

**Status**: ✅ Kế hoạch sẵn sàng để implementation. Bạn có muốn điều chỉnh gì không, hoặc sẵn sàng bắt đầu implementation?