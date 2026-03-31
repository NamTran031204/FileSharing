# Architecture Report: Video Encoding Strategy cho hệ thống Review

---

## Phần 1: Có cần encode nhiều phiên bản không?

### Trả lời ngắn: KHÔNG cần.

Với mục đích **review → duyệt → tải gốc**, chỉ cần **1 phiên bản preview duy nhất** là đủ.

### Phân tích use case

```
Flow thực tế:
  User upload video gốc (.mp4, có thể 2-10GB)
       │
       ▼
  Người review mở xem (stream playback) ← cần encode nhẹ, đủ xem
       │
       ├── Ưng → Download file .mp4 GỐC (không lấy file encode)
       └── Không ưng → Feedback / reject
```

**Điểm quan trọng:** File encode chỉ phục vụ playback để review, KHÔNG phải sản phẩm cuối cùng.

### So sánh với YouTube/Netflix

| | YouTube/Netflix | Hệ thống Review |
|---|---|---|
| Mục đích encode | Phục vụ hàng triệu viewer, nhiều thiết bị, nhiều băng thông | Phục vụ 1-5 reviewer xem 1 lần |
| Số phiên bản | 6-8 (144p → 4K) | **1 là đủ** |
| Chất lượng cần | Cao nhất có thể (viewer là end-user) | Đủ nhận biết nội dung, màu sắc, chi tiết |
| Thời gian encode | Không gấp (video đã publish) | Cần nhanh (reviewer đang chờ) |

### Đề xuất: Encode 1 phiên bản "Review Preview"

```bash
# Cấu hình encode tối ưu cho review playback
ffmpeg -i input.mp4 \
  -c:v libx264 \
  -preset veryfast \        # Nhanh, không cần nén tối ưu
  -crf 28 \                 # Chất lượng vừa phải, đủ review
  -vf "scale=1280:720" \    # 720p là đủ cho review
  -c:a aac -b:a 128k \      # Audio vừa đủ nghe
  -movflags +faststart \    # Cho phép stream ngay khi chưa tải hết
  -f hls \                  # Output dạng HLS segments (xem phần 2)
  -hls_time 6 \
  -hls_segment_filename "segment_%03d.ts" \
  playlist.m3u8
```

**Tài nguyên ước tính cho video 1 giờ 1080p input:**
- CPU: ~60% (veryfast preset)
- RAM: ~300MB
- Thời gian: ~5-8 phút
- Output: ~500MB (720p, CRF 28)

### Nếu sau này cần mở rộng

Chỉ thêm phiên bản khi có nhu cầu thực tế:

| Tình huống | Thêm gì |
|-----------|---------|
| Reviewer dùng mobile, mạng yếu | Thêm 480p |
| Cần review chi tiết pixel-level | Thêm 1080p (CRF thấp hơn) |
| Vẫn chỉ review bình thường | Giữ nguyên 1 phiên bản 720p |

> **Nguyên tắc: Encode ít nhất có thể, vừa đủ dùng. Tiết kiệm CPU/RAM/storage cho việc quan trọng hơn.**

---

## Phần 2: Encode từng phần nhỏ — Segment-based Encoding

### Trả lời ngắn: CÓ, hoàn toàn khả thi. Đây chính xác là cách YouTube và Netflix làm.

### Ý tưởng: Chia video thành segments, mỗi segment là 1 job riêng

```
Video gốc (2 giờ)
    │
    ▼ Split (rất nhanh, chỉ cắt không encode)
    │
    ├── Segment 0:00 - 0:10 ──→ Kafka message → Worker A encode
    ├── Segment 0:10 - 0:20 ──→ Kafka message → Worker B encode
    ├── Segment 0:20 - 0:30 ──→ Kafka message → Worker C encode
    ├── ...
    └── Segment 1:50 - 2:00 ──→ Kafka message → Worker N encode
    
    Kết quả: 720 segments (mỗi segment 10 giây)
    → Tạo playlist HLS (.m3u8) trỏ đến tất cả segments
    → Client dùng HLS.js để phát
```

### Tại sao cách này giải quyết vấn đề

| Vấn đề | Cách giải quyết |
|--------|----------------|
| 1 video lớn = 1 job nặng, block worker lâu | Chia nhỏ → mỗi job chỉ encode 6-10 giây video |
| Queue bị tràn vì mỗi message = 1 video GB | Mỗi message = 1 segment nhỏ, worker xử lý nhanh, giải phóng nhanh |
| Không kiểm soát được CPU/RAM | Mỗi segment tốn ~50-100MB RAM, encode trong 1-3 giây |
| 1 worker chết = mất toàn bộ progress | 1 worker chết = chỉ mất 1 segment, retry nhanh |
| Reviewer phải chờ encode xong toàn bộ | **Encode xong segment nào, xem được segment đó** (progressive playback) |

### Flow chi tiết: Segment-based Encoding Pipeline

```
┌──────────┐     upload xong      ┌──────────┐
│  Client   │ ──────────────────→ │  MinIO    │
└──────────┘   (presigned URL)    └────┬─────┘
                                       │
                                  Event: file uploaded
                                       │
                                       ▼
                                 ┌───────────┐
                                 │   Kafka    │
                                 │ topic:     │
                                 │ "video-    │
                                 │  uploaded" │
                                 └─────┬─────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │  Splitter Worker │  (Job nhẹ, chỉ demux)
                              │                 │
                              │  1. GET video    │
                              │     từ MinIO     │
                              │  2. ffmpeg split │
                              │     thành N      │
                              │     segments     │
                              │  3. Upload mỗi   │
                              │     segment lên  │
                              │     MinIO         │
                              │  4. Gửi N message│
                              │     vào Kafka     │
                              └────────┬────────┘
                                       │
                          N messages vào topic "segment-encode"
                                       │
                    ┌──────────────────┼──────────────────┐
                    ▼                  ▼                  ▼
             ┌────────────┐    ┌────────────┐    ┌────────────┐
             │  Worker 1  │    │  Worker 2  │    │  Worker 3  │
             │  Encode    │    │  Encode    │    │  Encode    │
             │  seg 001   │    │  seg 002   │    │  seg 003   │
             └─────┬──────┘    └─────┬──────┘    └─────┬──────┘
                   │                 │                 │
                   ▼                 ▼                 ▼
             ┌─────────────────────────────────────────────┐
             │                    MinIO                     │
             │  /encoded/video123/seg_001.ts                │
             │  /encoded/video123/seg_002.ts                │
             │  /encoded/video123/seg_003.ts                │
             │  /encoded/video123/playlist.m3u8             │
             └─────────────────────────────────────────────┘
                                   │
                                   ▼
                           Client (HLS.js)
                      Phát video theo segments
                   (encode xong đến đâu, xem đến đó)
```

### Bước 1: Split video (Splitter Worker)

```bash
# Split KHÔNG encode — chỉ cắt theo keyframe, rất nhanh
# Input: video gốc trên MinIO
# Output: nhiều segment nhỏ, mỗi segment ~6-10 giây

ffmpeg -i input.mp4 \
  -c copy \                          # KHÔNG encode, chỉ copy stream
  -f segment \                       # Output dạng segment
  -segment_time 10 \                 # Mỗi segment 10 giây
  -reset_timestamps 1 \              # Reset timestamp mỗi segment
  -map 0 \
  "segment_%04d.mp4"                 # segment_0000.mp4, segment_0001.mp4, ...

# Thời gian: Video 2 giờ split trong ~10-30 giây (chỉ đọc/ghi, không encode)
# CPU: ~5%
# RAM: ~50MB
```

**Sau khi split xong, Splitter gửi N messages vào Kafka:**

```json
// Mỗi segment = 1 Kafka message
{
  "videoId": "video-abc-123",
  "segmentIndex": 0,
  "totalSegments": 720,
  "sourceKey": "raw-segments/video-abc-123/segment_0000.mp4",
  "outputKey": "encoded/video-abc-123/segment_0000.ts",
  "encodingProfile": {
    "resolution": "1280:720",
    "preset": "veryfast",
    "crf": 28
  }
}
```

### Bước 2: Encode từng segment (Encode Workers)

```bash
# Mỗi worker nhận 1 segment, encode thành .ts (MPEG-TS cho HLS)

ffmpeg -i segment_0000.mp4 \
  -c:v libx264 -preset veryfast -crf 28 \
  -vf "scale=1280:720" \
  -c:a aac -b:a 128k \
  -f mpegts \
  segment_0000.ts

# Mỗi segment 10 giây:
# - CPU: ~60% trong 1-3 giây
# - RAM: ~100-150MB
# - Output: ~2-5MB
```

### Bước 3: Tạo playlist HLS

Khi tất cả (hoặc đủ số) segments encode xong:

```m3u8
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0

#EXTINF:10.0,
https://minio.internal/encoded/video-abc-123/segment_0000.ts
#EXTINF:10.0,
https://minio.internal/encoded/video-abc-123/segment_0001.ts
#EXTINF:10.0,
https://minio.internal/encoded/video-abc-123/segment_0002.ts
...
#EXT-X-ENDLIST
```

**Playlist có thể cập nhật liên tục** — encode xong segment nào, thêm vào playlist ngay → reviewer xem được ngay mà không cần chờ encode hết video.

### Bước 4: Client phát bằng HLS.js

```javascript
// Frontend: dùng HLS.js (hoặc video.js với HLS plugin)
import Hls from 'hls.js';

const video = document.getElementById('video');
const hls = new Hls();

// Trỏ đến playlist trên MinIO (qua presigned URL hoặc proxy)
hls.loadSource('https://minio/encoded/video-abc-123/playlist.m3u8');
hls.attachMedia(video);
```

### YouTube và Netflix làm thế nào?

#### YouTube

```
1. User upload video
2. Borg (cluster manager) schedule encoding job
3. Video split thành segments (~5 giây mỗi segment)
4. Mỗi segment encode SONG SONG trên nhiều máy:
   - 144p, 240p, 360p, 480p, 720p, 1080p, 1440p, 4K
   - VP9 codec (nén tốt hơn H.264)
   - AV1 cho video phổ biến (nén tốt nhất, encode chậm nhất)
5. Dùng DASH (Dynamic Adaptive Streaming over HTTP)
   - Tương tự HLS nhưng dùng .mpd manifest thay vì .m3u8
6. CDN phân phối segments đến viewer gần nhất
7. Client tự chọn quality dựa trên bandwidth

Điểm hay: Khi video mới upload, YouTube encode 360p TRƯỚC
→ viewer xem được ngay (dù chất lượng thấp)
→ encode dần các quality cao hơn ở background
```

#### Netflix

```
1. Studio upload master file (thường ProRes, hàng trăm GB)
2. Netflix chia thành "shots" (cảnh) thay vì segment cố định
   - Mỗi shot có đặc điểm khác nhau (cảnh tĩnh vs cảnh hành động)
   - Encode setting TỐI ƯU cho từng shot
3. Hệ thống "per-title encoding":
   - Phim hoạt hình: bitrate thấp cũng đẹp → tiết kiệm bandwidth
   - Phim hành động: cần bitrate cao hơn
4. Encode trên AWS (hàng nghìn EC2 instances)
5. Dùng DASH với Widevine DRM
6. Pre-encode TẤT CẢ quality trước khi publish
   (khác YouTube - Netflix không cần real-time)
```

### Áp dụng cho hệ thống Review: Phiên bản đơn giản hóa

```
Hệ thống Review (chỉ cần):
├── 1 quality level: 720p
├── 1 codec: H.264 (tương thích mọi browser)
├── Segment time: 6-10 giây
├── Streaming: HLS (đơn giản hơn DASH)
├── Không cần CDN (internal review, ít user)
├── Không cần DRM
└── Progressive playback: encode đến đâu xem đến đó
```

### Tài nguyên so sánh: Encode nguyên video vs Segment-based

**Video 1 giờ, 1080p input → 720p output:**

| | Encode nguyên file | Segment-based (10s/segment) |
|---|---|---|
| Số job | 1 job lớn | 360 jobs nhỏ |
| RAM/job | 300-400MB | 100-150MB |
| Thời gian/job | 5-8 phút | 1-3 giây |
| Fail recovery | Encode lại từ đầu | Encode lại 1 segment (3 giây) |
| Xem được sau | 5-8 phút (chờ hết) | ~30 giây (xem segment đầu tiên) |
| Scale | Thêm worker = thêm video song song | Thêm worker = 1 video encode nhanh hơn |
| Kafka message size | 1 message/video | 1 message/segment (nhỏ, kiểm soát dễ) |
| Queue control | Khó giới hạn (1 job = toàn bộ CPU) | Dễ giới hạn (mỗi job nhỏ, release nhanh) |

### Kafka topic design cho segment-based

```
Topic: "video-uploaded"          → Splitter worker nhận
Topic: "segment-encode"          → Encode workers nhận (nhiều partitions)
Topic: "segment-encoded"         → Playlist generator nhận
Topic: "video-ready"             → Notification service nhận → báo reviewer
```

```
Partition strategy cho "segment-encode":
  Key = videoId
  → Tất cả segments của 1 video vào cùng partition
  → 1 worker xử lý tuần tự segments của 1 video
  → Hoặc: Key = segmentId (random partition)
  → Segments phân tán đều giữa các workers
  → Encode nhanh hơn nhưng cần tracking completion
```

### Kết luận

1. **Segment-based encoding hoàn toàn khả thi** và là cách tiếp cận chuẩn công nghiệp
2. **Kafka handle tốt** vì mỗi message chỉ là metadata nhỏ, không phải file
3. **Kiểm soát tài nguyên tốt hơn** vì mỗi job nhỏ, tốn ít RAM, hoàn thành nhanh
4. **Progressive playback** — reviewer không cần chờ encode xong toàn bộ
5. Với hệ thống review, **chỉ cần 1 quality (720p) + HLS + segment 6-10s** là đủ
