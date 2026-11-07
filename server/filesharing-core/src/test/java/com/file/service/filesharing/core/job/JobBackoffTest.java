package com.file.service.filesharing.core.job;

import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JobBackoffTest {
    private static final Duration BASE = Duration.ofSeconds(30);
    private static final Duration MAX = Duration.ofMinutes(30);

    @Test
    void firstRetryIsTwiceBaseWithinJitter() {
        assertEquals(48_000, JobBackoff.next(0, BASE, MAX, () -> 0.0).toMillis());
        assertEquals(72_000, JobBackoff.next(0, BASE, MAX, () -> 1.0).toMillis());
    }

    @Test
    void growsExponentially() {
        assertEquals(120_000, JobBackoff.next(1, BASE, MAX, () -> 0.5).toMillis());
    }

    @Test
    void cappedAtMaxTimesJitter() {
        long ms = JobBackoff.next(50, BASE, MAX, () -> 1.0).toMillis();
        assertTrue(ms <= MAX.toMillis() * 1.2 + 1);
        assertTrue(ms >= MAX.toMillis() * 0.8);
    }
}
