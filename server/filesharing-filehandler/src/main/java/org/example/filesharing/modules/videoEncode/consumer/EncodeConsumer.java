package org.example.filesharing.modules.videoEncode.consumer;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.entities.models.MetadataEntity;
import org.example.filesharing.modules.videoEncode.services.impl.FileDownloadService;
import org.example.filesharing.repositories.MetadataRepo;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class EncodeConsumer {

    private final FileDownloadService fileDownloadService;
    private final MetadataRepo metadataRepo;

    @KafkaListener(
            topics = "${kafka.topics.video_encode_topic: video_encode_topic}",
            groupId = "${spring.kafka.consumer.group-id}",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void videoEncodeConsumer(String objectName, Acknowledgment acknowledgment) {
        Optional<MetadataEntity> metadata = metadataRepo.findByObjectName(objectName);
        if (metadata.isEmpty()) {
            return;
        }
        MetadataEntity metadataEntity = metadata.get();

    }
}
