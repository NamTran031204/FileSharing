package com.file.service.filesharingvideocodec.exception;

public class EncodingException extends RuntimeException {
    
    public EncodingException(String message) {
        super(message);
    }
    
    public EncodingException(String message, Throwable cause) {
        super(message, cause);
    }
    
    public EncodingException(Throwable cause) {
        super(cause);
    }
}
