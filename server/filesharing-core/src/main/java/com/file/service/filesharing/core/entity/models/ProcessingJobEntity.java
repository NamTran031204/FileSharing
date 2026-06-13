package com.file.service.filesharing.core.entity.models;

import com.file.service.filesharing.core.entity.models.base.EntityAuditBase;
import com.file.service.filesharing.core.entity.models.processing.ProcessingJobConfig;
import com.file.service.filesharing.core.entity.models.processing.ProcessingJobProgress;
import com.file.service.filesharing.core.entity.models.processing.ProcessingJobResult;
import com.file.service.filesharing.core.enums.ProcessingJobStatus;
import com.file.service.filesharing.core.enums.ProcessingJobType;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "processing_jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class ProcessingJobEntity extends EntityAuditBase {
    @Id
    private String jobId;

    private String metadataId;
    private Integer versionNumber;
    private String assetId;

    private String objectName;

    private ProcessingJobType jobType;
    private ProcessingJobConfig config;

    private ProcessingJobStatus status;
    private Integer priority;

    private ProcessingJobProgress progress;
    private ProcessingJobResult result;

    private Instant scheduledAt;
    private Instant startedAt;
    private Instant completedAt;

    private Integer retryCount;
    private Integer maxRetries;
    private String lastError;

    private String workerId;
    private Instant workerHeartbeat;
}