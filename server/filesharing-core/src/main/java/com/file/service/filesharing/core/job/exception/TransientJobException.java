package com.file.service.filesharing.core.job.exception;

// Loi tam thoi (timeout, MinIO chap chon...). Job ve PENDING voi backoff, het retry thi DEAD_LETTER.
public class TransientJobException extends Exception {
    private String detail;

    public TransientJobException(String message) {
        super(message);
    }

    public TransientJobException(String message, Throwable cause) {
        super(message, cause);
    }

    // detail: duoi stderr da che bi mat, chi vao errorHistory[].detail, khong toi client
    public TransientJobException(String message, String detail) {
        super(message);
        this.detail = detail;
    }

    public String getDetail() {
        return detail;
    }
}
