package com.file.service.filesharing.core.job.relay;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.file.service.filesharing.core.entity.models.ProcessingJobEntity;
import com.file.service.filesharing.core.enums.ProcessingJobStatus;
import com.file.service.filesharing.core.job.JobRuntimeProperties;
import com.file.service.filesharing.core.job.JobStore;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;

import java.util.concurrent.TimeUnit;

/**
 * Status-as-outbox: job da ket thuc ma resultPublishedAt = null thi relay gui JobResultMessage len Kafka
 * roi moi danh dau da gui. Kafka chet thi ban ghi nam lai, gui bu khi Kafka song lai. Gui it nhat 1 lan.
 */
@Slf4j
public class JobResultRelay {
    private static final int BATCH = 50;

    private final JobStore store;
    private final KafkaTemplate<String, String> kafka;
    private final ObjectMapper mapper;
    private final OutboxRelayProperties props;
    private final JobRuntimeProperties runtimeProps;

    public JobResultRelay(JobStore store, KafkaTemplate<String, String> kafka, ObjectMapper mapper,
                          OutboxRelayProperties props, JobRuntimeProperties runtimeProps) {
        this.store = store;
        this.kafka = kafka;
        this.mapper = mapper;
        this.props = props;
        this.runtimeProps = runtimeProps;
    }

    @Scheduled(fixedDelayString = "${outbox-relay.interval:1s}")
    public void publishPending() {
        for (int i = 0; i < BATCH; i++) {
            ProcessingJobEntity job;
            try {
                job = store.claimUnpublishedResult(runtimeProps.getJobTypes(), props.getLease());
            } catch (Exception e) {
                log.error("relay khong claim duoc ket qua: {}", e.getMessage());
                return;
            }
            if (job == null) return;
            try {
                String json = mapper.writeValueAsString(toMessage(job));
                String key = job.getMetadataId() != null ? job.getMetadataId() : job.getJobId();
                kafka.send(props.getTopic(), key, json).get(5, TimeUnit.SECONDS);
                store.markResultPublished(job.getJobId());
                log.info("publish ket qua job={} attempt={} status={}", job.getJobId(), job.getAttemptId(), job.getStatus());
            } catch (Exception e) {
                // Giu nguyen resultPublishedAt = null, lease het han se gui lai
                log.warn("publish ket qua job={} loi, se gui lai sau khi lease het han: {}", job.getJobId(), e.getMessage());
                return;
            }
        }
    }

    static JobResultMessage toMessage(ProcessingJobEntity job) {
        boolean ok = job.getStatus() == ProcessingJobStatus.COMPLETED;
        var r = job.getResult();
        return JobResultMessage.builder()
                .jobId(job.getJobId()).attemptId(job.getAttemptId()).jobType(job.getJobType())
                .metadataId(job.getMetadataId()).assetId(job.getAssetId())
                .status(ok ? JobResultStatus.SUCCEEDED : JobResultStatus.FAILED)
                .outputKeys(r == null ? null : r.getOutputKeys())
                .manifestKey(r == null ? null : r.getManifestKey())
                .thumbnailUrl(r == null ? null : r.getThumbnailUrl())
                .errorMessage(ok ? null : job.getLastError())
                .finishedAt(job.getCompletedAt())
                .build();
    }
}
