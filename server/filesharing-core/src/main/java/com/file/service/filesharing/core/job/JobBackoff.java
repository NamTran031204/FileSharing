package com.file.service.filesharing.core.job;

import java.time.Duration;
import java.util.function.DoubleSupplier;

// min(base * 2^(retryCount+1), max) * U(0.8, 1.2)
public final class JobBackoff {
    private JobBackoff() {
    }

    public static Duration next(int retryCount, Duration base, Duration max, DoubleSupplier unit) {
        // chan so mu de tranh tran so
        long factor = 1L << Math.min(retryCount + 1, 30);
        long millis = Math.min(base.toMillis() * factor, max.toMillis());
        double jitter = 0.8 + 0.4 * unit.getAsDouble();
        return Duration.ofMillis((long) (millis * jitter));
    }
}
