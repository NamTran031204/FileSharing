package org.example.filesharing.entities.dtos.upload;

import com.file.service.filesharing.core.enums.MediaType;
import com.file.service.filesharing.core.enums.ProcessingStatus;
import com.file.service.filesharing.core.enums.UploadStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadResourceResponseDto {
    private String sessionId;
    private String assetId;
    private String fileId;
    private int versionNumber;
    private String objectName;
    private String fileName;
    private long fileSize;
    private String etag;
    private String mimeType;
    private MediaType mediaType;
    private UploadStatus uploadStatus;
    private ProcessingStatus processingStatus;
    private Instant completedAt;
}
