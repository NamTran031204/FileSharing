package com.file.service.filesharingimagecodec.job;

import com.file.service.filesharingimagecodec.config.ImageProcessingConfig;
import com.file.service.filesharingimagecodec.consumer.dto.ImageJobMessage;
import com.file.service.filesharingimagecodec.enums.ProcessingJobStatus;
import com.file.service.filesharingimagecodec.enums.ProcessingJobType;
import com.file.service.filesharingimagecodec.job.queue.JobQueue;
import com.file.service.filesharingimagecodec.model.ProcessingJobConfig;
import com.file.service.filesharingimagecodec.model.ProcessingJobEntity;
import com.file.service.filesharingimagecodec.model.ProcessingJobProgress;
import com.file.service.filesharingimagecodec.model.ProcessingJobResult;
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
    private final ImageProcessingConfig config;

    /**
     * Create a new job if it doesn't already exist (idempotency).
     * @return true if new job was created, false if already exists.
     */
    public boolean createJobIfAbsent(ImageJobMessage message) {
        Optional<ProcessingJobEntity> existing = jobRepository.findById(message.getJobId());
        if (existing.isPresent()) {
            log.info("Job {} already exists with status {}, skipping duplicate",
                    message.getJobId(), existing.get().getStatus());
            return false;
        }

        ProcessingJobEntity job = ProcessingJobEntity.builder()
                .jobId(message.getJobId())
                .jobType(ProcessingJobType.GENERATE_THUMBNAILS)
                .status(ProcessingJobStatus.PENDING)
                .config(ProcessingJobConfig.builder()
                        .maxThumbnails(message.getThumbnailWidth() > 0 ? message.getThumbnailWidth() : 200)
                        .build())
                .progress(ProcessingJobProgress.builder()
                        .percent(0)
                        .currentStep("QUEUED")
                        .build())
                .retryCount(0)
                .maxRetries(config.getRetry().getMaxAttempts())
                .scheduledAt(message.getSubmittedAt() != null ? message.getSubmittedAt() : Instant.now())
                .build();

        job.setAssetId(message.getInputKey());
        job.setIsActive(true);

        jobRepository.save(job);
        log.info("Created new image job: {}", message.getJobId());
        return true;
    }

    public void markRunning(String jobId) {
        jobRepository.findById(jobId).ifPresent(job -> {
            job.setStatus(ProcessingJobStatus.PROCESSING);
            job.setStartedAt(Instant.now());
            job.setProgress(ProcessingJobProgress.builder()
                    .percent(0)
                    .currentStep("PROCESSING")
                    .build());
            job.setWorkerId(getWorkerId());
            job.setWorkerHeartbeat(Instant.now());
            jobRepository.save(job);
            log.info("Job {} marked as PROCESSING", jobId);
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

    public void markCompleted(String jobId, List<String> outputKeys, String primaryOutput) {
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
            log.info("Job {} marked as COMPLETED. Output: {}", jobId, primaryOutput);
        });
    }

    /**
     * Mark job failed with retry logic.
     * If retries remain, re-enqueue. Otherwise, permanent failure.
     */
    public void markFailed(String jobId, String error) {
        jobRepository.findById(jobId).ifPresent(job -> {
            int currentRetry = job.getRetryCount() != null ? job.getRetryCount() : 0;
            int maxRetries = job.getMaxRetries() != null ? job.getMaxRetries() : config.getRetry().getMaxAttempts();

            if (currentRetry + 1 < maxRetries) {
                job.setStatus(ProcessingJobStatus.PENDING);
                job.setRetryCount(currentRetry + 1);
                job.setLastError(error);
                job.setProgress(ProcessingJobProgress.builder()
                        .percent(0)
                        .currentStep("RETRY_PENDING")
                        .build());
                jobRepository.save(job);
                jobQueue.offer(jobId);
                log.warn("Job {} failed (attempt {}/{}), re-queued: {}",
                        jobId, currentRetry + 1, maxRetries, error);
            } else {
                markFailedPermanently(jobId, error);
            }
        });
    }

    /**
     * Mark job as permanently failed (no retry).
     * Used for corrupt input or deterministic errors.
     */
    public void markFailedPermanently(String jobId, String error) {
        jobRepository.findById(jobId).ifPresent(job -> {
            job.setStatus(ProcessingJobStatus.FAILED);
            job.setRetryCount((job.getRetryCount() != null ? job.getRetryCount() : 0) + 1);
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
            log.error("Job {} permanently FAILED: {}", jobId, error);
        });
    }

    public Optional<ProcessingJobEntity> findById(String jobId) {
        return jobRepository.findById(jobId);
    }

    /**
     * Recovery on startup: reset all PROCESSING jobs back to PENDING.
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
