package com.file.service.filesharing.core.entity.models.processing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

// Mot muc trong ProcessingJobEntity.errorHistory
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobErrorEntry {
    public enum Kind { TRANSIENT, PERMANENT, LEASE_EXPIRED }

    private String attemptId;
    private String workerId;
    private Instant at;
    private Kind kind;
    private String message;
    // Duoi stderr da che bi mat (<= 1500 ky tu). Khong di vao lastError/result/metadata
    private String detail;
}
