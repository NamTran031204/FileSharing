package com.file.service.filesharing.core.setting;

import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import org.jasypt.encryption.StringEncryptor;

/**
 * Ma hoa secret truoc khi ghi DB, marker FSENC1: de nhan biet. Moi loi doi thanh
 * SETTING_CIPHER_FAILED khong gan cause, vi exception cua jasypt co the in plaintext hoac ciphertext.
 */
public class SettingCipher {

    public static final String MARKER = "FSENC1:";

    private final StringEncryptor encryptor;

    public SettingCipher(StringEncryptor encryptor) {
        this.encryptor = encryptor;
    }

    public String encrypt(String plain) {
        if (plain == null || plain.isEmpty()) return "";
        if (plain.startsWith(MARKER)) {
            // da ma hoa: chi kiem giai ma duoc roi giu nguyen, khong ma hoa hai lan
            decrypt(plain);
            return plain;
        }
        try {
            String c = encryptor.encrypt(plain);
            if (c == null || c.isBlank() || c.equals(plain) || !plain.equals(encryptor.decrypt(c))) {
                throw failed();
            }
            return MARKER + c;
        } catch (RuntimeException e) {
            throw failed();
        }
    }

    public String decrypt(String stored) {
        if (stored == null || stored.isEmpty()) return "";
        if (!stored.startsWith(MARKER) || stored.length() == MARKER.length()) throw failed();
        try {
            String p = encryptor.decrypt(stored.substring(MARKER.length()));
            if (p == null) throw failed();
            return p;
        } catch (RuntimeException e) {
            throw failed();
        }
    }

    private static FileBusinessException failed() {
        return new FileBusinessException(ErrorCode.SETTING_CIPHER_FAILED);
    }
}
