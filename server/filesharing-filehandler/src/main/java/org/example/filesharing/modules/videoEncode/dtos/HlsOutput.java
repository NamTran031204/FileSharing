package org.example.filesharing.modules.videoEncode.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HlsOutput {
    private String masterPlaylistPath;  // master.m3u8
    private List<QualityVariant> variants;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QualityVariant {
        private String quality;  // "original", "720p"
        private String playlistPath;  // output_720p.m3u8
        private List<String> segmentPaths;  // segment_0.ts, segment_1.ts, ...
        private Integer width;
        private Integer height;
        private String bandwidth;
    }
}
