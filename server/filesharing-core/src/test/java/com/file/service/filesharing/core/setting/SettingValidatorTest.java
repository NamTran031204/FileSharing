package com.file.service.filesharing.core.setting;

import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class SettingValidatorTest {

    private static void assertInvalid(SettingKey k, String v) {
        FileBusinessException e = assertThrows(FileBusinessException.class, () -> SettingValidator.validate(k, v));
        assertEquals(ErrorCode.SETTING_INVALID_VALUE, e.getErrorCode());
        assertTrue(e.getMessage().contains(k.key()));
    }

    @Test
    void everyDefaultIsValid() {
        for (SettingKey k : SettingKey.values()) {
            assertEquals(k.defaultValue(), SettingValidator.validate(k, k.defaultValue()), k.key());
        }
    }

    @Test
    void catalogueKeysAreUniqueAndCounted() {
        Set<String> keys = new HashSet<>();
        for (SettingKey k : SettingKey.values()) assertTrue(keys.add(k.key()), k.key());
        assertEquals(69, keys.size());
        assertTrue(SettingKey.MAIL_PASSWORD.secret());
        assertEquals(1, java.util.Arrays.stream(SettingKey.values()).filter(SettingKey::secret).count());
    }

    @Test
    void intRangeAndType() {
        assertEquals("5", SettingValidator.validate(SettingKey.UPLOAD_MAX_THREADS, " 5 "));
        assertInvalid(SettingKey.UPLOAD_MAX_THREADS, "7");
        assertInvalid(SettingKey.UPLOAD_MAX_THREADS, "0");
        assertInvalid(SettingKey.UPLOAD_MAX_THREADS, "abc");
        assertInvalid(SettingKey.UPLOAD_INITIAL_URL_BATCH, "51");
    }

    @Test
    void durationAndDataSize() {
        assertEquals("2h", SettingValidator.validate(SettingKey.AUTH_JWT_ACCESS_TTL, "2h"));
        assertInvalid(SettingKey.AUTH_JWT_ACCESS_TTL, "1s");
        assertInvalid(SettingKey.AUTH_JWT_ACCESS_TTL, "xyz");
        assertEquals("10GB", SettingValidator.validate(SettingKey.UPLOAD_MAX_FILE_SIZE, "10GB"));
        assertInvalid(SettingKey.UPLOAD_MAX_FILE_SIZE, "999TB");
    }

    @Test
    void boolEnumUrl() {
        assertInvalid(SettingKey.UPLOAD_VERIFY_ETAG_MD5, "yes");
        assertInvalid(SettingKey.VIDEO_PRESET, "turbo");
        assertEquals("fast", SettingValidator.validate(SettingKey.VIDEO_PRESET, "fast"));
        assertInvalid(SettingKey.APP_FRONTEND_BASE_URL, "ftp://x.y");
        assertInvalid(SettingKey.APP_FRONTEND_BASE_URL, "not a url");
    }

    @Test
    void blankRulesAndCorsOrigins() {
        assertEquals("", SettingValidator.validate(SettingKey.MAIL_USERNAME, ""));
        assertInvalid(SettingKey.MAIL_HOST, "");
        assertInvalid(SettingKey.SECURITY_CORS_ALLOWED_ORIGINS, " , ");
        assertInvalid(SettingKey.SECURITY_CORS_ALLOWED_ORIGINS, "http://a.com/path");
        assertEquals("http://a.com, https://b.com:8443",
                SettingValidator.validate(SettingKey.SECURITY_CORS_ALLOWED_ORIGINS, "http://a.com, https://b.com:8443"));
    }

    @Test
    void crossConstraints() {
        assertThrows(FileBusinessException.class, () -> SettingValidator.validateCross(k -> Map.of(
                SettingKey.DOWNLOAD_URL_TTL_MIN, "4h", SettingKey.DOWNLOAD_URL_TTL_MAX, "900s").get(k)));
        assertThrows(FileBusinessException.class, () -> SettingValidator.validateCross(k -> Map.of(
                SettingKey.JOB_BACKOFF_BASE, "30m", SettingKey.JOB_BACKOFF_MAX, "30s").get(k)));
        assertDoesNotThrow(() -> SettingValidator.validateCross(SettingKey::defaultValue));
    }
}
