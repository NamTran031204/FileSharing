package com.file.service.filesharingvideocodec.ffmpeg;

import com.file.service.filesharing.core.job.tool.LineParser;

import java.time.Duration;
import java.util.Locale;
import java.util.function.BiConsumer;
import java.util.function.Consumer;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Doc tien do ffmpeg: khoi -progress pipe:1 tren stdout (out_time_us, speed, progress=...),
 * va tren stderr (-v verbose): "Statistics: N bytes read", "Opening '...ts' for writing".
 * fraction = out_time / thoi luong video; ETA = (thoi luong - out_time) / speed.
 */
public final class FfmpegProgress implements LineParser {
    private static final Pattern BYTES_READ = Pattern.compile("Statistics: (\\d+) bytes read");
    private static final Pattern SEGMENT = Pattern.compile("Opening '.*\\.ts' for writing");

    private final double durationSec;
    private final BiConsumer<Double, String> progress;
    private final Consumer<Duration> eta;
    private long outTimeUs;
    private double speed;
    private Long bytesRead;
    private int segments;

    public FfmpegProgress(double durationSec, BiConsumer<Double, String> progress, Consumer<Duration> eta) {
        this.durationSec = durationSec;
        this.progress = progress;
        this.eta = eta;
    }

    // ToolRunner goi tuan tu trong cung 1 khoa
    @Override
    public void onLine(boolean stderr, String line) {
        if (stderr) {
            Matcher m = BYTES_READ.matcher(line);
            if (m.find()) {
                long n = Long.parseLong(m.group(1));
                bytesRead = bytesRead == null ? n : Math.max(bytesRead, n);
            } else if (SEGMENT.matcher(line).find()) {
                segments++;
            }
            return;
        }
        if (line.startsWith("out_time_us=")) {
            outTimeUs = parseLong(line.substring(12), outTimeUs);
        } else if (line.startsWith("speed=")) {
            String v = line.substring(6).trim();
            if (v.endsWith("x")) v = v.substring(0, v.length() - 1);
            speed = parseDouble(v, speed);
        } else if (line.startsWith("progress=")) {
            publish();
        }
    }

    private void publish() {
        double t = outTimeUs / 1e6;
        if (durationSec > 0) {
            progress.accept(t / durationSec,
                    String.format(Locale.ROOT, "ENCODE %.1f/%.1fs %.2fx", t, durationSec, speed));
            if (speed > 0) eta.accept(Duration.ofMillis((long) (Math.max(0, durationSec - t) / speed * 1000)));
        } else {
            progress.accept(0.0, String.format(Locale.ROOT, "ENCODE %.1fs %.2fx", t, speed));
        }
    }

    public Long bytesRead() {
        return bytesRead;
    }

    public int segments() {
        return segments;
    }

    private static long parseLong(String s, long def) {
        try {
            return Long.parseLong(s.trim());
        } catch (NumberFormatException e) {
            return def;
        }
    }

    private static double parseDouble(String s, double def) {
        try {
            return Double.parseDouble(s);
        } catch (NumberFormatException e) {
            return def;
        }
    }
}
