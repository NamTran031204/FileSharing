package com.file.service.filesharing.core.exceptions;

import com.file.service.filesharing.core.entity.CommonResponse;
import com.file.service.filesharing.core.exceptions.specException.CommonException;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import com.file.service.filesharing.core.exceptions.specException.UserBusinessException;
import com.mongodb.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;


@RestControllerAdvice
@Slf4j
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private final MessageSource messageSource;

    /**
     * Dich message theo locale cua request (Accept-Language).
     * raw la key trong i18n/messages*.properties thi lay ban dich; neu raw chinh la message mac dinh cua ErrorCode thi lay error.<code>;
     * con lai giu nguyen raw (fallback)
     */
    private String localize(ErrorCode errorCode, String raw, Object[] args) {
        var locale = LocaleContextHolder.getLocale();
        if (raw != null) {
            String byKey = messageSource.getMessage(raw, args != null && args.length > 0 ? args : null, null, locale);
            if (byKey != null) {
                return byKey;
            }
        }
        if (raw == null || raw.equals(errorCode.getMessage())) {
            return messageSource.getMessage("error." + errorCode.getCode(), null, errorCode.getMessage(), locale);
        }
        return raw;
    }

    @ExceptionHandler({
            CommonException.class,
            FileBusinessException.class,
            UserBusinessException.class,
    })
    public ResponseEntity<CommonResponse<Object>> handleBusinessException(Exception ex, WebRequest request) {
        ErrorCode errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
        Object[] args = null;

        if (ex instanceof FileBusinessException fe) {
            errorCode = fe.getErrorCode();
            args = fe.getArgs();
        } else if (ex instanceof UserBusinessException ue) {
            errorCode = ue.getErrorCode();
            args = ue.getArgs();
        } else if (ex instanceof CommonException ce) {
            args = ce.getArgs();
        }

        CommonResponse<Object> response = CommonResponse.fail(
                errorCode,
                localize(errorCode, ex.getMessage(), args)
        );

        log.error("Spec Error: ", ex);

        return ResponseEntity
                .status(errorCode.getHttpStatus())
                .body(response);
    }

    @ExceptionHandler({
            MongoException.class,
            MongoClientException.class,
            MongoCommandException.class,
            MongoWriteException.class,
            MongoWriteConcernException.class,
            MongoTimeoutException.class,
            MongoSecurityException.class
    })
    public ResponseEntity<CommonResponse<Object>> handleGlobalException(Exception ex, WebRequest request) {
        CommonResponse<Object> response = CommonResponse.fail(
                ErrorCode.MONGO_ERROR,
                localize(ErrorCode.MONGO_ERROR, null, null)
        );

        log.error("MONGO Error: ", ex);
        return ResponseEntity
                .status(ErrorCode.MONGO_ERROR.getHttpStatus())
                .body(response);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class})
    public ResponseEntity<CommonResponse<Object>> handleHttpMessageNotReadableException(HttpMessageNotReadableException ex, WebRequest request) {
        CommonResponse<Object> response = CommonResponse.fail(
                ErrorCode.INTERNAL_SERVER_ERROR,
                ex.getMessage()
        );

        log.error("HTTP Message Not Readable: ", ex);
        return ResponseEntity
                .status(ErrorCode.INTERNAL_SERVER_ERROR.getHttpStatus())
                .body(response);
    }

    @ExceptionHandler({MethodArgumentNotValidException.class})
    public ResponseEntity<CommonResponse<Object>> handleHttpMessageNotReadableException(MethodArgumentNotValidException ex, WebRequest request) {
        CommonResponse<Object> response = CommonResponse.fail(
                ErrorCode.INTERNAL_SERVER_ERROR,
                localize(ErrorCode.INTERNAL_SERVER_ERROR, "validation.invalidInput", null)
        );

        log.error("MethodArgumentNotValidException: ", ex);
        return ResponseEntity
                .status(ErrorCode.INTERNAL_SERVER_ERROR.getHttpStatus())
                .body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<CommonResponse<Object>> handleException(Exception ex, WebRequest request) {
        CommonResponse<Object> response = CommonResponse.fail(
                ErrorCode.INTERNAL_SERVER_ERROR,
                ex.getMessage()
        );

        log.error("Internal Error: ", ex);
        return ResponseEntity
                .status(ErrorCode.INTERNAL_SERVER_ERROR.getHttpStatus())
                .body(response);
    }
}