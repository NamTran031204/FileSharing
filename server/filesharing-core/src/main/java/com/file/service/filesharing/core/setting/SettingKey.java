package com.file.service.filesharing.core.setting;

import static com.file.service.filesharing.core.setting.SettingApply.LIVE;
import static com.file.service.filesharing.core.setting.SettingApply.RESTART;
import static com.file.service.filesharing.core.setting.SettingGroup.*;
import static com.file.service.filesharing.core.setting.SettingType.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Danh muc setting (catalogue) cua he thong. Gia tri mac dinh la gia tri hien hanh o
 * application.yml cac module va hang so trong code, nen khong co override thi hanh vi khong doi.
 * Min/max: INT/LONG theo gia tri, DURATION theo giay, DATA_SIZE theo byte; null = khong gioi han.
 */
public enum SettingKey {
    // APP
    APP_FRONTEND_BASE_URL("app.frontend-base-url", APP, URL, "http://localhost:5173", LIVE),
    SECURITY_CORS_ALLOWED_ORIGINS("security.cors.allowed-origins", APP, STRING_LIST, "http://localhost:5173", LIVE),

    // AUTH
    AUTH_JWT_ACCESS_TTL("auth.jwt.access-ttl", AUTH, DURATION, "24h", LIVE, 60, 2_592_000),
    AUTH_JWT_REFRESH_TTL("auth.jwt.refresh-ttl", AUTH, DURATION, "7d", LIVE, 3600, 31_536_000),

    // UPLOAD
    UPLOAD_MAX_FILE_SIZE("upload.max-file-size", UPLOAD, DATA_SIZE, "50GB", LIVE, 1, 5_497_558_138_880L),
    UPLOAD_PART_URL_TTL("upload.part-url-ttl", UPLOAD, DURATION, "900s", LIVE, 60, 43_200),
    UPLOAD_MAX_THREADS("upload.max-threads", UPLOAD, INT, "6", LIVE, 1, 6),
    UPLOAD_SESSION_IDLE_TTL("upload.session-idle-ttl", UPLOAD, DURATION, "24h", LIVE, 60, 2_592_000),
    UPLOAD_MAX_SESSIONS_PER_USER("upload.max-sessions-per-user", UPLOAD, INT, "20", LIVE, 1, 1000),
    UPLOAD_VERIFY_ETAG_MD5("upload.verify-etag-md5", UPLOAD, BOOL, "true", LIVE),
    UPLOAD_SESSION_HARD_EXPIRY("upload.session-hard-expiry", UPLOAD, DURATION, "7d", LIVE, 3600, 2_592_000),
    UPLOAD_INITIAL_URL_BATCH("upload.initial-url-batch", UPLOAD, INT, "20", LIVE, 1, 50),
    UPLOAD_RECONCILE_ORPHAN_MIN_AGE("upload.reconcile.orphan-min-age", UPLOAD, DURATION, "24h", LIVE, 60, 2_592_000),
    UPLOAD_RECONCILE_SUBMIT_WINDOW("upload.reconcile.submit-window", UPLOAD, DURATION, "48h", LIVE, 60, 2_592_000),
    UPLOAD_GC_INTERVAL("upload.gc-interval", UPLOAD, DURATION, "900s", RESTART, 10, 86_400),
    UPLOAD_RECONCILE_INTERVAL("upload.reconcile-interval", UPLOAD, DURATION, "24h", RESTART, 60, 2_592_000),

    // DOWNLOAD
    DOWNLOAD_URL_TTL_MIN("download.url-ttl-min", DOWNLOAD, DURATION, "900s", LIVE, 60, 604_800),
    DOWNLOAD_URL_TTL_MAX("download.url-ttl-max", DOWNLOAD, DURATION, "4h", LIVE, 60, 604_800),

    // PROOF
    PROOF_MAX_NAME_LENGTH("proof.max-name-length", PROOF, INT, "100", LIVE, 1, 1000),
    PROOF_MAX_NOTE_LENGTH("proof.max-note-length", PROOF, INT, "1000", LIVE, 1, 10_000),
    PROOF_MAX_SUBMIT_ASSETS("proof.max-submit-assets", PROOF, INT, "5000", LIVE, 1, 100_000),
    PROOF_MAX_PAGE_SIZE("proof.max-page-size", PROOF, INT, "100", LIVE, 1, 1000),
    PROOF_PREVIEW_URL_TTL("proof.preview-url-ttl", PROOF, DURATION, "3600s", LIVE, 60, 604_800),

    // DASHBOARD
    DASHBOARD_RECENT_DEFAULT_LIMIT("dashboard.recent-default-limit", DASHBOARD, INT, "10", LIVE, 1, 100),
    DASHBOARD_RECENT_MAX_LIMIT("dashboard.recent-max-limit", DASHBOARD, INT, "50", LIVE, 1, 500),

    // RETENTION (ap dung bang collMod luc khoi dong)
    RETENTION_PROCESSING_JOBS("retention.processing-jobs", RETENTION, DURATION, "30d", RESTART, 3600, 31_536_000),
    RETENTION_UPLOAD_SESSIONS("retention.upload-sessions", RETENTION, DURATION, "48h", RESTART, 3600, 31_536_000),

    // JOB
    JOB_MAX_RETRIES("job.max-retries", JOB, INT, "3", LIVE, 0, 20),
    JOB_BACKOFF_BASE("job.backoff-base", JOB, DURATION, "30s", LIVE, 1, 86_400),
    JOB_BACKOFF_MAX("job.backoff-max", JOB, DURATION, "30m", LIVE, 1, 86_400),
    JOB_PRESIGN_TTL("job.presign-ttl", JOB, DURATION, "4h", LIVE, 60, 604_800),
    JOB_UPLOAD_BATCH_SIZE("job.upload-batch-size", JOB, INT, "15", LIVE, 1, 100),
    JOB_WORKSPACE_CLEANUP_AGE("job.workspace-cleanup-age", JOB, DURATION, "24h", LIVE, 60, 2_592_000),
    JOB_LEASE_DURATION("job.lease-duration", JOB, DURATION, "30s", RESTART, 5, 3600),
    JOB_POLL_INTERVAL("job.poll-interval", JOB, DURATION, "1s", RESTART, 1, 3600),
    JOB_REAPER_INTERVAL("job.reaper-interval", JOB, DURATION, "15s", RESTART, 1, 3600),
    JOB_RELAY_INTERVAL("job.relay-interval", JOB, DURATION, "1s", RESTART, 1, 3600),
    JOB_RELAY_LEASE("job.relay-lease", JOB, DURATION, "30s", LIVE, 5, 3600),

    // WORKER (bulkhead; tran theo so core cua node kiem o tang service)
    WORKER_BULKHEAD_FFMPEG_ENCODER_MAX_CONCURRENT("worker.bulkhead.ffmpeg-encoder.max-concurrent", WORKER, INT, "2", LIVE, 1, 64),
    WORKER_BULKHEAD_IMAGE_PROCESSOR_MAX_CONCURRENT("worker.bulkhead.image-processor.max-concurrent", WORKER, INT, "3", LIVE, 1, 64),
    WORKER_BULKHEAD_RAW_PROCESSOR_MAX_CONCURRENT("worker.bulkhead.raw-processor.max-concurrent", WORKER, INT, "2", LIVE, 1, 64),

    // VIDEO
    VIDEO_TIMEOUT("video.timeout", VIDEO, DURATION, "1h", LIVE, 10, 86_400),
    VIDEO_PROBE_TIMEOUT("video.probe-timeout", VIDEO, DURATION, "60s", LIVE, 1, 3600),
    VIDEO_THREADS_PER_PROCESS("video.threads-per-process", VIDEO, INT, "2", LIVE, 1, 64),
    VIDEO_CRF("video.crf", VIDEO, INT, "23", LIVE, 0, 51),
    VIDEO_PRESET("video.preset", VIDEO, ENUM, "medium", LIVE,
            "ultrafast,superfast,veryfast,faster,fast,medium,slow,slower,veryslow"),
    VIDEO_SEGMENT_DURATION("video.segment-duration", VIDEO, INT, "6", LIVE, 1, 60),
    VIDEO_AUDIO_BITRATE("video.audio-bitrate", VIDEO, STRING, "128k", LIVE),

    // IMAGE
    IMAGE_PROCESSING_TIMEOUT("image.processing-timeout", IMAGE, DURATION, "30s", LIVE, 1, 3600),
    IMAGE_MAX_PIXELS("image.max-pixels", IMAGE, LONG, "50000000", LIVE, 1, 1_000_000_000L),
    IMAGE_VIPS_CONCURRENCY("image.vips-concurrency", IMAGE, INT, "2", LIVE, 1, 64),
    IMAGE_ALLOWED_LOADERS("image.allowed-loaders", IMAGE, STRING_LIST,
            "jpegload,pngload,webpload,gifload,tiffload,heifload", LIVE),
    IMAGE_WEBP_QUALITY("image.webp-quality", IMAGE, INT, "82", LIVE, 1, 100),
    IMAGE_WEBP_EFFORT("image.webp-effort", IMAGE, INT, "6", LIVE, 0, 6),
    IMAGE_THUMBNAIL_WIDTH("image.thumbnail-width", IMAGE, INT, "200", LIVE, 16, 2000),
    IMAGE_PREVIEW_MAX_EDGE("image.preview-max-edge", IMAGE, INT, "2560", LIVE, 256, 8192),

    // RAW
    RAW_COMMAND_TIMEOUT("raw.command-timeout", RAW, DURATION, "30s", LIVE, 1, 3600),
    RAW_LOCK_WAIT("raw.lock-wait", RAW, DURATION, "60s", LIVE, 1, 3600),

    // MAIL: username/password lay tu env cu (GMAIL_USERNAME, GMAIL_APP_PASSWORD) khi chua co override
    MAIL_HOST("mail.host", MAIL, STRING, "smtp.gmail.com", LIVE),
    MAIL_PORT("mail.port", MAIL, INT, "587", LIVE, 1, 65_535),
    MAIL_USERNAME("mail.username", MAIL, STRING, "", LIVE, false, "GMAIL_USERNAME", null),
    MAIL_PASSWORD("mail.password", MAIL, STRING, "", LIVE, true, "GMAIL_APP_PASSWORD", null),
    MAIL_AUTH("mail.auth", MAIL, BOOL, "true", LIVE),
    MAIL_STARTTLS("mail.starttls", MAIL, BOOL, "true", LIVE),
    MAIL_CONNECTION_TIMEOUT("mail.connection-timeout", MAIL, DURATION, "10s", LIVE, 1, 600),
    MAIL_TIMEOUT("mail.timeout", MAIL, DURATION, "10s", LIVE, 1, 600),
    MAIL_WRITE_TIMEOUT("mail.write-timeout", MAIL, DURATION, "10s", LIVE, 1, 600),
    // mac dinh = mail.username khi trong
    MAIL_FROM_ADDRESS("mail.from-address", MAIL, STRING, "", LIVE, false, null, "mail.username"),
    MAIL_FROM_NAME("mail.from-name", MAIL, STRING, "File Sharing Service", LIVE);

    private static final Map<String, SettingKey> BY_KEY =
            Arrays.stream(values()).collect(Collectors.toUnmodifiableMap(SettingKey::key, Function.identity()));

    private final String key;
    private final SettingGroup group;
    private final SettingType type;
    private final String defaultValue;
    private final SettingApply apply;
    private final Long min;
    private final Long max;
    private final List<String> options;
    private final boolean secret;
    private final String envFallback;
    private final String fallbackKey;

    SettingKey(String key, SettingGroup group, SettingType type, String defaultValue, SettingApply apply) {
        this(key, group, type, defaultValue, apply, null, null, List.of(), false, null, null);
    }

    SettingKey(String key, SettingGroup group, SettingType type, String defaultValue, SettingApply apply,
               long min, long max) {
        this(key, group, type, defaultValue, apply, min, max, List.of(), false, null, null);
    }

    /** ENUM: options cach nhau dau phay */
    SettingKey(String key, SettingGroup group, SettingType type, String defaultValue, SettingApply apply,
               String options) {
        this(key, group, type, defaultValue, apply, null, null, List.of(options.split(",")), false, null, null);
    }

    SettingKey(String key, SettingGroup group, SettingType type, String defaultValue, SettingApply apply,
               boolean secret, String envFallback, String fallbackKey) {
        this(key, group, type, defaultValue, apply, null, null, List.of(), secret, envFallback, fallbackKey);
    }

    SettingKey(String key, SettingGroup group, SettingType type, String defaultValue, SettingApply apply,
               Long min, Long max, List<String> options, boolean secret, String envFallback, String fallbackKey) {
        this.key = key;
        this.group = group;
        this.type = type;
        this.defaultValue = defaultValue;
        this.apply = apply;
        this.min = min;
        this.max = max;
        this.options = options;
        this.secret = secret;
        this.envFallback = envFallback;
        this.fallbackKey = fallbackKey;
    }

    public String key() { return key; }
    public SettingGroup group() { return group; }
    public SettingType type() { return type; }
    public String defaultValue() { return defaultValue; }
    public SettingApply apply() { return apply; }
    public Long min() { return min; }
    public Long max() { return max; }
    public List<String> options() { return options; }
    public boolean secret() { return secret; }
    /** ten bien moi truong cu dung lam mac dinh, chi doc trong bo nho, khong ghi DB */
    public String envFallback() { return envFallback; }
    /** key khac dung lam mac dinh khi khong co override va gia tri mac dinh trong */
    public String fallbackKey() { return fallbackKey; }

    public static SettingKey of(String key) {
        return BY_KEY.get(key);
    }

    /** key bulkhead cua worker theo ten bulkhead, null neu khong co */
    public static SettingKey forBulkhead(String bulkheadName) {
        return of("worker.bulkhead." + bulkheadName + ".max-concurrent");
    }
}
