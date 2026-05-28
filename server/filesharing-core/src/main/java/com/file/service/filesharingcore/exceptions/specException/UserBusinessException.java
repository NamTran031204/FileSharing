package com.file.service.filesharingcore.exceptions.specException;

import com.file.service.filesharingcore.exceptions.ErrorCode;
import lombok.Getter;

@Getter
public class UserBusinessException extends RuntimeException {
    private final ErrorCode errorCode;

    public UserBusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public UserBusinessException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}
