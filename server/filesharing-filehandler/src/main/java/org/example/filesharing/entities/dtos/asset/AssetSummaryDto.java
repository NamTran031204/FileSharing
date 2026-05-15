package org.example.filesharing.entities.dtos.asset;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.entities.models.AssetEntity;
import org.example.filesharing.entities.models.MetadataEntity;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetSummaryDto {
    private AssetEntity asset;
    private MetadataEntity latestVersion;
}
