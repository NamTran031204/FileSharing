package com.file.service.filesharingimagecodec.model;

import com.file.service.filesharingimagecodec.enums.ProcessingJobStatus;
import com.file.service.filesharingimagecodec.enums.ProcessingJobType;
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