package com.file.service.filesharingcore.utils;


import com.file.service.filesharingcore.exceptions.ErrorCode;
import com.file.service.filesharingcore.exceptions.specException.UserBusinessException;

public class NumberUtils {
    public static Number requireNumber(Number input, String message) {
        if (input == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, message);
        }
        return input;
    }
}
