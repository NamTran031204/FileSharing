package org.example.filesharing.entities.dtos.asset;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.entities.dtos.metadata.InitiateUploadResponseDto;
import org.example.filesharing.entities.models.AssetEntity;
import org.example.filesharing.entities.models.MetadataEntity;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetCreateResponseDto {
    private AssetEntity asset;
    private MetadataEntity version;
    private InitiateUploadResponseDto upload;
}
