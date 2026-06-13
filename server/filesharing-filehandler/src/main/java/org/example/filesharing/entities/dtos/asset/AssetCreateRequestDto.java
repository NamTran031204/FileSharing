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
public class AssetCreateRequestDto {
    private String projectId;
    private String folderId;
    private String description;

    private String fileName;
    private String mimeType;
    private Double fileSize;
    private MediaType mediaType;
    private String compressionAlgo;
    private Integer timeToLive;

    // danh cho api upload new version
    private String assetId;
    private String changeNote;
    private AssetStatus assetStatus;
}
