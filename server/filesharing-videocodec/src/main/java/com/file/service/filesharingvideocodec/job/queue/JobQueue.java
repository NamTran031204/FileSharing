package com.file.service.filesharingvideocodec.job.queue;

/**
 * Abstraction over the internal job queue.
 * Phase 1: InMemoryJobQueue (LinkedBlockingDeque).
 * Phase 2: Can be swapped to RedisStreamJobQueue without touching JobDispatcher.
 */
public interface JobQueue {

    /**
     * Add a job to the queue.
     * @return false if the queue is full (back-pressure signal).
     */
    boolean offer(String jobId);

    /**
     * Retrieve and remove the next job (non-blocking, FIFO).
     * @return jobId or null if queue is empty.
     */
    String poll();

    /**
     * Put a job back at the head of the queue.
     * Used when Bulkhead is full and the job cannot be processed yet.
     */
    void putFirst(String jobId);

    /**
     * Current number of jobs in the queue. Used for metrics.
     */
    int size();
}
