package org.example.filesharing.modules.videoEncode.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoInfo {
    private String filePath;
    private Long duration; // milliseconds
    private Integer width;
    private Integer height;
    private String codec;
    private Long bitrate;
    private Double frameRate;
    private String format;
}