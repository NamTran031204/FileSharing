package com.file.service.filesharingimagecodec.job.queue;

import com.file.service.filesharingimagecodec.config.ImageProcessingConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.concurrent.LinkedBlockingDeque;

/**
 * Phase 1 implementation: in-memory queue backed by LinkedBlockingDeque.
 * Supports putFirst() for returning jobs to the head when Bulkhead is full.
 * Data is lost on JVM crash — recovered via JobService.recoverRunningJobs().
 */
@Component
@Slf4j
public class InMemoryJobQueue implements JobQueue {

    private final LinkedBlockingDeque<String> deque;

    public InMemoryJobQueue(ImageProcessingConfig config) {
        int capacity = config.getQueue().getMaxCapacity();
        this.deque = new LinkedBlockingDeque<>(capacity);
        log.info("InMemoryJobQueue initialized with capacity: {}", capacity);
    }

    @Override
    public boolean offer(String jobId) {
        boolean added = deque.offerLast(jobId);
        if (!added) {
            log.warn("JobQueue is full. Cannot enqueue jobId: {}", jobId);
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
            log.error("Interrupted while putting job back to queue head: {}", jobId);
        }
    }

    @Override
    public int size() {
        return deque.size();
    }
}
