package org.example.filesharing.exceptions.specException;

import lombok.Getter;
import org.example.filesharing.exceptions.ErrorCode;

@Getter
public class FileBusinessException extends RuntimeException {
    private final ErrorCode errorCode;

    public FileBusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public FileBusinessException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}
