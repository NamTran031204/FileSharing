package org.example.filesharing.entities.dtos.upload;

import com.file.service.filesharing.core.enums.UploadSessionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AbortUploadSessionResponseDto {
    private String sessionId;
    private UploadSessionStatus status;
    private Instant abortedAt;
}
