package com.file.service.filesharingcore.entity.models;

import lombok.*;
import org.example.filesharing.entities.models.base.EntityAuditBase;
import org.example.filesharing.entities.models.processing.ProcessingJobConfig;
import org.example.filesharing.entities.models.processing.ProcessingJobProgress;
import org.example.filesharing.entities.models.processing.ProcessingJobResult;
import org.example.filesharing.enums.ProcessingJobStatus;
import org.example.filesharing.enums.ProcessingJobType;
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