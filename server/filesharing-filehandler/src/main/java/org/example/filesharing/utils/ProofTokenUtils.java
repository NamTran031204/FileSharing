package org.example.filesharing.utils;

import com.file.service.filesharing.core.enums.ShareTokenTime;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.util.Base64;
import java.util.HexFormat;

public final class ProofTokenUtils {

    private static final SecureRandom RANDOM = new SecureRandom();

    private ProofTokenUtils() {
    }

    // 32 byte ngau nhien, base64url khong padding -> 43 ky tu, an toan khi dat trong URL
    public static String generateToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public static String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    // null hoac UNLIMITED -> null (khong gioi han). Tinh qua ZonedDateTime vi Instant khong cong duoc MONTHS/YEARS
    public static Instant resolveExpiry(ShareTokenTime range, Instant now) {
        if (range == null || range == ShareTokenTime.UNLIMITED) {
            return null;
        }
        ZonedDateTime base = now.atZone(ZoneOffset.UTC);
        return switch (range) {
            case ONE_DAY -> base.plusDays(1).toInstant();
            case ONE_WEEK -> base.plusWeeks(1).toInstant();
            case ONE_MONTH -> base.plusMonths(1).toInstant();
            case ONE_YEAR -> base.plusYears(1).toInstant();
            case UNLIMITED -> null;
        };
    }
}
