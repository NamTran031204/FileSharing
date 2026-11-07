package com.file.service.filesharing.core.job.exception;

// Loi tam thoi (timeout, MinIO chap chon...). Job ve PENDING voi backoff, het retry thi DEAD_LETTER.
public class TransientJobException extends Exception {
    public TransientJobException(String message) {
        super(message);
    }

    public TransientJobException(String message, Throwable cause) {
        super(message, cause);
    }
}
