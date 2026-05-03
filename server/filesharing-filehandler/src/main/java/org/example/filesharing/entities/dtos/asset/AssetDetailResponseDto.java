package org.example.filesharing.entities.dtos.asset;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.entities.models.core.AssetEntity;
import org.example.filesharing.entities.models.core.MetadataEntity;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetDetailResponseDto {
    private AssetEntity asset;
    private MetadataEntity latestVersion;
}
