package com.file.service.filesharingvideocodec.task;

import com.file.service.filesharingvideocodec.dto.EncodingResult;
import com.file.service.filesharingvideocodec.exception.EncodingException;
import com.file.service.filesharingvideocodec.service.EncodingOrchestrationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.support.Acknowledgment;

import java.time.Duration;

@Slf4j
public class VideoEncodingTask implements Runnable {

    private final String presignedUrl;
    private final Acknowledgment acknowledgment;
    private final EncodingOrchestrationService orchestrationService;

    public VideoEncodingTask(String presignedUrl, 
                            Acknowledgment acknowledgment,
                            EncodingOrchestrationService orchestrationService) {
        this.presignedUrl = presignedUrl;
        this.acknowledgment = acknowledgment;
        this.orchestrationService = orchestrationService;
    }

    @Override
    public void run() {
        long startTime = System.currentTimeMillis();
        log.info("Starting encoding task for URL: {}...", maskUrl(presignedUrl));
        
        try {
            EncodingResult result = orchestrationService.processVideoEncoding(presignedUrl);
            
            if ("SUCCESS".equals(result.getStatus())) {
                log.info("Encoding task completed successfully. JobId: {}, Duration: {}ms", 
                         result.getJobId(), result.getTotalDurationMs());
                acknowledgment.acknowledge();
            } else {
                log.error("Encoding task failed. JobId: {}, Error: {}", 
                         result.getJobId(), result.getErrorMessage());
                acknowledgment.nack(Duration.ZERO);
            }
            
        } catch (EncodingException e) {
            log.error("Encoding task failed with exception: {}", e.getMessage(), e);
            acknowledgment.nack(Duration.ZERO);
            
        } catch (Exception e) {
            log.error("Unexpected error in encoding task: {}", e.getMessage(), e);
            acknowledgment.nack(Duration.ZERO);
            
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            log.info("Encoding task finished. Total duration: {}ms", duration);
        }
    }

    private String maskUrl(String url) {
        if (url == null || url.length() < 50) {
            return url;
        }
        return url.substring(0, 50) + "...";
    }
}
