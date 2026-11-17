package com.file.service.filesharing.core.node;

import java.time.Duration;
import java.time.Instant;

public enum NodeStatus {
    ONLINE, STALE, DRAINING;

    public static final Duration STALE_AFTER = Duration.ofSeconds(15);

    /** STALE uu tien hon DRAINING: node im qua 15s thi co drain cung khong con y nghia */
    public static NodeStatus of(Instant lastSeenAt, boolean draining, Instant now) {
        if (lastSeenAt == null || Duration.between(lastSeenAt, now).compareTo(STALE_AFTER) > 0) return STALE;
        return draining ? DRAINING : ONLINE;
    }
}
