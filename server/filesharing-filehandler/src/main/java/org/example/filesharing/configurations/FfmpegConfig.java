package org.example.filesharing.configurations;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Data
@Configuration
@ConfigurationProperties(prefix = "ffmpeg")
public class FfmpegConfig {

    private String binPath = "C:\\Users\\Admin\\Downloads\\ffmpeg-8.1";
    private String outputDir = "./videos/processed";
    private String tempDir = "./videos/temp";

    private HlsConfig hls = new HlsConfig();
    private EncodingConfig encoding = new EncodingConfig();

    @Data
    public static class HlsConfig {
        private int segmentDuration = 10;
        private int segmentListSize = 0;
    }

    @Data
    public static class EncodingConfig {
        private QualityConfig original = new QualityConfig();
        private QualityConfig hd720 = new QualityConfig();
    }

    @Data
    public static class QualityConfig {
        private String codec = "libx264";
        private String preset = "medium";
        private int crf = 23;
        private Integer width;
        private Integer height;
        private String bitrate;
        private String audioBitrate = "128k";
    }
}
