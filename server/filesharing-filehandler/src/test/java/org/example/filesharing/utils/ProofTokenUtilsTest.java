package org.example.filesharing.utils;

import com.file.service.filesharing.core.enums.ShareTokenTime;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class ProofTokenUtilsTest {

    private static final Instant NOW = Instant.parse("2026-01-31T10:00:00Z");

    @Test
    void tokenIs43UrlSafeChars() {
        String token = ProofTokenUtils.generateToken();
        assertEquals(43, token.length());
        assertTrue(token.matches("[A-Za-z0-9_-]+"));
    }

    @Test
    void tokensDiffer() {
        assertNotEquals(ProofTokenUtils.generateToken(), ProofTokenUtils.generateToken());
    }

    @Test
    void sha256KnownVector() {
        assertEquals("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
                ProofTokenUtils.sha256Hex("abc"));
    }

    @Test
    void expiryUnlimitedIsNull() {
        assertNull(ProofTokenUtils.resolveExpiry(null, NOW));
        assertNull(ProofTokenUtils.resolveExpiry(ShareTokenTime.UNLIMITED, NOW));
    }

    @Test
    void expiryRanges() {
        assertEquals(Instant.parse("2026-02-01T10:00:00Z"), ProofTokenUtils.resolveExpiry(ShareTokenTime.ONE_DAY, NOW));
        assertEquals(Instant.parse("2026-02-07T10:00:00Z"), ProofTokenUtils.resolveExpiry(ShareTokenTime.ONE_WEEK, NOW));
        assertEquals(Instant.parse("2026-02-28T10:00:00Z"), ProofTokenUtils.resolveExpiry(ShareTokenTime.ONE_MONTH, NOW));
        assertEquals(Instant.parse("2027-01-31T10:00:00Z"), ProofTokenUtils.resolveExpiry(ShareTokenTime.ONE_YEAR, NOW));
    }
}
