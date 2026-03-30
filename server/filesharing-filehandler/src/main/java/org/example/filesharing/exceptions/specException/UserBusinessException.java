package org.example.filesharing.exceptions.specException;

import lombok.Getter;
import org.example.filesharing.exceptions.ErrorCode;

@Getter
public class UserBusinessException extends RuntimeException{
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
