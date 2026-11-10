package com.file.service.filesharing.core.job.exception;

// Loi khong the khac phuc bang thu lai (file hong, qua lon...). Job vao DEAD_LETTER ngay.
public class PermanentJobException extends Exception {
    private String detail;

    public PermanentJobException(String message) {
        super(message);
    }

    public PermanentJobException(String message, Throwable cause) {
        super(message, cause);
    }

    // detail: duoi stderr da che bi mat, chi vao errorHistory[].detail, khong toi client
    public PermanentJobException(String message, String detail) {
        super(message);
        this.detail = detail;
    }

    public String getDetail() {
        return detail;
    }
}
