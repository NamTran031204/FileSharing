package com.file.service.filesharing.core.exceptions.specException;

import com.file.service.filesharing.core.exceptions.ErrorCode;
import lombok.Getter;

@Getter
public class UserBusinessException extends RuntimeException {
    private final ErrorCode errorCode;
    /** tham so cho message key (i18n), rong neu message la van ban thuong */
    private final Object[] args;

    public UserBusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
        this.args = new Object[0];
    }

    public UserBusinessException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
        this.args = new Object[0];
    }

    /** message la key trong i18n/messages*.properties; args thay cho {0}, {1}... */
    public UserBusinessException(ErrorCode errorCode, String messageKey, Object... args) {
        super(messageKey);
        this.errorCode = errorCode;
        this.args = args;
    }
}
