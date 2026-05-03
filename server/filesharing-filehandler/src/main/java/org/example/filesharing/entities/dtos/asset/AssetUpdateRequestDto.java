package org.example.filesharing.entities.dtos.asset;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetUpdateRequestDto {
    private String assetId;
    private String assetName;
    private String description;
    private Instant shareExpiry;
    private Boolean regenerateShareToken;
}
