package com.file.service.filesharing.core.enums;

public enum OutboxEventStatus {
    // Cho relay phat
    PENDING,
    // Da phat xong. Event SENT qua 24h bi don (P1-01.c)
    SENT
}
