package com.file.service.filesharing.core.setting;

import org.springframework.util.unit.DataSize;

import java.time.Duration;
import java.util.List;

/**
 * Thong so loi do dev so huu cho 12 nhom (APP, AUTH, UPLOAD, DOWNLOAD, PROOF, DASHBOARD, RETENTION, JOB, WORKER, VIDEO, IMAGE, RAW).
 * Khong luu Mongo, khong sua tu UI; doi gia tri = sua DEFAULTS roi restart. Gia tri = defaultValue hien hanh
 * cua SettingKey nen hanh vi khong doi.
 */
public record FixedSettings(App app, Auth auth, Upload upload, Download download, Proof proof,
                            Dashboard dashboard, Retention retention, Job job, Worker worker, Video video, Image image,
                            Raw raw) {

    public record App(String frontendBaseUrl, List<String> corsAllowedOrigins) {
    }

    public record Auth(Duration accessTtl, Duration refreshTtl) {
    }

    public record Upload(DataSize maxFileSize, Duration partUrlTtl, int maxThreads, Duration sessionIdleTtl,
                         int maxSessionsPerUser, boolean verifyEtagMd5, Duration sessionHardExpiry,
                         int initialUrlBatch, Duration reconcileOrphanMinAge, Duration reconcileSubmitWindow,
                         Duration gcInterval, Duration reconcileInterval) {
    }

    public record Download(Duration urlTtlMin, Duration urlTtlMax) {
    }

    public record Proof(int maxNameLength, int maxNoteLength, int maxSubmitAssets, int maxPageSize,
                        Duration previewUrlTtl) {
    }

    public record Dashboard(int recentDefaultLimit, int recentMaxLimit) {
    }

    public record Retention(Duration processingJobs, Duration uploadSessions) {
    }

    public record Job(int maxRetries, Duration backoffBase, Duration backoffMax, Duration presignTtl,
                      int uploadBatchSize, Duration workspaceCleanupAge, Duration leaseDuration,
                      Duration pollInterval, Duration reaperInterval, Duration relayInterval, Duration relayLease) {
    }

    public record Worker(int ffmpegEncoderMaxConcurrent, int imageProcessorMaxConcurrent,
                         int rawProcessorMaxConcurrent) {
    }

    public record Video(Duration timeout, Duration probeTimeout, int threadsPerProcess, int crf, String preset,
                        int segmentDuration, String audioBitrate) {
    }

    public record Image(Duration processingTimeout, long maxPixels, int vipsConcurrency, List<String> allowedLoaders,
                        int webpQuality, int webpEffort, int thumbnailWidth, int previewMaxEdge) {
    }

    public record Raw(Duration commandTimeout, Duration lockWait) {
    }

    public static final FixedSettings DEFAULTS = new FixedSettings(
            new App("http://localhost:5173", List.of("http://localhost:5173")),
            new Auth(Duration.ofHours(24), Duration.ofDays(7)),
            new Upload(DataSize.ofGigabytes(50), Duration.ofSeconds(900), 6, Duration.ofHours(24), 20, true,
                    Duration.ofDays(7), 20, Duration.ofHours(24), Duration.ofHours(48), Duration.ofSeconds(900),
                    Duration.ofHours(24)),
            new Download(Duration.ofSeconds(900), Duration.ofHours(4)),
            new Proof(100, 1000, 5000, 100, Duration.ofSeconds(3600)),
            new Dashboard(10, 50),
            new Retention(Duration.ofDays(30), Duration.ofHours(48)),
            new Job(3, Duration.ofSeconds(30), Duration.ofMinutes(30), Duration.ofHours(4), 15, Duration.ofHours(24),
                    Duration.ofSeconds(30), Duration.ofSeconds(1), Duration.ofSeconds(15), Duration.ofSeconds(1),
                    Duration.ofSeconds(30)),
            new Worker(2, 3, 2),
            new Video(Duration.ofHours(1), Duration.ofSeconds(60), 2, 23, "medium", 6, "128k"),
            new Image(Duration.ofSeconds(30), 50_000_000L, 2,
                    List.of("jpegload", "pngload", "webpload", "gifload", "tiffload", "heifload"), 82, 6, 200, 2560),
            new Raw(Duration.ofSeconds(30), Duration.ofSeconds(60)));

    /** gia tri raw (chuoi parse duoc boi RuntimeSettings) cua key thuoc 12 nhom khoa */
    public String raw(SettingKey k) {
        return switch (k) {
            case APP_FRONTEND_BASE_URL -> app.frontendBaseUrl();
            case SECURITY_CORS_ALLOWED_ORIGINS -> String.join(",", app.corsAllowedOrigins());
            case AUTH_JWT_ACCESS_TTL -> fmt(auth.accessTtl());
            case AUTH_JWT_REFRESH_TTL -> fmt(auth.refreshTtl());
            case UPLOAD_MAX_FILE_SIZE -> fmt(upload.maxFileSize());
            case UPLOAD_PART_URL_TTL -> fmt(upload.partUrlTtl());
            case UPLOAD_MAX_THREADS -> String.valueOf(upload.maxThreads());
            case UPLOAD_SESSION_IDLE_TTL -> fmt(upload.sessionIdleTtl());
            case UPLOAD_MAX_SESSIONS_PER_USER -> String.valueOf(upload.maxSessionsPerUser());
            case UPLOAD_VERIFY_ETAG_MD5 -> String.valueOf(upload.verifyEtagMd5());
            case UPLOAD_SESSION_HARD_EXPIRY -> fmt(upload.sessionHardExpiry());
            case UPLOAD_INITIAL_URL_BATCH -> String.valueOf(upload.initialUrlBatch());
            case UPLOAD_RECONCILE_ORPHAN_MIN_AGE -> fmt(upload.reconcileOrphanMinAge());
            case UPLOAD_RECONCILE_SUBMIT_WINDOW -> fmt(upload.reconcileSubmitWindow());
            case UPLOAD_GC_INTERVAL -> fmt(upload.gcInterval());
            case UPLOAD_RECONCILE_INTERVAL -> fmt(upload.reconcileInterval());
            case DOWNLOAD_URL_TTL_MIN -> fmt(download.urlTtlMin());
            case DOWNLOAD_URL_TTL_MAX -> fmt(download.urlTtlMax());
            case PROOF_MAX_NAME_LENGTH -> String.valueOf(proof.maxNameLength());
            case PROOF_MAX_NOTE_LENGTH -> String.valueOf(proof.maxNoteLength());
            case PROOF_MAX_SUBMIT_ASSETS -> String.valueOf(proof.maxSubmitAssets());
            case PROOF_MAX_PAGE_SIZE -> String.valueOf(proof.maxPageSize());
            case PROOF_PREVIEW_URL_TTL -> fmt(proof.previewUrlTtl());
            case DASHBOARD_RECENT_DEFAULT_LIMIT -> String.valueOf(dashboard.recentDefaultLimit());
            case DASHBOARD_RECENT_MAX_LIMIT -> String.valueOf(dashboard.recentMaxLimit());
            case RETENTION_PROCESSING_JOBS -> fmt(retention.processingJobs());
            case RETENTION_UPLOAD_SESSIONS -> fmt(retention.uploadSessions());
            case JOB_MAX_RETRIES -> String.valueOf(job.maxRetries());
            case JOB_BACKOFF_BASE -> fmt(job.backoffBase());
            case JOB_BACKOFF_MAX -> fmt(job.backoffMax());
            case JOB_PRESIGN_TTL -> fmt(job.presignTtl());
            case JOB_UPLOAD_BATCH_SIZE -> String.valueOf(job.uploadBatchSize());
            case JOB_WORKSPACE_CLEANUP_AGE -> fmt(job.workspaceCleanupAge());
            case JOB_LEASE_DURATION -> fmt(job.leaseDuration());
            case JOB_POLL_INTERVAL -> fmt(job.pollInterval());
            case JOB_REAPER_INTERVAL -> fmt(job.reaperInterval());
            case JOB_RELAY_INTERVAL -> fmt(job.relayInterval());
            case JOB_RELAY_LEASE -> fmt(job.relayLease());
            case WORKER_BULKHEAD_FFMPEG_ENCODER_MAX_CONCURRENT -> String.valueOf(worker.ffmpegEncoderMaxConcurrent());
            case WORKER_BULKHEAD_IMAGE_PROCESSOR_MAX_CONCURRENT -> String.valueOf(worker.imageProcessorMaxConcurrent());
            case WORKER_BULKHEAD_RAW_PROCESSOR_MAX_CONCURRENT -> String.valueOf(worker.rawProcessorMaxConcurrent());
            case VIDEO_TIMEOUT -> fmt(video.timeout());
            case VIDEO_PROBE_TIMEOUT -> fmt(video.probeTimeout());
            case VIDEO_THREADS_PER_PROCESS -> String.valueOf(video.threadsPerProcess());
            case VIDEO_CRF -> String.valueOf(video.crf());
            case VIDEO_PRESET -> video.preset();
            case VIDEO_SEGMENT_DURATION -> String.valueOf(video.segmentDuration());
            case VIDEO_AUDIO_BITRATE -> video.audioBitrate();
            case IMAGE_PROCESSING_TIMEOUT -> fmt(image.processingTimeout());
            case IMAGE_MAX_PIXELS -> String.valueOf(image.maxPixels());
            case IMAGE_VIPS_CONCURRENCY -> String.valueOf(image.vipsConcurrency());
            case IMAGE_ALLOWED_LOADERS -> String.join(",", image.allowedLoaders());
            case IMAGE_WEBP_QUALITY -> String.valueOf(image.webpQuality());
            case IMAGE_WEBP_EFFORT -> String.valueOf(image.webpEffort());
            case IMAGE_THUMBNAIL_WIDTH -> String.valueOf(image.thumbnailWidth());
            case IMAGE_PREVIEW_MAX_EDGE -> String.valueOf(image.previewMaxEdge());
            case RAW_COMMAND_TIMEOUT -> fmt(raw.commandTimeout());
            case RAW_LOCK_WAIT -> fmt(raw.lockWait());
            default -> throw new IllegalArgumentException("khong thuoc nhom khoa: " + k.key());
        };
    }

    // d/h/m/s lon nhat chia het, de hien thi giong gia tri mac dinh cu (24h, 7d, 900s)
    private static String fmt(Duration d) {
        long s = d.toSeconds();
        if (s != 0 && s % 86_400 == 0) return s / 86_400 + "d";
        if (s != 0 && s % 3_600 == 0) return s / 3_600 + "h";
        if (s != 0 && s % 60 == 0) return s / 60 + "m";
        return s + "s";
    }

    private static String fmt(DataSize d) {
        long b = d.toBytes();
        long gb = 1024L * 1024 * 1024;
        return b % gb == 0 ? b / gb + "GB" : b + "B";
    }
}
