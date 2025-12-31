package org.example.filesharing.exceptions;

import com.mongodb.*;
import jakarta.mail.MessagingException;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.entities.CommonResponse;
import org.example.filesharing.exceptions.specException.FileBusinessException;
import org.example.filesharing.exceptions.specException.UserBusinessException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;


@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler({
            FileBusinessException.class,
            UserBusinessException.class,
    })
    public ResponseEntity<CommonResponse<Object>> handleBusinessException(Exception ex, WebRequest request) {
        ErrorCode errorCode = ErrorCode.INTERNAL_SERVER_ERROR;

        if (ex instanceof FileBusinessException) {
            errorCode = ((FileBusinessException) ex).getErrorCode();
        }
        else if (ex instanceof UserBusinessException) {
            errorCode = ((UserBusinessException) ex).getErrorCode();
        }

        CommonResponse<Object> response = CommonResponse.fail(
                errorCode,
                ex.getMessage()
        );

        log.error("Spec Error: ", ex);

        return ResponseEntity
                .status(ErrorCode.INTERNAL_SERVER_ERROR.getHttpStatus())
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
                ErrorCode.MONGO_ERROR
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
                "Dữ liệu đầu vào không hợp lệ"
        );

        log.error("MethodArgumentNotValidException: ", ex);
        return ResponseEntity
                .status(ErrorCode.INTERNAL_SERVER_ERROR.getHttpStatus())
                .body(response);
    }

    @ExceptionHandler(MessagingException.class)
    public ResponseEntity<CommonResponse<Object>> handleMailMessagingException(MessagingException ex, WebRequest request) {
        CommonResponse<Object> response = CommonResponse.fail(
                ErrorCode.MAIL_MESSAGING_ERROR,
                ex.getMessage()
        );

        log.error("Internal Error: ", ex);
        return ResponseEntity
                .status(ErrorCode.MAIL_MESSAGING_ERROR.getHttpStatus())
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