package org.example.filesharing.entities.dtos.asset;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.file.service.filesharing.core.entity.models.AssetEntity;
import com.file.service.filesharing.core.entity.models.MetadataEntity;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetDetailResponseDto {
    private AssetEntity asset;
    private MetadataEntity latestVersion;
}
