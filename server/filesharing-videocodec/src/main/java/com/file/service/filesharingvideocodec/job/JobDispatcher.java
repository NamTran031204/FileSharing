package com.file.service.filesharingvideocodec.job;

import com.file.service.filesharingvideocodec.ffmpeg.FfmpegExecutor;
import com.file.service.filesharingvideocodec.job.queue.JobQueue;
import io.github.resilience4j.bulkhead.Bulkhead;
import io.github.resilience4j.bulkhead.BulkheadRegistry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * thăm dò JobQueue mỗi 500ms và phân phối các job tới FfmpegExecutor
 * khi có một khe Bulkhead trống. các job chạy trên Virtual Threads.
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
        // kiểm tra xem có khe trống nào không
        int availableSlots = bulkhead.getMetrics().getAvailableConcurrentCalls();
        if (availableSlots <= 0) {
            return;
        }

        String jobId = jobQueue.poll();
        if (jobId == null) {
            return;  // hàng đợi trống
        }

        // cố gắng lấy giấy phép Bulkhead
        boolean permitted = bulkhead.tryAcquirePermission();
        if (!permitted) {
            // Bulkhead đầy — đưa job trở lại đầu hàng đợi
            jobQueue.putFirst(jobId);
            log.debug("Bulkhead da day, tra job {} ve dau hang doi", jobId);
            return;
        }

        // tạo Virtual Thread cho job mã hoá
        Thread.ofVirtual()
                .name("encoder-" + jobId)
                .start(() -> {
                    try {
                        log.info("dang phan phoi job {} cho trinh thuc thi FFmpeg", jobId);
                        ffmpegExecutor.execute(jobId);
                    } catch (Exception e) {
                        log.error("loi khong duoc xu ly khi thuc thi job {}: {}", jobId, e.getMessage(), e);
                    } finally {
                        bulkhead.releasePermission();
                    }
                });
    }
}
