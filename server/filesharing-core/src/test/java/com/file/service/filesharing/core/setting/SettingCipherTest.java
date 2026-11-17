package com.file.service.filesharing.core.setting;

import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import org.jasypt.encryption.StringEncryptor;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.mock.env.MockEnvironment;

import static org.junit.jupiter.api.Assertions.*;

class SettingCipherTest {

    // khoa gia chi dung trong test, khong phai khoa that
    private static final String FAKE_KEY = "test-only-fake-key-1";
    private static final String PLAIN = "plain-secret-value-xyz";

    private static StringEncryptor encryptorWith(String key) {
        MockEnvironment env = new MockEnvironment();
        if (key != null) env.setProperty("JASYPT_ENCRYPTOR_PASSWORD", key);
        return new SettingAutoConfiguration().jasyptStringEncryptor(env);
    }

    private static SettingCipher cipherWith(String key) {
        return new SettingCipher(encryptorWith(key));
    }

    @Test
    void ciphertextHasMarkerAndRoundTrips() {
        SettingCipher c = cipherWith(FAKE_KEY);
        String stored = c.encrypt(PLAIN);
        assertTrue(stored.startsWith(SettingCipher.MARKER));
        assertFalse(stored.contains(PLAIN));
        assertEquals(PLAIN, c.decrypt(stored));
    }

    @Test
    void encryptTwiceDoesNotChangeValue() {
        SettingCipher c = cipherWith(FAKE_KEY);
        String once = c.encrypt(PLAIN);
        assertEquals(once, c.encrypt(once));
    }

    @Test
    void wrongKeyFailsWithoutLeakingPlaintext() {
        String stored = cipherWith(FAKE_KEY).encrypt(PLAIN);
        FileBusinessException e = assertThrows(FileBusinessException.class,
                () -> cipherWith("another-fake-key-2").decrypt(stored));
        assertEquals(ErrorCode.SETTING_CIPHER_FAILED, e.getErrorCode());
        assertNull(e.getCause());
        assertFalse(String.valueOf(e.getMessage()).contains(PLAIN));
    }

    @Test
    void missingKeyFailsClosedOnUse() {
        FileBusinessException e = assertThrows(FileBusinessException.class, () -> cipherWith(null).encrypt(PLAIN));
        assertEquals(ErrorCode.SETTING_CIPHER_FAILED, e.getErrorCode());
        assertNull(e.getCause());
    }

    @Test
    void decryptRejectsValueWithoutMarker() {
        SettingCipher c = cipherWith(FAKE_KEY);
        assertThrows(FileBusinessException.class, () -> c.decrypt("khong-co-marker"));
        assertThrows(FileBusinessException.class, () -> c.decrypt(SettingCipher.MARKER));
    }

    @Test
    void emptyStaysEmpty() {
        SettingCipher c = cipherWith(FAKE_KEY);
        assertEquals("", c.encrypt(""));
        assertEquals("", c.decrypt(""));
    }

    /** gia tri ENC(...) trong env/yml phai duoc giai ma tren Spring Boot 3 */
    @Test
    void encPropertyResolvesInSpringContext() {
        String c = encryptorWith(FAKE_KEY).encrypt(PLAIN);
        new ApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of(SettingAutoConfiguration.class))
                .withPropertyValues("JASYPT_ENCRYPTOR_PASSWORD=" + FAKE_KEY, "demo.secret=ENC(" + c + ")")
                .run(ctx -> {
                    assertNull(ctx.getStartupFailure());
                    assertTrue(ctx.containsBean("jasyptStringEncryptor"));
                    assertEquals(PLAIN, ctx.getEnvironment().getProperty("demo.secret"));
                });
    }

    /** thieu khoa: context van khoi dong khi khong ai dung secret */
    @Test
    void contextStartsWithoutKey() {
        new ApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of(SettingAutoConfiguration.class))
                .run(ctx -> assertNull(ctx.getStartupFailure()));
    }
}
