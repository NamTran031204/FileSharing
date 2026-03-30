# 04. Tech Stack dự kiến và kiến trúc đề xuất

## 1. Nguyên tắc chọn stack
1. Tận dụng tối đa nền tảng hiện có để giảm rủi ro triển khai
2. Tách media processing khỏi API chính để tăng ổn định
3. Ưu tiên thành phần phổ biến, dễ vận hành trong môi trường đồ án/SMB

## 2. Kiến trúc logical đề xuất
1. Web Client (React + TypeScript)
2. Core API (Spring Boot): auth, metadata, permission, review workflow
3. Media Processing Worker (Java hoặc Node/Python worker độc lập)
4. Queue (Redis + queue library)
5. Object Storage (MinIO): original + renditions + thumbnails + waveform/sprite
6. Metadata DB (MongoDB): media metadata, version, annotation, comments, review sessions

## 3. Tech stack đề xuất theo lớp

### 3.1 Frontend
1. React + TypeScript + Vite (giữ nguyên)
2. Video playback:
- video.js hoặc ReactPlayer + hls.js
3. Annotation image/video overlay:
- Konva (react-konva) hoặc Fabric.js
4. State/query:
- TanStack Query (nếu chưa có) để quản lý cache request
5. Realtime cập nhật comment:
- WebSocket hoặc Server-Sent Events (SSE)

### 3.2 Backend Core API
1. Spring Boot (giữ nguyên)
2. Spring Security + JWT (giữ nguyên)
3. Validation:
- Hibernate Validator
4. Rate limiting:
- Bucket4j (in-memory hoặc Redis-backed)
5. Observability:
- Micrometer + Prometheus + structured logging

### 3.3 Media processing
1. FFmpeg: transcode HLS, thumbnail, poster frame
2. Worker service:
- Nhận job từ queue, xử lý, cập nhật trạng thái
3. Queue:
- Redis + BullMQ/Resque-like (nếu worker Node)
- Hoặc Redis + Java queue library (nếu worker Java)

### 3.4 Data và storage
1. MongoDB collections:
- media_assets
- media_versions
- media_renditions
- annotations
- comment_threads
- review_sessions
- audit_logs
2. MinIO bucket layout:
- /originals/{assetId}/{versionId}/source
- /renditions/{assetId}/{versionId}/{profile}/index.m3u8
- /thumbnails/{assetId}/{versionId}/...

## 4. Lựa chọn streaming
### Khuyến nghị
1. Mặc định dùng HLS cho video dài hoặc bitrate cao
2. Presigned direct range download chỉ dùng fallback cho file nhỏ

Lý do:
1. HLS hỗ trợ adaptive bitrate
2. Playback ổn định hơn trong điều kiện mạng dao động
3. Dễ gắn timeline comment theo thời gian phát

## 5. Security baseline cần có
1. Validate magic bytes trước khi nhận media
2. Presigned URL thời hạn ngắn, scope đúng object
3. Audit log cho action nhạy cảm (status, permission, version)
4. Quarantine và scan virus (ClamAV) cho file upload mới

## 6. Trade-off cần chốt
1. Worker dùng cùng ngôn ngữ Java hay tách Node để tận dụng ecosystem queue
2. SSE vs WebSocket cho realtime comment
3. Lưu annotation vector đơn giản hay chuẩn hóa theo schema mở rộng

## 7. Khuyến nghị cuối cùng
Cho phase 2, nên giữ API ở Spring Boot và tách worker độc lập theo hướng FFmpeg + Redis queue để tránh quá tải API node, đồng thời đảm bảo mở rộng được khi số lượng phiên review tăng.
