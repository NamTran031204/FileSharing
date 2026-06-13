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
public class VersionCreateRequestDto {
    private String assetId;
    private String fileName;
    private String mimeType;
    private Double fileSize;
    private MediaType mediaType;
    private String compressionAlgo;
    private Integer timeToLive;
    private String changeNote;
    private AssetStatus assetStatus;
}
