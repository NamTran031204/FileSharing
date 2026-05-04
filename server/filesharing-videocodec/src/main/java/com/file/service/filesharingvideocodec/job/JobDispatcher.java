package com.file.service.filesharingvideocodec.job;

import com.file.service.filesharingvideocodec.ffmpeg.FfmpegExecutor;
import com.file.service.filesharingvideocodec.job.queue.JobQueue;
import io.github.resilience4j.bulkhead.Bulkhead;
import io.github.resilience4j.bulkhead.BulkheadRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Polls the JobQueue every 500ms and dispatches jobs to FfmpegExecutor
 * when a Bulkhead slot is available. Jobs run on Virtual Threads.
 */
@Component
@Slf4j
public class JobDispatcher {

    private final JobQueue jobQueue;
    private final Bulkhead bulkhead;
    private final FfmpegExecutor ffmpegExecutor;

    public JobDispatcher(JobQueue jobQueue,
                         BulkheadRegistry bulkheadRegistry,
                         FfmpegExecutor ffmpegExecutor) {
        this.jobQueue = jobQueue;
        this.bulkhead = bulkheadRegistry.bulkhead("ffmpeg-encoder");
        this.ffmpegExecutor = ffmpegExecutor;
    }

    @Scheduled(fixedDelay = 500)
    public void dispatch() {
        // Check if there are available slots
        int availableSlots = bulkhead.getMetrics().getAvailableConcurrentCalls();
        if (availableSlots <= 0) {
            return;
        }

        String jobId = jobQueue.poll();
        if (jobId == null) {
            return;  // Queue is empty
        }

        // Try to acquire a Bulkhead permit
        boolean permitted = bulkhead.tryAcquirePermission();
        if (!permitted) {
            // Bulkhead full — put job back at head of queue
            jobQueue.putFirst(jobId);
            log.debug("Bulkhead full, returning job {} to queue head", jobId);
            return;
        }

        // Spawn Virtual Thread for the encoding job
        Thread.ofVirtual()
                .name("encoder-" + jobId)
                .start(() -> {
                    try {
                        log.info("Dispatching job {} to FFmpeg executor", jobId);
                        ffmpegExecutor.execute(jobId);
                    } catch (Exception e) {
                        log.error("Unhandled error executing job {}: {}", jobId, e.getMessage(), e);
                    } finally {
                        bulkhead.releasePermission();
                    }
                });
    }
}
