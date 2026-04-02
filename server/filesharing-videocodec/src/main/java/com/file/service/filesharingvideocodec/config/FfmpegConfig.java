package com.file.service.filesharingvideocodec.config;

import lombok.Data;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FfmpegConfig {
    private final String ffmpegExecutePath = ".\\src\\main\\resources\\ffmpeg\\ffmpeg.exe";
    private final String ffmpegProbePath = ".\\src\\main\\resources\\ffmpeg\\ffmpeg.probe";

    @Data
    public static class HlsConfig {
        private int segmentDuration = 5;
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
