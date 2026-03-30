package org.example.filesharing.exceptions.specException;

import org.example.filesharing.exceptions.ErrorCode;
import lombok.Getter;

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
