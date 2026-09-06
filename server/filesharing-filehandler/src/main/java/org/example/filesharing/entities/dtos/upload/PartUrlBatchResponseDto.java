package org.example.filesharing.entities.dtos.upload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartUrlBatchResponseDto {
    private String sessionId;
    private Map<Integer, String> urls;
    private Instant urlExpiresAt;
    private Instant expiresAt;
}
