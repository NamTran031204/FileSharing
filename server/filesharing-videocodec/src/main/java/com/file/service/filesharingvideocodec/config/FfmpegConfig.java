package com.file.service.filesharingvideocodec.config;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * FFmpeg binary configuration.
 * Only holds the path and timeout values.
 * Command building logic has been moved to FfmpegCommandBuilder.
 * Process execution logic has been moved to FfmpegExecutor (uses ProcessBuilder instead of commons-exec).
 */
@Configuration
@Data
public class FfmpegConfig {

    @Value("${video.encoding.ffmpeg.path:ffmpeg}")
    private String ffmpegPath;

    @Value("${video.encoding.ffmpeg.timeout:3600000}")
    private long ffmpegTimeout;
}
