package com.file.service.filesharingimagecodec.job.queue;

import com.file.service.filesharingimagecodec.config.ImageProcessingConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.concurrent.LinkedBlockingDeque;

/**
 * triển khai Giai đoạn 1: hàng đợi trong bộ nhớ được hỗ trợ bởi LinkedBlockingDeque.
 * hỗ trợ putFirst() để đưa các job trở lại đầu hàng khi Bulkhead đầy.
 * dữ liệu bị mất khi JVM gặp sự cố — được khôi phục qua JobService.recoverRunningJobs().
 */
@Component
@Slf4j
public class InMemoryJobQueue implements JobQueue {

    private final LinkedBlockingDeque<String> deque;

    public InMemoryJobQueue(ImageProcessingConfig config) {
        int capacity = config.getQueue().getMaxCapacity();
        this.deque = new LinkedBlockingDeque<>(capacity);
        log.info("InMemoryJobQueue duoc khoi tao voi dung luong: {}", capacity);
    }

    @Override
    public boolean offer(String jobId) {
        boolean added = deque.offerLast(jobId);
        if (!added) {
            log.warn("JobQueue da day. khong the dua vao hang doi jobId: {}", jobId);
        }
        return added;
    }

    @Override
    public String poll() {
        return deque.pollFirst();
    }

    @Override
    public void putFirst(String jobId) {
        try {
            deque.putFirst(jobId);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("bi gian doan khi dua job tro lai dau hang doi: {}", jobId);
        }
    }

    @Override
    public int size() {
        return deque.size();
    }
}
