package com.file.service.filesharingvideocodec.ffmpeg;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Parses FFmpeg stderr output to extract encoding progress.
 * FFmpeg writes lines like:
 *   frame=  247 fps= 32 q=28.0 size=    1280kB time=00:00:10.29 bitrate= 1019.2kbits/s speed=1.34x
 */
@Component
@Slf4j
public class ProgressParser {

    private static final Pattern TIME_PATTERN = Pattern.compile("time=(\\d{2}):(\\d{2}):(\\d{2})\\.(\\d{2})");
    private static final Pattern SPEED_PATTERN = Pattern.compile("speed=\\s*([\\d.]+)x");

    /**
     * Parse a single stderr line and extract the encoded time in seconds.
     * @return encoded seconds, or -1 if the line doesn't contain time info.
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
     * Parse the encoding speed from a stderr line.
     * @return speed multiplier (e.g. 1.34), or -1 if not found.
     */
    public double parseSpeed(String line) {
        Matcher matcher = SPEED_PATTERN.matcher(line);
        if (matcher.find()) {
            return Double.parseDouble(matcher.group(1));
        }
        return -1;
    }

    /**
     * Calculate progress percentage.
     * @param encodedSeconds how many seconds have been encoded so far
     * @param totalDurationSeconds total duration of the input video
     * @return percentage (0-100), capped at 99 until encoding is truly complete
     */
    public int calculatePercent(double encodedSeconds, double totalDurationSeconds) {
        if (totalDurationSeconds <= 0) {
            return 0;
        }
        int percent = (int) (encodedSeconds / totalDurationSeconds * 100);
        return Math.min(percent, 99);  // Cap at 99 — only markCompleted sets 100
    }
}
