package org.example.filesharing.entities.dtos.asset;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.enums.AssetStatus;
import org.example.filesharing.enums.MediaType;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetFilterRequestDto {
    private String projectId;
    private String folderId;
    private MediaType mediaType;
    private AssetStatus assetStatus;
    private String ownerId;
    private String keyword;
    private Boolean isActive;
}
