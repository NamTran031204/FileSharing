package org.example.filesharing.entities.dtos.asset;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.file.service.filesharing.core.enums.AssetStatus;
import com.file.service.filesharing.core.enums.MediaType;

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
    private Boolean isTrash;
}
