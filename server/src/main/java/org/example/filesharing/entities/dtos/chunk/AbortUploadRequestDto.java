package org.example.filesharing.entities.dtos.chunk;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AbortUploadRequestDto {
    private String uploadId;
    private String objectName;
}
