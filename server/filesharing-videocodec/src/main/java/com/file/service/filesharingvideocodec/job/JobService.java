package com.file.service.filesharingvideocodec.job;

import com.file.service.filesharingvideocodec.config.VideoEncodingConfig;
import com.file.service.filesharingvideocodec.consumer.dto.EncodeRequestMessage;
import com.file.service.filesharingvideocodec.enums.ProcessingJobStatus;
import com.file.service.filesharingvideocodec.enums.ProcessingJobType;
import com.file.service.filesharingvideocodec.job.queue.JobQueue;
import com.file.service.filesharingvideocodec.kafka.EncodeResultProducer;
import com.file.service.filesharingvideocodec.kafka.dto.EncodeResultMessage;
import com.file.service.filesharingvideocodec.model.ProcessingJobConfig;
import com.file.service.filesharingvideocodec.model.ProcessingJobEntity;
import com.file.service.filesharingvideocodec.model.ProcessingJobProgress;
import com.file.service.filesharingvideocodec.model.ProcessingJobResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final JobQueue jobQueue;
    private final VideoEncodingConfig encodingConfig;
    private final EncodeResultProducer encodeResultProducer;

    /**
     * Create a new job if it doesn't already exist (idempotency).
     * @return true if new job was created, false if already exists.
     */
    public boolean createJobIfAbsent(EncodeRequestMessage message) {
        Optional<ProcessingJobEntity> existing = jobRepository.findById(message.getJobId());
        if (existing.isPresent()) {
            log.info("Job {} already exists with status {}, skipping duplicate",
                    message.getJobId(), existing.get().getStatus());
            return false;
        }

        ProcessingJobEntity job = ProcessingJobEntity.builder()
                .jobId(message.getJobId())
                .jobType(ProcessingJobType.TRANSCODE_HLS)
                .status(ProcessingJobStatus.PENDING)
                .config(ProcessingJobConfig.builder()
                        .profiles(encodingConfig.getProfiles())
                        .build())
                .progress(ProcessingJobProgress.builder()
                        .percent(0)
                        .currentStep("QUEUED")
                        .build())
                .retryCount(0)
                .maxRetries(encodingConfig.getRetry().getMaxAttempts())
                .scheduledAt(message.getSubmittedAt() != null ? message.getSubmittedAt() : Instant.now())
                .build();

        // Store inputKey in assetId field for retrieval later
        job.setAssetId(message.getInputKey());
        job.setIsActive(true);

        jobRepository.save(job);
        log.info("Created new job: {}", message.getJobId());
        return true;
    }

    public void markRunning(String jobId) {
        jobRepository.findById(jobId).ifPresent(job -> {
            job.setStatus(ProcessingJobStatus.PROCESSING);
            job.setStartedAt(Instant.now());
            job.setProgress(ProcessingJobProgress.builder()
                    .percent(0)
                    .currentStep("ENCODING")
                    .build());
            job.setWorkerId(getWorkerId());
            job.setWorkerHeartbeat(Instant.now());
            jobRepository.save(job);
            log.info("Job {} marked as PROCESSING", jobId);

            encodeResultProducer.sendResult(EncodeResultMessage.builder()
                    .jobId(jobId)
                    .status(ProcessingJobStatus.PROCESSING.name())
                    .startedAt(job.getStartedAt())
                    .build());
        });
    }

    public void updateProgress(String jobId, int percent, String currentStep) {
        jobRepository.findById(jobId).ifPresent(job -> {
            job.setProgress(ProcessingJobProgress.builder()
                    .percent(percent)
                    .currentStep(currentStep)
                    .build());
            job.setWorkerHeartbeat(Instant.now());
            jobRepository.save(job);
        });
    }

    public void markCompleted(String jobId, List<String> outputKeys, String playlistUrl) {
        jobRepository.findById(jobId).ifPresent(job -> {
            job.setStatus(ProcessingJobStatus.COMPLETED);
            job.setCompletedAt(Instant.now());
            job.setProgress(ProcessingJobProgress.builder()
                    .percent(100)
                    .currentStep("COMPLETED")
                    .build());
            job.setResult(ProcessingJobResult.builder()
                    .success(true)
                    .outputKeys(outputKeys)
                    .build());
            jobRepository.save(job);
            log.info("Job {} marked as COMPLETED. Playlist: {}", jobId, playlistUrl);

                encodeResultProducer.sendResult(EncodeResultMessage.builder()
                    .jobId(jobId)
                    .status(ProcessingJobStatus.COMPLETED.name())
                    .playlistKey(playlistUrl)
                    .outputKeys(outputKeys)
                    .completedAt(job.getCompletedAt())
                    .build());
        });
    }

    public void markFailed(String jobId, String error) {
        jobRepository.findById(jobId).ifPresent(job -> {
            int currentRetry = job.getRetryCount() != null ? job.getRetryCount() : 0;
            int maxRetries = job.getMaxRetries() != null ? job.getMaxRetries() : encodingConfig.getRetry().getMaxAttempts();

            if (currentRetry + 1 < maxRetries) {
                // Still has retries left — put back to PENDING
                job.setStatus(ProcessingJobStatus.PENDING);
                job.setRetryCount(currentRetry + 1);
                job.setLastError(error);
                job.setProgress(ProcessingJobProgress.builder()
                        .percent(0)
                        .currentStep("RETRY_PENDING")
                        .build());
                jobRepository.save(job);

                // Re-enqueue for retry
                jobQueue.offer(jobId);
                log.warn("Job {} failed (attempt {}/{}), re-queued for retry: {}",
                        jobId, currentRetry + 1, maxRetries, error);
            } else {
                // No more retries — permanent failure
                job.setStatus(ProcessingJobStatus.FAILED);
                job.setRetryCount(currentRetry + 1);
                job.setLastError(error);
                job.setCompletedAt(Instant.now());
                job.setProgress(ProcessingJobProgress.builder()
                        .percent(0)
                        .currentStep("FAILED")
                        .build());
                job.setResult(ProcessingJobResult.builder()
                        .success(false)
                        .errorMessage(error)
                        .build());
                jobRepository.save(job);
                log.error("Job {} permanently FAILED after {} attempts: {}", jobId, maxRetries, error);

                encodeResultProducer.sendResult(EncodeResultMessage.builder()
                    .jobId(jobId)
                    .status(ProcessingJobStatus.FAILED.name())
                    .errorMessage(error)
                    .completedAt(job.getCompletedAt())
                    .build());
            }
        });
    }

    public Optional<ProcessingJobEntity> findById(String jobId) {
        return jobRepository.findById(jobId);
    }

    /**
     * Recovery on startup: reset all PROCESSING jobs back to PENDING.
     * These jobs were running when JVM crashed and need to be re-encoded.
     */
    @EventListener(ApplicationReadyEvent.class)
    public void recoverRunningJobs() {
        List<ProcessingJobEntity> stuckJobs = jobRepository.findAllByStatus(ProcessingJobStatus.PROCESSING);
        if (stuckJobs.isEmpty()) {
            log.info("No stuck jobs found during startup recovery");
            return;
        }

        log.warn("Found {} stuck PROCESSING jobs, resetting to PENDING", stuckJobs.size());
        for (ProcessingJobEntity job : stuckJobs) {
            job.setStatus(ProcessingJobStatus.PENDING);
            job.setProgress(ProcessingJobProgress.builder()
                    .percent(0)
                    .currentStep("RECOVERED")
                    .build());
            jobRepository.save(job);
            jobQueue.offer(job.getJobId());
            log.info("Recovered job {} → PENDING, re-enqueued", job.getJobId());
        }
    }

    private String getWorkerId() {
        return "worker-" + ProcessHandle.current().pid();
    }
}
