package com.file.service.filesharingvideocodec.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class EncodingLogger {

    public void logEncodingStart(String jobId, String presignedUrl, String profile) {
        log.info("[Encoding Started] JobId: {}, Profile: {}, URL: {}", jobId, profile, maskUrl(presignedUrl));
    }

    public void logSegmentComplete(String jobId, String profile, int segmentCount) {
        log.info("[Segment Complete] JobId: {}, Profile: {}, Segments: {}", jobId, profile, segmentCount);
    }

    public void logEncodingError(String jobId, String profile, String error) {
        log.error("[Encoding Error] JobId: {}, Profile: {}, Error: {}", jobId, profile, error);
    }

    public void logProfileComplete(String jobId, String profile, long durationMs, String m3u8Url) {
        log.info("[Profile Complete] JobId: {}, Profile: {}, Duration: {}ms, M3U8: {}", 
                 jobId, profile, durationMs, maskUrl(m3u8Url));
    }

    public void logUploadStart(String jobId, String profile, int fileCount) {
        log.info("[Upload Started] JobId: {}, Profile: {}, Files: {}", jobId, profile, fileCount);
    }

    public void logUploadComplete(String jobId, String profile, int fileCount) {
        log.info("[Upload Complete] JobId: {}, Profile: {}, Files uploaded: {}", jobId, profile, fileCount);
    }

    public void logJobComplete(String jobId, long totalDurationMs, int profileCount) {
        log.info("[Job Complete] JobId: {}, Total Duration: {}ms, Profiles: {}", 
                 jobId, totalDurationMs, profileCount);
    }

    public void logRetryAttempt(String jobId, int attemptNumber, int maxAttempts) {
        log.warn("[Retry Attempt] JobId: {}, Attempt: {}/{}", jobId, attemptNumber, maxAttempts);
    }

    private String maskUrl(String url) {
        if (url == null || url.length() < 50) {
            return url;
        }
        return url.substring(0, 50) + "...";
    }
}
