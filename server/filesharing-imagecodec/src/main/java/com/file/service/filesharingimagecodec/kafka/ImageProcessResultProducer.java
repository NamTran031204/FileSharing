package com.file.service.filesharingimagecodec.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.file.service.filesharingimagecodec.kafka.dto.ImageProcessResultMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
@Slf4j
@RequiredArgsConstructor
public class ImageProcessResultProducer {

    @Value("${kafka.topics.image_process_result_topic}")
    private String resultTopic;

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void sendCompleted(String jobId, String assetId, String metadataId, String objectName, String thumbnailUrl) {
        ImageProcessResultMessage msg = ImageProcessResultMessage.builder()
                .jobId(jobId)
                .assetId(assetId)
                .metadataId(metadataId)
                .objectName(objectName)
                .status("READY")
                .thumbnailUrl(thumbnailUrl)
                .completedAt(Instant.now())
                .build();
        send(assetId, msg);
    }

    public void sendFailed(String jobId, String assetId, String metadataId, String errorMessage) {
        ImageProcessResultMessage msg = ImageProcessResultMessage.builder()
                .jobId(jobId)
                .assetId(assetId)
                .metadataId(metadataId)
                .status("FAILED")
                .errorMessage(errorMessage)
                .completedAt(Instant.now())
                .build();
        send(assetId, msg);
    }

    private void send(String key, ImageProcessResultMessage msg) {
        try {
            String json = objectMapper.writeValueAsString(msg);
            kafkaTemplate.send(resultTopic, key != null ? key : msg.getJobId(), json);
            log.info("published image result [{}] for asset {}", msg.getStatus(), msg.getAssetId());
        } catch (Exception e) {
            log.error("failed to publish image result for job {}: {}", msg.getJobId(), e.getMessage(), e);
        }
    }
}
