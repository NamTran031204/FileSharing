package com.file.service.filesharingvideocodec.listener;

import com.file.service.filesharingvideocodec.service.EncodingOrchestrationService;
import com.file.service.filesharingvideocodec.task.VideoEncodingTask;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.concurrent.Executor;

@Component
@Slf4j
@RequiredArgsConstructor
public class VideoEncodingKafkaListener {

    @Qualifier("videoEncodingExecutor")
    private final Executor videoEncodingExecutor;
    
    private final EncodingOrchestrationService orchestrationService;

    @KafkaListener(
        topics = "${video.encoding.kafka.topic}",
        groupId = "${spring.kafka.consumer.group-id}",
        containerFactory = "kafkaListenerContainerFactory"
    )
    public void onEncodingMessage(String presignedUrl, Acknowledgment acknowledgment) {
        log.info("Received encoding message from Kafka: {}...", maskUrl(presignedUrl));
        
        if (presignedUrl == null || presignedUrl.trim().isEmpty()) {
            log.warn("Received empty or null presigned URL, skipping...");
            acknowledgment.acknowledge();
            return;
        }
        
        try {
            VideoEncodingTask task = new VideoEncodingTask(
                presignedUrl, 
                acknowledgment, 
                orchestrationService
            );
            
            videoEncodingExecutor.execute(task);
            log.info("Encoding task submitted to executor for URL: {}...", maskUrl(presignedUrl));
            
        } catch (Exception e) {
            log.error("Failed to submit encoding task: {}", e.getMessage(), e);
            acknowledgment.nack(Duration.ZERO);
        }
    }

    private String maskUrl(String url) {
        if (url == null || url.length() < 50) {
            return url;
        }
        return url.substring(0, 50) + "...";
    }
}
