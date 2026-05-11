package com.file.service.filesharingvideocodec.ffmpeg;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.concurrent.atomic.AtomicReference;

/**
 * rút cạn stderr của FFmpeg trên một Virtual Thread để ngăn tràn bộ đệm đường ống.
 * nhân Linux chỉ phân bổ 64KB cho các bộ đệm đường ống — nếu stderr không được đọc
 * liên tục, đường ống sẽ đầy, nhân chặn FFmpeg và máy chủ bị treo.
 *
 * <p>các quy tắc bên trong trình rút cạn:
 * <ul>
 *   <li>không ghi DB đồng bộ — tiến trình đi vào AtomicReference</li>
 *   <li>không gọi dịch vụ bên ngoài</li>
 *   <li>chỉ ghi log an toàn không đồng bộ</li>
 * </ul>
 */
@Component
@Slf4j
public class StderrDrainer {

    private final ProgressParser progressParser;

    public StderrDrainer(ProgressParser progressParser) {
        this.progressParser = progressParser;
    }

    /**
     * trình giữ dữ liệu cho tiến trình mới nhất được phân tích cú pháp từ stderr.
     */
    public static class ProgressData {
        public final double encodedSeconds;
        public final double speed;

        public ProgressData(double encodedSeconds, double speed) {
            this.encodedSeconds = encodedSeconds;
            this.speed = speed;
        }
    }

    /**
     * bắt đầu rút cạn stderr trên một Virtual Thread.
     * ghi tiến trình mới nhất vào AtomicReference được cung cấp (chia sẻ với trình xoá định kỳ).
     *
     * @param stderr         InputStream stderr từ tiến trình FFmpeg
     * @param jobId          cho ngữ cảnh ghi log
     * @param progressRef    AtomicReference được chia sẻ cho dữ liệu tiến trình
     * @return Virtual Thread (đã bắt đầu)
     */
    public Thread drain(InputStream stderr, String jobId, AtomicReference<ProgressData> progressRef) {
        return Thread.ofVirtual()
                .name("stderr-drain-" + jobId)
                .start(() -> {
                    try (BufferedReader reader = new BufferedReader(new InputStreamReader(stderr))) {
                        String line;
                        while ((line = reader.readLine()) != null) {
                            // phân tích cú pháp tiến trình
                            double timeSec = progressParser.parseTimeSeconds(line);
                            if (timeSec >= 0) {
                                double speed = progressParser.parseSpeed(line);
                                progressRef.set(new ProgressData(timeSec, speed));
                            }
                            // ghi log ở cấp độ debug để tránh ngập lụt
                            log.debug("[{}] {}", jobId, line);
                        }
                    } catch (Exception e) {
                        log.warn("trinh rut can stderr cho job {} bi cham dut: {}", jobId, e.getMessage());
                    }
                    log.debug("trinh rut can stderr cho job {} da hoan thanh", jobId);
                });
    }
}
