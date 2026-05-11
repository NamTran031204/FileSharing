package com.file.service.filesharingvideocodec.ffmpeg;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * phân tích cú pháp đầu ra stderr của FFmpeg để trích xuất tiến trình mã hoá.
 * FFmpeg ghi các dòng như:
 *   frame=  247 fps= 32 q=28.0 size=    1280kB time=00:00:10.29 bitrate= 1019.2kbits/s speed=1.34x
 */
@Component
@Slf4j
public class ProgressParser {

    private static final Pattern TIME_PATTERN = Pattern.compile("time=(\\d{2}):(\\d{2}):(\\d{2})\\.(\\d{2})");
    private static final Pattern SPEED_PATTERN = Pattern.compile("speed=\\s*([\\d.]+)x");

    /**
     * phân tích cú pháp một dòng stderr duy nhất và trích xuất thời gian đã mã hoá tính bằng giây.
     * @return số giây đã mã hoá, hoặc -1 nếu dòng không chứa thông tin thời gian.
     */
    public double parseTimeSeconds(String line) {
        Matcher matcher = TIME_PATTERN.matcher(line);
        if (matcher.find()) {
            int hours = Integer.parseInt(matcher.group(1));
            int minutes = Integer.parseInt(matcher.group(2));
            int seconds = Integer.parseInt(matcher.group(3));
            int centiseconds = Integer.parseInt(matcher.group(4));
            return hours * 3600.0 + minutes * 60.0 + seconds + centiseconds / 100.0;
        }
        return -1;
    }

    /**
     * phân tích cú pháp tốc độ mã hoá từ một dòng stderr.
     * @return hệ số tốc độ (ví dụ: 1.34), hoặc -1 nếu không tìm thấy.
     */
    public double parseSpeed(String line) {
        Matcher matcher = SPEED_PATTERN.matcher(line);
        if (matcher.find()) {
            return Double.parseDouble(matcher.group(1));
        }
        return -1;
    }

    /**
     * tính phần trăm tiến trình.
     * @param encodedSeconds số giây đã được mã hoá cho đến nay
     * @param totalDurationSeconds tổng thời lượng của video đầu vào
     * @return phần trăm (0-100), giới hạn ở 99 cho đến khi quá trình mã hoá thực sự hoàn tất
     */
    public int calculatePercent(double encodedSeconds, double totalDurationSeconds) {
        if (totalDurationSeconds <= 0) {
            return 0;
        }
        int percent = (int) (encodedSeconds / totalDurationSeconds * 100);
        return Math.min(percent, 99);  // giới hạn ở 99 — chỉ markCompleted mới đặt là 100
    }
}
