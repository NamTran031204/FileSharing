package com.file.service.filesharing.core.enums;

public enum ProcessingJobStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    FAILED,
    CANCELLED,
    // Het retry, giu lai kem ngu canh dieu tra, co the replay thu cong (ADR-001 QD-1)
    DEAD_LETTER
}
