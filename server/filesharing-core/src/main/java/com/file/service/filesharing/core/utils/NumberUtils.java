package com.file.service.filesharing.core.utils;


import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.UserBusinessException;

public class NumberUtils {
    public static Number requireNumber(Number input, String message) {
        if (input == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, message);
        }
        return input;
    }
}
