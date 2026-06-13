package org.example.filesharing.entities.dtos.asset;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.file.service.filesharing.core.enums.ProcessingStatus;
import com.file.service.filesharing.core.enums.UploadStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VersionFilterRequestDto {
    private String assetId;
    private Boolean includeTrash;
    private UploadStatus status;
    private ProcessingStatus processingStatus;
}
