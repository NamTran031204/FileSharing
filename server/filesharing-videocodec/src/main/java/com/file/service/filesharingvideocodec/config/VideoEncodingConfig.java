package com.file.service.filesharingvideocodec.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@ConfigurationProperties(prefix = "video.encoding")
@Data
public class VideoEncodingConfig {

    private boolean isTest;

    private FfmpegConfig ffmpeg;
    private KafkaConfig kafka;
    private SegmentConfig segment;
    private List<String> profiles;
    private BulkheadConfig bulkhead;
    private QueueConfig queue;
    private RetryConfig retry;
    private UploadConfig upload;
    private TempConfig temp;
    private OutputConfig output;

    @Data
    public static class FfmpegConfig {
        private String path;
        private long timeout;
        private int threadsPerProcess;
        private int crf;
        private String preset;
    }

    @Data
    public static class KafkaConfig {
        private String topic;
    }

    @Data
    public static class SegmentConfig {
        private int duration;
        private String audioBitrate;
    }

    @Data
    public static class BulkheadConfig {
        private int maxConcurrent;
    }

    @Data
    public static class QueueConfig {
        private int maxCapacity;
    }

    @Data
    public static class RetryConfig {
        private int maxAttempts;
        private int initialDelaySeconds;
        private double multiplier;
    }

    @Data
    public static class UploadConfig {
        private int batchSize;
    }

    @Data
    public static class TempConfig {
        private String baseDir;
        private int cleanupAgeHours;
    }

    @Data
    public static class OutputConfig {
        private String bucket;
    }
}
