# Báo cáo use case hệ thống Media Review (cập nhật theo Phase 1)

## 1. Mục tiêu cập nhật
Tài liệu này cập nhật lại danh sách use case cho hệ thống Media Review dựa trên:
1. Tài liệu thiết kế trong thư mục docs.
2. Hiện trạng kỹ thuật Phase 1 trong ans.md.

Điểm thay đổi chính của bản cập nhật này:
1. Đánh dấu rõ use case nào đã có ở Phase 1.
2. Phân biệt use case cần mở rộng từ nền tảng cũ và use case hoàn toàn mới của Phase 2.
3. Điều chỉnh lại thứ tự ưu tiên triển khai để tránh làm lại phần đã hoàn thành.

## 2. Quy ước phân loại

### 2.1. Mức độ quan trọng
- P0: Bắt buộc để MVP Media Review hoạt động.
- P1: Quan trọng để tăng hiệu quả và trải nghiệm.
- P2: Nâng cao, triển khai sau khi hệ thống ổn định.

### 2.2. Trạng thái triển khai
- Đã có ở Phase 1: Chức năng đã có trong hệ thống File Sharing hiện tại, chỉ cần tái sử dụng hoặc tinh chỉnh nhỏ.
- Cần mở rộng từ Phase 1: Có nền tảng sẵn nhưng chưa đủ cho bài toán Media Review.
- Mới ở Phase 2: Chưa có nền tảng đáng kể, cần thiết kế và phát triển mới.

## 3. Tóm tắt năng lực đã có từ Phase 1
1. Đăng nhập, JWT, refresh token đã hoạt động.
2. Upload multipart/chunked, adaptive bandwidth, retry logic đã có.
3. Download range-based và presigned URL đã có.
4. Quản lý metadata file, trash/restore, file preview page đã có.
5. Phân quyền theo file (READ, COMMENT, MODIFY, OWNER), chia sẻ qua email/link đã có.

Các khoảng trống lớn còn thiếu từ Phase 1:
1. Chưa có audit log chuẩn cho hành động nhạy cảm.
2. Chưa có pipeline xử lý media chuyên dụng (transcode HLS, thumbnail/sprite).
3. Chưa có annotation theo timecode/vùng ảnh và workflow review.
4. Chưa có lớp NFR đủ mạnh cho production như virus scan, rate limiting, metrics chuẩn hóa.

## 4. Danh sách use case theo nhóm (đã hiệu chỉnh)

## Nhóm A - Truy cập, phân quyền, bảo mật

### UC-A01 - Đăng nhập và xác thực phiên làm việc
- Actor: Reviewer, Producer, PM, Owner.
- Ý nghĩa: Bảo đảm chỉ người dùng hợp lệ mới truy cập được media và dữ liệu review.
- Mức độ quan trọng: P0.
- Trạng thái hiện tại: Đã có ở Phase 1.
- Yêu cầu kỹ thuật:
  - Tái sử dụng Spring Security + JWT + refresh token.
  - Bổ sung claim/context cần thiết để phục vụ các use case review nâng cao.

### UC-A02 - Áp dụng ma trận quyền READ, COMMENT, MODIFY, OWNER
- Actor: Owner/Admin, tất cả user được cấp quyền.
- Ý nghĩa: Ngăn thao tác vượt quyền, tránh sửa sai dữ liệu review.
- Mức độ quan trọng: P0.
- Trạng thái hiện tại: Đã có ở Phase 1.
- Yêu cầu kỹ thuật:
  - Tái sử dụng logic per-file permission hiện có.
  - Mở rộng kiểm tra quyền cho tài nguyên mới: annotation, review session, version.

### UC-A03 - Chia sẻ link an toàn theo quyền
- Actor: Owner, PM, Producer.
- Ý nghĩa: Giúp chia sẻ nhanh cho client nhưng vẫn kiểm soát truy cập.
- Mức độ quan trọng: P0.
- Trạng thái hiện tại: Đã có ở Phase 1 (cần tinh chỉnh).
- Yêu cầu kỹ thuật:
  - Tái sử dụng cơ chế share token/presigned URL.
  - Bổ sung ràng buộc theo version hoặc review scope khi cần.

### UC-A04 - Audit log cho hành động nhạy cảm
- Actor: Hệ thống, PM, Owner.
- Ý nghĩa: Truy vết được thay đổi trạng thái duyệt, quyền và version.
- Mức độ quan trọng: P1.
- Trạng thái hiện tại: Mới ở Phase 2.
- Yêu cầu kỹ thuật:
  - Tạo mô hình audit_logs với actor, action, target, before, after, timestamp.
  - Bắt buộc ghi log cho đổi trạng thái review, upload version, thay đổi permission.

## Nhóm B - Ingest media và xử lý phiên bản

### UC-B01 - Upload media dung lượng lớn ổn định
- Actor: Producer.
- Ý nghĩa: Là đầu vào bắt buộc để mọi luồng review hoạt động.
- Mức độ quan trọng: P0.
- Trạng thái hiện tại: Đã có ở Phase 1 (cần mở rộng cho media workflow).
- Yêu cầu kỹ thuật:
  - Tái sử dụng multipart upload, adaptive chunking, retry logic.
  - Bổ sung validate file media theo chuẩn mime và magic bytes.

### UC-B02 - Tạo phiên bản mới cho media asset
- Actor: Producer.
- Ý nghĩa: Giữ lịch sử chỉnh sửa và tránh sửa nhầm bản.
- Mức độ quan trọng: P0.
- Trạng thái hiện tại: Cần mở rộng từ Phase 1.
- Yêu cầu kỹ thuật:
  - Thiết kế media asset và media version tách biệt metadata file hiện tại.
  - Mỗi lần upload mới phải tạo versionNumber tăng dần.

### UC-B03 - Hoàn tất upload và kích hoạt processing pipeline
- Actor: Producer, Hệ thống.
- Ý nghĩa: Chuyển từ trạng thái lưu file sang trạng thái sẵn sàng playback.
- Mức độ quan trọng: P0.
- Trạng thái hiện tại: Cần mở rộng từ Phase 1.
- Yêu cầu kỹ thuật:
  - Sau complete upload, đẩy job vào worker queue để xử lý media.
  - Theo dõi trạng thái PENDING, PROCESSING, READY, FAILED.

### UC-B04 - Theo dõi trạng thái xử lý media
- Actor: Producer, PM, Reviewer.
- Ý nghĩa: Minh bạch tiến độ, tránh review trên bản chưa xử lý xong.
- Mức độ quan trọng: P0.
- Trạng thái hiện tại: Cần mở rộng từ Phase 1.
- Yêu cầu kỹ thuật:
  - API trả trạng thái processing theo version.
  - Client polling hoặc SSE để cập nhật gần thời gian thực.

### UC-B05 - Quét virus và cơ chế quarantine cho file upload mới
- Actor: Hệ thống.
- Ý nghĩa: Nâng mức an toàn trước khi phát hành lên production.
- Mức độ quan trọng: P1.
- Trạng thái hiện tại: Mới ở Phase 2.
- Yêu cầu kỹ thuật:
  - Tích hợp engine scan (ví dụ ClamAV).
  - Chỉ cho phép playback khi file qua kiểm tra bảo mật.

## Nhóm C - Playback và preview

### UC-C01 - Streaming video bằng HLS adaptive bitrate
- Actor: Reviewer, Producer.
- Ý nghĩa: Đảm bảo xem mượt trong điều kiện mạng dao động.
- Mức độ quan trọng: P0.
- Trạng thái hiện tại: Mới ở Phase 2.
- Yêu cầu kỹ thuật:
  - Pipeline FFmpeg tạo rendition và manifest HLS.
  - Player hỗ trợ HLS và mapping tốt với timeline comment.

### UC-C02 - Fallback xem trực tiếp bằng URL có kiểm soát
- Actor: Reviewer.
- Ý nghĩa: Đảm bảo vẫn có thể xem khi chưa có HLS hoặc file nhỏ.
- Mức độ quan trọng: P0.
- Trạng thái hiện tại: Cần mở rộng từ Phase 1.
- Yêu cầu kỹ thuật:
  - Tái sử dụng presigned URL và range request hiện có.
  - API playback trả rõ chế độ fallback để UI hiển thị đúng.

### UC-C03 - Thumbnail hoặc sprite để điều hướng nhanh
- Actor: Reviewer, Producer.
- Ý nghĩa: Giảm thời gian tìm đúng đoạn cần phản hồi.
- Mức độ quan trọng: P1.
- Trạng thái hiện tại: Mới ở Phase 2.
- Yêu cầu kỹ thuật:
  - Worker sinh thumbnail hoặc sprite metadata.
  - UI timeline hỗ trợ xem trước theo mốc thời gian.

### UC-C04 - Giám sát độ ổn định playback theo NFR
- Actor: Hệ thống, PM.
- Ý nghĩa: Nếu playback không ổn định, vòng review sẽ thất bại.
- Mức độ quan trọng: P0.
- Trạng thái hiện tại: Cần mở rộng từ Phase 1.
- Yêu cầu kỹ thuật:
  - Thu thập chỉ số startup time, rebuffer, error rate.
  - Tích hợp metrics và dashboard theo baseline đã định.

## Nhóm D - Annotation và cộng tác phản hồi

### UC-D01 - Comment theo timecode video
- Actor: Reviewer.
- Ý nghĩa: Tăng độ chính xác phản hồi, giảm sửa sai đoạn.
- Mức độ quan trọng: P0.
- Trạng thái hiện tại: Mới ở Phase 2.
- Yêu cầu kỹ thuật:
  - Lưu mốc thời gian rõ ràng theo version.
  - Click comment phải seek đúng vị trí trên player.

### UC-D02 - Annotation vùng ảnh hoặc frame video
- Actor: Reviewer.
- Ý nghĩa: Chỉ rõ vị trí cần chỉnh sửa trên nội dung trực quan.
- Mức độ quan trọng: P0.
- Trạng thái hiện tại: Mới ở Phase 2.
- Yêu cầu kỹ thuật:
  - Lưu tọa độ theo hệ quy chiếu ổn định.
  - Đảm bảo render đúng sau reload hoặc đổi kích thước viewport.

### UC-D03 - Thread comment, reply, resolve
- Actor: Reviewer, Producer.
- Ý nghĩa: Theo dõi hội thoại theo ngữ cảnh và đóng phản hồi đã xử lý.
- Mức độ quan trọng: P0.
- Trạng thái hiện tại: Mới ở Phase 2.
- Yêu cầu kỹ thuật:
  - Mô hình thread tách root comment, replies, participants, trạng thái mở hoặc đóng.
  - Ràng buộc comment luôn gắn đúng annotation và version.

### UC-D04 - Tìm kiếm, lọc comment theo trạng thái và người tạo
- Actor: Reviewer, PM.
- Ý nghĩa: Quản lý hiệu quả khi số lượng feedback lớn.
- Mức độ quan trọng: P1.
- Trạng thái hiện tại: Mới ở Phase 2.
- Yêu cầu kỹ thuật:
  - API hỗ trợ filter, sort, phân trang.
  - UI có bộ lọc theo OPEN, RESOLVED, creator, time range.

### UC-D05 - Mention người phụ trách trong comment
- Actor: Reviewer, PM.
- Ý nghĩa: Chỉ định trách nhiệm rõ ràng và rút ngắn vòng phản hồi.
- Mức độ quan trọng: P1.
- Trạng thái hiện tại: Mới ở Phase 2.
- Yêu cầu kỹ thuật:
  - Parse mention token trong nội dung comment.
  - Kích hoạt thông báo theo user được nhắc.

## Nhóm E - Versioning và so sánh bản

### UC-E01 - Xem lịch sử version của media
- Actor: Producer, Reviewer, PM.
- Ý nghĩa: Truy vết đầy đủ, tránh nhầm bản khi review.
- Mức độ quan trọng: P0.
- Trạng thái hiện tại: Cần mở rộng từ Phase 1.
- Yêu cầu kỹ thuật:
  - Bổ sung mô hình version tách khỏi metadata file đơn lẻ.
  - Hiển thị danh sách version với trạng thái xử lý tương ứng.

### UC-E02 - Upload version mới nhưng giữ toàn bộ phản hồi cũ
- Actor: Producer.
- Ý nghĩa: Đảm bảo tính liên tục của vòng revision.
- Mức độ quan trọng: P0.
- Trạng thái hiện tại: Mới ở Phase 2.
- Yêu cầu kỹ thuật:
  - Không xóa annotation và thread của version trước.
  - Cho phép đối chiếu phản hồi giữa version cũ và mới.

### UC-E03 - Chọn active version trong phiên review
- Actor: PM, Producer.
- Ý nghĩa: Xác định chính xác bản đang được duyệt chính thức.
- Mức độ quan trọng: P0.
- Trạng thái hiện tại: Mới ở Phase 2.
- Yêu cầu kỹ thuật:
  - Review session phải lưu activeVersionId.
  - Mọi thao tác review mới mặc định bám theo active version.

### UC-E04 - Compare version cơ bản dạng A/B hoặc overlay
- Actor: Reviewer, Producer.
- Ý nghĩa: Kiểm tra nhanh khác biệt sau mỗi vòng chỉnh sửa.
- Mức độ quan trọng: P1.
- Trạng thái hiện tại: Mới ở Phase 2.
- Yêu cầu kỹ thuật:
  - Cho phép chuyển qua lại giữa hai version cùng asset.
  - Tối ưu preload để tránh giật khi đổi bản.

### UC-E05 - Compare side-by-side đồng bộ timeline
- Actor: Reviewer, Producer.
- Ý nghĩa: Phục vụ nhu cầu đối chiếu nâng cao.
- Mức độ quan trọng: P2.
- Trạng thái hiện tại: Mới ở Phase 2.
- Yêu cầu kỹ thuật:
  - Đồng bộ play, pause, seek giữa hai player.
  - Có cơ chế xử lý lệch timeline khi metadata khác nhau.

## Nhóm F - Workflow review và điều phối

### UC-F01 - Đổi trạng thái review
- Actor: PM, Reviewer có quyền, Owner.
- Ý nghĩa: Chốt kết quả mỗi vòng duyệt theo trạng thái chuẩn.
- Mức độ quan trọng: P0.
- Trạng thái hiện tại: Mới ở Phase 2.
- Yêu cầu kỹ thuật:
  - Trạng thái chính: IN_REVIEW, REQUEST_CHANGES, APPROVED.
  - Mỗi lần đổi trạng thái phải sinh audit record.

### UC-F02 - Timeline review tổng hợp
- Actor: PM, Reviewer, Producer.
- Ý nghĩa: Xem toàn bộ diễn biến review trong một nơi tập trung.
- Mức độ quan trọng: P0.
- Trạng thái hiện tại: Mới ở Phase 2.
- Yêu cầu kỹ thuật:
  - Gom annotation, comment và thay đổi workflow theo dòng thời gian.
  - Hỗ trợ lọc theo version và trạng thái.

### UC-F03 - Theo dõi tiến độ xử lý feedback
- Actor: PM.
- Ý nghĩa: Quản lý SLA và hiệu suất theo dự án.
- Mức độ quan trọng: P1.
- Trạng thái hiện tại: Mới ở Phase 2.
- Yêu cầu kỹ thuật:
  - Tính số lượng open hoặc resolved và thời gian đóng phản hồi.
  - Cần dữ liệu audit và activity nhất quán.

### UC-F04 - Dashboard hiệu suất review theo team hoặc dự án
- Actor: PM, Owner.
- Ý nghĩa: Tối ưu quy trình theo số liệu thực tế.
- Mức độ quan trọng: P2.
- Trạng thái hiện tại: Mới ở Phase 2.
- Yêu cầu kỹ thuật:
  - Tổng hợp KPI theo chu kỳ ngày hoặc tuần.
  - Cần lớp báo cáo và index dữ liệu phù hợp.

## Nhóm G - Thông báo và tích hợp

### UC-G01 - Thông báo in-app khi có phản hồi mới
- Actor: Reviewer, Producer, PM.
- Ý nghĩa: Giảm độ trễ phản hồi trong vòng review.
- Mức độ quan trọng: P1.
- Trạng thái hiện tại: Mới ở Phase 2.
- Yêu cầu kỹ thuật:
  - Kênh realtime bằng SSE hoặc WebSocket.
  - Trigger từ sự kiện comment, reply, mention, đổi trạng thái.

### UC-G02 - Notification đa kênh qua email và webhook
- Actor: Owner, PM, hệ thống tích hợp ngoài.
- Ý nghĩa: Mở rộng khả năng phối hợp liên công cụ.
- Mức độ quan trọng: P2.
- Trạng thái hiện tại: Cần mở rộng từ Phase 1.
- Yêu cầu kỹ thuật:
  - Tái sử dụng nền tảng gửi email hiện có để gửi thông báo workflow.
  - Bổ sung webhook event schema, retry và dead-letter.

## 5. Điều chỉnh ưu tiên triển khai theo hiện trạng Phase 1

### 5.1. Hạng mục giữ nguyên hoặc tái sử dụng mạnh
1. UC-A01, UC-A02, UC-A03.
2. Một phần của UC-B01 và UC-C02.

### 5.2. Hạng mục mở rộng trực tiếp từ nền tảng cũ
1. UC-B01, UC-B02, UC-B03, UC-B04.
2. UC-C02, UC-C04.
3. UC-E01, UC-G02.

### 5.3. Hạng mục phát triển mới trọng tâm cho MVP Media Review
1. UC-C01.
2. UC-D01, UC-D02, UC-D03.
3. UC-E02, UC-E03.
4. UC-F01, UC-F02.

### 5.4. Hạng mục bổ sung sau MVP
1. P1: UC-A04, UC-B05, UC-C03, UC-D04, UC-D05, UC-E04, UC-F03, UC-G01.
2. P2: UC-E05, UC-F04.

## 6. Kết luận cập nhật
Bản use case sau chỉnh sửa đã phản ánh đúng thực tế rằng dự án đã có nền tảng mạnh từ Phase 1, đặc biệt ở xác thực, phân quyền, upload và download.

Trọng tâm của Phase 2 không phải làm lại phần lõi đã có, mà là mở rộng lên năng lực Media Review chuyên sâu gồm:
1. Streaming và xử lý media.
2. Annotation và timeline feedback.
3. Version workflow và điều phối review.
4. Audit, metrics và các năng lực vận hành để đạt chất lượng triển khai thực tế.

## 7. Ma trận triển khai use case theo sprint (bản ngắn)

### 7.1. Quy ước sprint đề xuất
- Sprint 0: Tận dụng nền tảng Phase 1, chuẩn hóa mô hình dữ liệu và API khung.
- Sprint 1: Media pipeline lõi và playback nền tảng.
- Sprint 2: Annotation, version workflow và review workflow lõi.
- Sprint 3: P1 sau MVP (ổn định, trải nghiệm, vận hành).
- Sprint 4: P2 nâng cao.

### 7.2. Ma trận tổng hợp

| Mã use case | Trạng thái hiện tại | Ưu tiên | Sprint đề xuất |
|---|---|---|---|
| UC-A01 | Đã có ở Phase 1 | P0 | Sprint 0 |
| UC-A02 | Đã có ở Phase 1 | P0 | Sprint 0 |
| UC-A03 | Đã có ở Phase 1 (cần tinh chỉnh) | P0 | Sprint 0 |
| UC-A04 | Mới ở Phase 2 | P1 | Sprint 3 |
| UC-B01 | Đã có ở Phase 1 (cần mở rộng) | P0 | Sprint 0 |
| UC-B02 | Cần mở rộng từ Phase 1 | P0 | Sprint 0 |
| UC-B03 | Cần mở rộng từ Phase 1 | P0 | Sprint 1 |
| UC-B04 | Cần mở rộng từ Phase 1 | P0 | Sprint 1 |
| UC-B05 | Mới ở Phase 2 | P1 | Sprint 3 |
| UC-C01 | Mới ở Phase 2 | P0 | Sprint 1 |
| UC-C02 | Cần mở rộng từ Phase 1 | P0 | Sprint 1 |
| UC-C03 | Mới ở Phase 2 | P1 | Sprint 3 |
| UC-C04 | Cần mở rộng từ Phase 1 | P0 | Sprint 3 |
| UC-D01 | Mới ở Phase 2 | P0 | Sprint 2 |
| UC-D02 | Mới ở Phase 2 | P0 | Sprint 2 |
| UC-D03 | Mới ở Phase 2 | P0 | Sprint 2 |
| UC-D04 | Mới ở Phase 2 | P1 | Sprint 3 |
| UC-D05 | Mới ở Phase 2 | P1 | Sprint 3 |
| UC-E01 | Cần mở rộng từ Phase 1 | P0 | Sprint 2 |
| UC-E02 | Mới ở Phase 2 | P0 | Sprint 2 |
| UC-E03 | Mới ở Phase 2 | P0 | Sprint 2 |
| UC-E04 | Mới ở Phase 2 | P1 | Sprint 3 |
| UC-E05 | Mới ở Phase 2 | P2 | Sprint 4 |
| UC-F01 | Mới ở Phase 2 | P0 | Sprint 2 |
| UC-F02 | Mới ở Phase 2 | P0 | Sprint 2 |
| UC-F03 | Mới ở Phase 2 | P1 | Sprint 3 |
| UC-F04 | Mới ở Phase 2 | P2 | Sprint 4 |
| UC-G01 | Mới ở Phase 2 | P1 | Sprint 3 |
| UC-G02 | Cần mở rộng từ Phase 1 | P2 | Sprint 4 |