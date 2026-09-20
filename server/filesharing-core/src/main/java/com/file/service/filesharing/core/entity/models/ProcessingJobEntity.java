package com.file.service.filesharing.core.entity.models;

import com.file.service.filesharing.core.entity.models.base.EntityAuditBase;
import com.file.service.filesharing.core.entity.models.processing.JobResourceUsage;
import com.file.service.filesharing.core.entity.models.processing.OutboxEvent;
import com.file.service.filesharing.core.entity.models.processing.ProcessingJobConfig;
import com.file.service.filesharing.core.entity.models.processing.ProcessingJobProgress;
import com.file.service.filesharing.core.entity.models.processing.ProcessingJobResult;
import com.file.service.filesharing.core.enums.ProcessingJobStatus;
import com.file.service.filesharing.core.enums.ProcessingJobType;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

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
    // Khoa sort cua JobClaimer: priority DESC, dueAt ASC (ADR-001 muc 4)
    private Integer priority;

    private ProcessingJobProgress progress;
    private ProcessingJobResult result;

    private Instant scheduledAt;
    private Instant startedAt;
    private Instant completedAt;

    // Som nhat duoc claim lai. Nen tang cua backoff (P1-01.b)
    private Instant dueAt;
    // Het han thi job coi nhu mo coi, LeaseReaper thu hoi (P1-01.b)
    private Instant leaseUntil;
    // Dinh danh 1 lan thu, dung de bo ket qua cua lan thu cu (P1-01.d, P1-02.d)
    private String attemptId;
    // Noi log/trace xuyen service (P1-02.d)
    private String traceId;

    private Integer retryCount;
    private Integer maxRetries;
    private String lastError;

    private String workerId;
    private Instant workerHeartbeat;

    // Event cho phat, nhung trong chinh document nay (ADR-001 QD-2)
    private List<OutboxEvent> outbox;
    // CPU/RSS dinh diem va trung binh, P1-03.c do vao
    private JobResourceUsage resourceUsage;
}