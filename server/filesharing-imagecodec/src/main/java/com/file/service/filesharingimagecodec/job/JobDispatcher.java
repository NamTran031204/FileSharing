package com.file.service.filesharingimagecodec.job;

import com.file.service.filesharingimagecodec.job.queue.JobQueue;
import com.file.service.filesharingimagecodec.vips.ImageJobExecutor;
import io.github.resilience4j.bulkhead.Bulkhead;
import io.github.resilience4j.bulkhead.BulkheadRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Polls the JobQueue every 500ms and dispatches jobs to ImageJobExecutor
 * when a Bulkhead slot is available. Jobs run on Virtual Threads.
 */
@Component
@Slf4j
public class JobDispatcher {

    private final JobQueue jobQueue;
    private final Bulkhead bulkhead;
    private final ImageJobExecutor imageJobExecutor;

    public JobDispatcher(JobQueue jobQueue,
                         BulkheadRegistry bulkheadRegistry,
                         ImageJobExecutor imageJobExecutor) {
        this.jobQueue = jobQueue;
        this.bulkhead = bulkheadRegistry.bulkhead("image-processor");
        this.imageJobExecutor = imageJobExecutor;
    }

    @Scheduled(fixedDelay = 500)
    public void dispatch() {
        int availableSlots = bulkhead.getMetrics().getAvailableConcurrentCalls();
        if (availableSlots <= 0) {
            return;
        }

        String jobId = jobQueue.poll();
        if (jobId == null) {
            return;
        }

        boolean permitted = bulkhead.tryAcquirePermission();
        if (!permitted) {
            jobQueue.putFirst(jobId);
            log.debug("Bulkhead full, returning job {} to queue head", jobId);
            return;
        }

        Thread.ofVirtual()
                .name("image-proc-" + jobId)
                .start(() -> {
                    try {
                        log.info("Dispatching image job {} to executor", jobId);
                        imageJobExecutor.execute(jobId);
                    } catch (Exception e) {
                        log.error("Unhandled error executing image job {}: {}", jobId, e.getMessage(), e);
                    } finally {
                        bulkhead.releasePermission();
                    }
                });
    }
}
