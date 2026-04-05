package com.file.service.filesharingvideocodec.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.List;
import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@Configuration
@ConfigurationProperties(prefix = "video.encoding")
@Data
public class VideoEncodingConfig {
    
    private KafkaConfig kafka;
    private SegmentConfig segment;
    private List<String> profiles;
    private RetryConfig retry;
    private ThreadPoolConfig threadPool;
    private String tempDir;
    private OutputConfig output;

    @Bean(name = "videoEncodingExecutor")
    public Executor videoEncodingExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(threadPool.getCoreSize());
        executor.setMaxPoolSize(threadPool.getMaxSize());
        executor.setQueueCapacity(threadPool.getQueueCapacity());
        executor.setThreadNamePrefix(threadPool.getThreadNamePrefix());
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);
        executor.initialize();
        return executor;
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
    public static class RetryConfig {
        private int maxAttempts;
        private long delayMs;
    }

    @Data
    public static class ThreadPoolConfig {
        private int coreSize;
        private int maxSize;
        private int queueCapacity;
        private String threadNamePrefix;
    }

    @Data
    public static class OutputConfig {
        private String bucket;
    }
}
