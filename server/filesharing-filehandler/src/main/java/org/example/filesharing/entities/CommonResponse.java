package org.example.filesharing.entities;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.exceptions.ErrorCode;
import org.example.filesharing.utils.StringUtils;

import java.io.Serial;
import java.io.Serializable;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CommonResponse<TResult> implements Serializable {
    @Serial
    private static final long serialVersionUID = 7594052194764993562L;

    private Boolean isSuccessful;
    private TResult data;
    private String code;
    private String message;

    public static <T> CommonResponse<T> success() {
        return success(null);
    }

    public static <T> CommonResponse<T> success(T data) {
        return success(data, ErrorCode.SUCCESS.getMessage());
    }

    public static <T> CommonResponse<T> success(T data, String message) {
        return success(data, message, null);
    }

    public static <T> CommonResponse<T> success(T data, String message, String code) {
        if (StringUtils.isNullOrEmpty(code)) {
            code = ErrorCode.SUCCESS.getCode();
        }
        return result(true, data, code, message);
    }

    public static <T> CommonResponse<T> fail() {
        return fail(null, null);
    }

    public static <T> CommonResponse<T> fail(ErrorCode errorCode) {
        return fail(errorCode, errorCode.getMessage());
    }

    public static <T> CommonResponse<T> fail(ErrorCode errorCode, String message) {
        if (errorCode == null) {
            errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
        }
        if (StringUtils.isNullOrEmpty(message)) {
            message = ErrorCode.INTERNAL_SERVER_ERROR.getMessage();
        }
        return result(false, null, errorCode.getCode(), message);
    }

    public static <T> CommonResponse<T> result(boolean success, T data, String code, String message) {
        return CommonResponse.<T>builder()
                .isSuccessful(success)
                .data(data)
                .code(code)
                .message(message)
                .build();
    }
}
