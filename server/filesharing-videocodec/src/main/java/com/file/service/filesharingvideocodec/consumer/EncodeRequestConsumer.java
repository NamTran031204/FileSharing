package com.file.service.filesharingvideocodec.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.file.service.filesharingvideocodec.consumer.dto.EncodeRequestMessage;
import com.file.service.filesharingvideocodec.job.JobService;
import com.file.service.filesharingvideocodec.job.queue.JobQueue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

/**
 * Kafka consumer for video encoding requests.
 * Receives JSON message, persists job to MongoDB, enqueues for processing.
 * Only commits offset after successful persist + enqueue.
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class EncodeRequestConsumer {

    private final JobService jobService;
    private final JobQueue jobQueue;
    private final ObjectMapper objectMapper;

    @KafkaListener(
            topics = "${video.encoding.kafka.topic}",
            groupId = "${spring.kafka.consumer.group-id}",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void onMessage(String message, Acknowledgment acknowledgment) {
        log.info("Received encode request from Kafka: {}",
                message.length() > 100 ? message.substring(0, 100) + "..." : message);

        try {
            // Deserialize JSON message
            EncodeRequestMessage request = objectMapper.readValue(message, EncodeRequestMessage.class);

            if (request.getJobId() == null || request.getJobId().isBlank()) {
                log.warn("Received message with null/empty jobId, skipping");
                acknowledgment.acknowledge();
                return;
            }

            // Idempotency check + persist
            boolean isNew = jobService.createJobIfAbsent(request);
            if (!isNew) {
                // Job already exists — commit offset and skip
                log.info("Duplicate job {}, acknowledging and skipping", request.getJobId());
                acknowledgment.acknowledge();
                return;
            }

            // Enqueue for processing
            boolean enqueued = jobQueue.offer(request.getJobId());
            if (!enqueued) {
                // Queue full — do NOT commit offset → Kafka back-pressure
                log.warn("JobQueue full, NOT acknowledging message for job {}", request.getJobId());
                return;
            }

            // All good — commit offset
            acknowledgment.acknowledge();
            log.info("Job {} persisted and enqueued successfully", request.getJobId());

        } catch (Exception e) {
            log.error("Failed to process encode request: {}", e.getMessage(), e);
            // Do NOT acknowledge — let Kafka redeliver
        }
    }
}
