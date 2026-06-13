package org.example.filesharing.jobs.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.file.service.filesharing.core.entity.models.MediaRenditionEntity;
import com.file.service.filesharing.core.entity.models.MetadataEntity;
import com.file.service.filesharing.core.enums.ProcessingStatus;
import com.file.service.filesharing.core.enums.RenditionStatus;
import com.file.service.filesharing.core.enums.RenditionType;
import org.example.filesharing.jobs.consumer.dto.EncodeResultMessage;
import org.example.filesharing.repositories.MediaRenditionRepo;
import org.example.filesharing.repositories.MetadataRepo;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
@Slf4j
@RequiredArgsConstructor
public class VideoEncodeResultConsumer {

    private final ObjectMapper objectMapper;
    private final MetadataRepo metadataRepo;
    private final MediaRenditionRepo mediaRenditionRepo;

    @KafkaListener(
            topics = "${kafka.topics.video_encode_result_topic}",
            groupId = "${spring.kafka.consumer.group-id}",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void onMessage(String message, Acknowledgment acknowledgment) {
        try {
            EncodeResultMessage result = objectMapper.readValue(message, EncodeResultMessage.class);

            if (result.getJobId() == null || result.getJobId().isBlank()) {
                log.warn("Received encode result with null/empty jobId, skipping");
                acknowledgment.acknowledge();
                return;
            }

            MetadataEntity version = metadataRepo.findById(result.getJobId()).orElse(null);
            if (version == null) {
                log.warn("No metadata found for encode job {}, skipping", result.getJobId());
                acknowledgment.acknowledge();
                return;
            }

            applyProcessingUpdate(version, result);
            metadataRepo.save(version);

            acknowledgment.acknowledge();
        } catch (Exception e) {
            log.error("Failed to process encode result: {}", e.getMessage(), e);
            // Do not acknowledge to allow retry
        }
    }

    private void applyProcessingUpdate(MetadataEntity version, EncodeResultMessage result) {
        String status = result.getStatus();
        if (status == null) {
            return;
        }

        switch (status) {
            case "PROCESSING" -> {
                version.setProcessingStatus(ProcessingStatus.PROCESSING);
                if (version.getProcessingStartAt() == null) {
                    version.setProcessingStartAt(firstNonNull(result.getStartedAt(), Instant.now()));
                }
            }
            case "COMPLETED" -> {
                version.setProcessingStatus(ProcessingStatus.READY);
                version.setProcessingCompleteAt(firstNonNull(result.getCompletedAt(), Instant.now()));
                version.setProcessingError(null);
                upsertHlsRendition(version, result);
            }
            case "FAILED" -> {
                version.setProcessingStatus(ProcessingStatus.FAILED);
                version.setProcessingCompleteAt(firstNonNull(result.getCompletedAt(), Instant.now()));
                version.setProcessingError(result.getErrorMessage());
            }
            default -> {
                // Ignore unknown status
            }
        }
    }

    private void upsertHlsRendition(MetadataEntity version, EncodeResultMessage result) {
        String playlistKey = result.getPlaylistKey();
        if (playlistKey == null || playlistKey.isBlank()) {
            return;
        }

        MediaRenditionEntity rendition = mediaRenditionRepo
                .findFirstByMetadataIdAndRenditionType(version.getFileId(), RenditionType.HLS)
                .orElseGet(MediaRenditionEntity::new);

        rendition.setMetadataId(version.getFileId());
        rendition.setAssetId(version.getAssetId());
        rendition.setRenditionType(RenditionType.HLS);
        rendition.setProfile("ORIGINAL");
        rendition.setManifestKey(playlistKey);
        rendition.setSegmentPathPrefix(extractSegmentPrefix(playlistKey));
        rendition.setStatus(RenditionStatus.READY);

        mediaRenditionRepo.save(rendition);

        long renditionCount = mediaRenditionRepo.countByMetadataId(version.getFileId());
        version.setRenditionCount((int) renditionCount);
    }

    private String extractSegmentPrefix(String playlistKey) {
        int idx = playlistKey.lastIndexOf('/');
        if (idx < 0) {
            return null;
        }
        return playlistKey.substring(0, idx + 1);
    }

    private Instant firstNonNull(Instant value, Instant fallback) {
        return value != null ? value : fallback;
    }
}
