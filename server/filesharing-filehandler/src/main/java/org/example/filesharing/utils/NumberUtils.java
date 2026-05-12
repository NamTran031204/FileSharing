package org.example.filesharing.utils;

import org.example.filesharing.exceptions.ErrorCode;
import org.example.filesharing.exceptions.specException.UserBusinessException;

public class NumberUtils {
    public static Number requireNumber(Number input, String message) {
        if (input == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, message);
        }
        return input;
    }
}
