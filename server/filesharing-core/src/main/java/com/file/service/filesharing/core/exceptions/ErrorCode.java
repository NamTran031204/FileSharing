package com.file.service.filesharing.core.exceptions;

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
    INTERNAL_SERVER_ERROR("500", "Internal server error", HttpStatus.INTERNAL_SERVER_ERROR),
    VALIDATION_ERROR("510", "Validation Error", HttpStatus.INTERNAL_SERVER_ERROR),

    DOCKER_ERROR("5001", "Docker container error", HttpStatus.INTERNAL_SERVER_ERROR),
    DOCKER_BUILD_FAILED("5002", "Failed to build Docker image", HttpStatus.INTERNAL_SERVER_ERROR),

    FILE_ERROR("5100", "File error", HttpStatus.INTERNAL_SERVER_ERROR),
    FILE_NOT_FOUND("5101", "File not found", HttpStatus.NOT_FOUND),
    FILE_READ_ERROR("5102", "Failed to read file", HttpStatus.INTERNAL_SERVER_ERROR),
    FILE_OBJECT_NAME_CANNOT_BE_EMPTY("5103", "File name cannot be empty", HttpStatus.BAD_REQUEST),
    FILE_PERMISSION_ERROR("5104", "File permission Error", HttpStatus.FORBIDDEN),
    USER_ERROR("5201", "User Error", HttpStatus.INTERNAL_SERVER_ERROR),
    USER_PASSWORD_NOT_VALID("5202", "User password not valid", HttpStatus.FORBIDDEN),
    USER_NOT_FOUND("5203", "User not found", HttpStatus.NOT_FOUND),
    USER_EMAIL_NOT_VERIFY("5204", "User email not verified", HttpStatus.BAD_REQUEST),
    USER_NOT_AUTHENTICATED("5205", "User not authenticated", HttpStatus.UNAUTHORIZED),
    GOOGLE_TOKEN_INVALID("5206", "Google token invalid or expired", HttpStatus.UNAUTHORIZED),
    USER_ALREADY_EXISTS("5207", "User already exists", HttpStatus.BAD_REQUEST),

    PROJECT_NOT_FOUND("5301", "Project not found", HttpStatus.NOT_FOUND),
    FOLDER_NOT_FOUND("5401", "Folder not found", HttpStatus.NOT_FOUND),
    FOLDER_ALREADY_EXISTS("5402", "Folder already exists", HttpStatus.BAD_REQUEST),
    FOLDER_CIRCULAR_REFERENCE("5403", "Circular reference detected in folder structure", HttpStatus.BAD_REQUEST),
    FOLDER_PARENT_NOT_FOUND("5404", "Parent folder not found", HttpStatus.NOT_FOUND),
    FOLDER_NOT_IN_TRASH("5405", "Folder is not in trash", HttpStatus.BAD_REQUEST),

    SESSION_NOT_FOUND("5501", "Upload session not found", HttpStatus.NOT_FOUND),
    UPLOAD_INCOMPLETE("5502", "Upload is incomplete", HttpStatus.BAD_REQUEST),
    SIZE_MISMATCH("5503", "Uploaded size does not match declared size", HttpStatus.BAD_REQUEST),
    CHECKSUM_MISMATCH("5504", "Part checksum mismatch", HttpStatus.BAD_REQUEST),
    SESSION_INVALID_STATE("5505", "Upload session is not in a valid state", HttpStatus.CONFLICT),
    SESSION_LIMIT_EXCEEDED("5506", "Too many concurrent upload sessions", HttpStatus.TOO_MANY_REQUESTS),
    FILE_NOT_READY("5507", "File is not ready for download", HttpStatus.CONFLICT),

    MONGO_ERROR("6100", "Mongo error", HttpStatus.INTERNAL_SERVER_ERROR),
    MAIL_MESSAGING_ERROR("6101", "Mail message error", HttpStatus.INTERNAL_SERVER_ERROR),

    ;

    private final String code;
    private final String message;
    private final HttpStatus httpStatus;
}