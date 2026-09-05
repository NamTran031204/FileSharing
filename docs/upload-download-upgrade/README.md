# Upload/Download Upgrade — Bộ tài liệu phase PA2 (Presigned Direct, Hardened)

Quyết định nền: giữ upload/download **trực tiếp qua presigned URL** (không xây proxy service), nâng cấp để luồng này nhanh nhất và an toàn nhất. Cơ sở nghiên cứu: `docs/research/upload-pipeline-research.md` (+ 2 báo cáo gốc Google/Microsoft).

| Tài liệu | Trả lời câu hỏi | Người đọc chính |
|---|---|---|
| [01_user_requirement.md](01_user_requirement.md) | Hiện trạng đầy đủ của luồng hiện tại là gì (kiến trúc, từng bước, thuật toán client/server, điểm yếu đã xác minh S1-S8/P1-P4/R1-R6)? Người dùng yêu cầu nâng cấp gì (SEC/PERF/REL)? | BA, reviewer, người mới vào dự án |
| [02_system_technical_design.md](02_system_technical_design.md) | Phase này làm gì? Pipeline mới hình dạng ra sao (3 pha initiate→transfer→commit)? Công nghệ mới nào? Sơ đồ luồng + sequence + state diagram (mermaid) | Architect, tech lead |
| [03_detailed_design.md](03_detailed_design.md) | Phần nào nâng cấp, nâng cấp những gì, ảnh hưởng kiến trúc thế nào? 7 work package (WP1-WP7) + sơ đồ từng luồng mới + rollout + rủi ro | Người triển khai |

## Truy vết yêu cầu → thiết kế

- Mã yêu cầu (`SEC-xx`, `PERF-xx`, `REL-xx`) định nghĩa ở tài liệu 01, được map sang cơ chế ở tài liệu 02 (§6) và sang work package ở tài liệu 03.
- Mã điểm yếu hiện trạng (`S1-S8`, `P1-P4`, `R1-R6`) định nghĩa ở tài liệu 01 §A.6, được tham chiếu tại từng WP của tài liệu 03.

## Tóm tắt thay đổi lớn nhất

0. **Gỡ bỏ module `filesharing-uploadservice`** (WebFlux stub, chưa từng hoạt động) — yêu cầu mở màn CLEAN-01: PA2 không có data-plane service giữa client và MinIO.
1. **UploadSession** (MongoDB, TTL trượt + trần cứng 7 ngày) — client chỉ cầm `sessionId`; `objectName`/`uploadId` do server giữ.
2. Part URL cấp **theo batch, TTL 15 phút đồng nhất** — bỏ sinh trước toàn bộ URL và công thức `calculateExpireTime`.
3. **Part size cố định do server công bố** — công thức `clamp(max(8MiB, size/10000), 8MiB, 64MiB)`, mặc định 8MiB — đổi adaptive chunk size lấy khả năng resume; adaptive concurrency nâng thành **hill-climbing trên tổng throughput** (AzCopy-style), trần 6 thread theo giới hạn trình duyệt trên HTTP/1.1.
4. Complete **verify trước commit** (owner → ListParts → tổng size → checksum) và **idempotent**.
5. Presigned ký bằng **service account scope hẹp** (`svc-upload` / `svc-download`), không dùng root key.
6. Download **kiểm quyền** trước khi phát URL.
7. **GC 3 tầng**: MinIO ILM 7d + GC job 15 phút + reconcile job 24h.
8. Thay OkHttp + XML tự chế bằng **AWS SDK v2** cho mọi call multipart.
