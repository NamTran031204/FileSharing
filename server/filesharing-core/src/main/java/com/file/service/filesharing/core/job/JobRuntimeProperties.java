package com.file.service.filesharing.core.job;

import com.file.service.filesharing.core.enums.ProcessingJobType;
import lombok.Data;
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
    private Doorbell doorbell = new Doorbell();

    @Data
    public static class Doorbell {
        private boolean enabled = true;
    }
}
