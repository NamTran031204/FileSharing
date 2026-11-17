package com.file.service.filesharing.core.setting;

import com.file.service.filesharing.core.entity.models.SystemSettingEntity;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import org.junit.jupiter.api.Test;
import org.springframework.boot.convert.DurationStyle;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.util.unit.DataSize;

import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RuntimeSettingsTest {

    // khoa gia chi dung trong test
    private static final String FAKE_KEY = "test-only-fake-key-1";

    private final MongoTemplate mongo = mock(MongoTemplate.class);
    private final MockEnvironment env = new MockEnvironment().withProperty("JASYPT_ENCRYPTOR_PASSWORD", FAKE_KEY);
    private final SettingCipher cipher = new SettingCipher(new SettingAutoConfiguration().jasyptStringEncryptor(env));
    private final RuntimeSettings settings = new RuntimeSettings(mongo, cipher, env, Duration.ofSeconds(10));

    private static SystemSettingEntity row(SettingKey k, String v) {
        return SystemSettingEntity.builder().key(k.key()).value(v).build();
    }

    @Test
    void defaultsWhenNoOverride() {
        when(mongo.findAll(SystemSettingEntity.class)).thenReturn(List.of());
        settings.refresh();
        assertEquals(20, settings.intValue(SettingKey.UPLOAD_MAX_SESSIONS_PER_USER));
        assertEquals(2, settings.intValue(SettingKey.VIDEO_THREADS_PER_PROCESS));
        assertEquals(Duration.ofHours(24), settings.duration(SettingKey.AUTH_JWT_ACCESS_TTL));
        assertEquals(Duration.ofDays(30), settings.duration(SettingKey.RETENTION_PROCESSING_JOBS));
        assertEquals(50L * 1024 * 1024 * 1024, settings.dataSize(SettingKey.UPLOAD_MAX_FILE_SIZE).toBytes());
        assertEquals(List.of("http://localhost:5173"), settings.list(SettingKey.SECURITY_CORS_ALLOWED_ORIGINS));
        assertTrue(settings.boolValue(SettingKey.UPLOAD_VERIFY_ETAG_MD5));
        assertFalse(settings.isOverridden(SettingKey.UPLOAD_MAX_SESSIONS_PER_USER));
    }

    @Test
    void fixedGroupIgnoresMongoOverride() {
        when(mongo.findAll(SystemSettingEntity.class)).thenReturn(List.of(
                row(SettingKey.UPLOAD_MAX_FILE_SIZE, "1B"), row(SettingKey.JOB_MAX_RETRIES, "9")));
        settings.refresh();
        assertEquals(50L * 1024 * 1024 * 1024, settings.dataSize(SettingKey.UPLOAD_MAX_FILE_SIZE).toBytes());
        assertEquals(3, settings.intValue(SettingKey.JOB_MAX_RETRIES));
        assertFalse(settings.isOverridden(SettingKey.UPLOAD_MAX_FILE_SIZE));
    }

    @Test
    void fixedDefaultsMatchSettingKeyCatalogue() {
        for (SettingKey k : SettingKey.values()) {
            if (!k.group().isFixed()) continue;
            String raw = FixedSettings.DEFAULTS.raw(k);
            // so sanh o dang da parse de khong phu thuoc cach viet (24h = 86400s)
            switch (k.type()) {
                case DURATION -> assertEquals(DurationStyle.detectAndParse(k.defaultValue()),
                        DurationStyle.detectAndParse(raw), k.key());
                case DATA_SIZE -> assertEquals(DataSize.parse(k.defaultValue()), DataSize.parse(raw), k.key());
                default -> assertEquals(k.defaultValue(), raw, k.key());
            }
        }
    }

    @Test
    void overrideWinsAfterRefresh() {
        when(mongo.findAll(SystemSettingEntity.class)).thenReturn(List.of(row(SettingKey.MAIL_PORT, "2525")));
        settings.refresh();
        assertEquals(2525, settings.intValue(SettingKey.MAIL_PORT));
        assertTrue(settings.isOverridden(SettingKey.MAIL_PORT));
    }

    @Test
    void dbFailureKeepsPreviousSnapshot() {
        when(mongo.findAll(SystemSettingEntity.class))
                .thenReturn(List.of(row(SettingKey.MAIL_PORT, "2525")))
                .thenThrow(new RuntimeException("mat ket noi"));
        settings.refresh();
        settings.refresh();
        assertEquals(2525, settings.intValue(SettingKey.MAIL_PORT));
    }

    @Test
    void mailFallsBackToEnvInMemoryThenOverride() {
        env.setProperty("GMAIL_USERNAME", "old@mail.test");
        env.setProperty("GMAIL_APP_PASSWORD", "old-env-password");
        when(mongo.findAll(SystemSettingEntity.class)).thenReturn(List.of());
        settings.refresh();
        assertEquals("old@mail.test", settings.string(SettingKey.MAIL_USERNAME));
        assertEquals("old-env-password", settings.secret(SettingKey.MAIL_PASSWORD));
        // from-address trong thi lay theo username
        assertEquals("old@mail.test", settings.string(SettingKey.MAIL_FROM_ADDRESS));

        String stored = cipher.encrypt("new-db-password");
        when(mongo.findAll(SystemSettingEntity.class)).thenReturn(List.of(row(SettingKey.MAIL_PASSWORD, stored)));
        settings.refresh();
        assertEquals("new-db-password", settings.secret(SettingKey.MAIL_PASSWORD));
    }

    @Test
    void secretWithWrongKeyFailsClosed() {
        String stored = cipher.encrypt("some-secret");
        MockEnvironment other = new MockEnvironment().withProperty("JASYPT_ENCRYPTOR_PASSWORD", "another-fake-key-2");
        RuntimeSettings s = new RuntimeSettings(mongo,
                new SettingCipher(new SettingAutoConfiguration().jasyptStringEncryptor(other)), other, Duration.ofSeconds(10));
        when(mongo.findAll(SystemSettingEntity.class)).thenReturn(List.of(row(SettingKey.MAIL_PASSWORD, stored)));
        s.refresh();
        FileBusinessException e = assertThrows(FileBusinessException.class, () -> s.secret(SettingKey.MAIL_PASSWORD));
        assertEquals(ErrorCode.SETTING_CIPHER_FAILED, e.getErrorCode());
        assertFalse(String.valueOf(e.getMessage()).contains("some-secret"));
    }
}
