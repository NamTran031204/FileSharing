package com.file.service.filesharingimagecodec.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.file.service.filesharingimagecodec.consumer.dto.ImageJobMessage;
import com.file.service.filesharingimagecodec.job.JobService;
import com.file.service.filesharingimagecodec.job.queue.JobQueue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

/**
 * Kafka consumer for image processing requests.
 * Receives JSON message, persists job to MongoDB, enqueues for processing.
 * Only commits offset after successful persist + enqueue.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class ImageJobConsumer {

    private final JobService jobService;
    private final JobQueue jobQueue;
    private final ObjectMapper objectMapper;

    @KafkaListener(
            topics = "${image.processing.kafka.topic}",
            groupId = "${spring.kafka.consumer.group-id}",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void onMessage(String message, Acknowledgment acknowledgment) {
        log.info("Received image job from Kafka: {}",
                message.length() > 100 ? message.substring(0, 100) + "..." : message);

        try {
            ImageJobMessage request = objectMapper.readValue(message, ImageJobMessage.class);

            if (request.getJobId() == null || request.getJobId().isBlank()) {
                log.warn("Received message with null/empty jobId, skipping");
                acknowledgment.acknowledge();
                return;
            }

            // Idempotency check + persist
            boolean isNew = jobService.createJobIfAbsent(request);
            if (!isNew) {
                log.info("Duplicate job {}, acknowledging and skipping", request.getJobId());
                acknowledgment.acknowledge();
                return;
            }

            // Enqueue for processing
            boolean enqueued = jobQueue.offer(request.getJobId());
            if (!enqueued) {
                log.warn("JobQueue full, NOT acknowledging message for job {}", request.getJobId());
                return;
            }

            acknowledgment.acknowledge();
            log.info("Image job {} persisted and enqueued successfully", request.getJobId());

        } catch (Exception e) {
            log.error("Failed to process image job request: {}", e.getMessage(), e);
        }
    }
}
