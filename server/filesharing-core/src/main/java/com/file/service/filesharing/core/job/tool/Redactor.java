package com.file.service.filesharing.core.job.tool;

import java.util.List;
import java.util.regex.Pattern;

// Che chuoi bi mat khai bao trong lenh, cong luoi an toan cho tham so chu ky S3 trong moi URL
public final class Redactor {
    private static final Pattern S3_PARAMS =
            Pattern.compile("(?i)(X-Amz-(?:Signature|Credential|Security-Token)=)[^&\\s'\"]+");

    private final List<String> secrets;

    public Redactor(List<String> secrets) {
        this.secrets = secrets == null ? List.of() : secrets;
    }

    public String apply(String s) {
        if (s == null) return null;
        String r = s;
        for (String secret : secrets) {
            if (!secret.isEmpty()) r = r.replace(secret, "***");
        }
        return S3_PARAMS.matcher(r).replaceAll("$1***");
    }
}
