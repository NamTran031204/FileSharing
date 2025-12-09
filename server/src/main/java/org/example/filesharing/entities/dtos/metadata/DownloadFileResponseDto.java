package org.example.filesharing.entities.dtos.metadata;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DownloadFileResponseDto {
    private String url;
    private Double fileSize;
    private String fileName;
    private String mimeType;
}
