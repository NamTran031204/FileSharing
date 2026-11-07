package com.file.service.filesharingvideocodec.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "video.encoding")
@Data
public class VideoEncodingConfig {

    private FfmpegConfig ffmpeg;
    private SegmentConfig segment;

    @Data
    public static class FfmpegConfig {
        private String path;
        private long timeout;
        private int threadsPerProcess;
        private int crf;
        private String preset;
    }


    @Data
    public static class SegmentConfig {
        private int duration;
        private String audioBitrate;
    }





}
