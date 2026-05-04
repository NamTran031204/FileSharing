package com.file.service.filesharingvideocodec.ffmpeg;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Drains FFmpeg stderr on a Virtual Thread to prevent pipe buffer overflow.
 * Linux kernel only allocates 64KB for pipe buffers — if stderr isn't read
 * continuously, the pipe fills up, kernel blocks FFmpeg, and the server hangs.
 *
 * <p>Rules inside the drainer:
 * <ul>
 *   <li>No synchronous DB writes — progress goes into AtomicReference</li>
 *   <li>No external service calls</li>
 *   <li>Only async-safe logging</li>
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
     * Data holder for the latest progress parsed from stderr.
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
     * Start draining stderr on a Virtual Thread.
     * Writes latest progress into the provided AtomicReference (shared with a periodic flusher).
     *
     * @param stderr         the stderr InputStream from the FFmpeg process
     * @param jobId          for logging context
     * @param progressRef    shared AtomicReference for progress data
     * @return the Virtual Thread (already started)
     */
    public Thread drain(InputStream stderr, String jobId, AtomicReference<ProgressData> progressRef) {
        return Thread.ofVirtual()
                .name("stderr-drain-" + jobId)
                .start(() -> {
                    try (BufferedReader reader = new BufferedReader(new InputStreamReader(stderr))) {
                        String line;
                        while ((line = reader.readLine()) != null) {
                            // Parse progress
                            double timeSec = progressParser.parseTimeSeconds(line);
                            if (timeSec >= 0) {
                                double speed = progressParser.parseSpeed(line);
                                progressRef.set(new ProgressData(timeSec, speed));
                            }
                            // Log at debug level to avoid flooding
                            log.debug("[{}] {}", jobId, line);
                        }
                    } catch (Exception e) {
                        log.warn("Stderr drainer for job {} terminated: {}", jobId, e.getMessage());
                    }
                    log.debug("Stderr drainer for job {} finished", jobId);
                });
    }
}
