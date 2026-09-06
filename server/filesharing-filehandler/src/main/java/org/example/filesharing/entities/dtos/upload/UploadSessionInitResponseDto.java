package org.example.filesharing.entities.dtos.upload;

import com.file.service.filesharing.core.enums.UploadMode;
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
public class UploadSessionInitResponseDto {
    private String sessionId;
    private UploadMode uploadMode;
    private long partSize;
    private int partCount;
    private long declaredSize;
    private Map<Integer, String> urls;
    private Instant urlExpiresAt;
    private Instant expiresAt;
    private Instant hardExpiresAt;
}
