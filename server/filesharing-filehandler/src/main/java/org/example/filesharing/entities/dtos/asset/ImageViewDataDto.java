package org.example.filesharing.entities.dtos.asset;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.file.service.filesharing.core.enums.ProcessingStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageViewDataDto {
    private String assetId;
    private String previewUrl;
    private String thumbnailUrl;
    private String originalUrl;
    private String mimeType;
    private ProcessingStatus processingStatus;
    private DimensionDto dimensions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DimensionDto {
        private Integer width;
        private Integer height;
    }
}
