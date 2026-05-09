package com.file.service.filesharingimagecodec.config;

import lombok.Data;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "image.processing")
@Data
public class ImageProcessingConfig {

    @Value("${image.processing.is-test}")
    private boolean isTest;

    private KafkaConfig kafka;
    private VipsConfig vips;
    private OutputConfig output;
    private QueueConfig queue;
    private RetryConfig retry;
    private TempConfig temp;

    @Data
    public static class KafkaConfig {
        private String topic;
    }

    @Data
    public static class VipsConfig {
        private int largeImageThresholdMb;
        private int processingTimeoutSeconds;
    }

    @Data
    public static class OutputConfig {
        private int webpQuality;
        private boolean stripMetadata;
        private String bucket;
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
    public static class TempConfig {
        private String baseDir;
        private int cleanupAgeHours;
    }
}
