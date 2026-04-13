# Báo cáo phân tích cơ chế Adaptive và đo tốc độ mạng trong hls.js

## Thông tin chung
- Mục tiêu: Phân tích cách hls.js đo tốc độ mạng và tự động chọn chất lượng stream (ABR - Adaptive Bitrate).
- Phạm vi mã nguồn: thư mục [docs/hls.js](docs/hls.js).
- Ngày lập báo cáo: 13/04/2026.

## 1) Thành phần chính liên quan đến Adaptive

- Bộ điều khiển ABR: [docs/hls.js/src/controller/abr-controller.ts](docs/hls.js/src/controller/abr-controller.ts#L36)
- Bộ ước lượng băng thông EWMA: [docs/hls.js/src/utils/ewma-bandwidth-estimator.ts](docs/hls.js/src/utils/ewma-bandwidth-estimator.ts#L1)
- Lõi EWMA: [docs/hls.js/src/utils/ewma.ts](docs/hls.js/src/utils/ewma.ts#L6)
- Khởi tạo ABR trong Hls: [docs/hls.js/src/hls.ts](docs/hls.js/src/hls.ts#L218)
- Cấu hình mặc định ABR: [docs/hls.js/src/config.ts](docs/hls.js/src/config.ts#L466)

Nhận xét: cơ chế adaptive được thiết kế theo hướng đo thực tế trong lúc tải segment, không dựa vào bài test tốc độ độc lập.

## 2) Pipeline đo tốc độ mạng

### 2.1 Tạo và cập nhật thống kê tải
- Mốc bắt đầu request được gán tại [docs/hls.js/src/utils/base-loader.ts](docs/hls.js/src/utils/base-loader.ts#L38).
- Cấu trúc số liệu tải nằm ở [docs/hls.js/src/loader/load-stats.ts](docs/hls.js/src/loader/load-stats.ts#L7), gồm:
  - loading.start, loading.first, loading.end
  - loaded, total
  - parsing.start, parsing.end
  - buffering.start, buffering.end
  - bwEstimate

### 2.2 Đo ở tầng HTTP loader
- XHR loader ghi nhận first byte, end, loaded ở:
  - [docs/hls.js/src/utils/xhr-loader.ts](docs/hls.js/src/utils/xhr-loader.ts#L150)
  - [docs/hls.js/src/utils/xhr-loader.ts](docs/hls.js/src/utils/xhr-loader.ts#L178)
  - [docs/hls.js/src/utils/xhr-loader.ts](docs/hls.js/src/utils/xhr-loader.ts#L238)
- XHR có tính nhanh bwEstimate theo công thức:
  - [docs/hls.js/src/utils/xhr-loader.ts](docs/hls.js/src/utils/xhr-loader.ts#L187)
- Fetch loader cập nhật tương tự ở:
  - [docs/hls.js/src/utils/fetch-loader.ts](docs/hls.js/src/utils/fetch-loader.ts#L126)
  - [docs/hls.js/src/utils/fetch-loader.ts](docs/hls.js/src/utils/fetch-loader.ts#L155)
  - [docs/hls.js/src/utils/fetch-loader.ts](docs/hls.js/src/utils/fetch-loader.ts#L245)

### 2.3 Gắn stats vào Fragment/Part
- Khi tải fragment: [docs/hls.js/src/loader/fragment-loader.ts](docs/hls.js/src/loader/fragment-loader.ts#L100)
- Khi tải part LL-HLS: [docs/hls.js/src/loader/fragment-loader.ts](docs/hls.js/src/loader/fragment-loader.ts#L210)

### 2.4 ABR lấy mẫu khi đã parse/buffer
- FRAG_BUFFERED được bắn tại [docs/hls.js/src/controller/buffer-controller.ts](docs/hls.js/src/controller/buffer-controller.ts#L1111).
- ABR nghe event và lấy mẫu ở [docs/hls.js/src/controller/abr-controller.ts](docs/hls.js/src/controller/abr-controller.ts#L510).
- processingMs được tính ở [docs/hls.js/src/controller/abr-controller.ts](docs/hls.js/src/controller/abr-controller.ts#L526), sau đó sample tại [docs/hls.js/src/controller/abr-controller.ts](docs/hls.js/src/controller/abr-controller.ts#L532).

Ý nghĩa quan trọng: hls.js cố gắng đo phần thời gian tải hữu ích, hạn chế nhiễu do thời gian chờ append buffer.

## 3) Thuật toán ước lượng băng thông (EWMA)

### 3.1 Thành phần estimator
- Fast EWMA + Slow EWMA + TTFB EWMA.
- Khởi tạo ở [docs/hls.js/src/utils/ewma-bandwidth-estimator.ts](docs/hls.js/src/utils/ewma-bandwidth-estimator.ts#L20).
- Ngưỡng mẫu tối thiểu và delay tối thiểu:
  - minWeight_: [docs/hls.js/src/utils/ewma-bandwidth-estimator.ts](docs/hls.js/src/utils/ewma-bandwidth-estimator.ts#L27)
  - minDelayMs_: [docs/hls.js/src/utils/ewma-bandwidth-estimator.ts](docs/hls.js/src/utils/ewma-bandwidth-estimator.ts#L28)

### 3.2 Công thức chính
- Mẫu băng thông:
  - bwSample = (8 x numBytes) / durationSeconds
  - Thực thi trong [docs/hls.js/src/utils/ewma-bandwidth-estimator.ts](docs/hls.js/src/utils/ewma-bandwidth-estimator.ts#L48)
- Giá trị estimate cuối:
  - bwEstimate = min(fastEWMA, slowEWMA)
  - [docs/hls.js/src/utils/ewma-bandwidth-estimator.ts](docs/hls.js/src/utils/ewma-bandwidth-estimator.ts#L77)
- Mẫu TTFB riêng tại [docs/hls.js/src/utils/ewma-bandwidth-estimator.ts](docs/hls.js/src/utils/ewma-bandwidth-estimator.ts#L59).

### 3.3 Tính chất
- Giảm chất lượng nhanh khi mạng xấu (fast phản ứng nhanh).
- Tăng chất lượng chậm hơn để tránh rung lắc.
- Thiên hướng bảo thủ vì lấy min(fast, slow).

## 4) Cơ chế chọn level adaptive

### 4.1 Điểm vào quyết định
- nextAutoLevel: [docs/hls.js/src/controller/abr-controller.ts](docs/hls.js/src/controller/abr-controller.ts#L594)
- firstAutoLevel: [docs/hls.js/src/controller/abr-controller.ts](docs/hls.js/src/controller/abr-controller.ts#L556)
- getNextABRAutoLevel: [docs/hls.js/src/controller/abr-controller.ts](docs/hls.js/src/controller/abr-controller.ts#L637)
- findBestLevel: [docs/hls.js/src/controller/abr-controller.ts](docs/hls.js/src/controller/abr-controller.ts#L750)

### 4.2 Tiêu chí cốt lõi khi chọn level
- Ước lượng thời gian cạn buffer: [docs/hls.js/src/controller/abr-controller.ts](docs/hls.js/src/controller/abr-controller.ts#L298)
- Ước lượng thời gian tải fragment: [docs/hls.js/src/controller/abr-controller.ts](docs/hls.js/src/controller/abr-controller.ts#L206)
- Dùng hệ số bảo thủ:
  - down/giữ mức: abrBandWidthFactor
  - upswitch: abrBandWidthUpFactor
  - áp dụng tại [docs/hls.js/src/controller/abr-controller.ts](docs/hls.js/src/controller/abr-controller.ts#L941) và [docs/hls.js/src/controller/abr-controller.ts](docs/hls.js/src/controller/abr-controller.ts#L943)
- Điều kiện chấp nhận switch tại [docs/hls.js/src/controller/abr-controller.ts](docs/hls.js/src/controller/abr-controller.ts#L960).

### 4.3 Chống giật: emergency downswitch
- ABR theo dõi fragment đang tải theo chu kỳ 100ms:
  - [docs/hls.js/src/controller/abr-controller.ts](docs/hls.js/src/controller/abr-controller.ts#L159)
- Nếu phát hiện không kịp buffer, có thể hạ level khẩn cấp và abort request:
  - [docs/hls.js/src/controller/abr-controller.ts](docs/hls.js/src/controller/abr-controller.ts#L240)
  - [docs/hls.js/src/controller/abr-controller.ts](docs/hls.js/src/controller/abr-controller.ts#L461)

## 5) Bitrate test khi khởi động

- Khi startLevel = -1 và testBandwidth = true, stream-controller tải fragment đầu ở level thấp nhất để đo:
  - [docs/hls.js/src/controller/stream-controller.ts](docs/hls.js/src/controller/stream-controller.ts#L149)
  - [docs/hls.js/src/controller/stream-controller.ts](docs/hls.js/src/controller/stream-controller.ts#L152)
- Cờ bitrateTest của fragment: [docs/hls.js/src/loader/fragment.ts](docs/hls.js/src/loader/fragment.ts#L234)
- Luồng tải test fragment: [docs/hls.js/src/controller/stream-controller.ts](docs/hls.js/src/controller/stream-controller.ts#L1159)
- ABR sử dụng bitrateTestDelay trong quyết định level ban đầu:
  - [docs/hls.js/src/controller/abr-controller.ts](docs/hls.js/src/controller/abr-controller.ts#L678)

## 6) Tham số cấu hình ảnh hưởng mạnh đến adaptive

Khai báo kiểu cấu hình: [docs/hls.js/src/config.ts](docs/hls.js/src/config.ts#L50)

Giá trị mặc định đáng chú ý:
- abrEwmaFastLive = 3: [docs/hls.js/src/config.ts](docs/hls.js/src/config.ts#L466)
- abrEwmaSlowLive = 9: [docs/hls.js/src/config.ts](docs/hls.js/src/config.ts#L467)
- abrEwmaFastVoD = 3: [docs/hls.js/src/config.ts](docs/hls.js/src/config.ts#L468)
- abrEwmaSlowVoD = 9: [docs/hls.js/src/config.ts](docs/hls.js/src/config.ts#L469)
- abrEwmaDefaultEstimate = 500 kbps: [docs/hls.js/src/config.ts](docs/hls.js/src/config.ts#L470)
- abrBandWidthFactor = 0.95: [docs/hls.js/src/config.ts](docs/hls.js/src/config.ts#L472)
- abrBandWidthUpFactor = 0.7: [docs/hls.js/src/config.ts](docs/hls.js/src/config.ts#L473)
- maxStarvationDelay = 4s: [docs/hls.js/src/config.ts](docs/hls.js/src/config.ts#L476)
- maxLoadingDelay = 4s: [docs/hls.js/src/config.ts](docs/hls.js/src/config.ts#L477)
- testBandwidth = true: [docs/hls.js/src/config.ts](docs/hls.js/src/config.ts#L487)

Ngoài ra, có cơ chế chặn đổi level quá dày bằng abrSwitchInterval:
- [docs/hls.js/src/controller/level-controller.ts](docs/hls.js/src/controller/level-controller.ts#L678)

## 7) API theo dõi estimate từ bên ngoài

- Lấy bandwidthEstimate: [docs/hls.js/src/hls.ts](docs/hls.js/src/hls.ts#L892)
- Gán bandwidthEstimate để reset estimator: [docs/hls.js/src/hls.ts](docs/hls.js/src/hls.ts#L900)
- Lấy ttfbEstimate: [docs/hls.js/src/hls.ts](docs/hls.js/src/hls.ts#L916)
- Lấy nextAutoLevel: [docs/hls.js/src/hls.ts](docs/hls.js/src/hls.ts#L1012)

## 8) Chuỗi sự kiện rút gọn

1. Loader bắt đầu request, ghi loading.start.
2. Nhận first byte, cập nhật loading.first.
3. Tải xong fragment/part, cập nhật loaded và loading.end.
4. Parse và append buffer xong, phát FRAG_BUFFERED.
5. ABR nhận stats, sample EWMA bandwidth + TTFB.
6. ABR tính bufferStarvationDelay, fetchDuration, chọn level tối ưu.
7. Nếu nguy cơ rebuffer cao, kích hoạt emergency switch-down.

## 9) Kết luận

- hls.js đang dùng mô hình ABR bảo thủ và thực dụng, tập trung giảm rebuffer hơn là giữ chất lượng cao bằng mọi giá.
- Điểm mạnh là phản ứng nhanh khi mạng giảm, tăng chất lượng có kiểm soát, và có cơ chế hạ khẩn cấp khi cần.
- Với workload thực tế, các tham số abrBandWidthFactor, abrBandWidthUpFactor, maxStarvationDelay và maxLoadingDelay là nhóm nên tinh chỉnh đầu tiên.
