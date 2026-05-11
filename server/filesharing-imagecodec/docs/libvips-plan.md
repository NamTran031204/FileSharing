# Kế Hoạch Triển Khai: Image Processing Service với jvips
**Stack:** Java 21 · Spring Boot 3 · jvips · MinIO · Kafka · MongoDB (duy nhất)  
**Môi trường:** Single VM (Phase 1), Multi-VM (Phase 2)  
**Mục tiêu:** Xử lý ảnh raster (JPG/PNG/WebP) thành thumbnail và preview

---

## 1. Thành Phần Hệ Thống

| Thành phần | Ghi chú |
|---|---|
| Kafka Consumer | `max.poll.records: 5` |
| `JobQueue` interface + `InMemoryJobQueue` | Phase 1; swap sang Redis khi scale ngang |
| `JobDispatcher` + `@Scheduled` | Poll 500ms |
| `SemaphoreBulkhead` | Giới hạn số job đồng thời |
| `JobRepository` + MongoDB | Tracking state + output result trên cùng collection |
| `VipsProcessor` | Xử lý ảnh qua jvips JNI |
| `MinioStorageClient` | Download input, upload output dạng `byte[]` |
| `TempFileManager` | Chỉ dùng cho input ≥ 50MB |

---

## 2. Cấu Trúc Package

```
com.example.imageprocessor
├── kafka
│   ├── ImageJobConsumer.java
│   └── dto
│       └── ImageJobMessage.java
├── job
│   ├── JobService.java
│   ├── JobDispatcher.java
│   ├── JobRepository.java
│   ├── queue
│   │   ├── JobQueue.java
│   │   └── InMemoryJobQueue.java
│   └── domain
│       ├── Job.java
│       └── JobStatus.java
├── vips
│   ├── VipsProcessor.java
│   ├── VipsOptions.java
│   └── VipsResult.java
├── storage
│   ├── MinioStorageClient.java
│   └── TempFileManager.java
└── config
    ├── BulkheadConfig.java
    ├── MinioConfig.java
    ├── VipsConfig.java
    └── KafkaConfig.java
```

---

## 3. Kafka Consumer

### 3.1 Message Schema

```json
{
  "jobId":        "550e8400-e29b-41d4-a716-446655440000",
  "inputKey":     "uploads/images/photo-abc.jpg",
  "outputPrefix": "processed/",
  "thumbnailWidth": 200,
  "quality":      82,
  "submittedAt":  "2025-04-18T10:00:00Z"
}
```

Output luôn cố định gồm 2 file WebP:
- `thumb.webp` — resize về `thumbnailWidth`, giữ tỉ lệ
- `preview.webp` — giữ nguyên resolution gốc, chỉ convert sang WebP

### 3.2 Cấu Hình

```yaml
spring:
  kafka:
    consumer:
      group-id: image-encoding-service
      auto-offset-reset: earliest
      enable-auto-commit: false
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      properties:
        max.poll.records: 5
        max.poll.interval.ms: 60000
        session.timeout.ms: 30000
        heartbeat.interval.ms: 10000
    listener:
      ack-mode: MANUAL_IMMEDIATE
      concurrency: 1
```

### 3.3 Luồng Nhận Message

```
Kafka message đến
  → SELECT WHERE id = jobId (ON CONFLICT DO NOTHING)
  → INSERT job: status = QUEUED
  → jobQueue.offer(jobId)
      └─ Nếu queue đầy: KHÔNG commit offset
  → Acknowledgment.acknowledge()
```

---

## 4. VipsProcessor

### 4.1 Luồng Xử Lý

```
VipsProcessor.process(job)
  │
  ├─ Download input từ MinIO
  │   ├─ < 50MB  → byte[]
  │   └─ ≥ 50MB  → /tmp/vips-input/{jobId}.{ext}
  │
  ├─ Tạo thumb.webp
  │   └─ try (VipsImage img = VipsImage.thumbnail(input, thumbnailWidth,
  │               SIZE(DOWN), AUTO_ROTATE(true)))
  │       ├─ Nếu img.hasAlpha(): img = img.flatten(bg=[255,255,255])
  │       └─ byte[] thumb = img.writeToArray(WebP, Q=quality, STRIP=true)
  │
  ├─ Tạo preview.webp
  │   └─ try (VipsImage img = VipsImage.newFromBuffer(input, AUTO_ROTATE))
  │       ├─ Nếu img.hasAlpha(): img = img.flatten(bg=[255,255,255])
  │       └─ byte[] preview = img.writeToArray(WebP, Q=quality, STRIP=true)
  │
  ├─ Upload song song lên MinIO
  │   ├─ {outputPrefix}/{jobId}/thumb.webp
  │   └─ {outputPrefix}/{jobId}/preview.webp
  │   (Virtual Thread per file + CompletableFuture.allOf())
  │
  ├─ Ghi output keys vào MongoDB
  ├─ Update status = COMPLETED
  └─ Cleanup temp input file nếu có
```

### 4.2 jvips — Các Lời Gọi Cần Thiết

```java
// Thumbnail — dùng thumbnail(), không dùng newFromBuffer() + resize()
try (VipsImage img = VipsImage.thumbnail(
        inputBytes,                               // hoặc inputPath (String)
        targetWidth,
        VipsThumbnailOption.SIZE(VipsSize.DOWN),
        VipsThumbnailOption.AUTO_ROTATE(true)
)) {
    VipsImage out = img;

    // Flatten alpha nếu output là JPEG
    if (img.hasAlpha() && outputFormat == JPEG) {
        out = img.flatten(
            VipsFlattenOption.BACKGROUND(new double[]{255, 255, 255})
        );
    }

    byte[] result = switch (outputFormat) {
        case JPEG -> out.writeToArray(
            VipsForeignJpegSave.Q(jpegQuality),
            VipsForeignJpegSave.STRIP(stripMetadata)
        );
        case WEBP -> out.writeToArray(
            VipsForeignWebpSave.Q(webpQuality),
            VipsForeignWebpSave.LOSSLESS(false),
            VipsForeignWebpSave.STRIP(stripMetadata)
        );
        case PNG  -> out.writeToArray(
            VipsForeignPngSave.COMPRESSION(pngCompression)
        );
    };
}
```

### 4.3 Xử Lý Input Ảnh Lớn

```java
public ImageInput download(String key) {
    long sizeBytes = minio.statObject(bucket, key).size();
    if (sizeBytes >= largeImageThresholdBytes) {
        Path tmp = tempFileManager.create(jobId, extractExtension(key));
        minio.downloadToFile(bucket, key, tmp);
        return ImageInput.fromFile(tmp.toString());
    }
    byte[] data = minio.downloadToBytes(bucket, key);
    return ImageInput.fromBytes(data);
}
```

### 4.4 Upload Song Song

```java
List<CompletableFuture<Void>> futures = results.stream()
    .map(r -> CompletableFuture.runAsync(
        () -> minio.upload(outputBucket, r.outputKey(), r.data()),
        Thread.ofVirtual().factory()
    ))
    .toList();

CompletableFuture
    .allOf(futures.toArray(new CompletableFuture[0]))
    .orTimeout(30, TimeUnit.SECONDS)
    .join();
```

### 4.5 Timeout và Error Handling

```java
CompletableFuture
    .supplyAsync(() -> doProcess(job), virtualThreadExecutor)
    .orTimeout(processingTimeoutSeconds, TimeUnit.SECONDS)
    .whenComplete((result, ex) -> {
        if (ex == null) {
            markCompleted(job.id(), result);
        } else if (ex instanceof TimeoutException) {
            scheduleRetry(job);
        } else if (ex instanceof VipsException ve && isCorruptInput(ve)) {
            markFailed(job.id(), ve.getMessage());   // tidak retry
        } else {
            scheduleRetry(job);
        }
    });

private boolean isCorruptInput(VipsException e) {
    String msg = e.getMessage().toLowerCase();
    return msg.contains("unable to load")
        || msg.contains("no known loader")
        || msg.contains("invalid image");
}
```

---

## 5. Resource Control

### 5.1 VIPS_CONCURRENCY và Bulkhead

```
VIPS_CONCURRENCY = N    → thread libvips dùng nội bộ mỗi operation (giới hạn mềm)
maxConcurrentCalls = M  → số job chạy đồng thời (giới hạn ở tầng application)
Tổng threads xử lý ảnh = N × M
```

**Bảng cấu hình theo VM:**

| VM | `VIPS_CONCURRENCY` | `maxConcurrentCalls` | Tổng threads | RAM est. |
|---|---|---|---|---|
| 4-core / 4GB | 1 | 3 | 3 | ~1.2GB |
| 8-core / 8GB | 1 | 6 | 6 | ~2.4GB |
| 16-core / 16GB | 2 | 6 | 12 | ~2.4GB |

**Cấu hình cho VM 4-core / 4GB (khuyến nghị):**

```yaml
resilience4j:
  bulkhead:
    instances:
      image-processor:
        maxConcurrentCalls: 3
        maxWaitDuration: 0ms
```

```dockerfile
ENV VIPS_CONCURRENCY=1
ENV VIPS_CACHE_MAX=0
ENV VIPS_CACHE_MAX_MEM=0
ENV JAVA_OPTS="-Xms512m -Xmx1024m -XX:MaxDirectMemorySize=512m"
```

### 5.2 Hard Limit bằng Docker

```yaml
# docker-compose.yml
services:
  image-processor:
    deploy:
      resources:
        limits:
          cpus: "3.5"
          memory: "3.5G"
    environment:
      VIPS_CONCURRENCY: "1"
      VIPS_CACHE_MAX: "0"
      VIPS_CACHE_MAX_MEM: "0"
```

---

## 6. Phân Loại Lỗi và Retry

| Lỗi | Dấu hiệu | Hành động |
|---|---|---|
| Ảnh corrupt | `VipsException: unable to load` | FAILED, không retry |
| Format không hỗ trợ | `VipsException: No known loader` | FAILED, không retry |
| MinIO download fail | `IOException` | Retry với backoff |
| MinIO upload fail | `IOException` | Retry upload, không xử lý lại ảnh |
| Timeout | `TimeoutException` | Retry 1 lần, sau đó FAILED |
| OOM | `OutOfMemoryError` | FAILED + alert |

```yaml
encoder:
  retry:
    max-attempts: 3
    initial-delay-seconds: 2
    multiplier: 2.0
```

---

## 7. Job Schema — MongoDB

Dùng MongoDB collection `processing_jobs` với schema như trong ProcessingJobEntity.java.

---

## 8. application.yml Đầy Đủ

```yaml
server:
  port: 8080

spring:
  data:
    mongodb:
      uri: ${MONGODB_URI:mongodb://localhost:27017/imageprocessor}
      database: imageprocessor
  kafka:
    bootstrap-servers: ${KAFKA_BOOTSTRAP_SERVERS:localhost:9092}
    consumer:
      group-id: image-processing-service
      auto-offset-reset: earliest
      enable-auto-commit: false
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      properties:
        spring.json.trusted.packages: "com.example.imageprocessor.kafka.dto"
        max.poll.records: 5
        max.poll.interval.ms: 60000
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
    input: raw-images
    output: processed-images
  presigned-url:
    ttl-minutes: 30

vips:
  large-image-threshold-mb: 50
  temp-dir: /tmp/vips-input
  processing-timeout-seconds: 30
  output:
    jpeg-quality: 85
    webp-quality: 82
    webp-lossless: false
    png-compression: 6
    strip-metadata: true

resilience4j:
  bulkhead:
    instances:
      image-processor:
        maxConcurrentCalls: 3
        maxWaitDuration: 0ms

encoder:
  queue:
    max-capacity: 500
  retry:
    max-attempts: 3
    initial-delay-seconds: 2
    multiplier: 2.0
  cleanup:
    temp-age-hours: 2

management:
  endpoints:
    web:
      exposure:
        include: health,metrics,prometheus
```

---

## 9. Dependencies (pom.xml)

```xml
<!-- jvips -->
<dependency>
    <groupId>com.criteo.vips</groupId>
    <artifactId>jvips</artifactId>
    <version>1.0.0</version>
</dependency>

<!-- Kafka -->
<dependency>
    <groupId>org.springframework.kafka</groupId>
    <artifactId>spring-kafka</artifactId>
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

<!-- MongoDB -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-mongodb</artifactId>
</dependency>

<!-- Monitoring -->
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

---

## 10. Dockerfile

```dockerfile
FROM eclipse-temurin:21-jre-jammy

# jvips bundle sẵn native libvips — chỉ cần runtime deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    libjpeg-turbo8 \
    libpng16-16 \
    libwebp7 \
    libtiff5 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY target/image-processor.jar app.jar

ENV VIPS_CONCURRENCY=1
ENV VIPS_CACHE_MAX=0
ENV VIPS_CACHE_MAX_MEM=0
ENV JAVA_OPTS="-Xms512m -Xmx1024m -XX:MaxDirectMemorySize=512m"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
```

---

## 11. Phase 1 và Phase 2 — Scale Ngang

### Phase 1 — Single VM (4-core, 4GB)

| Config | Giá trị |
|---|---|
| `VIPS_CONCURRENCY` | 1 |
| `maxConcurrentCalls` | 3 |
| `listener.concurrency` | 1 |
| Kafka topic partitions | 1 |
| Queue | `InMemoryJobQueue` |
| Job persistence | MongoDB |

### Phase 2 — Multi-VM

| Thay đổi | Cách làm |
|---|---|
| Kafka partitions | Tăng bằng số VM |
| `JobQueue` | Swap sang `RedisStreamJobQueue` — interface đã tách sẵn |
| `listener.concurrency` | Giữ 1 per instance |
| `maxConcurrentCalls` | Giữ 3 per instance |
| `VipsProcessor`, `MinioStorageClient` | Không thay đổi |

---

## 12. Monitoring

| Metric | Alert |
|---|---|
| `vips.jobs.active` | = `maxConcurrentCalls` |
| `vips.queue.size` | > 100 |
| `vips.job.duration.ms` | p95 tăng đột biến |
| `vips.job.failed.total` | > 5/phút |
| `vips.native.memory.bytes` | Tăng liên tục > 30 phút |
| `system.cpu.usage` | > 85% |
| `jvm.memory.used` | > 80% max heap |

---

## 13. Checklist Migration

### Chuẩn Bị
- [ ] Xác nhận jvips bundled native chạy trên OS/arch của VM (`java -jar` + log jvips init)
- [ ] Chuẩn bị test dataset: JPEG thường, JPEG > 50MB, PNG có alpha, ảnh EXIF orientation, ảnh corrupt
- [ ] Benchmark 100 ảnh JPEG 5MP — đo thời gian và RAM peak để validate `maxConcurrentCalls`

### Code
- [ ] Tạo `VipsProcessor` — gọi `thumbnail()` với `AUTO_ROTATE(true)`
- [ ] Implement alpha flatten trước khi encode JPEG
- [ ] Implement large-image routing: < 50MB → `byte[]`, ≥ 50MB → temp file
- [ ] `try-with-resources` cho **mọi** `VipsImage` — không ngoại lệ
- [ ] Update `MinioStorageClient` — thêm `upload(key, byte[])`
- [ ] Bỏ `StderrDrainer`, `FfmpegCommandBuilder`
- [ ] Set `VIPS_CACHE_MAX=0`, `VIPS_CACHE_MAX_MEM=0` trong Dockerfile

### Validation
- [ ] JPEG thường → thumbnail WebP: kích thước và orientation đúng
- [ ] PNG có alpha → thumbnail JPEG: alpha flatten thành nền trắng
- [ ] Ảnh EXIF rotation → thumbnail: không bị ngược
- [ ] Ảnh ≥ 50MB: không OOM, routing đúng sang temp file
- [ ] Ảnh corrupt: status FAILED, không retry
- [ ] 3 job đồng thời: CPU ≤ 85%
- [ ] Native memory sau 1000 job: không tăng liên tục
- [ ] Kafka redelivery cùng `jobId`: idempotent

### Vận Hành
- [ ] Dashboard Grafana cho `vips.*` metrics
- [ ] Alert `vips.native.memory.bytes` tăng liên tục
- [ ] Alert `vips.queue.size` > 100
- [ ] Cron cleanup `/tmp/vips-input/` cũ hơn 2 giờ

---

## 14. Rủi Ro Kỹ Thuật

| # | Rủi ro | Mức độ | Giảm thiểu |
|---|---|---|---|
| R1 | `VipsImage` không close → native memory leak | **CAO** | `try-with-resources` bắt buộc; alert `vips.native.memory.bytes`; load test 24h |
| R2 | `VIPS_CONCURRENCY` không set → libvips dùng toàn bộ core | **CAO** | Bắt buộc `ENV VIPS_CONCURRENCY=1` trong Dockerfile |
| R3 | PNG lớn không có shrink-on-load → RAM spike | **TRUNG BÌNH** | Hạ ngưỡng temp file cho PNG; monitor RAM peak |
| R4 | jvips bundled xung đột với system libvips nếu apt install thêm | **TRUNG BÌNH** | Không apt install libvips khi đã dùng jvips bundled |
| R5 | Double rotation nếu upstream đã bake-in EXIF | **THẤP** | Kiểm tra ảnh gốc trên MinIO; disable `AUTO_ROTATE` nếu cần |
| R6 | Output quality khác FFmpeg | **THẤP** | So sánh visual trước deploy; cần product sign-off |
| R7 | Docker image size tăng do libvips runtime deps | **THẤP** | Multi-stage build; chỉ copy runtime deps |
