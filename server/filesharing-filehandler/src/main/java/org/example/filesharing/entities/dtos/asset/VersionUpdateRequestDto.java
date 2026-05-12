package org.example.filesharing.entities.dtos.asset;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.enums.ProcessingStatus;
import org.example.filesharing.enums.objectPermission.ObjectPermission;
import org.example.filesharing.enums.objectPermission.ObjectVisibility;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VersionUpdateRequestDto {
    private String assetId;
    private Integer versionNumber;
    private String downloadFileName;
    private ObjectVisibility visibility;
    private ObjectPermission publicPermission;
    private ProcessingStatus processingStatus;
    private String processingError;
    private MediaInfoDto mediaInfo;
}
