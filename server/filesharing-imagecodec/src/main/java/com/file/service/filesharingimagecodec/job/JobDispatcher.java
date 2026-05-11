package com.file.service.filesharingimagecodec.job;

import com.file.service.filesharingimagecodec.job.queue.JobQueue;
import com.file.service.filesharingimagecodec.vips.ImageJobExecutor;
import io.github.resilience4j.bulkhead.Bulkhead;
import io.github.resilience4j.bulkhead.BulkheadRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * thăm dò JobQueue mỗi 500ms và phân phối các job tới ImageJobExecutor
 * khi có một khe Bulkhead trống. các job chạy trên Virtual Threads.
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
            log.debug("Bulkhead da day, tra job {} ve dau hang doi", jobId);
            return;
        }

        Thread.ofVirtual()
                .name("image-proc-" + jobId)
                .start(() -> {
                    try {
                        log.info("dang phan phoi job anh {} cho trinh thuc thi", jobId);
                        imageJobExecutor.execute(jobId);
                    } catch (Exception e) {
                        log.error("loi khong duoc xu ly khi thuc thi job anh {}: {}", jobId, e.getMessage(), e);
                    } finally {
                        bulkhead.releasePermission();
                    }
                });
    }
}
