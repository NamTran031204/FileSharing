package com.file.service.filesharing.core.job;

import com.file.service.filesharing.core.enums.ProcessingJobType;
import com.file.service.filesharing.core.setting.RuntimeSettings;
import com.file.service.filesharing.core.setting.SettingKey;
import lombok.AccessLevel;
import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Data
@ConfigurationProperties("job-runtime")
public class JobRuntimeProperties {
    private boolean enabled = false;
    private List<ProcessingJobType> jobTypes = new ArrayList<>();
    private Duration pollInterval = Duration.ofSeconds(1);
    private Duration leaseDuration = Duration.ofSeconds(30);
    // Phai <= leaseDuration de job mo coi quay lai trong <= 2x lease
    private Duration reaperInterval = Duration.ofSeconds(15);
    private String bulkheadName;
    private int maxRetries = 3;
    private Duration backoffBase = Duration.ofSeconds(30);
    private Duration backoffMax = Duration.ofMinutes(30);
    private int uploadBatchSize = 15;
    private String workspaceDir = System.getProperty("java.io.tmpdir") + "/job-runtime";
    private String inputBucket = "file-sharing";
    private Duration presignTtl = Duration.ofHours(4);
    // Mac dinh cua workspace-cleanup-age khi khong co RuntimeSettings (test)
    private Duration workspaceCleanupAge = Duration.ofHours(24);
    private Doorbell doorbell = new Doorbell();

    // Nguon setting dong (system_settings); null thi dung gia tri bind tu yml/mac dinh o tren
    @Getter(AccessLevel.NONE)
    @Setter(AccessLevel.NONE)
    private RuntimeSettings settings;

    public void attach(RuntimeSettings settings) {
        this.settings = settings;
    }

    // Cac key LIVE doc qua getter de doi setting co hieu luc khong can restart.
    // Key RESTART (lease-duration, poll-interval, reaper-interval) giu nguyen gia tri bind luc khoi dong.
    public int getMaxRetries() {
        return settings == null ? maxRetries : settings.intValue(SettingKey.JOB_MAX_RETRIES);
    }

    public Duration getBackoffBase() {
        return settings == null ? backoffBase : settings.duration(SettingKey.JOB_BACKOFF_BASE);
    }

    public Duration getBackoffMax() {
        return settings == null ? backoffMax : settings.duration(SettingKey.JOB_BACKOFF_MAX);
    }

    public Duration getPresignTtl() {
        return settings == null ? presignTtl : settings.duration(SettingKey.JOB_PRESIGN_TTL);
    }

    public int getUploadBatchSize() {
        return settings == null ? uploadBatchSize : settings.intValue(SettingKey.JOB_UPLOAD_BATCH_SIZE);
    }

    public Duration getWorkspaceCleanupAge() {
        return settings == null ? workspaceCleanupAge : settings.duration(SettingKey.JOB_WORKSPACE_CLEANUP_AGE);
    }

    /** Anh chup cac key LIVE o dau moi job, de gia tri khong doi giua chung */
    public record Snapshot(int maxRetries, Duration backoffBase, Duration backoffMax, Duration presignTtl,
                           int uploadBatchSize) {
    }

    public Snapshot snapshot() {
        return new Snapshot(getMaxRetries(), getBackoffBase(), getBackoffMax(), getPresignTtl(), getUploadBatchSize());
    }

    @Data
    public static class Doorbell {
        private boolean enabled = true;
    }
}
