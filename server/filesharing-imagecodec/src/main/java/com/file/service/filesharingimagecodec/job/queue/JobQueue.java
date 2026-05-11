package com.file.service.filesharingimagecodec.job.queue;

/**
 * sự trừu tượng hoá trên hàng đợi job nội bộ.
 * Giai đoạn 1: InMemoryJobQueue (LinkedBlockingDeque).
 * Giai đoạn 2: có thể được hoán đổi thành RedisStreamJobQueue mà không cần chạm vào JobDispatcher.
 */
public interface JobQueue {

    /**
     * thêm một job vào hàng đợi.
     * @return false nếu hàng đợi đầy (tín hiệu áp lực ngược).
     */
    boolean offer(String jobId);

    /**
     * lấy và xoá job tiếp theo (không chặn, FIFO).
     * @return jobId hoặc null nếu hàng đợi trống.
     */
    String poll();

    /**
     * đưa một job trở lại đầu hàng đợi.
     * được sử dụng khi Bulkhead đầy và job chưa thể được xử lý.
     */
    void putFirst(String jobId);

    /**
     * số lượng job hiện tại trong hàng đợi. được sử dụng cho các số liệu.
     */
    int size();
}
