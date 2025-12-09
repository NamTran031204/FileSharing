package org.example.filesharing.exceptions;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {
    SUCCESS("200", "Successful", HttpStatus.OK),

    BAD_REQUEST("400", "Bad request", HttpStatus.BAD_REQUEST),
    UNAUTHORIZED("401", "Unauthorized", HttpStatus.UNAUTHORIZED),
    FORBIDDEN("403", "Forbidden", HttpStatus.FORBIDDEN),
    NOT_FOUND("404", "Resource not found", HttpStatus.NOT_FOUND),
    INTERNAL_SERVER_ERROR("500", "Internal server error", HttpStatus.INTERNAL_SERVER_ERROR)
    ,

    DOCKER_ERROR("5001", "Docker container error", HttpStatus.INTERNAL_SERVER_ERROR),
    DOCKER_BUILD_FAILED("5002", "Failed to build Docker image", HttpStatus.INTERNAL_SERVER_ERROR)
    ,

    FILE_NOT_FOUND("5101", "File not found", HttpStatus.NOT_FOUND),
    FILE_READ_ERROR("5102", "Failed to read file", HttpStatus.INTERNAL_SERVER_ERROR)
    ,
    USER_ERROR("5201", "User Error", HttpStatus.INTERNAL_SERVER_ERROR),
    USER_PASSWORD_NOT_VALID("5202", "User password not valid", HttpStatus.INTERNAL_SERVER_ERROR),
    USER_NOT_FOUND("5203", "User not found", HttpStatus.NOT_FOUND)
    ,
    MONGO_ERROR("6100", "Mongo error", HttpStatus.INTERNAL_SERVER_ERROR)

    ;

    private final String code;
    private final String message;
    private final HttpStatus httpStatus;
}