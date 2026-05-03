package org.example.filesharing.entities.dtos.asset;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.enums.ProcessingStatus;
import org.example.filesharing.enums.UploadStatus;

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
