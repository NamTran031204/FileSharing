package com.file.service.filesharingvideocodec.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "video.encoding")
@Data
public class VideoEncodingConfig {

    private FfmpegConfig ffmpeg;

    @Data
    public static class FfmpegConfig {
        private String path;
        // ffprobe cho buoc PROBE
        private String ffprobePath;
        // timeout, probe-timeout, threads, crf, preset, segment doc tu RuntimeSettings (video.*)
    }
}
