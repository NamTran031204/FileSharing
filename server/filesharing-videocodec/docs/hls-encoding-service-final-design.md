# Thiết Kế Hệ Thống: HLS Video Encoding Service
**Stack:** Java 21 · Spring Boot 3 · FFmpeg · MinIO  
**Môi trường:** Single VM, CPU + RAM only  
**Mục tiêu:** Encode video sang HLS (m3u8 + ts segments) tương thích HLS.js

---

## 1. Quyết Định Kiến Trúc Nền Tảng

Trước khi đi vào chi tiết, ba quyết định sau đây không thể thương lượng và chi phối toàn bộ thiết kế:

**Quyết định 1 — Output format là HLS, bắt buộc dùng filesystem.**  
HLS tạo ra nhiều file vật lý độc lập (một file `.m3u8` và hàng chục đến hàng trăm file `.ts`). FFmpeg không thể ghi HLS qua pipe vì cần random write access. Mọi thiết kế "zero-disk" hay "pipe thẳng lên MinIO" đều không áp dụng được cho HLS. Local temp filesystem là bắt buộc.

**Quyết định 2 — Job phải được persist xuống DB trước khi xử lý.**  
Kafka consumer chỉ được commit offset sau khi job đã được persist thành công. Nếu job chỉ nằm trong in-memory queue và JVM crash, message có thể bị redelivery lặp hoặc mất khả năng truy vết trạng thái. DB là nguồn sự thật duy nhất về trạng thái của mọi job.

**Quyết định 3 — FFmpeg stderr phải được drain liên tục, không ngoại lệ.**  
Linux kernel chỉ cấp 64KB cho pipe buffer. FFmpeg ghi log rất nhiều. Nếu không có thread đọc stderr liên tục, pipe đầy, kernel block FFmpeg, server treo. Đây không phải best practice mà là yêu cầu kỹ thuật bắt buộc.

---

## 2. Kiến Trúc Tổng Thể

```
[Producer Services (Upload/API Gateway/...)]
    │
  ▼
[Kafka Topic: video.encode.requests]
  │
    ▼
[Kafka Consumer Layer]
  │  @KafkaListener nhận message + idempotency check
    │
    ▼
[Job Persistence — MongoDB]
    │  Ghi job với status = QUEUED trước khi làm bất cứ điều gì khác
    │
    ▼
[Job Queue — LinkedBlockingQueue (Phase 1) / Redis Stream (Phase 2)]
    │
    ▼
[Job Dispatcher — @Scheduled Virtual Thread]
    │  Poll queue, kiểm tra slot Bulkhead còn trống
    │
    ▼
[SemaphoreBulkhead — Resilience4j]
    │  Giới hạn số tiến trình FFmpeg chạy đồng thời
    │
    ▼
[FFmpeg Executor]
    │  ├── Virtual Thread A: drain stderr + parse progress
    │  └── CompletableFuture (process.onExit()) + timeout
    │
    ▼
[Local Temp Filesystem — /tmp/{jobId}/]
    │  FFmpeg ghi toàn bộ HLS files vào đây
    │
    ▼
[Batch Uploader — MinIO Client]
    │  Upload atomic: hoặc tất cả hoặc không gì
    │
    ▼
[Cleanup + Status Update + Notify Client]
```

---

## 3. Cấu Trúc Package Spring Boot

```
com.example.encoder
├── consumer
│   ├── EncodeRequestConsumer.java
│   └── dto
│       └── EncodeRequestMessage.java
├── job
│   ├── JobService.java
│   ├── JobDispatcher.java
│   ├── JobRepository.java
│   ├── queue
│   │   ├── JobQueue.java              (Interface — xem Mục 10)
│   │   └── InMemoryJobQueue.java      (Impl Phase 1: LinkedBlockingQueue)
│   └── domain
│       ├── JobDocument.java           (MongoDB Document)
│       └── JobStatus.java             (Enum: QUEUED, RUNNING, COMPLETED, FAILED)
├── ffmpeg
│   ├── FfmpegExecutor.java
│   ├── FfmpegCommandBuilder.java
│   ├── StderrDrainer.java
│   └── ProgressParser.java
├── storage
│   ├── MinioUploader.java             (bao gồm parallel upload logic)
│   └── TempFileManager.java
└── config
    ├── BulkheadConfig.java
    ├── MinioConfig.java
    └── ThreadConfig.java
```

---

## 4. Kafka Consumer — Đầu Vào Của Hệ Thống

Service nhận đầu vào duy nhất qua Kafka topic. Các service khác (upload service, API gateway, v.v.) publish message vào topic khi có video cần encode. Encoding service tiêu thụ message, persist job, rồi đưa vào `JobQueue` để xử lý.

### 4.1 Message Schema

Message được publish lên Kafka topic `video.encode.requests` theo định dạng JSON:

```json
{
  "jobId":      "550e8400-e29b-41d4-a716-446655440000",
  "inputKey":   "uploads/raw/video-abc.mp4",
  "callbackUrl":"https://your-service/webhook/encode-done",
  "submittedAt":"2025-04-18T10:00:00Z"
}
```

`jobId` do producer tạo ra (UUID v4). Encoding service **không tự sinh jobId** — đây là thiết kế đúng vì producer là người biết về job đầu tiên và cần dùng `jobId` để track trạng thái sau này.

### 4.2 Cấu Hình Kafka Consumer

```yaml
# application.yml
spring:
  kafka:
    bootstrap-servers: ${KAFKA_BOOTSTRAP_SERVERS:localhost:9092}
    consumer:
      group-id: video-encoding-service
      auto-offset-reset: earliest
      enable-auto-commit: false          # Bắt buộc false — tự quản lý offset
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      properties:
        spring.json.trusted.packages: "com.example.encoder.consumer.dto"
        max.poll.records: 1              # Chỉ lấy 1 message mỗi lần poll
        max.poll.interval.ms: 600000     # 10 phút — đủ thời gian để persist + enqueue
        session.timeout.ms: 30000
        heartbeat.interval.ms: 10000
    listener:
      ack-mode: MANUAL_IMMEDIATE         # Commit offset thủ công sau khi xử lý xong
      concurrency: 1                     # 1 listener thread — đủ cho single VM
```

**Giải thích các config quan trọng:**

| Config | Giá trị | Lý do |
|--------|---------|-------|
| `enable-auto-commit` | `false` | Tự kiểm soát khi nào commit offset — tránh mất message nếu crash sau poll nhưng trước khi persist |
| `ack-mode` | `MANUAL_IMMEDIATE` | Chỉ commit offset sau khi đã ghi job xuống DB thành công |
| `max.poll.records` | `1` | Nhận từng message một, xử lý tuần tự, dễ kiểm soát back-pressure |
| `max.poll.interval.ms` | `600000` | Kafka sẽ kick consumer ra khỏi group nếu không poll trong khoảng này — 10 phút đủ an toàn |
| `listener.concurrency` | `1` | Một partition, một consumer thread là đủ; tăng khi scale nhiều VM |

### 4.3 Luồng Xử Lý Khi Nhận Message

```
Kafka Topic: video.encode.requests
    │
    ▼
@KafkaListener nhận message (1 message / poll)
    │
    ├─ Kiểm tra job đã tồn tại trong DB chưa? (idempotency check)
    │  └─ Nếu đã có → commit offset, bỏ qua (tránh encode lại do redelivery)
    │
    ├─ Ghi job vào DB với status = QUEUED
    │  └─ Nếu ghi DB thất bại → KHÔNG commit offset → Kafka tự redeliver
    │
    ├─ Đẩy jobId vào JobQueue (InMemoryJobQueue / Redis)
    │  └─ Nếu queue đầy → KHÔNG commit offset → back-pressure về Kafka
    │     (consumer bị lag, Kafka giữ message, không mất)
    │
    └─ Commit offset thủ công (Acknowledgment.acknowledge())
```

**Back-pressure qua Kafka:** Khi `JobQueue` đầy (server đang xử lý tối đa), consumer không commit offset. Kafka nhận thấy consumer lag tăng nhưng không làm gì thêm — message vẫn còn trên topic, chờ consumer sẵn sàng. Đây là cơ chế back-pressure tự nhiên, không cần `429` như HTTP.

**Lưu ý về `max.poll.interval.ms`:** Nếu logic persist + enqueue mất hơn `max.poll.interval.ms`, Kafka sẽ kick consumer ra khỏi consumer group và trigger rebalance. Với `max.poll.records: 1` và persist chỉ là một thao tác insert/upsert đơn giản trong MongoDB, thời gian xử lý thường dưới 1 giây — 10 phút là ngưỡng cực kỳ an toàn.

### 4.4 Idempotency — Tránh Encode Lại Do Kafka Redelivery

Kafka đảm bảo **at-least-once delivery**. Trong một số tình huống (consumer crash sau khi persist nhưng trước khi commit offset), cùng một message có thể được deliver lần thứ hai. Cần kiểm tra `jobId` đã tồn tại trong DB trước khi insert:

```
Trước khi ghi DB: db.encode_jobs.countDocuments({ _id: jobId })
  → Nếu > 0: job đã tồn tại, commit offset và return
  → Nếu = 0: proceed với insert
```

Hoặc dùng `updateOne({_id: jobId}, {$setOnInsert: ...}, {upsert: true})` để xử lý gọn hơn ở tầng DB.

### 4.5 Dependencies Cần Thêm

```xml
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
</dependency>
```

Spring Boot 3 tự quản lý version của `spring-kafka` qua BOM — không cần khai báo version thủ công.

### 4.6 Kafka Consumer Khi Mở Rộng Ra Nhiều Service

Khi hệ thống lớn lên và cần chạy nhiều instance encoding service song song, cấu hình Kafka consumer thay đổi theo các nguyên tắc sau:

**Nguyên tắc cốt lõi:** Số consumer instance trong cùng một `group-id` không bao giờ vượt quá số partition của topic. Partition dư thừa sẽ không có consumer nào nhận — lãng phí throughput.

```
Ví dụ đúng:
  Topic video.encode.requests: 6 partitions
  Consumer group video-encoding-service: 6 instance VM
  → Mỗi VM giữ 1 partition, xử lý song song hoàn toàn

Ví dụ sai:
  Topic: 3 partitions
  Consumer group: 6 instance VM
  → 3 VM có partition, 3 VM idle — lãng phí hoàn toàn
```

**Cấu hình thay đổi khi scale ngang:**

```yaml
spring:
  kafka:
    consumer:
      group-id: video-encoding-service   # Giữ nguyên — tất cả instance cùng group
      max.poll.records: 1                # Giữ nguyên
    listener:
      concurrency: 1                     # Mỗi VM vẫn dùng 1 listener thread
                                         # Scale bằng cách thêm VM, không tăng concurrency
```

**Không tăng `listener.concurrency` để scale:** Tăng `concurrency` nghĩa là một JVM xử lý nhiều partition đồng thời, mỗi partition trên một thread riêng. Với encoding service, mỗi message đã kéo theo nhiều Virtual Thread (FFmpeg, stderr drainer, uploader) — thêm listener thread chỉ làm phức tạp hơn mà không tăng throughput thực sự. Cách đúng là thêm VM mới vào consumer group.

**Partition key:** Producer nên publish message với `key = jobId`. Kafka dùng key để routing message vào partition — cùng key luôn vào cùng partition, đảm bảo ordering cho từng job. Với encoding service, ordering per-job không quan trọng lắm (mỗi job độc lập), nhưng dùng key giúp phân bổ đều hơn qua consistent hashing.

**Topic configuration khuyến nghị khi scale:**

```
Số partition = MAX_CONCURRENT_VMs × 1 (1 partition per VM)
Replication factor = 2 (tolerant với 1 broker fail)
Retention = 24 giờ (đủ để replay nếu cần, không cần giữ lâu)
```

**Khi có nhiều loại encode khác nhau (multi-priority):** Tạo nhiều topic riêng biệt thay vì dùng một topic với priority field trong message. Ví dụ: `video.encode.high-priority` và `video.encode.normal`. Mỗi topic có consumer group riêng, Bulkhead riêng, và có thể deploy trên VM riêng nếu cần. Đây là cách Kafka-native để xử lý priority, không cần Priority Queue trong application.

---

## 5. Job Persistence — MongoDB

### 5.1 Schema

```javascript
// Collection: encode_jobs
{
  _id: UUID("550e8400-e29b-41d4-a716-446655440000"),
  inputKey: "uploads/raw/video-abc.mp4",
  outputPrefix: "videos/550e8400-e29b-41d4-a716-446655440000/",
  playlistUrl: "https://cdn.example.com/videos/.../master.m3u8",
  status: "QUEUED", // QUEUED | RUNNING | COMPLETED | FAILED
  progress: 0.0,
  encodeSpeed: null,
  errorMessage: null,
  retryCount: 0,
  callbackUrl: "https://your-service/webhook/encode-done",
  createdAt: ISODate("2025-04-18T10:00:00Z"),
  updatedAt: ISODate("2025-04-18T10:00:00Z"),
  completedAt: null
}

db.encode_jobs.createIndex({ status: 1 })
db.encode_jobs.createIndex({ createdAt: -1 })
```

### 5.2 Luồng Ghi DB

1. `@KafkaListener` nhận message từ `video.encode.requests` → kiểm tra idempotency theo `jobId`.
2. Ghi job vào MongoDB với `status = QUEUED` (insert/upsert).
3. Đẩy `jobId` vào queue nội bộ để dispatcher xử lý.
4. Commit offset thủ công khi các bước trên thành công.
5. Nếu ghi DB hoặc enqueue thất bại: không commit offset để Kafka redeliver.
6. Trước khi FFmpeg chạy → update `status = RUNNING`, `updatedAt`.
7. FFmpeg chạy → update `progress` định kỳ mỗi 5 giây (không update mỗi frame, tránh DB thrashing).
8. FFmpeg xong, upload MinIO xong → update `status = COMPLETED`, `playlistUrl`, `completedAt`.
9. Thất bại → update `status = FAILED`, `errorMessage`, tăng `retryCount`.

### 5.3 Recovery Khi Khởi Động Lại

Khi service khởi động (`@EventListener(ApplicationReadyEvent.class)`), quét MongoDB tìm tất cả job có `status = RUNNING` và reset chúng về `QUEUED` để tái xử lý. Các job này đang chạy dở khi JVM crash và cần encode lại từ đầu.

---


## 6. FFmpeg Executor

### 6.1 Lệnh FFmpeg Chuẩn

```
ffmpeg
  -reconnect 1
  -reconnect_at_eof 1
  -reconnect_streamed 1
  -reconnect_delay_max 5
  -i {presignedInputUrl}
  -c:v libx264
  -preset medium
  -crf 23
  -threads 2
  -c:a aac
  -b:a 128k
  -f hls
  -hls_time 6
  -hls_playlist_type vod
  -hls_flags delete_segments+append_list
  -hls_segment_filename /tmp/{jobId}/seg_%04d.ts
  /tmp/{jobId}/index.m3u8
```

**Giải thích các flag quan trọng:**

| Flag | Giá trị | Lý do |
|------|---------|-------|
| `-reconnect*` | 1/1/1/5 | Tự động retry HTTP khi mạng bị ngắt giữa chừng khi đọc từ MinIO |
| `-c:v libx264` | — | Tương thích tốt nhất với HLS.js trên mọi browser |
| `-preset medium` | — | Cân bằng tốc độ encode và chất lượng nén |
| `-crf 23` | 18–28 | Chất lượng constant-quality; tăng số → nhỏ file hơn nhưng kém hơn |
| `-threads 2` | 2–4 | Giới hạn thread mỗi process; đặt ở output flags để giới hạn encoder |
| `-hls_time 6` | 4–10s | Segment 6 giây: cân bằng seek accuracy và số file |
| `-hls_playlist_type vod` | — | Ghi `#EXT-X-ENDLIST` vào cuối playlist, báo hiệu video on-demand |
| `-hls_segment_filename` | pattern | Đặt tên segment có padding số để dễ sort |

**Lưu ý về `-threads`:** Flag này phải đặt ở phần output (sau tất cả input flags). Đặt trước `-i` chỉ giới hạn decoder, không giới hạn encoder — phần tốn CPU nhiều nhất.

### 6.2 Pre-signed URL Input

FFmpeg đọc trực tiếp từ MinIO qua HTTP pre-signed URL. TTL của URL cần đặt dài hơn thời gian encode tối đa ước tính (ví dụ: video 2 giờ encode ~30 phút → TTL tối thiểu 2 giờ, đặt 4 giờ để an toàn).

### 6.3 Process Management — `onExit()` Thay Vì `waitFor()`

Sử dụng `process.onExit()` thay vì `process.waitFor()` vì:
- `onExit()` trả về `CompletableFuture<Process>`, không block thread
- Dễ compose với timeout bằng `.orTimeout()`
- Rõ ràng hơn về async model

```
process.onExit()
  .orTimeout(MAX_ENCODE_MINUTES, TimeUnit.MINUTES)
  .whenComplete((p, ex) -> {
      if (ex instanceof TimeoutException) {
          process.destroyForcibly();
          markJobFailed(jobId, "Encode timeout");
      } else if (p.exitValue() != 0) {
          markJobFailed(jobId, "FFmpeg exit code: " + p.exitValue());
      } else {
          uploadAndComplete(jobId);
      }
  });
```

### 6.4 Stderr Drainer — Bắt Buộc, Chạy Song Song

Ngay sau khi `process.start()`, phải spawn Virtual Thread drain stderr trước khi làm bất cứ điều gì khác:

```
Thread.ofVirtual().start(() -> {
    try (var reader = new BufferedReader(
            new InputStreamReader(process.getErrorStream()))) {
        String line;
        while ((line = reader.readLine()) != null) {
            parseAndUpdateProgress(jobId, line);
            asyncLogger.debug("[{}] {}", jobId, line);  // KHÔNG dùng sync logger
        }
    }
});
```

**Quy tắc bắt buộc bên trong drainer:**
- Không ghi DB synchronously — progress update vào một `AtomicReference` trong bộ nhớ, một thread khác flush xuống DB định kỳ mỗi 5 giây.
- Không gọi external service.
- Chỉ dùng async logger (Log4j2 AsyncAppender hoặc Logback AsyncAppender).

### 6.5 Parse Progress Từ Stderr

FFmpeg ghi vào stderr theo định dạng:
```
frame=  247 fps= 32 q=28.0 size=    1280kB time=00:00:10.29 bitrate= 1019.2kbits/s speed=1.34x
```

Cần lấy `time` (thời gian đã encode) và chia cho `duration` (lấy từ ffprobe trước khi encode) để ra phần trăm. `speed` dùng để hiển thị tốc độ encode cho user.

---

## 7. Resource Control — SemaphoreBulkhead

### 7.1 Công Thức Tính MAX_CONCURRENT

```
THREADS_PER_PROCESS = 2   (với 1080p H.264; tăng lên 4 nếu 4K)
MAX_CONCURRENT_CPU  = floor(availableProcessors * 0.75 / THREADS_PER_PROCESS)
MAX_CONCURRENT_RAM  = floor(totalRAM_GB * 0.75 / ram_per_job_GB)
MAX_CONCURRENT      = min(MAX_CONCURRENT_CPU, MAX_CONCURRENT_RAM)
```

RAM ước tính mỗi job encode 1080p H.264: khoảng 1–1.5GB. Nếu không chắc, bắt đầu từ giá trị thấp và tăng dần sau khi load test.

**Bảng tham khảo nhanh (1080p H.264, 2 threads/process, 1.5GB RAM/job):**

| CPU Cores | RAM | MAX_CONCURRENT (CPU limited) | MAX_CONCURRENT (RAM limited) | Chọn |
|-----------|-----|------------------------------|------------------------------|------|
| 4 | 8 GB | 1 | 4 | **1** |
| 8 | 16 GB | 3 | 8 | **3** |
| 16 | 32 GB | 6 | 16 | **6** |
| 16 | 16 GB | 6 | 8 | **6** |
| 32 | 64 GB | 12 | 32 | **12** |

> Đây là **starting point**. Load test thực tế trên hardware cụ thể mới cho ra con số chính xác. Theo dõi CPU% và RAM% trong giờ cao điểm, điều chỉnh tăng/giảm theo dữ liệu thực.

### 7.2 Cấu Hình Resilience4j

```yaml
# application.yml
resilience4j:
  bulkhead:
    instances:
      ffmpeg-encoder:
        maxConcurrentCalls: 3        # Thay bằng giá trị tính từ công thức trên
        maxWaitDuration: 0ms         # Không chờ — từ chối ngay nếu đầy
```

`maxWaitDuration: 0ms` là đúng: job không vào được Bulkhead thì nằm lại queue, không bị drop. Chờ tại Bulkhead sẽ giữ thread và làm rối logic dispatcher.

---

## 8. Temp Filesystem và Batch Upload

### 8.1 Cấu Trúc Thư Mục Temp

```
/tmp/encode/{jobId}/
    index.m3u8
    seg_0000.ts
    seg_0001.ts
    seg_0002.ts
    ...
    seg_NNNN.ts
```

Đảm bảo `/tmp` mount trên ổ nhanh (SSD hoặc NVMe). Nếu server có RAM dư, có thể mount `/tmp` dưới dạng tmpfs để tăng tốc I/O write của FFmpeg.

### 8.2 Parallel Upload Lên MinIO — Virtual Threads + CompletableFuture.allOf()

Một video dài có thể sinh ra hàng trăm file `.ts`. Upload tuần tự từng file là nút thắt cổ chai nghiêm trọng vì mỗi lần upload là một lần chờ network I/O round-trip đến MinIO. Giải pháp: chia các file `.ts` thành từng batch nhỏ và upload song song bằng Virtual Threads.

**Thứ tự upload bắt buộc:**
1. Upload tất cả file `.ts` song song theo batch → chờ `CompletableFuture.allOf()` báo xong toàn bộ.
2. Chỉ sau khi mọi `.ts` đã xác nhận thành công, mới upload file `index.m3u8`.

Thứ tự này đảm bảo client không bao giờ đọc được playlist trước khi segment sẵn sàng.

**Logic parallel upload:**

Lấy danh sách tất cả file `.ts` trong `/tmp/{jobId}/`, chia thành các batch kích thước `UPLOAD_BATCH_SIZE` (khuyến nghị 10–20). Với mỗi batch, tạo một `CompletableFuture` chạy trên Virtual Thread thực hiện upload. Gom tất cả future bằng `CompletableFuture.allOf()` và block chờ. Nếu bất kỳ future nào throw exception, toàn bộ coi là thất bại và bắt đầu rollback. Sau khi allOf() hoàn thành thành công, upload `index.m3u8` đơn lẻ.

**Lý do dùng Virtual Thread ở đây:** Mỗi upload là một I/O call blocking đến MinIO SDK. Virtual Thread giải phóng platform thread trong thời gian chờ network, cho phép hàng chục upload diễn ra đồng thời mà không tốn hàng chục platform thread.

**Tham số cần config:**
```yaml
encoder:
  upload:
    batch-size: 15          # Số file .ts upload song song trong 1 batch
    # Tăng nếu MinIO có băng thông lớn và độ trễ thấp
    # Giảm nếu MinIO báo lỗi connection limit
```

**Cấu trúc trên MinIO sau khi upload xong:**
```
videos/{jobId}/
    index.m3u8       ← upload sau cùng
    seg_0000.ts
    seg_0001.ts
    ...
    seg_NNNN.ts
```

**Tính nguyên tử (Atomicity):** Nếu upload thất bại ở bất kỳ file `.ts` nào, xóa toàn bộ object đã upload trong prefix `videos/{jobId}/` trước khi retry. Tránh trạng thái "playlist có nhưng segment thiếu" trên MinIO. Chỉ cập nhật `status = COMPLETED` và ghi `playlistUrl` vào DB sau khi `index.m3u8` đã upload xong thành công.

### 8.3 Cleanup

Luôn xóa thư mục temp trong khối `finally`, bất kể thành công hay thất bại:

```
finally {
    FileUtils.deleteDirectory(new File("/tmp/encode/" + jobId));
}
```

**Fallback cleanup:** Một `@Scheduled` job chạy mỗi đêm, tìm và xóa các thư mục trong `/tmp/encode/` cũ hơn 24 giờ — dọn rác từ các lần JVM crash không chạy được khối `finally`.

---

## 9. Failure Handling và Retry

### 9.1 Phân Loại Lỗi

| Loại lỗi | Dấu hiệu nhận biết | Hành động |
|----------|-------------------|-----------|
| **Deterministic** | FFmpeg exit code 1 + stderr chứa "Invalid data", "No such file", "Decoder not found" | Ghi `FAILED`, không retry, notify client |
| **Transient — Network** | FFmpeg exit code 1 + stderr chứa "Connection refused", "Timeout", "HTTP error 5xx" | Retry với exponential backoff |
| **Transient — Timeout** | `TimeoutException` từ `orTimeout()` | Retry với exponential backoff |
| **Transient — MinIO upload** | IOException khi upload | Retry upload (không encode lại) |
| **Unknown** | Tất cả còn lại | Retry 1 lần, sau đó `FAILED` |

### 9.2 Retry Config

```yaml
# application.yml
encoder:
  retry:
    max-attempts: 3
    initial-delay-seconds: 5
    multiplier: 2.0
    # delays: 5s → 10s → 20s
```

Retry được thực hiện bằng cách đưa job trở lại queue với `retryCount` tăng lên 1. Khi `retryCount >= max-attempts`, job bị đưa vào trạng thái `FAILED` vĩnh viễn.

---

## 10. Job Dispatcher và Queue Abstraction

### 10.1 Interface JobQueue — Tách Logic Queue Thành Riêng Biệt

Queue là thành phần **có khả năng thay thế cao nhất** trong hệ thống: bắt đầu với `LinkedBlockingQueue` in-memory, sau đó có thể migrate sang Redis Stream, RabbitMQ, hoặc bất kỳ broker nào mà không ảnh hưởng đến Dispatcher hay FFmpeg Executor.

Để đảm bảo điều đó, queue phải được tách thành một interface riêng với logic implementation hoàn toàn độc lập:

```
Interface: JobQueue
─────────────────────────────────────────
+ offer(jobId: UUID): boolean
    // Thêm job vào queue
    // Trả về false nếu queue đã đầy (back-pressure)

+ poll(): UUID | null
    // Lấy job tiếp theo (non-blocking, FIFO)
    // Trả về null nếu queue trống

+ putFirst(jobId: UUID): void
    // Đưa job trở lại đầu queue (dùng khi Bulkhead đầy, chưa xử lý được)

+ size(): int
    // Dùng cho metrics

Implementation hiện tại (Phase 1):
─────────────────────────────────────────
InMemoryJobQueue implements JobQueue
  → wrap LinkedBlockingQueue<UUID>
  → capacity = encoder.queue.max-capacity (config)

Implementation tương lai (Phase 2):
─────────────────────────────────────────
RedisStreamJobQueue implements JobQueue
  → dùng Redis Stream + Consumer Group
  → hỗ trợ at-least-once delivery
  → hỗ trợ replay khi consumer crash
```

**Quy tắc quan trọng:** `JobDispatcher` chỉ được phép gọi qua interface `JobQueue`, không được import trực tiếp `LinkedBlockingQueue` hay bất kỳ implementation cụ thể nào. Spring DI inject implementation qua `@Primary` hoặc `@ConditionalOnProperty` — khi cần đổi queue, chỉ cần thay bean được inject, không đụng vào Dispatcher.

**Lý do FIFO là đúng cho encoding:** FIFO đảm bảo job submit trước được xử lý trước — công bằng và dễ dự đoán. Priority queue chỉ nên xem xét khi có nhu cầu rõ ràng (ví dụ: user trả phí cao hơn được ưu tiên), không nên thêm vào từ đầu vì tăng độ phức tạp và có nguy cơ starvation với job độ ưu tiên thấp.

### 10.2 Luồng Dispatcher

Dispatcher chạy theo `@Scheduled` với `fixedDelay = 500ms`. Interval 500ms là hợp lý cho encode job tính bằng phút — overhead polling hoàn toàn không đáng kể. Khi migrate sang Redis Stream ở giai đoạn sau, `RedisStreamJobQueue` sẽ dùng blocking pull (`XREADGROUP BLOCK`) bên trong — Dispatcher không cần thay đổi gì.

Luồng xử lý:
1. Kiểm tra Bulkhead còn slot trống không.
2. Nếu có, gọi `jobQueue.poll()` lấy job.
3. Nếu Bulkhead đầy và job đã lấy ra, gọi `jobQueue.putFirst(jobId)` trả về đầu hàng.
4. Nếu có job và có slot, spawn Virtual Thread chạy FFmpeg Executor.
5. Virtual Thread phù hợp vì phần lớn thời gian chờ `process.onExit()` — I/O wait, không chiếm platform thread.

---

## 11. Monitoring — Metrics Tối Thiểu

Sử dụng Micrometer (có sẵn trong Spring Boot Actuator) để expose các metrics sau lên Prometheus/Grafana:

| Metric | Ý nghĩa | Ngưỡng cảnh báo |
|--------|---------|-----------------|
| `ffmpeg.processes.active` | Số tiến trình FFmpeg đang chạy | = MAX_CONCURRENT |
| `ffmpeg.queue.size` | Số job đang chờ trong queue | > 50 |
| `ffmpeg.job.duration.seconds` | Thời gian encode (histogram) | p95 tăng đột biến |
| `ffmpeg.job.failed.total` | Tổng job thất bại | > 5/phút |
| `system.cpu.usage` | CPU% toàn server | > 85% |
| `jvm.memory.used` | Heap JVM | > 80% max heap |
| `disk.free` | Dung lượng đĩa còn lại tại `/tmp` | < 10 GB |

**Lưu ý về disk monitor:** `/tmp` có thể đầy nếu nhiều job lớn chạy đồng thời. Nếu disk đầy, FFmpeg sẽ fail với lỗi khó debug. Cần alert sớm khi disk còn < 10–20 GB.

---

## 12. Cấu Hình Application

```yaml
# application.yml
server:
  port: 8080

spring:
  data:
    mongodb:
      uri: ${MONGODB_URI:mongodb://localhost:27017/encoder_db}
  kafka:
    bootstrap-servers: ${KAFKA_BOOTSTRAP_SERVERS:localhost:9092}
    consumer:
      group-id: video-encoding-service
      auto-offset-reset: earliest
      enable-auto-commit: false
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      properties:
        spring.json.trusted.packages: "com.example.encoder.consumer.dto"
        max.poll.records: 1
        max.poll.interval.ms: 600000
        session.timeout.ms: 30000
        heartbeat.interval.ms: 10000
    listener:
      ack-mode: MANUAL_IMMEDIATE
      concurrency: 1

minio:
  endpoint: http://minio:9000
  access-key: ${MINIO_ACCESS_KEY}
  secret-key: ${MINIO_SECRET_KEY}
  bucket:
    input: raw-videos
    output: encoded-videos
  presigned-url:
    ttl-hours: 4

encoder:
  ffmpeg:
    binary-path: /usr/bin/ffmpeg
    threads-per-process: 2
    crf: 23
    preset: medium
    hls-time: 6
    max-timeout-minutes: 120
  bulkhead:
    max-concurrent: 3          # Tính theo công thức ở Mục 7
  queue:
    max-capacity: 300
  retry:
    max-attempts: 3
    initial-delay-seconds: 5
    multiplier: 2.0
  upload:
    batch-size: 15              # Số file .ts upload song song trong 1 batch
  temp:
    base-dir: /tmp/encode
    cleanup-age-hours: 24

management:
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus
  metrics:
    export:
      prometheus:
        enabled: true
```

---

## 13. Dependencies (pom.xml)

```xml
<!-- Spring Boot Starter -->
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-mongodb</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.kafka</groupId>
  <artifactId>spring-kafka</artifactId>
</dependency>

<!-- Database -->
<dependency>
  <groupId>org.mongodb</groupId>
  <artifactId>mongodb-driver-sync</artifactId>
</dependency>

<!-- MinIO -->
<dependency>
    <groupId>io.minio</groupId>
    <artifactId>minio</artifactId>
    <version>8.5.9</version>
</dependency>

<!-- Resilience4j -->
<dependency>
    <groupId>io.github.resilience4j</groupId>
    <artifactId>resilience4j-spring-boot3</artifactId>
    <version>2.2.0</version>
</dependency>

<!-- Monitoring -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>

<!-- Logging async -->
<dependency>
    <groupId>com.lmax</groupId>
    <artifactId>disruptor</artifactId>
    <version>3.4.4</version>
</dependency>
```

---

## 14. Lộ Trình Phát Triển

### Phase 1 — Foundation (MVP)

- [ ] Job persistence với MongoDB
- [ ] `LinkedBlockingQueue` in-memory
- [ ] FFmpeg Executor với stderr drainer
- [ ] SemaphoreBulkhead
- [ ] Batch upload lên MinIO
- [ ] Recovery khi khởi động (reset RUNNING → QUEUED)
- [ ] Cleanup fallback cron job
- [ ] Metrics cơ bản

### Phase 2 — Hardening

- [ ] Migrate queue sang Redis Stream (consumer group, at-least-once delivery)
- [ ] Phân loại lỗi retry đầy đủ
- [ ] Atomic upload với rollback khi thất bại
- [ ] Progress tracking realtime qua SSE
- [ ] ffprobe trước encode để validate input và lấy duration chính xác
- [ ] Alert khi disk `/tmp` < ngưỡng

### Phase 3 — Scale (Khi Cần)

- [ ] Horizontal scale với nhiều VM (Redis Stream consumer group tự xử lý phân tán)
- [ ] Multi-bitrate HLS (adaptive streaming)
- [ ] Hardware acceleration nếu VM được cấp GPU
- [ ] Workload classification (CPU-heavy vs I/O-heavy) nếu mở rộng sang các loại task khác

---

## 15. Tóm Tắt Các Nguyên Tắc Thiết Kế

| Nguyên tắc | Lý do |
|-----------|-------|
| **HLS → filesystem, không pipe** | HLS yêu cầu multi-file write và không hỗ trợ seekable stream |
| **Persist job trước enqueue** | Chỉ commit Kafka offset sau khi persist thành công, đảm bảo không mất trạng thái qua restart |
| **Drain stderr song song, không đồng bộ với waitFor** | 64KB pipe buffer — block stderr = block FFmpeg = server treo |
| **`process.onExit()` thay vì `waitFor()`** | Async model rõ ràng hơn, không block platform thread |
| **Virtual Thread cho stderr drainer** | Thread chủ yếu I/O wait — virtual thread là lựa chọn tự nhiên của Java 21 |
| **Bulkhead giới hạn cứng đồng thời** | Bảo vệ server khỏi CPU/RAM bão hòa trong giờ cao điểm |
| **Upload segment trước, playlist sau** | Đảm bảo player không gặp lỗi "segment not found" |
| **Phân loại lỗi trước khi retry** | Retry lỗi deterministic là lãng phí tài nguyên và che giấu bug |
| **Không optimise sớm** | Phase 1 đơn giản nhưng đúng nền; scale khi có dữ liệu thực tế |

---

## 16. Update Về Sau

Phần này ghi lại các hướng phát triển khi hệ thống vượt ra ngoài phạm vi single-VM hiện tại. Mỗi mục mô tả **điều kiện kích hoạt** (khi nào cần làm), **thay đổi kiến trúc** (thay cái gì), và **những gì không cần thay** (để tránh rewrite không cần thiết).

---

### 16.1 Mở Rộng Nhiều VM — Distributed Encoding

**Điều kiện kích hoạt:** Queue thường xuyên tồn đọng > 100 job trong giờ cao điểm dù đã tối đa hóa `MAX_CONCURRENT` trên VM hiện tại.

**Thay đổi kiến trúc:**

Bước đầu tiên và duy nhất cần thiết là **migrate `InMemoryJobQueue` sang `RedisStreamJobQueue`**. Đây chính là lý do interface `JobQueue` được tách riêng ngay từ đầu. Khi nhiều instance VM cùng consume từ Redis Stream với consumer group, Redis tự động phân phối job — mỗi job chỉ được xử lý bởi một consumer duy nhất.

Redis Stream cung cấp thêm:
- **Acknowledgement (XACK):** Consumer phải xác nhận đã xử lý xong. Nếu consumer crash trước khi XACK, job tự động được redelivered sau timeout — không mất job.
- **Pending Entry List (PEL):** Theo dõi job nào đã được deliver nhưng chưa được XACK, dùng để phát hiện job bị stuck.
- **Consumer Group:** Nhiều VM cùng subscribe vào một stream, Redis cân bằng tải tự động.

Các thành phần **không cần thay đổi:** `JobDispatcher`, `FfmpegExecutor`, `MinioUploader`, `JobRepository` — toàn bộ vẫn chạy y nguyên trên mỗi VM.

**Lưu ý:** Khi chạy nhiều VM, thư mục `/tmp/encode/{jobId}/` là local với từng VM. Đây không phải vấn đề vì mỗi job chỉ chạy trên một VM duy nhất tại một thời điểm. Không cần shared filesystem.

---

### 16.2 Bỏ Temp Filesystem — Stream Thẳng Lên MinIO

**Điều kiện kích hoạt:** Disk space trở thành bottleneck thực sự (không phải lo ngại lý thuyết), hoặc VM không có local disk đủ lớn, hoặc cần chuyển sang container ephemeral không có persistent volume.

**Tại sao không làm ngay từ đầu:** HLS với `libx264` hiện tại **không hỗ trợ streaming output** vì FFmpeg cần random write access để cập nhật playlist `index.m3u8` liên tục trong suốt quá trình encode. Đây là ràng buộc của format HLS, không phải giới hạn của thiết kế hiện tại.

**Điều kiện tiên quyết để stream được:** Phải thay đổi output format. Có hai hướng:

Hướng thứ nhất — **MPEG-DASH với fMP4**: FFmpeg có thể ghi DASH manifest và segment ra stdout/pipe. fMP4 segment không cần seek, hoàn toàn streamable. MinIO nhận từng segment qua multipart upload. Tuy nhiên, cần kiểm tra lại HLS.js compatibility vì HLS.js hỗ trợ DASH ở mức hạn chế hơn native HLS.

Hướng thứ hai — **HLS với MPEG-TS pipe trick**: FFmpeg ghi segment `.ts` ra stdout theo thứ tự, một Java thread đọc từ stdout và upload từng chunk lên MinIO theo tên segment được đánh số tăng dần. Playlist `index.m3u8` được xây dựng dần trong bộ nhớ Java và chỉ upload sau cùng. Đây là cách phức tạp nhất nhưng giữ được output HLS native.

**Thay đổi kiến trúc khi chọn hướng này:**

`MinioUploader` cần được viết lại thành `StreamingMinioUploader` với interface tương tự — đây là lý do các component được tách biệt. `FfmpegExecutor` cần thêm logic đọc stdout. `TempFileManager` không còn cần thiết. Toàn bộ phần còn lại của hệ thống (consumer, queue, dispatcher, bulkhead, retry) không thay đổi.

**Cảnh báo quan trọng:** Streaming pipeline phức tạp hơn đáng kể về error handling. Nếu upload một segment thất bại giữa chừng, không thể "undo" các segment đã lên MinIO mà không có logic rollback rõ ràng. Cần thiết kế atomicity cho streaming pipeline riêng trước khi migrate.

---

### 16.3 Multi-Bitrate HLS — Adaptive Streaming

**Điều kiện kích hoạt:** Yêu cầu hỗ trợ nhiều chất lượng (360p / 720p / 1080p) để player tự chọn theo băng thông của viewer.

**Thay đổi kiến trúc:**

FFmpeg hỗ trợ multi-bitrate HLS trong một lệnh duy nhất với `-var_stream_map`. Output sẽ gồm một master playlist `master.m3u8` trỏ đến nhiều variant playlist con, mỗi variant một resolution.

Cấu trúc output thay đổi từ:
```
videos/{jobId}/
    index.m3u8
    seg_0000.ts ...
```
thành:
```
videos/{jobId}/
    master.m3u8
    720p/index.m3u8  +  720p/seg_0000.ts ...
    1080p/index.m3u8 +  1080p/seg_0000.ts ...
```

`FfmpegCommandBuilder` cần cập nhật để sinh lệnh multi-output. `MinioUploader` cần upload theo cấu trúc thư mục con. Parallel upload vẫn áp dụng được và lợi ích còn lớn hơn vì số file `.ts` tăng theo số bitrate. Phần còn lại không thay đổi.

**Lưu ý về CPU:** Encode multi-bitrate tốn CPU nhiều hơn đáng kể. Cần re-tính lại `MAX_CONCURRENT` và `THREADS_PER_PROCESS` với công thức ở Mục 7 dựa trên số bitrate target.

---

### 16.4 Hardware Acceleration — Khi VM Được Cấp GPU

**Điều kiện kích hoạt:** Encode throughput cần tăng mạnh (ví dụ: từ 6 concurrent jobs lên 20+) mà không thể tăng CPU core thêm về mặt chi phí.

**Thay đổi kiến trúc:**

Chỉ cần cập nhật `FfmpegCommandBuilder` để inject hardware encoder (`-c:v h264_nvenc` cho NVIDIA, `-c:v h264_qsv` cho Intel). Không thay đổi gì khác trong pipeline.

Tuy nhiên, cần lưu ý: `SemaphoreBulkhead` vẫn cần thiết nhưng `MAX_CONCURRENT` được tính lại theo giới hạn concurrent sessions của GPU (NVENC thường giới hạn 3–8 sessions đồng thời tùy card), không còn tính theo CPU core nữa. GPU encoding thường cho quality thấp hơn CPU encoding ở cùng bitrate — đây là trade-off chấp nhận được khi ưu tiên throughput.

