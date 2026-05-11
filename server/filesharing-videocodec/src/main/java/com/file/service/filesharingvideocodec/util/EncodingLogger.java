package com.file.service.filesharingvideocodec.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class EncodingLogger {

    public void logEncodingStart(String jobId, String presignedUrl, String profile) {
        log.info("[bat dau ma hoa] jobId: {}, profile: {}, url: {}", jobId, profile, maskUrl(presignedUrl));
    }

    public void logSegmentComplete(String jobId, String profile, int segmentCount) {
        log.info("[hoan tat phan doan] jobId: {}, profile: {}, so phan doan: {}", jobId, profile, segmentCount);
    }

    public void logEncodingError(String jobId, String profile, String error) {
        log.error("[loi ma hoa] jobId: {}, profile: {}, loi: {}", jobId, profile, error);
    }

    public void logProfileComplete(String jobId, String profile, long durationMs, String m3u8Url) {
        log.info("[hoan tat profile] jobId: {}, profile: {}, thoi gian: {}ms, m3u8: {}", 
                 jobId, profile, durationMs, maskUrl(m3u8Url));
    }

    public void logUploadStart(String jobId, String profile, int fileCount) {
        log.info("[bat dau tai len] jobId: {}, profile: {}, so tep: {}", jobId, profile, fileCount);
    }

    public void logUploadComplete(String jobId, String profile, int fileCount) {
        log.info("[hoan tat tai len] jobId: {}, profile: {}, so tep da tai: {}", jobId, profile, fileCount);
    }

    public void logJobComplete(String jobId, long totalDurationMs, int profileCount) {
        log.info("[hoan tat job] jobId: {}, tong thoi gian: {}ms, so profile: {}", 
                 jobId, totalDurationMs, profileCount);
    }

    public void logRetryAttempt(String jobId, int attemptNumber, int maxAttempts) {
        log.warn("[thu lai] jobId: {}, lan thu: {}/{}", jobId, attemptNumber, maxAttempts);
    }

    private String maskUrl(String url) {
        if (url == null || url.length() < 50) {
            return url;
        }
        return url.substring(0, 50) + "...";
    }
}
