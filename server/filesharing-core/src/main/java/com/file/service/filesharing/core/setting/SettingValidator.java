package com.file.service.filesharing.core.setting;

import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import org.springframework.boot.convert.DurationStyle;
import org.springframework.util.unit.DataSize;

import java.net.URI;
import java.time.Duration;
import java.util.Arrays;
import java.util.List;
import java.util.function.Function;
import java.util.regex.Pattern;

/**
 * Kiem tra gia tri raw theo kieu, min/max va rang buoc cheo. Loi luon la SETTING_INVALID_VALUE
 * kem ten key, khong in gia tri (co the la secret).
 */
public final class SettingValidator {

    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    private SettingValidator() {
    }

    /** tra ve gia tri da chuan hoa (trim), nem loi neu sai */
    public static String validate(SettingKey k, String raw) {
        String v = raw == null ? "" : raw.trim();
        if (v.isEmpty()) {
            // chi cho phep rong voi STRING co mac dinh rong (mail.username...)
            if (k.type() == SettingType.STRING && k.defaultValue().isEmpty()) {
                return v;
            }
            throw invalid(k);
        }
        try {
            switch (k.type()) {
                case INT -> inRange(k, Integer.parseInt(v));
                case LONG -> inRange(k, Long.parseLong(v));
                case BOOL -> {
                    if (!v.equals("true") && !v.equals("false")) throw invalid(k);
                }
                case STRING -> {
                }
                case URL -> checkUrl(k, v, false);
                case EMAIL -> {
                    if (!EMAIL.matcher(v).matches()) throw invalid(k);
                }
                case DURATION -> {
                    Duration d = DurationStyle.detectAndParse(v);
                    inRange(k, d.toSeconds());
                }
                case DATA_SIZE -> inRange(k, DataSize.parse(v).toBytes());
                case STRING_LIST -> {
                    List<String> items = splitList(v);
                    if (items.isEmpty()) throw invalid(k);
                    if (k == SettingKey.SECURITY_CORS_ALLOWED_ORIGINS) {
                        items.forEach(o -> checkUrl(k, o, true));
                    }
                }
                case ENUM -> {
                    if (!k.options().contains(v)) throw invalid(k);
                }
            }
        } catch (FileBusinessException e) {
            throw e;
        } catch (RuntimeException e) {
            throw invalid(k);
        }
        return v;
    }

    /**
     * Rang buoc cheo giua cac key, effective tra ve gia tri hieu luc (sau khi ap thay doi).
     * Chi kiem khi ca hai key doc duoc.
     */
    public static void validateCross(Function<SettingKey, String> effective) {
        lessOrEqual(effective, SettingKey.DOWNLOAD_URL_TTL_MIN, SettingKey.DOWNLOAD_URL_TTL_MAX);
        lessOrEqual(effective, SettingKey.JOB_BACKOFF_BASE, SettingKey.JOB_BACKOFF_MAX);
        lessOrEqual(effective, SettingKey.DASHBOARD_RECENT_DEFAULT_LIMIT, SettingKey.DASHBOARD_RECENT_MAX_LIMIT);
    }

    public static List<String> splitList(String raw) {
        if (raw == null) return List.of();
        return Arrays.stream(raw.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    private static void lessOrEqual(Function<SettingKey, String> eff, SettingKey a, SettingKey b) {
        String va = eff.apply(a);
        String vb = eff.apply(b);
        if (va == null || vb == null) return;
        if (toNumber(a, va) > toNumber(b, vb)) {
            throw invalid(a);
        }
    }

    private static long toNumber(SettingKey k, String v) {
        return k.type() == SettingType.DURATION
                ? DurationStyle.detectAndParse(v).toSeconds()
                : Long.parseLong(v);
    }

    private static void checkUrl(SettingKey k, String v, boolean originOnly) {
        URI u = URI.create(v);
        boolean ok = u.getHost() != null && ("http".equals(u.getScheme()) || "https".equals(u.getScheme()));
        if (originOnly) {
            // origin khong co path, query, fragment
            ok = ok && (u.getPath() == null || u.getPath().isEmpty()) && u.getQuery() == null && u.getFragment() == null;
        }
        if (!ok) throw invalid(k);
    }

    private static void inRange(SettingKey k, long n) {
        if ((k.min() != null && n < k.min()) || (k.max() != null && n > k.max())) {
            throw invalid(k);
        }
    }

    private static FileBusinessException invalid(SettingKey k) {
        return new FileBusinessException(ErrorCode.SETTING_INVALID_VALUE,
                ErrorCode.SETTING_INVALID_VALUE.getMessage() + ": " + k.key());
    }
}
