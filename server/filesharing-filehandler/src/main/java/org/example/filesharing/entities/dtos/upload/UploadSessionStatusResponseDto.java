package org.example.filesharing.entities.dtos.upload;

import com.file.service.filesharing.core.enums.UploadMode;
import com.file.service.filesharing.core.enums.UploadSessionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadSessionStatusResponseDto {
    private String sessionId;
    private UploadSessionStatus status;
    private UploadMode uploadMode;
    private long partSize;
    private int partCount;
    private long declaredSize;
    private List<ReceivedPartDto> receivedParts;
    private long uploadedBytes;
    private Instant expiresAt;
    private Instant hardExpiresAt;
    private UploadResourceResponseDto resource;
}
