package org.example.filesharing.utils;

import java.text.Normalizer;
import java.util.regex.Pattern;

public class StringUtils {
    private static final String EMAIL_REGEX = "^[\\w.+\\-']+@[\\w.-]+\\.[A-Za-z]{2,}$";
    private static final Pattern EMAIL_PATTERN = Pattern.compile(EMAIL_REGEX);

    public static boolean isEmail(String value) {
        if (value == null || value.isEmpty()) {
            return false;
        }
        return EMAIL_PATTERN.matcher(value).matches();
    }

    public static boolean isNullOrEmpty(String str) {
        return str == null || str.isEmpty();
    }

    public static boolean isNotNullOrEmpty(String str) {
        return !isNullOrEmpty(str);
    }

    public static boolean isNullOrBlank(String str) {
        return str == null || str.isEmpty() || str.isBlank();
    }

    public static boolean isNotNullOrBlank(String str) {
        return !isNullOrBlank(str);
    }

    public static String removeVietnameseAccents(String input) {
        if (input == null || input.isEmpty()) {
            return input;
        }
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        Pattern pattern = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        String withoutAccents = pattern.matcher(normalized).replaceAll("");
        withoutAccents = withoutAccents.replace("đ", "d").replace("Đ", "D");

        return withoutAccents;
    }
}
