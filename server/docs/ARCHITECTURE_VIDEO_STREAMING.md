# 🏗️ Kiến Trúc Hệ Thống Video Streaming với MinIO + FFmpeg

> **Tài liệu chuyên sâu về System Design, I/O Optimization và Memory Management cho Video Processing Pipeline**

---

## Mục Lục

1. [STEP 1: MinIO API & Streaming Analysis](#step-1-minio-api--streaming-analysis)
2. [STEP 2: Optimal Architecture Design](#step-2-optimal-architecture-design)
3. [STEP 3: Implementation Concept](#step-3-implementation-concept)
4. [Phụ Lục: Decision Matrix](#phụ-lục-decision-matrix)

---

# STEP 1: MinIO API & Streaming Analysis

## 1.1. Các Phương Pháp Đọc File từ MinIO

MinIO tuân thủ chuẩn Amazon S3 API, cung cấp **3 phương thức chính** để đọc dữ liệu:

### 1.1.1. GetObject với InputStream (Streaming Mode)

```
MinIO Server
    │
    ▼ (TCP Stream, chunked transfer)
┌─────────────────────────────────────┐
│  InputStream (không buffer toàn bộ) │
│  - Đọc tuần tự từ đầu đến cuối      │
│  - Memory footprint: ~8KB buffer    │
│  - Không hỗ trợ seek/random access  │
└─────────────────────────────────────┘
```

**Đặc điểm kỹ thuật:**
- **Memory Usage:** Chỉ cần buffer nhỏ (~8KB - 64KB) cho mỗi chunk đọc
- **Latency:** Bắt đầu đọc ngay lập tức, không cần chờ download xong
- **Hạn chế QUAN TRỌNG:** Không thể seek ngược (backward seek). Một khi đã đọc qua byte X, không thể quay lại đọc byte X-1

### 1.1.2. HTTP Range Requests (Partial Content - RFC 7233)

```
Client Request:
GET /bucket/video.mp4 HTTP/1.1
Range: bytes=104857600-209715199   (đọc từ byte 100MB đến 200MB)

MinIO Response:
HTTP/1.1 206 Partial Content
Content-Range: bytes 104857600-209715199/1073741824
Content-Length: 104857600
```

**Đặc điểm kỹ thuật:**
- **Random Access:** Có thể đọc BẤT KỲ đoạn nào của file mà không cần tải toàn bộ
- **Memory Usage:** Chỉ tải đúng số bytes được yêu cầu
- **Parallel Downloads:** Có thể mở nhiều connection song song để tải các range khác nhau
- **MinIO Support:** Hoàn toàn hỗ trợ, tương thích S3

### 1.1.3. Presigned URL (Temporary Public Access)

```
MinIO Client tạo URL có chữ ký:
https://minio.server:9000/bucket/video.mp4
    ?X-Amz-Algorithm=AWS4-HMAC-SHA256
    &X-Amz-Credential=...
    &X-Amz-Date=20260401T090000Z
    &X-Amz-Expires=3600
    &X-Amz-Signature=abc123...
```

**Đặc điểm kỹ thuật:**
- **Thời hạn:** Có thể cấu hình từ 1 giây đến 7 ngày
- **Quyền truy cập:** URL có thể được sử dụng bởi bất kỳ client nào (bao gồm FFmpeg)
- **HTTP Features:** Hỗ trợ đầy đủ Range Requests vì MinIO xử lý như request bình thường

---

## 1.2. Phân Tích Khả Năng "On-the-fly Streaming"

### 1.2.1. Vấn Đề Cốt Lõi với Video Container

**Cấu trúc file MP4/MOV (ISO Base Media File Format):**

```
┌─────────────────────────────────────────────────────────────┐
│                        MP4 FILE                              │
├─────────────────────────────────────────────────────────────┤
│ ftyp │ moov (metadata, index) │ mdat (actual video data)    │
│ 32B  │      5-50MB            │        phần còn lại         │
└─────────────────────────────────────────────────────────────┘
       │                        │
       │   QUAN TRỌNG: moov     │
       │   chứa Sample Table    │
       │   (stts, stsc, stco)   │
       │   mô tả VỊ TRÍ của     │
       │   từng frame trong     │
       │   mdat block           │
       └────────────────────────┘
```

**Hệ quả kỹ thuật:**
- FFmpeg **BẮT BUỘC** phải đọc `moov` atom trước để biết cấu trúc video
- `moov` có thể nằm ở **đầu file** (fast-start/web-optimized) hoặc **cuối file** (default encoding)
- Nếu `moov` ở cuối: FFmpeg phải seek đến cuối file → **không thể pipe thuần túy**

### 1.2.2. Phương Án 1: Pipe MinIO InputStream → FFmpeg stdin

```
┌─────────┐    InputStream     ┌─────────┐
│  MinIO  │ ─────────────────► │  Java   │
│ Server  │   (sequential)     │ Process │
└─────────┘                    └────┬────┘
                                    │ pipe to stdin
                                    ▼
                              ┌─────────┐
                              │ FFmpeg  │
                              │ -i pipe:│
                              └─────────┘
```

**Phân tích chi tiết:**

| Tiêu chí | Đánh giá |
|----------|----------|
| **Hoạt động được không?** | ⚠️ Chỉ khi moov ở đầu file |
| **Memory** | ✅ Tối thiểu (~64KB buffer) |
| **Seek capability** | ❌ Không thể seek backward |
| **FFmpeg compatibility** | ❌ FFmpeg cần seek khi cắt segment chính xác |

**Kết luận:** KHÔNG PHÙ HỢP cho mục tiêu chia segment trước khi encode.

### 1.2.3. Phương Án 2: FFmpeg Đọc Trực Tiếp từ Presigned URL

```
┌─────────┐  1. Generate URL   ┌─────────┐
│  MinIO  │ ◄───────────────── │  Java   │
│ Client  │                    │ Service │
└────┬────┘                    └─────────┘
     │
     │ 2. Return presigned URL
     ▼
┌──────────────────────────────────────────────┐
│ https://minio:9000/bucket/video.mp4?sig=...  │
└──────────────────────────────────────────────┘
     │
     │ 3. FFmpeg trực tiếp HTTP GET với Range headers
     ▼
┌─────────┐    HTTP/1.1 206 Partial Content    ┌─────────┐
│ FFmpeg  │ ◄─────────────────────────────────►│  MinIO  │
│ -i URL  │    (multiple range requests)       │ Server  │
└─────────┘                                    └─────────┘
```

**Phân tích chi tiết:**

| Tiêu chí | Đánh giá |
|----------|----------|
| **Hoạt động được không?** | ✅ Hoàn toàn, FFmpeg hỗ trợ HTTP input |
| **Memory** | ✅ FFmpeg quản lý buffer riêng |
| **Seek capability** | ✅ FFmpeg tự động sử dụng Range Requests |
| **Segment cắt chính xác** | ✅ FFmpeg có thể seek đến keyframe bất kỳ |
| **Network overhead** | ⚠️ Mỗi seek = 1 HTTP request mới |

**Kết luận:** ĐÂY LÀ PHƯƠNG ÁN TỐI ƯU cho use case này.

### 1.2.4. Phương Án 3: Hybrid - Download Partial + Process

```
                    ┌─────────────────────────────────┐
                    │     PARTIAL DOWNLOAD ZONE       │
                    │  (chỉ tải phần cần thiết)       │
┌─────────┐         │                                 │
│  MinIO  │ ───────►│  [moov] + [segment N data]     │
│ Server  │  Range  │      ~50MB cho mỗi segment     │
└─────────┘  Request│                                 │
                    └────────────────┬────────────────┘
                                     │
                                     ▼
                              ┌─────────────┐
                              │   FFmpeg    │
                              │ process     │
                              └─────────────┘
```

**Khi nào sử dụng:**
- Khi cần control chính xác data flow
- Khi muốn implement caching layer
- Khi network latency đến MinIO cao

---

## 1.3. Kết Luận STEP 1

### Trả lời câu hỏi chính:

**Q: Có cách nào để "vừa download, vừa chia segment, vừa encode" mà không tải full file?**

**A: CÓ, nhưng với điều kiện và giới hạn cụ thể:**

| Phương pháp | Khả thi | Điều kiện |
|-------------|---------|-----------|
| Pure InputStream pipe | ❌ | - |
| Presigned URL + FFmpeg HTTP | ✅ | FFmpeg cần được compile với `--enable-protocol=http` |
| Partial Range Download | ✅ | Cần tính toán byte range chính xác |

**KHUYẾN NGHỊ:** Sử dụng **Presigned URL** để FFmpeg đọc trực tiếp từ MinIO. FFmpeg sẽ tự động:
1. Đọc moov atom (seek đến vị trí cần thiết)
2. Sử dụng HTTP Range Requests để tải đúng phần video cần xử lý
3. Không cần buffer toàn bộ file trong memory

---

# STEP 2: Optimal Architecture Design

## 2.1. Phân Tích Hai Chiến Lược Cắt Segment

### 2.1.1. Chiến Lược A: FFmpeg Byte-Range Trực Tiếp từ URL

```
┌──────────────────────────────────────────────────────────────────┐
│                    STRATEGY A: DIRECT URL ACCESS                  │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌─────────┐         ┌─────────────────────────────────────┐   │
│   │ MinIO   │◄────────│ FFmpeg Process #1 (Segment 0-10s)   │   │
│   │ Server  │  HTTP   │ -ss 0 -t 10 -i "presigned_url"      │   │
│   │         │  Range  └─────────────────────────────────────┘   │
│   │         │                                                    │
│   │         │◄────────┌─────────────────────────────────────┐   │
│   │         │  HTTP   │ FFmpeg Process #2 (Segment 10-20s)  │   │
│   │         │  Range  │ -ss 10 -t 10 -i "presigned_url"     │   │
│   │         │         └─────────────────────────────────────┘   │
│   │         │                                                    │
│   │         │◄────────┌─────────────────────────────────────┐   │
│   │         │  HTTP   │ FFmpeg Process #N (Segment N)       │   │
│   └─────────┘  Range  │ -ss N*10 -t 10 -i "presigned_url"   │   │
│                       └─────────────────────────────────────┘   │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Ưu điểm:**

| Tiêu chí | Chi tiết |
|----------|----------|
| **Zero Local Storage** | Không cần lưu file gốc xuống disk |
| **True Parallelism** | Mỗi FFmpeg process độc lập, có thể chạy song song |
| **Memory Efficiency** | Mỗi process chỉ buffer ~10s video trong RAM |
| **Scalability** | Có thể distribute sang nhiều server |
| **Failure Isolation** | Segment N fail không ảnh hưởng segment khác |

**Nhược điểm:**

| Tiêu chí | Chi tiết |
|----------|----------|
| **Seek Overhead** | Mỗi process phải seek từ đầu đến vị trí cần (network RTT) |
| **Repeated Moov Read** | Mỗi process đọc lại moov atom (~5-50MB) |
| **Network Amplification** | N processes × moov size = N × 50MB network waste |
| **Connection Exhaustion** | Nhiều connection đồng thời đến MinIO |

**Tính toán Network Overhead:**
```
Video: 1 giờ, segment 10s → 360 segments
Moov size: 50MB
Network waste: 360 × 50MB = 18GB (chỉ để đọc moov lặp lại!)
```

### 2.1.2. Chiến Lược B: Download Stream → Local Temp → Segment

```
┌──────────────────────────────────────────────────────────────────┐
│                    STRATEGY B: LOCAL STAGING                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌─────────┐    Single Stream     ┌─────────────────────────┐  │
│   │ MinIO   │ ──────────────────►  │ Local Temp File         │  │
│   │ Server  │    (1 connection)    │ /tmp/video_abc123.mp4   │  │
│   └─────────┘                      └───────────┬─────────────┘  │
│                                                 │                 │
│                                    ┌────────────┼────────────┐   │
│                                    │            │            │   │
│                                    ▼            ▼            ▼   │
│                              ┌─────────┐  ┌─────────┐  ┌─────────┐│
│                              │FFmpeg 1 │  │FFmpeg 2 │  │FFmpeg N ││
│                              │Seg 0-10 │  │Seg 10-20│  │Seg N    ││
│                              └─────────┘  └─────────┘  └─────────┘│
│                                    │            │            │   │
│                                    └────────────┼────────────┘   │
│                                                 ▼                 │
│                                    ┌─────────────────────────┐   │
│                                    │ Delete temp file        │   │
│                                    └─────────────────────────┘   │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Ưu điểm:**

| Tiêu chí | Chi tiết |
|----------|----------|
| **Minimal Network** | Chỉ download 1 lần, network = file size |
| **Fast Seek** | Local disk seek là O(1), không có network latency |
| **Moov Read Once** | Tất cả processes đọc từ local cache |
| **Reliable** | Không phụ thuộc network stability sau download |

**Nhược điểm:**

| Tiêu chí | Chi tiết |
|----------|----------|
| **Disk Space** | Cần temp storage = file size (có thể hàng GB) |
| **Initial Latency** | Phải chờ download xong mới bắt đầu segment |
| **I/O Bottleneck** | Nhiều FFmpeg đọc cùng 1 file = disk contention |
| **Single Point of Failure** | Download fail = toàn bộ job fail |

### 2.1.3. Chiến Lược C (KHUYẾN NGHỊ): Hybrid Streaming Pipeline

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    STRATEGY C: HYBRID STREAMING PIPELINE                  │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  PHASE 1: PROBE                                                          │
│  ┌─────────┐   Range: 0-50MB    ┌──────────────────┐                     │
│  │ MinIO   │ ─────────────────► │ FFprobe          │                     │
│  │         │   (chỉ moov)       │ → Duration       │                     │
│  │         │                    │ → Keyframe list  │                     │
│  └─────────┘                    │ → Resolution     │                     │
│                                 └────────┬─────────┘                     │
│                                          │                                │
│  PHASE 2: SEGMENT PLANNING               │                                │
│                                          ▼                                │
│                          ┌───────────────────────────────┐               │
│                          │    Segment Coordinator        │               │
│                          │    ─────────────────────      │               │
│                          │    Video: 3600s               │               │
│                          │    Segment size: 10s          │               │
│                          │    Total segments: 360        │               │
│                          │    Keyframes: [0, 9.8, 19.7,  │               │
│                          │                29.5, ...]     │               │
│                          │                               │               │
│                          │    SMART BATCHING:            │               │
│                          │    Batch 1: Seg 0-9 (0-100s)  │               │
│                          │    Batch 2: Seg 10-19         │               │
│                          │    ...                        │               │
│                          └───────────────┬───────────────┘               │
│                                          │                                │
│  PHASE 3: BATCH DOWNLOAD + PARALLEL ENCODE                               │
│                                          │                                │
│       ┌──────────────────────────────────┼──────────────────────────┐    │
│       │                                  ▼                          │    │
│       │  ┌─────────────────────────────────────────────────────┐   │    │
│       │  │              BATCH PROCESSOR                         │   │    │
│       │  │  ┌─────────────────────────────────────────────┐    │   │    │
│       │  │  │ 1. Range Request: bytes=0-104857600         │    │   │    │
│       │  │  │    (100MB = ~100s video @ 8Mbps)            │    │   │    │
│       │  │  │                                             │    │   │    │
│       │  │  │ 2. Stream to Named Pipe (FIFO):             │    │   │    │
│       │  │  │    MinIO Stream ──► /tmp/batch1.pipe        │    │   │    │
│       │  │  │                                             │    │   │    │
│       │  │  │ 3. FFmpeg reads from pipe:                  │    │   │    │
│       │  │  │    FFmpeg -i /tmp/batch1.pipe               │    │   │    │
│       │  │  │           -f segment                        │    │   │    │
│       │  │  │           -segment_time 10                  │    │   │    │
│       │  │  │           seg_%03d.ts                       │    │   │    │
│       │  │  └─────────────────────────────────────────────┘    │   │    │
│       │  │                                                      │   │    │
│       │  │  Memory: ~100MB buffer (batch size)                 │   │    │
│       │  │  Disk: ZERO (using named pipe)                      │   │    │
│       │  └─────────────────────────────────────────────────────┘   │    │
│       │                                                             │    │
│       └─────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  PHASE 4: PARALLEL ENCODING (per segment)                                │
│                                                                           │
│       ┌─────────────────────────────────────────────────────────────┐    │
│       │                    ENCODING THREAD POOL                      │    │
│       │                    (size = CPU cores - 2)                    │    │
│       │                                                              │    │
│       │  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐ │    │
│       │  │ Worker 1 │   │ Worker 2 │   │ Worker 3 │   │ Worker N │ │    │
│       │  │ seg_000  │   │ seg_001  │   │ seg_002  │   │ seg_00N  │ │    │
│       │  │ ────────►│   │ ────────►│   │ ────────►│   │ ────────►│ │    │
│       │  │ Original │   │ Original │   │ Original │   │ Original │ │    │
│       │  │ + 720p   │   │ + 720p   │   │ + 720p   │   │ + 720p   │ │    │
│       │  └──────────┘   └──────────┘   └──────────┘   └──────────┘ │    │
│       │                                                              │    │
│       │  Mỗi worker chạy FFmpeg với:                                │    │
│       │  - Thread limit: -threads 2 (tránh CPU saturation)          │    │
│       │  - Memory limit: ulimit hoặc cgroup                         │    │
│       │                                                              │    │
│       └─────────────────────────────────────────────────────────────┘    │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2.2. Thread Pool và Resource Management

### 2.2.1. Bài Toán OOM và CPU Saturation

**Scenario xấu nhất:**
```
Server: 16 CPU cores, 32GB RAM
Video: 1 giờ, 360 segments

Nếu spawn 360 FFmpeg processes đồng thời:
- Memory: 360 × 200MB (FFmpeg working memory) = 72GB → OOM!
- CPU: 360 processes tranh giành 16 cores → thrashing
- I/O: 360 processes đọc/ghi đồng thời → disk bottleneck
```

### 2.2.2. Mô Hình Thread Pool Đề Xuất

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         RESOURCE GOVERNOR                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    BOUNDED THREAD POOL                              │ │
│  │                                                                     │ │
│  │    Pool Size = min(CPU_CORES - 2, MAX_CONCURRENT_ENCODES)          │ │
│  │                                                                     │ │
│  │    Ví dụ: 16 cores → Pool size = 14                                │ │
│  │    Giữ 2 cores cho: OS, Java GC, Network I/O                       │ │
│  │                                                                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    MEMORY BUDGET PER WORKER                         │ │
│  │                                                                     │ │
│  │    Total Available = 32GB - 4GB (OS/Java) = 28GB                   │ │
│  │    Per Worker = 28GB / 14 workers = 2GB max                        │ │
│  │                                                                     │ │
│  │    FFmpeg memory usage (thực tế):                                  │ │
│  │    - Decode buffer: ~100MB (10s × 8Mbps)                           │ │
│  │    - Encode buffer: ~200MB (output buffering)                      │ │
│  │    - Working memory: ~100MB                                        │ │
│  │    ─────────────────────────────────                               │ │
│  │    Total per worker: ~400MB (có headroom 5x)                       │ │
│  │                                                                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    FFMPEG THREAD LIMITING                           │ │
│  │                                                                     │ │
│  │    Mỗi FFmpeg process được giới hạn: -threads 2                    │ │
│  │                                                                     │ │
│  │    Tại sao?                                                        │ │
│  │    - 14 workers × 2 threads = 28 threads                           │ │
│  │    - 16 cores với HyperThreading = 32 logical cores                │ │
│  │    - Utilization target: 28/32 = 87.5% (để headroom)               │ │
│  │                                                                     │ │
│  │    Nếu không giới hạn:                                             │ │
│  │    - FFmpeg mặc định dùng all cores                                │ │
│  │    - 14 workers × 16 threads = 224 threads!                        │ │
│  │    - Context switching overhead làm chậm toàn bộ system            │ │
│  │                                                                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                    BOUNDED QUEUE + BACKPRESSURE                     │ │
│  │                                                                     │ │
│  │    ┌─────────────────────────────────────────────────────────────┐ │ │
│  │    │    TASK QUEUE (capacity = 2 × pool_size)                    │ │ │
│  │    │                                                             │ │ │
│  │    │    [Seg 14] [Seg 15] [Seg 16] ... [Seg 27]                 │ │ │
│  │    │    ◄─────────── 28 tasks max ──────────────►                │ │ │
│  │    │                                                             │ │ │
│  │    │    Khi queue đầy → Producer block (backpressure)           │ │ │
│  │    │    → Tự động điều tiết tốc độ tạo task                     │ │ │
│  │    │                                                             │ │ │
│  │    └─────────────────────────────────────────────────────────────┘ │ │
│  │                                                                     │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2.3. Cấu Hình Thread Pool Chi Tiết

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    THREAD POOL CONFIGURATION MATRIX                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SERVER PROFILE    │ CPU │ RAM  │ POOL │ THREADS/ │ QUEUE │ MAX MEM/   │
│                    │     │      │ SIZE │ WORKER   │ SIZE  │ WORKER     │
│  ──────────────────┼─────┼──────┼──────┼──────────┼───────┼────────────│
│  Small (Dev)       │  4  │  8GB │   2  │    1     │   4   │   2GB      │
│  Medium            │  8  │ 16GB │   6  │    1     │  12   │   2GB      │
│  Large             │ 16  │ 32GB │  14  │    2     │  28   │   2GB      │
│  X-Large           │ 32  │ 64GB │  28  │    2     │  56   │   2GB      │
│  Dedicated Encoder │ 64  │128GB │  60  │    2     │ 120   │   2GB      │
│                                                                          │
│  CÔNG THỨC:                                                             │
│  ────────────                                                            │
│  pool_size = CPU_CORES - 2                                              │
│  threads_per_worker = max(1, CPU_CORES / pool_size / 2)                 │
│  queue_size = pool_size × 2                                             │
│  max_memory_per_worker = (RAM - 4GB) / pool_size                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2.3. Kiến Trúc Tổng Thể Đề Xuất

```
┌────────────────────────────────────────────────────────────────────────────────┐
│                           COMPLETE SYSTEM ARCHITECTURE                          │
├────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                              LAYER 1: API                                │  │
│  │                                                                          │  │
│  │   POST /api/videos/encode                                               │  │
│  │   {                                                                      │  │
│  │     "sourceMinioPath": "bucket/original/video.mp4",                     │  │
│  │     "outputPath": "bucket/hls/{videoId}/",                              │  │
│  │     "qualities": ["original", "720p"]                                   │  │
│  │   }                                                                      │  │
│  │                                                                          │  │
│  │   Response: { "jobId": "abc-123", "status": "QUEUED" }                  │  │
│  │                                                                          │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                         │                                      │
│                                         ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                         LAYER 2: JOB ORCHESTRATOR                        │  │
│  │                                                                          │  │
│  │   ┌───────────────┐    ┌───────────────┐    ┌───────────────┐          │  │
│  │   │ Job Queue     │    │ Job State     │    │ Progress      │          │  │
│  │   │ (Redis/Kafka) │    │ Machine       │    │ Tracker       │          │  │
│  │   │               │    │               │    │               │          │  │
│  │   │ FIFO ordering │    │ QUEUED        │    │ 45/360 segs   │          │  │
│  │   │ Priority      │    │ PROBING       │    │ 12.5%         │          │  │
│  │   │ Retry logic   │    │ SEGMENTING    │    │ ETA: 15min    │          │  │
│  │   │               │    │ ENCODING      │    │               │          │  │
│  │   │               │    │ UPLOADING     │    │               │          │  │
│  │   │               │    │ COMPLETED     │    │               │          │  │
│  │   │               │    │ FAILED        │    │               │          │  │
│  │   └───────────────┘    └───────────────┘    └───────────────┘          │  │
│  │                                                                          │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                         │                                      │
│                                         ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                       LAYER 3: PROCESSING PIPELINE                       │  │
│  │                                                                          │  │
│  │   ┌─────────────┐     ┌─────────────┐     ┌─────────────┐              │  │
│  │   │   PROBE     │     │  SEGMENT    │     │   ENCODE    │              │  │
│  │   │   STAGE     │────►│  PLANNER    │────►│   STAGE     │              │  │
│  │   │             │     │             │     │             │              │  │
│  │   │ FFprobe     │     │ Keyframe    │     │ Parallel    │              │  │
│  │   │ via URL     │     │ alignment   │     │ workers     │              │  │
│  │   │             │     │ Batch calc  │     │             │              │  │
│  │   └─────────────┘     └─────────────┘     └─────────────┘              │  │
│  │                                                  │                       │  │
│  │                                                  ▼                       │  │
│  │                                          ┌─────────────┐                │  │
│  │                                          │  MANIFEST   │                │  │
│  │                                          │  GENERATOR  │                │  │
│  │                                          │             │                │  │
│  │                                          │ master.m3u8 │                │  │
│  │                                          │ 720p.m3u8   │                │  │
│  │                                          │ original.   │                │  │
│  │                                          │ m3u8        │                │  │
│  │                                          └─────────────┘                │  │
│  │                                                                          │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                         │                                      │
│                                         ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                        LAYER 4: RESOURCE LAYER                           │  │
│  │                                                                          │  │
│  │   ┌────────────────┐   ┌────────────────┐   ┌────────────────┐         │  │
│  │   │                │   │                │   │                │         │  │
│  │   │    MinIO       │   │   Local Temp   │   │    MongoDB     │         │  │
│  │   │    ──────      │   │   ──────────   │   │    ───────     │         │  │
│  │   │                │   │                │   │                │         │  │
│  │   │ • Source video │   │ • Named pipes  │   │ • Job metadata │         │  │
│  │   │ • Output HLS   │   │ • Segment temp │   │ • Segment map  │         │  │
│  │   │ • Presigned    │   │ • Auto cleanup │   │ • Progress     │         │  │
│  │   │   URLs         │   │                │   │                │         │  │
│  │   │                │   │                │   │                │         │  │
│  │   └────────────────┘   └────────────────┘   └────────────────┘         │  │
│  │                                                                          │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
└────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2.4. So Sánh Chiến Lược - Decision Matrix

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           STRATEGY COMPARISON MATRIX                             │
├──────────────────┬───────────────┬───────────────┬───────────────────────────────┤
│     Criteria     │  Strategy A   │  Strategy B   │  Strategy C (Recommended)     │
│                  │ (Direct URL)  │ (Full Download)│  (Hybrid Pipeline)           │
├──────────────────┼───────────────┼───────────────┼───────────────────────────────┤
│                  │               │               │                               │
│ Network Usage    │ ❌ High       │ ✅ Optimal    │ ✅ Optimal                    │
│                  │ (N × moov)    │ (1 × file)    │ (1 × file, streamed)          │
│                  │               │               │                               │
├──────────────────┼───────────────┼───────────────┼───────────────────────────────┤
│                  │               │               │                               │
│ Disk Usage       │ ✅ Zero       │ ❌ Full file  │ ⚠️ Minimal                    │
│                  │               │ size          │ (batch buffer only)           │
│                  │               │               │                               │
├──────────────────┼───────────────┼───────────────┼───────────────────────────────┤
│                  │               │               │                               │
│ Memory Usage     │ ⚠️ Per-process│ ✅ Shared     │ ✅ Controlled                 │
│                  │ duplication   │ source        │ (bounded queue)               │
│                  │               │               │                               │
├──────────────────┼───────────────┼───────────────┼───────────────────────────────┤
│                  │               │               │                               │
│ Initial Latency  │ ✅ None       │ ❌ Download   │ ⚠️ Probe time                 │
│                  │               │ time          │ (~5s)                         │
│                  │               │               │                               │
├──────────────────┼───────────────┼───────────────┼───────────────────────────────┤
│                  │               │               │                               │
│ Parallelism      │ ✅ Full       │ ✅ Full       │ ✅ Full                       │
│                  │               │               │                               │
├──────────────────┼───────────────┼───────────────┼───────────────────────────────┤
│                  │               │               │                               │
│ Failure Recovery │ ✅ Per-segment│ ❌ Full retry │ ✅ Per-batch retry            │
│                  │               │               │                               │
├──────────────────┼───────────────┼───────────────┼───────────────────────────────┤
│                  │               │               │                               │
│ Scalability      │ ✅ Horizontal │ ❌ Vertical   │ ✅ Horizontal                 │
│                  │               │ only          │                               │
│                  │               │               │                               │
├──────────────────┼───────────────┼───────────────┼───────────────────────────────┤
│                  │               │               │                               │
│ Implementation   │ ✅ Simple     │ ✅ Simple     │ ⚠️ Complex                    │
│ Complexity       │               │               │ (nhưng worthwhile)            │
│                  │               │               │                               │
├──────────────────┼───────────────┼───────────────┼───────────────────────────────┤
│                  │               │               │                               │
│ OVERALL SCORE    │ 6/10         │ 5/10         │ 9/10                          │
│                  │               │               │                               │
└──────────────────┴───────────────┴───────────────┴───────────────────────────────┘

RECOMMENDATION: Strategy C (Hybrid Pipeline) vì:
─────────────────────────────────────────────────
1. Cân bằng tối ưu giữa network và disk usage
2. Cho phép parallel encoding với resource governance
3. Có khả năng recovery tốt (per-batch)
4. Horizontal scalability cho production
```

---

# STEP 3: Implementation Concept

## 3.1. Logic Flow Tổng Quan

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        COMPLETE PROCESSING FLOW                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ╔═══════════════════════════════════════════════════════════════════════════╗ │
│  ║  PHASE 1: VIDEO PROBE (Metadata Extraction)                               ║ │
│  ╠═══════════════════════════════════════════════════════════════════════════╣ │
│  ║                                                                           ║ │
│  ║  INPUT:  MinIO path: "videos/original/abc123.mp4"                        ║ │
│  ║                                                                           ║ │
│  ║  PROCESS:                                                                 ║ │
│  ║  ┌─────────────┐                                                         ║ │
│  ║  │ Java Service│                                                         ║ │
│  ║  │             │ 1. minioClient.getPresignedObjectUrl(                   ║ │
│  ║  │             │      bucket, path, 1 hour expiry)                       ║ │
│  ║  │             │                                                         ║ │
│  ║  │             │    → presignedUrl                                       ║ │
│  ║  │             │                                                         ║ │
│  ║  │             │ 2. Execute FFprobe:                                     ║ │
│  ║  │             │    ffprobe -v quiet -print_format json                  ║ │
│  ║  │             │            -show_format -show_streams                   ║ │
│  ║  │             │            "presignedUrl"                               ║ │
│  ║  │             │                                                         ║ │
│  ║  │             │    → JSON với duration, resolution, codec, bitrate      ║ │
│  ║  │             │                                                         ║ │
│  ║  │             │ 3. Execute FFprobe Keyframe Detection:                  ║ │
│  ║  │             │    ffprobe -v quiet -select_streams v                   ║ │
│  ║  │             │            -show_entries frame=pkt_pts_time,key_frame   ║ │
│  ║  │             │            -of csv "presignedUrl"                       ║ │
│  ║  │             │                                                         ║ │
│  ║  │             │    → List of keyframe timestamps                        ║ │
│  ║  └─────────────┘                                                         ║ │
│  ║                                                                           ║ │
│  ║  OUTPUT:  VideoMetadata {                                                ║ │
│  ║             duration: 3600.5s                                            ║ │
│  ║             width: 1920, height: 1080                                    ║ │
│  ║             codec: "h264"                                                ║ │
│  ║             bitrate: 8000000                                             ║ │
│  ║             keyframes: [0, 2.0, 4.0, 6.0, 8.0, 10.0, ...]              ║ │
│  ║           }                                                              ║ │
│  ║                                                                           ║ │
│  ╚═══════════════════════════════════════════════════════════════════════════╝ │
│                                    │                                            │
│                                    ▼                                            │
│  ╔═══════════════════════════════════════════════════════════════════════════╗ │
│  ║  PHASE 2: SEGMENT PLANNING                                                ║ │
│  ╠═══════════════════════════════════════════════════════════════════════════╣ │
│  ║                                                                           ║ │
│  ║  INPUT:  VideoMetadata + targetSegmentDuration (10s)                     ║ │
│  ║                                                                           ║ │
│  ║  ALGORITHM: Keyframe-Aligned Segment Planning                            ║ │
│  ║  ──────────────────────────────────────────────                          ║ │
│  ║                                                                           ║ │
│  ║  Mục tiêu: Cắt segment tại keyframe gần nhất với mốc 10s                ║ │
│  ║  Lý do: Cắt tại non-keyframe gây hiện tượng màn hình xanh/artifact      ║ │
│  ║                                                                           ║ │
│  ║  Video:  |====|====|====|====|====|====|====|====|====|====|             ║ │
│  ║  Time:   0    5    10   15   20   25   30   35   40   45                 ║ │
│  ║  KF:     *         *         *         *         *                       ║ │
│  ║  Target: |---------|---------|---------|---------|                       ║ │
│  ║  Actual: |---------|---------|---------|---------|                       ║ │
│  ║          0      9.8      19.7      29.5      39.4                        ║ │
│  ║                                                                           ║ │
│  ║  PROCESS:                                                                 ║ │
│  ║  for each targetTime in [10, 20, 30, ...]:                               ║ │
│  ║      nearestKeyframe = findNearestKeyframe(keyframes, targetTime)        ║ │
│  ║      segments.add(new Segment(startTime, nearestKeyframe))               ║ │
│  ║      startTime = nearestKeyframe                                         ║ │
│  ║                                                                           ║ │
│  ║  OUTPUT:  List<SegmentPlan> [                                            ║ │
│  ║             { index: 0, start: 0.0, end: 9.8, duration: 9.8 },          ║ │
│  ║             { index: 1, start: 9.8, end: 19.7, duration: 9.9 },         ║ │
│  ║             { index: 2, start: 19.7, end: 29.5, duration: 9.8 },        ║ │
│  ║             ...                                                          ║ │
│  ║             { index: 359, start: 3590.2, end: 3600.5, duration: 10.3 }  ║ │
│  ║           ]                                                              ║ │
│  ║                                                                           ║ │
│  ╚═══════════════════════════════════════════════════════════════════════════╝ │
│                                    │                                            │
│                                    ▼                                            │
│  ╔═══════════════════════════════════════════════════════════════════════════╗ │
│  ║  PHASE 3: PARALLEL ENCODING                                               ║ │
│  ╠═══════════════════════════════════════════════════════════════════════════╣ │
│  ║                                                                           ║ │
│  ║  INPUT:  List<SegmentPlan>, presignedUrl, qualities: [original, 720p]   ║ │
│  ║                                                                           ║ │
│  ║  ┌─────────────────────────────────────────────────────────────────────┐ ║ │
│  ║  │                      THREAD POOL EXECUTOR                           │ ║ │
│  ║  │                      ─────────────────────                          │ ║ │
│  ║  │  Core Pool Size: CPU_CORES - 2                                     │ ║ │
│  ║  │  Max Pool Size: CPU_CORES - 2 (no expansion)                       │ ║ │
│  ║  │  Queue: LinkedBlockingQueue(capacity = pool_size × 2)              │ ║ │
│  ║  │  Rejection Policy: CallerRunsPolicy (backpressure)                 │ ║ │
│  ║  │                                                                     │ ║ │
│  ║  │  ┌─────────────────────────────────────────────────────────────┐   │ ║ │
│  ║  │  │                    WORK QUEUE                               │   │ ║ │
│  ║  │  │  [Seg0-orig] [Seg0-720p] [Seg1-orig] [Seg1-720p] ...       │   │ ║ │
│  ║  │  └─────────────────────────────────────────────────────────────┘   │ ║ │
│  ║  │                              │                                      │ ║ │
│  ║  │          ┌──────────────────┬┴──────────────────┐                  │ ║ │
│  ║  │          │                  │                   │                  │ ║ │
│  ║  │          ▼                  ▼                   ▼                  │ ║ │
│  ║  │   ┌───────────┐      ┌───────────┐      ┌───────────┐             │ ║ │
│  ║  │   │ Worker 1  │      │ Worker 2  │      │ Worker N  │             │ ║ │
│  ║  │   │           │      │           │      │           │             │ ║ │
│  ║  │   │ FFmpeg:   │      │ FFmpeg:   │      │ FFmpeg:   │             │ ║ │
│  ║  │   │ -ss 0     │      │ -ss 0     │      │ -ss 9.8   │             │ ║ │
│  ║  │   │ -t 9.8    │      │ -t 9.8    │      │ -t 9.9    │             │ ║ │
│  ║  │   │ -i URL    │      │ -i URL    │      │ -i URL    │             │ ║ │
│  ║  │   │ (original)│      │ -vf       │      │ (original)│             │ ║ │
│  ║  │   │ -threads 2│      │ scale=    │      │ -threads 2│             │ ║ │
│  ║  │   │           │      │ 1280:720  │      │           │             │ ║ │
│  ║  │   │ → seg0.ts │      │ -threads 2│      │ → seg1.ts │             │ ║ │
│  ║  │   │           │      │           │      │           │             │ ║ │
│  ║  │   │           │      │ → seg0_   │      │           │             │ ║ │
│  ║  │   │           │      │   720p.ts │      │           │             │ ║ │
│  ║  │   └───────────┘      └───────────┘      └───────────┘             │ ║ │
│  ║  │                                                                     │ ║ │
│  ║  └─────────────────────────────────────────────────────────────────────┘ ║ │
│  ║                                                                           ║ │
│  ║  FFMPEG COMMAND TEMPLATES:                                               ║ │
│  ║  ──────────────────────────                                              ║ │
│  ║                                                                           ║ │
│  ║  Original Quality:                                                       ║ │
│  ║  ffmpeg -ss {startTime} -t {duration}                                   ║ │
│  ║         -i "{presignedUrl}"                                             ║ │
│  ║         -c:v libx264 -preset medium -crf 23                             ║ │
│  ║         -c:a aac -b:a 128k                                              ║ │
│  ║         -threads 2                                                       ║ │
│  ║         -f mpegts                                                        ║ │
│  ║         "{outputDir}/original/segment_{index:03d}.ts"                   ║ │
│  ║                                                                           ║ │
│  ║  720p Quality:                                                           ║ │
│  ║  ffmpeg -ss {startTime} -t {duration}                                   ║ │
│  ║         -i "{presignedUrl}"                                             ║ │
│  ║         -vf "scale=1280:720"                                            ║ │
│  ║         -c:v libx264 -preset medium -crf 23 -b:v 2500k                  ║ │
│  ║         -c:a aac -b:a 128k                                              ║ │
│  ║         -threads 2                                                       ║ │
│  ║         -f mpegts                                                        ║ │
│  ║         "{outputDir}/720p/segment_{index:03d}.ts"                       ║ │
│  ║                                                                           ║ │
│  ║  OUTPUT:  Local temp files:                                              ║ │
│  ║           /tmp/job_xyz/original/segment_000.ts                          ║ │
│  ║           /tmp/job_xyz/original/segment_001.ts                          ║ │
│  ║           ...                                                            ║ │
│  ║           /tmp/job_xyz/720p/segment_000.ts                              ║ │
│  ║           /tmp/job_xyz/720p/segment_001.ts                              ║ │
│  ║           ...                                                            ║ │
│  ║                                                                           ║ │
│  ╚═══════════════════════════════════════════════════════════════════════════╝ │
│                                    │                                            │
│                                    ▼                                            │
│  ╔═══════════════════════════════════════════════════════════════════════════╗ │
│  ║  PHASE 4: MANIFEST GENERATION                                             ║ │
│  ╠═══════════════════════════════════════════════════════════════════════════╣ │
│  ║                                                                           ║ │
│  ║  INPUT:  List<SegmentPlan> + encoded segment files                       ║ │
│  ║                                                                           ║ │
│  ║  PROCESS:                                                                 ║ │
│  ║                                                                           ║ │
│  ║  1. Generate variant playlists:                                          ║ │
│  ║                                                                           ║ │
│  ║     original.m3u8:                                                       ║ │
│  ║     ─────────────────────────────────────────────                        ║ │
│  ║     #EXTM3U                                                              ║ │
│  ║     #EXT-X-VERSION:3                                                     ║ │
│  ║     #EXT-X-TARGETDURATION:11                                             ║ │
│  ║     #EXT-X-MEDIA-SEQUENCE:0                                              ║ │
│  ║     #EXTINF:9.800,                                                       ║ │
│  ║     original/segment_000.ts                                              ║ │
│  ║     #EXTINF:9.900,                                                       ║ │
│  ║     original/segment_001.ts                                              ║ │
│  ║     ...                                                                  ║ │
│  ║     #EXT-X-ENDLIST                                                       ║ │
│  ║                                                                           ║ │
│  ║     720p.m3u8:                                                           ║ │
│  ║     ─────────────────────────────────────────────                        ║ │
│  ║     #EXTM3U                                                              ║ │
│  ║     #EXT-X-VERSION:3                                                     ║ │
│  ║     #EXT-X-TARGETDURATION:11                                             ║ │
│  ║     #EXT-X-MEDIA-SEQUENCE:0                                              ║ │
│  ║     #EXTINF:9.800,                                                       ║ │
│  ║     720p/segment_000.ts                                                  ║ │
│  ║     #EXTINF:9.900,                                                       ║ │
│  ║     720p/segment_001.ts                                                  ║ │
│  ║     ...                                                                  ║ │
│  ║     #EXT-X-ENDLIST                                                       ║ │
│  ║                                                                           ║ │
│  ║  2. Generate master playlist:                                            ║ │
│  ║                                                                           ║ │
│  ║     master.m3u8:                                                         ║ │
│  ║     ─────────────────────────────────────────────                        ║ │
│  ║     #EXTM3U                                                              ║ │
│  ║     #EXT-X-VERSION:3                                                     ║ │
│  ║                                                                           ║ │
│  ║     #EXT-X-STREAM-INF:BANDWIDTH=8000000,RESOLUTION=1920x1080            ║ │
│  ║     original.m3u8                                                        ║ │
│  ║                                                                           ║ │
│  ║     #EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720             ║ │
│  ║     720p.m3u8                                                            ║ │
│  ║                                                                           ║ │
│  ║  OUTPUT:  Manifest files saved to local temp                             ║ │
│  ║                                                                           ║ │
│  ╚═══════════════════════════════════════════════════════════════════════════╝ │
│                                    │                                            │
│                                    ▼                                            │
│  ╔═══════════════════════════════════════════════════════════════════════════╗ │
│  ║  PHASE 5: UPLOAD TO MINIO                                                 ║ │
│  ╠═══════════════════════════════════════════════════════════════════════════╣ │
│  ║                                                                           ║ │
│  ║  INPUT:  Local temp directory with all HLS files                         ║ │
│  ║                                                                           ║ │
│  ║  PROCESS:                                                                 ║ │
│  ║                                                                           ║ │
│  ║  ┌─────────────────────────────────────────────────────────────────────┐ ║ │
│  ║  │                      PARALLEL UPLOAD                                │ ║ │
│  ║  │                                                                     │ ║ │
│  ║  │  Upload Thread Pool (size = 10 concurrent connections)             │ ║ │
│  ║  │                                                                     │ ║ │
│  ║  │  for each file in [manifests + segments]:                          │ ║ │
│  ║  │      minioClient.putObject(                                        │ ║ │
│  ║  │          bucket: "videos-hls",                                     │ ║ │
│  ║  │          object: "hls/{videoId}/original/segment_000.ts",         │ ║ │
│  ║  │          stream: FileInputStream(localFile),                       │ ║ │
│  ║  │          contentType: "video/mp2t"                                 │ ║ │
│  ║  │      )                                                             │ ║ │
│  ║  │                                                                     │ ║ │
│  ║  │  Content-Type mapping:                                             │ ║ │
│  ║  │  ─────────────────────                                             │ ║ │
│  ║  │  .m3u8 → application/vnd.apple.mpegurl                            │ ║ │
│  ║  │  .ts   → video/mp2t                                                │ ║ │
│  ║  │                                                                     │ ║ │
│  ║  └─────────────────────────────────────────────────────────────────────┘ ║ │
│  ║                                                                           ║ │
│  ║  FINAL MINIO STRUCTURE:                                                  ║ │
│  ║  ────────────────────────                                                ║ │
│  ║                                                                           ║ │
│  ║  videos-hls/                                                             ║ │
│  ║  └── hls/                                                                ║ │
│  ║      └── {videoId}/                                                      ║ │
│  ║          ├── master.m3u8                                                 ║ │
│  ║          ├── original.m3u8                                               ║ │
│  ║          ├── 720p.m3u8                                                   ║ │
│  ║          ├── original/                                                   ║ │
│  ║          │   ├── segment_000.ts                                          ║ │
│  ║          │   ├── segment_001.ts                                          ║ │
│  ║          │   └── ...                                                     ║ │
│  ║          └── 720p/                                                       ║ │
│  ║              ├── segment_000.ts                                          ║ │
│  ║              ├── segment_001.ts                                          ║ │
│  ║              └── ...                                                     ║ │
│  ║                                                                           ║ │
│  ║  OUTPUT:  Streaming URL:                                                 ║ │
│  ║           https://minio.server/videos-hls/hls/{videoId}/master.m3u8    ║ │
│  ║                                                                           ║ │
│  ╚═══════════════════════════════════════════════════════════════════════════╝ │
│                                    │                                            │
│                                    ▼                                            │
│  ╔═══════════════════════════════════════════════════════════════════════════╗ │
│  ║  PHASE 6: CLEANUP                                                         ║ │
│  ╠═══════════════════════════════════════════════════════════════════════════╣ │
│  ║                                                                           ║ │
│  ║  1. Delete local temp directory: rm -rf /tmp/job_{jobId}/                ║ │
│  ║  2. Update job status in MongoDB: COMPLETED                              ║ │
│  ║  3. Emit event/notification: JobCompletedEvent                           ║ │
│  ║  4. Optional: Delete source file from MinIO nếu cần                      ║ │
│  ║                                                                           ║ │
│  ╚═══════════════════════════════════════════════════════════════════════════╝ │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3.2. Sequence Diagram Chi Tiết

```
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  Client  │  │   API    │  │   Job    │  │  MinIO   │  │  FFmpeg  │  │  Thread  │
│          │  │ Controller│  │Orchestrator│ │  Client  │  │ Executor │  │   Pool   │
└────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │             │             │             │
     │ POST /encode│             │             │             │             │
     │────────────►│             │             │             │             │
     │             │             │             │             │             │
     │             │ createJob() │             │             │             │
     │             │────────────►│             │             │             │
     │             │             │             │             │             │
     │  { jobId }  │             │             │             │             │
     │◄────────────│             │             │             │             │
     │             │             │             │             │             │
     │             │             │ getPresignedUrl()         │             │
     │             │             │────────────►│             │             │
     │             │             │             │             │             │
     │             │             │  presignedUrl             │             │
     │             │             │◄────────────│             │             │
     │             │             │             │             │             │
     │             │             │ executeProbe(url)         │             │
     │             │             │────────────────────────── ►│             │
     │             │             │             │             │             │
     │             │             │         VideoMetadata     │             │
     │             │             │◄─────────────────────────── │             │
     │             │             │             │             │             │
     │             │             │ planSegments()            │             │
     │             │             │─────────┐   │             │             │
     │             │             │         │   │             │             │
     │             │             │◄────────┘   │             │             │
     │             │             │             │             │             │
     │             │             │ submitEncodeTasks()       │             │
     │             │             │─────────────────────────────────────────►│
     │             │             │             │             │             │
     │             │             │             │             │    ┌────────┴────────┐
     │             │             │             │             │    │                 │
     │             │             │             │             │    │  Worker 1..N    │
     │             │             │             │             │    │                 │
     │             │             │             │             │    │  for each seg:  │
     │             │             │             │             │    │   FFmpeg encode │
     │             │             │             │             │    │                 │
     │             │             │             │             │    └────────┬────────┘
     │             │             │             │             │             │
     │             │             │     all segments completed              │
     │             │             │◄─────────────────────────────────────────│
     │             │             │             │             │             │
     │             │             │ generateManifests()       │             │
     │             │             │─────────┐   │             │             │
     │             │             │         │   │             │             │
     │             │             │◄────────┘   │             │             │
     │             │             │             │             │             │
     │             │             │ uploadToMinIO()           │             │
     │             │             │────────────►│             │             │
     │             │             │             │             │             │
     │             │             │         success          │             │
     │             │             │◄────────────│             │             │
     │             │             │             │             │             │
     │             │             │ cleanup()  │             │             │
     │             │             │─────────┐   │             │             │
     │             │             │         │   │             │             │
     │             │             │◄────────┘   │             │             │
     │             │             │             │             │             │
     │             │             │ updateStatus(COMPLETED)  │             │
     │             │             │─────────┐   │             │             │
     │             │             │         │   │             │             │
     │             │             │◄────────┘   │             │             │
     │             │             │             │             │             │
     │ GET /jobs/{jobId}/status │             │             │             │
     │────────────►│             │             │             │             │
     │             │ getJobStatus()           │             │             │
     │             │────────────►│             │             │             │
     │             │             │             │             │             │
     │  { status: "COMPLETED", streamingUrl: "..." }        │             │
     │◄────────────│             │             │             │             │
     │             │             │             │             │             │
```

---

## 3.3. Error Handling và Recovery

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        ERROR HANDLING STRATEGY                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    FAILURE CATEGORIES                                    │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                          │   │
│  │  CATEGORY 1: TRANSIENT FAILURES (auto-retry)                            │   │
│  │  ────────────────────────────────────────────                           │   │
│  │  • Network timeout đến MinIO                                            │   │
│  │  • FFmpeg process crash do resource exhaustion                          │   │
│  │  • Presigned URL expired giữa chừng                                     │   │
│  │                                                                          │   │
│  │  Strategy:                                                               │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  RetryTemplate:                                                  │   │   │
│  │  │    maxAttempts: 3                                               │   │   │
│  │  │    backoffPolicy: ExponentialBackoff(                           │   │   │
│  │  │      initialInterval: 1s,                                       │   │   │
│  │  │      maxInterval: 30s,                                          │   │   │
│  │  │      multiplier: 2                                              │   │   │
│  │  │    )                                                            │   │   │
│  │  │    retryableExceptions: [IOException, TimeoutException]        │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                          │   │
│  │  CATEGORY 2: SEGMENT-LEVEL FAILURES (partial retry)                     │   │
│  │  ─────────────────────────────────────────────────                      │   │
│  │  • Single segment encode fails                                          │   │
│  │  • Single segment upload fails                                          │   │
│  │                                                                          │   │
│  │  Strategy:                                                               │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  SegmentRetryPolicy:                                            │   │   │
│  │  │    - Track failed segments in MongoDB                           │   │   │
│  │  │    - Re-queue only failed segments                              │   │   │
│  │  │    - Do not re-process successful segments                      │   │   │
│  │  │    - After 3 retries, mark job as PARTIALLY_FAILED             │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                          │   │
│  │  CATEGORY 3: FATAL FAILURES (abort job)                                 │   │
│  │  ─────────────────────────────────────────                              │   │
│  │  • Source video corrupted/unreadable                                    │   │
│  │  • Invalid video format (không phải video)                              │   │
│  │  • Insufficient permissions                                             │   │
│  │                                                                          │   │
│  │  Strategy:                                                               │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │  - Mark job as FAILED immediately                               │   │   │
│  │  │  - Log detailed error message                                   │   │   │
│  │  │  - Cleanup partial outputs                                      │   │   │
│  │  │  - Notify client via webhook/polling                           │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    CIRCUIT BREAKER PATTERN                               │   │
│  ├─────────────────────────────────────────────────────────────────────────┤   │
│  │                                                                          │   │
│  │  Áp dụng khi MinIO hoặc FFmpeg liên tục fail:                          │   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │  │                                                                  │   │   │
│  │  │     CLOSED ──────► OPEN ──────► HALF-OPEN ──────► CLOSED       │   │   │
│  │  │        │              │              │               │          │   │   │
│  │  │     (normal)     (5 failures   (after 30s,      (success)      │   │   │
│  │  │                   in 60s)       try 1 request)                  │   │   │
│  │  │                                                                  │   │   │
│  │  │  When OPEN:                                                     │   │   │
│  │  │    - Reject all new encode tasks                                │   │   │
│  │  │    - Return 503 Service Unavailable                             │   │   │
│  │  │    - Queue tasks for later (if queue not full)                  │   │   │
│  │  │                                                                  │   │   │
│  │  └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

# Phụ Lục: Decision Matrix

## A. Công Thức Tính Resource

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         RESOURCE CALCULATION FORMULAS                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. THREAD POOL SIZE                                                            │
│  ────────────────────                                                           │
│                                                                                  │
│     encoding_pool_size = CPU_CORES - 2                                         │
│     upload_pool_size = 10 (fixed, network-bound)                               │
│                                                                                  │
│  2. MEMORY BUDGET                                                               │
│  ────────────────────                                                           │
│                                                                                  │
│     available_memory = TOTAL_RAM - 4GB (OS + JVM overhead)                     │
│     memory_per_worker = available_memory / encoding_pool_size                  │
│                                                                                  │
│     FFmpeg actual usage ≈ 300-500MB per process                                │
│     Safety margin: 5x headroom                                                  │
│                                                                                  │
│  3. ENCODING TIME ESTIMATION                                                    │
│  ────────────────────────────                                                   │
│                                                                                  │
│     single_segment_encode_time ≈ segment_duration × encoding_factor            │
│                                                                                  │
│     encoding_factor:                                                            │
│       - ultrafast preset: 0.5x (5s segment → 2.5s encode)                      │
│       - medium preset: 1.5x (5s segment → 7.5s encode)                         │
│       - slow preset: 3x (5s segment → 15s encode)                              │
│                                                                                  │
│     total_segments = video_duration / segment_duration                         │
│     parallel_batches = total_segments / encoding_pool_size                     │
│                                                                                  │
│     estimated_total_time = parallel_batches × single_segment_encode_time       │
│                            × 2 (for 2 qualities)                               │
│                            × 1.2 (overhead factor)                             │
│                                                                                  │
│  4. STORAGE ESTIMATION                                                          │
│  ─────────────────────                                                          │
│                                                                                  │
│     temp_storage_peak = max_concurrent_segments × avg_segment_size × 2         │
│                       = encoding_pool_size × (segment_duration × bitrate/8)    │
│                         × 2 (original + 720p)                                  │
│                                                                                  │
│     Example: 14 workers × 10s × 8Mbps/8 × 2 = 14 × 10MB × 2 = 280MB            │
│                                                                                  │
│     final_output_size ≈ original_video_size × 1.1                              │
│                         + (original_video_size × 720p_ratio) × 1.1             │
│                       ≈ original_video_size × 1.6                              │
│                                                                                  │
│  5. NETWORK BANDWIDTH                                                           │
│  ────────────────────                                                           │
│                                                                                  │
│     download_bandwidth = video_bitrate (single stream)                         │
│     upload_bandwidth = upload_pool_size × avg_segment_size / upload_time       │
│                      ≈ 10 × 10MB / 1s = 100 MB/s = 800 Mbps (theoretical)     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## B. Performance Tuning Parameters

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         PERFORMANCE TUNING GUIDE                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │                        FFMPEG PARAMETERS                                │    │
│  ├────────────────────────────────────────────────────────────────────────┤    │
│  │                                                                         │    │
│  │  Parameter          │ Value      │ Impact                               │    │
│  │  ───────────────────┼────────────┼─────────────────────────────────────│    │
│  │  -preset            │ medium     │ CPU usage vs encode speed            │    │
│  │  -threads           │ 2          │ Per-process thread limit             │    │
│  │  -crf               │ 23         │ Quality vs file size                 │    │
│  │  -g                 │ 50         │ GOP size (keyframe interval)         │    │
│  │  -sc_threshold      │ 0          │ Disable scene change detection       │    │
│  │  -bf                │ 2          │ B-frames (compression efficiency)    │    │
│  │  -movflags          │ +faststart │ Optimize for streaming               │    │
│  │                                                                         │    │
│  │  MEMORY TUNING:                                                        │    │
│  │  -max_muxing_queue_size 1024   │ Prevent memory growth                │    │
│  │  -bufsize 2M                    │ Rate control buffer                  │    │
│  │                                                                         │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │                      JVM PARAMETERS                                     │    │
│  ├────────────────────────────────────────────────────────────────────────┤    │
│  │                                                                         │    │
│  │  -Xms4g -Xmx4g          │ Fixed heap (avoid GC resize)                │    │
│  │  -XX:+UseG1GC           │ G1 GC for large heaps                       │    │
│  │  -XX:MaxGCPauseMillis=200│ Target GC pause time                       │    │
│  │  -XX:+UseStringDeduplication│ Save memory on repeated strings        │    │
│  │                                                                         │    │
│  │  For heavy I/O:                                                        │    │
│  │  -Djava.nio.channels.spi.SelectorProvider=sun.nio.ch.EPollSelectorProvider│    │
│  │  -XX:+UseNUMA           │ NUMA-aware allocation                       │    │
│  │                                                                         │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │                      MINIO CLIENT TUNING                                │    │
│  ├────────────────────────────────────────────────────────────────────────┤    │
│  │                                                                         │    │
│  │  Connection Pool:                                                      │    │
│  │    maxConnections: 100                                                 │    │
│  │    connectionTimeout: 30s                                              │    │
│  │    socketTimeout: 60s                                                  │    │
│  │                                                                         │    │
│  │  Multipart Upload (for segments > 5MB):                               │    │
│  │    partSize: 10MB                                                      │    │
│  │    concurrentParts: 4                                                  │    │
│  │                                                                         │    │
│  │  Presigned URL:                                                        │    │
│  │    expiry: 2 hours (đủ cho job dài nhất + buffer)                     │    │
│  │                                                                         │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## C. Monitoring Metrics

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         KEY METRICS TO MONITOR                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  SYSTEM LEVEL                        │  APPLICATION LEVEL                       │
│  ────────────────                    │  ────────────────────                    │
│                                       │                                          │
│  • CPU utilization per core          │  • Jobs in queue                         │
│  • Memory usage (RSS, heap)          │  • Jobs processing                       │
│  • Disk I/O (read/write IOPS)        │  • Jobs completed/failed rate           │
│  • Network I/O (bytes in/out)        │  • Average encode time per segment      │
│  • Process count (FFmpeg instances)  │  • Segments encoded per minute          │
│  • File descriptor count             │  • Queue wait time                       │
│                                       │  • MinIO latency (p50, p95, p99)        │
│                                       │  • FFmpeg process duration              │
│                                       │                                          │
│  ALERTING THRESHOLDS                 │                                          │
│  ────────────────────                │                                          │
│                                       │                                          │
│  • CPU > 90% for 5 min → WARNING     │                                          │
│  • Memory > 85% → WARNING            │                                          │
│  • Disk usage > 80% → WARNING        │                                          │
│  • Queue size > 100 → ALERT          │                                          │
│  • Job failure rate > 5% → ALERT     │                                          │
│  • FFmpeg timeout > 5 min → ALERT    │                                          │
│                                       │                                          │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## D. Kết Luận Cuối Cùng

### Trả lời câu hỏi ban đầu:

**Q: Có phải download toàn bộ file video về local disk trước khi xử lý không?**

**A: KHÔNG BẮT BUỘC.** Với thiết kế được đề xuất:

1. **FFmpeg có thể đọc trực tiếp từ MinIO Presigned URL** với HTTP Range Requests
2. **Memory footprint tối thiểu** vì FFmpeg chỉ buffer segment đang xử lý
3. **Parallel encoding** được kiểm soát qua Thread Pool với resource governance
4. **Zero mandatory local storage** cho source file (chỉ cần temp cho output segments trước khi upload)

### Khuyến nghị triển khai:

```
PRIORITY ORDER:
─────────────────
1. Implement Strategy C (Hybrid Pipeline) - HIGH
2. Setup Thread Pool với proper sizing - HIGH
3. Implement Circuit Breaker - MEDIUM
4. Add monitoring metrics - MEDIUM
5. Optimize FFmpeg parameters - LOW (fine-tuning)
```

---

**Tài liệu này được tạo cho dự án FileSharing**  
**Tác giả:** AI System Architect  
**Ngày tạo:** 2026-04-01  
**Phiên bản:** 1.0
