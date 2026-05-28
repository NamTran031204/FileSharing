package com.file.service.filesharingimagecodec.job;

import com.file.service.filesharingimagecodec.model.ProcessingJobEntity;
import com.file.service.filesharingimagecodec.vips.ImageJobExecutor;
import io.github.resilience4j.bulkhead.Bulkhead;
import io.github.resilience4j.bulkhead.BulkheadRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 5s kiểm tra slot còn lại trong bulkhead, nếu còn slots thì chiếm slots rồi chọc xuống db 1 lần để lấy ra job đã được lên lịch
 * nếu db không trả về job, free slots đó
 */
@Component
@Slf4j
public class JobDispatcher {

    private final Bulkhead bulkhead;
    private final ImageJobExecutor imageJobExecutor;
    private final JobService jobService;

    public JobDispatcher(BulkheadRegistry bulkheadRegistry,
                         ImageJobExecutor imageJobExecutor,
                         JobService jobService) {
        this.bulkhead = bulkheadRegistry.bulkhead("image-processor");
        this.imageJobExecutor = imageJobExecutor;
        this.jobService = jobService;
    }

    @Scheduled(fixedDelay = 5000)
    public void dispatch() {
        int availableSlots = bulkhead.getMetrics().getAvailableConcurrentCalls();
        if (availableSlots <= 0) {
            return;
        }

        while (bulkhead.tryAcquirePermission()) {
            ProcessingJobEntity job = jobService.setProcessingJob();

            if (job == null) {
                bulkhead.releasePermission();  // không có job, trả slot lại
                break;
            }

            Thread.ofVirtual()
                    .name("image-proc-" + job.getJobId())
                    .start(() -> {
                        try {
                            log.info("dang phan phoi job anh {} cho trinh thuc thi", job.getJobId());
                            imageJobExecutor.execute(job.getJobId(), job.getObjectName(), job.getAssetId(), job.getMetadataId());
                        } catch (Exception e) {
                            log.error("loi khong duoc xu ly khi thuc thi job anh {}: {}", job.getJobId(), e.getMessage(), e);
                        } finally {
                            bulkhead.releasePermission();
                        }
                    });
        }

    }
}
