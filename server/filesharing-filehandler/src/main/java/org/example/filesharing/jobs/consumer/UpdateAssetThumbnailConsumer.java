package org.example.filesharing.jobs.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.file.service.filesharing.core.entity.models.AssetEntity;
import com.file.service.filesharing.core.entity.models.MetadataEntity;
import com.file.service.filesharing.core.enums.ProcessingStatus;
import org.example.filesharing.jobs.consumer.dto.ImageProcessResultMessage;
import org.example.filesharing.repositories.AssetRepo;
import org.example.filesharing.repositories.MetadataRepo;
import org.example.filesharing.services.SseService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
public class UpdateAssetThumbnailConsumer {

    private final ObjectMapper objectMapper;
    private final MetadataRepo metadataRepo;
    private final AssetRepo assetRepo;
    private final SseService sseService;

    @KafkaListener(
            topics = "${kafka.topics.image_process_result_topic}",
            groupId = "${spring.kafka.consumer.group-id}",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void onMessage(String message, Acknowledgment acknowledgment) {
        try {
            ImageProcessResultMessage result = objectMapper.readValue(message, ImageProcessResultMessage.class);

            if (result.getMetadataId() == null || result.getMetadataId().isBlank()) {
                log.warn("image result missing metadataId, skipping");
                acknowledgment.acknowledge();
                return;
            }

            MetadataEntity metadata = metadataRepo.findById(result.getMetadataId()).orElse(null);
            if (metadata == null) {
                log.warn("no metadata found for id {}, skipping", result.getMetadataId());
                acknowledgment.acknowledge();
                return;
            }

            applyUpdate(metadata, result);
            metadataRepo.save(metadata);

            pushSseEvent(metadata, result);

            acknowledgment.acknowledge();
        } catch (Exception e) {
            log.error("failed to process image result: {}", e.getMessage(), e);
        }
    }

    private void applyUpdate(MetadataEntity metadata, ImageProcessResultMessage result) {
        if ("READY".equals(result.getStatus())) {
            metadata.setProcessingStatus(ProcessingStatus.READY);
            metadata.setThumbnailUrl(result.getThumbnailUrl());
            metadata.setProcessingCompleteAt(result.getCompletedAt() != null ? result.getCompletedAt() : Instant.now());
            metadata.setProcessingError(null);
        } else if ("FAILED".equals(result.getStatus())) {
            metadata.setProcessingStatus(ProcessingStatus.FAILED);
            metadata.setProcessingCompleteAt(result.getCompletedAt() != null ? result.getCompletedAt() : Instant.now());
            metadata.setProcessingError(result.getErrorMessage());
        }
    }

    private void pushSseEvent(MetadataEntity metadata, ImageProcessResultMessage result) {
        AssetEntity asset = assetRepo.findById(metadata.getAssetId()).orElse(null);
        if (asset == null || asset.getFolderId() == null) return;

        Map<String, Object> event = new HashMap<>();
        event.put("assetId", metadata.getAssetId());
        event.put("newStatus", metadata.getProcessingStatus());
        event.put("thumbnailUrl", metadata.getThumbnailUrl());

        sseService.sendAssetStatusUpdate(asset.getFolderId(), event);
    }
}
