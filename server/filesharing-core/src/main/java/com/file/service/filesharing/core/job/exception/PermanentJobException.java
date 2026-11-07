package com.file.service.filesharing.core.job.exception;

// Loi khong the khac phuc bang thu lai (file hong, qua lon...). Job vao DEAD_LETTER ngay.
public class PermanentJobException extends Exception {
    public PermanentJobException(String message) {
        super(message);
    }

    public PermanentJobException(String message, Throwable cause) {
        super(message, cause);
    }
}
