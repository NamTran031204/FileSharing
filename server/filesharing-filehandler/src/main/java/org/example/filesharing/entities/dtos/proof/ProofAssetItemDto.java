package org.example.filesharing.entities.dtos.proof;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProofAssetItemDto {
    private String assetId;
    private String assetName;
    private String thumbnailUrl;
    private String previewUrl;
    private Integer width;
    private Integer height;
}
