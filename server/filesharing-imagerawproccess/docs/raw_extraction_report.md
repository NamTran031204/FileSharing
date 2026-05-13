# Báo cáo Kỹ thuật: RAW Image Extraction Service

> **Công nghệ:** Java Spring Boot · ExifTool · Apache Kafka · MinIO · MongoDB · Resilience4j  
> **Phiên bản:** 1.0 — Tháng 5, 2025

---

## Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [Kiến trúc Service](#2-kiến-trúc-service)
3. [Giai đoạn 1 — 1 VM](#3-giai-đoạn-1-1-vm--4-core--4-gb-ram--20-gb-storage)
4. [Giai đoạn 2 — 4 VM](#4-giai-đoạn-2-4-vm--horizontal-scaling)
5. [Implementation Chi tiết](#5-implementation-chi-tiết)
6. [Resilience & Fault Tolerance](#6-resilience--fault-tolerance)
7. [Monitoring & Vận hành](#7-monitoring--observability)
8. [Docker & Triển khai](#8-docker--triển-khai)
9. [Tổng kết & Khuyến nghị](#9-tổng-kết--khuyến-nghị)

---

## 1. Tổng quan

### 1.1. Bối cảnh kỹ thuật

File RAW (CR2, NEF, ARW, RAF, ORF, RW2, ...) được camera nhúng sẵn nhiều lớp ảnh JPEG bên trong:

| Loại ảnh nhúng | Kích thước điển hình | Kích thước file | Mục đích |
|---|---|---|---|
| ThumbnailImage | 160 × 120 px | 20–80 KB | Icon, grid view nhỏ |
| LargeThumbnail | 512 × 384 px | 80–300 KB | Preview medium, mobile |
| PreviewImage | 2000–6000 px (cạnh dài) | 2–8 MB | Web display, xem ảnh đầy đủ |

> **Quan trọng:** ExifTool chỉ đọc binary structure và extract JPEG blob đã nhúng sẵn — **không decode pixel RAW**. Đây là lý do ExifTool nhanh và nhẹ hơn ImageMagick hay Darktable rất nhiều.

### 1.2. Yêu cầu chức năng

- Nhận `objectName` từ Kafka topic để xác định file RAW cần xử lý
- Download file RAW từ MinIO về disk tạm
- Extract `ThumbnailImage` (EXIF) và `PreviewImage` (full-size) bằng ExifTool
- Upload thumbnail và preview JPEG lên MinIO vào các prefix tương ứng
- Ghi metadata xử lý (trạng thái, timestamp, kích thước output) vào MongoDB
- Retry tự động khi thất bại với Resilience4j (CircuitBreaker + Retry)

### 1.3. Yêu cầu phi chức năng

| Tham số | Yêu cầu |
|---|---|
| **CPU Usage tối đa** | **≤ 70% tổng CPU của VM — bắt buộc** |
| Xử lý | Đa luồng + đa tiến trình (multi-thread + multi-process) |
| Throughput Phase 1 | ≥ 4 file RAW/s trên 1 VM 4-core |
| Throughput Phase 2 | ≥ 16 file RAW/s trên 4 VM |
| Latency per file | ≤ 3s từ khi nhận Kafka message đến khi preview available trên MinIO |
| Idempotency | Xử lý trùng lặp message Kafka không tạo duplicate file trên MinIO |

---

## 2. Kiến trúc Service

### 2.1. Luồng dữ liệu (Data Flow)

```
[1] Producer bên ngoài → gửi objectName vào Kafka topic "raw-photo-ingest"
[2] KafkaConsumer (Spring @KafkaListener, concurrency=N) → nhận message
[3] Idempotency check → tra cứu MongoDB theo objectName + etag → skip nếu đã xử lý
[4] MinIO Download → tải file RAW (~40MB) về /tmp/raw/ bằng stream (không load heap)
[5] ExifTool Pool (-stay_open) → extract ThumbnailImage → thumbnail.jpg
[6] ExifTool Pool (-stay_open) → extract PreviewImage   → preview.jpg
[7] MinIO Upload → đẩy thumbnail lên "thumbnails/", preview lên "previews/"
[8] MongoDB Write → ghi ProcessingRecord: status=DONE, duration, outputSize, timestamp
[9] Cleanup → xóa file tạm /tmp/raw/ và /tmp/out/ ngay lập tức
[X] Lỗi bất kỳ bước nào → Resilience4j Retry (3 lần, exp backoff) → Dead Letter Topic
```

### 2.2. Cấu trúc component

| Component | Công nghệ | Vai trò |
|---|---|---|
| KafkaConsumer | Spring Kafka `@KafkaListener` | Nhận objectName, dispatch task |
| ExifToolPoolService | `ProcessBuilder` + `Semaphore` | Quản lý pool ExifTool processes |
| MinioStorageService | MinIO Java SDK | Download RAW, upload preview |
| ProcessingRecordRepo | Spring Data MongoDB | Lưu trạng thái, idempotency key |
| ResilienceDecorator | Resilience4j CircuitBreaker + Retry | Fault tolerance, retry logic |
| ResourceGuardScheduler | Spring `@Scheduled` + JMX MBean | Monitor CPU/RAM, pause consumer nếu vượt ngưỡng |

### 2.3. Chiến lược đa luồng & đa tiến trình

**Multi-thread (JVM level):** Kafka consumer với `concurrency=N` tạo N thread listener độc lập. Mỗi thread xử lý 1 Kafka partition, cho phép N file được xử lý song song trong cùng 1 JVM process.

**Multi-process (OS level):** Mỗi KafkaListener thread giữ 1 ExifTool process riêng biệt (chế độ `-stay_open`). N thread = N ExifTool processes chạy song song. Đây là tầng đa tiến trình thực sự ở mức OS.

**CPU Affinity:** Dùng `taskset` để pin các ExifTool processes vào một tập core cụ thể, tránh tranh CPU với JVM Spring. Đảm bảo ≤ 70% CPU tổng.

---

## 3. Giai đoạn 1: 1 VM — 4 Core / 4 GB RAM / 20 GB Storage

### 3.1. Thông số phần cứng và giới hạn

| Tài nguyên | Tổng | Mức 70% giới hạn | Phân bổ thực tế |
|---|---|---|---|
| CPU | 4 cores (400%) | **280% — tối đa** | Spring JVM: ~100% \| ExifTool pool: ~180% |
| RAM | 4 096 MB | 3 276 MB (80%) | JVM heap: 512MB \| ExifTool: 4×50MB \| OS: 512MB |
| Disk /tmp | 20 GB total | 4 GB cho /tmp | 4 RAW đồng thời × 40MB = 160MB peak |
| Disk app + logs | 20 GB total | 5 GB | OS + Spring app + ExifTool + logs |
| Kafka Partitions | — | 4 partitions | 1 consumer × 4 listener threads = 4 partition song song |

### 3.2. Tính toán CPU — Bảo đảm ≤ 70%

```
CPU Budget (4-core VM, giới hạn 70% = 280% tổng):

┌─────────────────────────────────────────────────────────────┐
│  Spring JVM (main threads, GC, Kafka IO, Mongo IO)  ~100%  │
│  ExifTool Process #1  (core 1)                       ~70%  │
│  ExifTool Process #2  (core 2)                       ~70%  │
│  ExifTool Process #3  (core 3)                       ~70%  │
│  OS overhead + network + disk IO                     ~30%  │
│                                                ─────────── │
│  Tổng sử dụng                                       ~340%  │ ← vượt 280%
│                                                             │
│  → Điều chỉnh: ExifTool pool size = 2, dùng nice -n 10    │
│  ExifTool #1 + #2                                    ~140%  │
│  Spring JVM                                          ~100%  │
│  OS overhead                                          ~30%  │
│                                                ─────────── │
│  Tổng                                               ~270%  │  ✓ ≤ 280%
└─────────────────────────────────────────────────────────────┘
```

### 3.3. Cấu hình tối ưu Phase 1

| Tham số cấu hình | Giá trị Phase 1 |
|---|---|
| `kafka.listener.concurrency` | **2** |
| `exiftool.pool.size` | 2 (1 process / listener thread) |
| `exiftool.nice.level` | 10 (ưu tiên thấp hơn JVM) |
| `exiftool.taskset.cores` | `"1,2"` — pin ExifTool vào core 1 và 2, Spring dùng core 0 và 3 |
| JVM `-Xms` / `-Xmx` | 256m / 512m |
| JVM GC | `-XX:+UseG1GC -XX:MaxGCPauseMillis=200` |
| `temp.dir` | `/tmp/raw-processing/` (mount tmpfs 2GB) |
| Kafka topic partitions | 4 partitions (dự phòng cho Phase 2) |
| CPU guard threshold | Pause consumer khi `systemCpuLoad > 0.70` |
| RAM guard threshold | Pause consumer khi RAM usage > 82% |

### 3.4. Tài nguyên tiêu tốn thực tế — File RAW 40 MB

| Chỉ số | Per file (1 thread) | Peak (2 file song song) | Ghi chú |
|---|---|---|---|
| Thời gian xử lý | 0.4–0.8 giây | 0.5–1.0 giây | ExifTool `-stay_open` warm |
| Download từ MinIO | ~40 MB read | ~80 MB/s net | Bottleneck nếu MinIO ở xa |
| RAM — ExifTool process | ~45–55 MB | ~100–110 MB | Perl runtime + parse buffer |
| RAM — JVM heap (per task) | < 5 MB | < 10 MB | Chỉ giữ path string |
| CPU — ExifTool | ~70% × 1 core | ~140% (2 cores) | Parse RAW binary structure |
| Disk /tmp (peak) | ~48 MB | ~96 MB | RAW + thumbnail + preview tạm |
| Output — Thumbnail | 20–80 KB | — | ThumbnailImage EXIF |
| Output — Preview | 2–8 MB | — | PreviewImage full-size JPEG |
| **Throughput Phase 1** | — | **~4–5 file/s** | 2 thread × 2 file/s |

### 3.5. Cấu trúc MinIO — Phase 1

| Bucket | Object path pattern | Nội dung |
|---|---|---|
| `raw-photos` | `originals/{year}/{month}/{filename}.CR2` | File RAW gốc (input) |
| `raw-photos` | `thumbnails/{year}/{month}/{filename}_thumb.jpg` | Thumbnail ~160px (output) |
| `raw-photos` | `previews/{year}/{month}/{filename}_preview.jpg` | Preview full-size JPEG (output) |

---

## 4. Giai đoạn 2: 4 VM — Horizontal Scaling

### 4.1. Topology triển khai

```
Kafka Topic "raw-photo-ingest": 8 partitions

┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   VM-1       │  │   VM-2       │  │   VM-3       │  │   VM-4       │
│  Spring App  │  │  Spring App  │  │  Spring App  │  │  Spring App  │
│  2 listeners │  │  2 listeners │  │  2 listeners │  │  2 listeners │
│  2 ExifTool  │  │  2 ExifTool  │  │  2 ExifTool  │  │  2 ExifTool  │
│  Part. 0, 1  │  │  Part. 2, 3  │  │  Part. 4, 5  │  │  Part. 6, 7  │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       └──────────────────────────────────────────────────────┘
                                    │
              ┌─────────────────────┴──────────────────────┐
              │           Shared Infrastructure             │
              │  MinIO Cluster | MongoDB ReplicaSet | Kafka │
              └────────────────────────────────────────────┘
```

### 4.2. Tính toán tài nguyên Phase 2 (tổng 4 VM)

| Tài nguyên | Per VM | % CPU per VM | 4 VM tổng | Trạng thái |
|---|---|---|---|---|
| CPU — Spring JVM | ~100% | 25% | 400% | ✅ OK |
| CPU — 2× ExifTool | ~140% | 35% | 560% | ✅ OK |
| CPU — OS overhead | ~30% | 7.5% | 120% | ✅ OK |
| **CPU tổng per VM** | **~270%** | **67.5% ✓** | 1080% / 1600% | **✅ ≤ 70%** |
| RAM per VM | ~750 MB | ~18% | 3 GB / 16 GB | ✅ OK |
| **Throughput Phase 2** | ~4–5 file/s | — | **~16–20 file/s** | **✅ Scale linear** |

### 4.3. Kafka Consumer Group Configuration

```
Topic: raw-photo-ingest — 8 partitions (2 partition/VM × 4 VM)
Consumer Group ID:   raw-extraction-service  (dùng chung trên tất cả VM)
Listener concurrency per VM: 2
Replication factor:  3
Retention:           24h
Max poll records:    1     ← tránh consumer timeout khi file lớn
Max poll interval:   120 000ms (2 phút)
Dead Letter Topic:   raw-photo-ingest-dlt
```

### 4.4. Scaling: khi nào thêm VM?

| Chỉ số quan sát | Ngưỡng cảnh báo | Ngưỡng hành động | Hành động |
|---|---|---|---|
| Kafka Consumer Lag | > 1 000 messages | > 5 000 messages | Thêm VM mới vào group |
| CPU usage trung bình | > 60% sustained 5 phút | > 65% sustained 10 phút | Giảm pool size hoặc thêm VM |
| Processing latency p95 | > 2 giây | > 5 giây | Kiểm tra MinIO bandwidth, tăng VM |
| Error rate | > 1% | > 5% | Kiểm tra log, dead letter topic |

---

## 5. Implementation Chi tiết

### 5.1. ExifTool Pool — Quản lý đa tiến trình

```java
@Service
public class ExifToolPoolService {
    private final List<ExifToolWorker> pool = new CopyOnWriteArrayList<>();
    private final Semaphore semaphore;

    @PostConstruct
    public void init() {
        // Spawn N ExifTool processes với nice + taskset
        for (int i = 0; i < poolSize; i++) {
            pool.add(new ExifToolWorker(i, cpuCores.get(i)));
        }
        this.semaphore = new Semaphore(poolSize);
    }

    public ExtractionResult extract(Path rawFile, Path outDir)
            throws IOException, InterruptedException {
        semaphore.acquire(); // block nếu tất cả worker đang bận
        ExifToolWorker worker = acquireWorker();
        try {
            Path thumb   = worker.extractTag("-ThumbnailImage", rawFile, outDir);
            Path preview = worker.extractTag("-PreviewImage",   rawFile, outDir);
            return new ExtractionResult(thumb, preview);
        } finally {
            releaseWorker(worker);
            semaphore.release();
        }
    }

    @PreDestroy
    public void shutdown() { pool.forEach(ExifToolWorker::close); }
}
```

### 5.2. Kafka Consumer — Đa luồng, idempotency

```java
@KafkaListener(
    topics = "${kafka.topic.raw-ingest}",
    concurrency = "${exiftool.pool.size}",
    containerFactory = "rawPhotoListenerFactory"
)
@CircuitBreaker(name = "rawProcessing", fallbackMethod = "sendToDlt")
@Retry(name = "rawProcessing")
public void consume(RawPhotoMessage msg, Acknowledgment ack) {
    // Idempotency: skip nếu đã xử lý thành công
    if (recordRepo.existsByObjectNameAndStatus(msg.objectName(), "DONE")) {
        ack.acknowledge();
        return;
    }

    Path tempRaw = null;
    Path tempOut = null;
    try {
        tempRaw = minioStorage.downloadToTemp(msg.objectName());
        tempOut = Files.createTempDirectory("exif-out-");

        ExtractionResult result = exifToolPool.extract(tempRaw, tempOut);

        minioStorage.uploadThumbnail(msg.objectName(), result.thumbnail());
        minioStorage.uploadPreview(msg.objectName(),   result.preview());

        recordRepo.save(ProcessingRecord.success(msg.objectName(), result));
        ack.acknowledge(); // Manual commit sau khi xử lý xong

    } finally {
        FileUtils.deleteQuietly(tempRaw);  // Cleanup ngay lập tức
        FileUtils.deleteQuietly(tempOut);
    }
}
```

### 5.3. Resource Guard — Bảo vệ giới hạn 70% CPU

```java
@Component
public class ResourceGuard {

    @Value("${resource.cpu.max-usage:0.70}")
    private double maxCpuUsage;

    @Scheduled(fixedRate = 3_000) // Kiểm tra mỗi 3 giây
    public void guardResources() {
        OperatingSystemMXBean os = (OperatingSystemMXBean)
                ManagementFactory.getOperatingSystemMXBean();

        double cpu = os.getSystemCpuLoad();
        double ram = 1.0 - (double) os.getFreePhysicalMemorySize()
                               / os.getTotalPhysicalMemorySize();

        if ((cpu > maxCpuUsage || ram > maxRamUsage) && !paused) {
            // Dừng nhận message mới, hoàn thành task hiện tại
            registry.getListenerContainer("rawPhotoConsumer").pause();
            paused = true;
        } else if (cpu < maxCpuUsage * 0.80 && !paused == false) {
            registry.getListenerContainer("rawPhotoConsumer").resume();
            paused = false;
        }
    }
}
```

### 5.4. application.yml — Phase 1 và Phase 2

```yaml
# ── Phase 1 (1 VM, 4 core) ──────────────────────────────────────
exiftool:
  pool:
    size: 2
  nice-level: 10
  taskset-cores: "1,2"   # pin ExifTool vào core 1 và 2

spring.kafka:
  listener:
    concurrency: 2
    ack-mode: MANUAL_IMMEDIATE
  consumer:
    max-poll-records: 1
    max-poll-interval-ms: 120000
    group-id: raw-extraction-service

resource:
  cpu.max-usage: 0.70
  ram.max-usage: 0.82

# ── Phase 2 (4 VM) ───────────────────────────────────────────────
# Kafka topic partitions: 8 (set khi tạo topic)
# Mỗi VM giữ nguyên concurrency=2, pool.size=2
# Kafka Consumer Group tự cân bằng: mỗi VM nhận 2 partition
# Không cần thay đổi code, chỉ scale horizontally
```

---

## 6. Resilience & Fault Tolerance

### 6.1. Chiến lược Retry và CircuitBreaker

| Tham số | Giá trị | Áp dụng cho | Lý do |
|---|---|---|---|
| `retry.maxAttempts` | 3 | ExifTool failure | Tránh loop vô hạn |
| `retry.backoff` | 2s → 4s → 8s (exp) | MinIO timeout | Tránh overload MinIO |
| `cb.slidingWindowSize` | 10 | All external calls | Sample 10 call gần nhất |
| `cb.failureRateThreshold` | 50% | MinIO / MongoDB | Mở circuit khi >50% fail |
| `cb.waitDurationOpen` | 30 giây | MinIO / MongoDB | Nghỉ 30s trước khi thử lại |
| Fallback | Dead Letter Topic | Sau 3 retry | Không mất message |

### 6.2. Các trường hợp lỗi và cách xử lý

| Trường hợp lỗi | Retry? | Xử lý |
|---|---|---|
| MinIO download timeout | Có (3 lần) | Exp backoff, sau đó DLT |
| ExifTool process crash | Có | Restart process, extract lại từ đầu |
| Preview không tồn tại trong RAW | Không | Fallback sang LargeThumbnail, log WARNING |
| `/tmp` đầy | Không | Alert ngay, pause consumer, dọn /tmp |
| MongoDB write fail | Có (3 lần) | File đã upload MinIO rồi, chỉ retry ghi metadata |
| Kafka message trùng lặp | N/A | Idempotency check MongoDB → skip |
| CPU vượt 70% | N/A | ResourceGuard tự động pause Kafka consumer |

---

## 7. Monitoring & Observability

### 7.1. Metrics cần theo dõi

| Metric | Nguồn | Alert khi |
|---|---|---|
| `resource.cpu.usage` | JMX MBean | > 70% trong 5 phút liên tiếp |
| `resource.ram.usage` | JMX MBean | > 85% |
| `kafka.consumer.lag` | Kafka JMX | > 1 000 records |
| `exiftool.extraction.duration` | Micrometer Timer | p95 > 3 giây |
| `exiftool.pool.active` | Gauge tự tạo | = pool.size trong > 60s |
| `raw.processing.error.rate` | Counter | > 5% trong 10 phút |
| `disk.free (/tmp)` | Node Exporter | < 500 MB |
| `resilience4j.cb.state` | Resilience4j Actuator | Khi state = OPEN |

### 7.2. MongoDB — Schema ProcessingRecord

```json
{
  "_id":          "ObjectId",
  "objectName":   "originals/2025/05/IMG_1234.CR2",
  "etag":         "abc123def456",
  "status":       "DONE | FAILED | PROCESSING",
  "vmId":         "vm-1",
  "startedAt":    "ISODate",
  "completedAt":  "ISODate",
  "durationMs":   754,
  "thumbnailKey": "thumbnails/2025/05/IMG_1234_thumb.jpg",
  "previewKey":   "previews/2025/05/IMG_1234_preview.jpg",
  "thumbnailSize": 45231,
  "previewSize":   3847291,
  "errorMessage":  null,
  "retryCount":    0
}
```

**Indexes:**
- `{ objectName: 1 }` — unique, dùng cho idempotency check
- `{ status: 1, startedAt: 1 }` — query file chưa xử lý hoặc failed
- `{ completedAt: 1 }` — TTL index, auto-delete sau 30 ngày

---

## 8. Docker & Triển khai

### 8.1. Dockerfile

```dockerfile
FROM eclipse-temurin:21-jre-alpine AS runtime

# Cài ExifTool + Perl (~25 MB layer)
RUN apk add --no-cache perl perl-archive-zip wget \
    && wget -q https://exiftool.org/Image-ExifTool-12.76.tar.gz \
    && tar -xzf Image-ExifTool-12.76.tar.gz \
    && cd Image-ExifTool-12.76 && perl Makefile.PL && make install \
    && cd .. && rm -rf Image-ExifTool-12.76*

RUN mkdir -p /tmp/raw-processing && chmod 777 /tmp/raw-processing

COPY target/*.jar app.jar

ENV JAVA_OPTS="-Xms256m -Xmx512m \
               -XX:+UseG1GC \
               -XX:MaxGCPauseMillis=200 \
               -Djava.io.tmpdir=/tmp/raw-processing"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app.jar"]
```

### 8.2. docker-compose — Phase 1

```yaml
version: "3.9"
services:
  raw-extraction-service:
    image: raw-extraction:latest
    deploy:
      resources:
        limits:
          cpus: "2.8"     # 70% của 4 core = 2.8 core (hard limit ở kernel)
          memory: 1536M
        reservations:
          cpus: "1.0"
          memory: 512M
    environment:
      - EXIFTOOL_POOL_SIZE=2
      - KAFKA_LISTENER_CONCURRENCY=2
      - KAFKA_BOOTSTRAP_SERVERS=kafka:9092
      - MINIO_ENDPOINT=http://minio:9000
      - MONGODB_URI=mongodb://mongo:27017/raw_processing
    tmpfs:
      - /tmp/raw-processing:size=2g,mode=1777
```

---

## 9. Tổng kết & Khuyến nghị

### 9.1. So sánh hai giai đoạn

| Tiêu chí | Phase 1 — 1 VM | Phase 2 — 4 VM |
|---|---|---|
| Throughput | ~4–5 file/s | **~16–20 file/s** |
| CPU Usage (max) | ~270% / 400% = 67.5% | 67.5% per VM ✅ |
| RAM Usage (max) | ~750 MB / 4 GB = 18% | ~750 MB / 4 GB per VM |
| ExifTool processes | 2 processes | 8 processes (2×4 VM) |
| Kafka concurrency | 2 listener threads | 8 threads (2×4 VM) |
| Scale effort | — | Zero code change |
| Fault tolerance | Single point of failure | Kafka rebalance tự động khi 1 VM down |

### 9.2. Checklist triển khai

1. Cài ExifTool 12.x trên tất cả VM (hoặc build vào Docker image)
2. Tạo Kafka topic với 4 partition (Phase 1) hoặc 8 partition (Phase 2)
3. Tạo MongoDB collection `processing_records` với index unique trên `objectName`
4. Cấu hình MinIO bucket với prefix `thumbnails/` và `previews/`
5. Set docker resource limits: `cpus=2.8` (70% của 4 core)
6. Mount tmpfs `/tmp/raw-processing` size=2G để tránh I/O disk
7. Cấu hình Grafana dashboard theo dõi 8 metric đã liệt kê
8. Test idempotency: gửi cùng 1 message 3 lần, verify chỉ 1 file được tạo
9. Test failover: kill 1 VM trong Phase 2, verify Kafka rebalance và xử lý tiếp
10. Benchmark throughput với folder 100 file RAW 40MB, verify ≤ 70% CPU

### 9.3. Khuyến nghị ưu tiên cao

> **1. Bottleneck thực tế là network, không phải CPU.**  
> MinIO và service nên đặt cùng subnet/datacenter để giảm latency download 40MB/file.

> **2. tmpfs > disk cho /tmp.**  
> Mount `/tmp/raw-processing` bằng tmpfs để đọc/ghi file tạm hoàn toàn trên RAM, giảm disk I/O 80%.

> **3. ExifTool `-stay_open` bắt buộc.**  
> Không spawn process mới mỗi request — overhead Perl startup là 0.3–0.5s/lần.

> **4. Kafka `max-poll-records=1` bắt buộc.**  
> Tránh consumer timeout khi xử lý file lớn > 30MB.

> **5. Idempotency bằng MinIO etag, không chỉ objectName.**  
> File có thể bị replace trên MinIO với cùng objectName — dùng etag làm idempotency key chính xác hơn.

---

*Tài liệu này dành cho mục đích thiết kế và triển khai nội bộ. Mọi thông số tài nguyên là ước tính dựa trên file RAW 40MB — cần benchmark thực tế trước khi đưa vào production.*
