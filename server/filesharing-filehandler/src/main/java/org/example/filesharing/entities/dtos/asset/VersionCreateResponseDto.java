package org.example.filesharing.entities.dtos.asset;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.entities.dtos.metadata.InitiateUploadResponseDto;
import org.example.filesharing.entities.models.core.MetadataEntity;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VersionCreateResponseDto {
    private MetadataEntity version;
    private InitiateUploadResponseDto upload;
}
