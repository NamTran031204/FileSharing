package org.example.filesharing.entities.dtos.asset;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MediaInfoDto {
    private Integer durationMs;
    private Integer width;
    private Integer height;
    private Integer frameRate;
    private String codec;
    private String colorSpace;
    private String hasAlpha;
}
