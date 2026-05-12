package org.example.filesharing.entities.models.core;

import lombok.*;
import org.example.filesharing.entities.models.ProcessingJobConfig;
import org.example.filesharing.entities.models.ProcessingJobProgress;
import org.example.filesharing.entities.models.ProcessingJobResult;
import org.example.filesharing.entities.models.core.base.EntityAuditBase;
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

    private Integer versionNumber;
    private String assetId;

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