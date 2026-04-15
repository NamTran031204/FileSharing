package org.example.filesharing.exceptions.specException;

import lombok.Getter;
import lombok.Setter;
import org.example.filesharing.exceptions.ErrorCode;

@Getter
public class CommonException extends RuntimeException {
    private final ErrorCode errorCode;

    public CommonException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    public CommonException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }
}
