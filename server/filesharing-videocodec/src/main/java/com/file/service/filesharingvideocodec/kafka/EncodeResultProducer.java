package com.file.service.filesharingvideocodec.kafka;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.file.service.filesharingvideocodec.config.VideoEncodingConfig;
import com.file.service.filesharingvideocodec.kafka.dto.EncodeResultMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class EncodeResultProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final VideoEncodingConfig videoEncodingConfig;

    public void sendResult(EncodeResultMessage message) {
        String topic = videoEncodingConfig.getKafka() != null
                ? videoEncodingConfig.getKafka().getResultTopic()
                : null;

        if (topic == null || topic.isBlank()) {
            log.warn("Encode result topic not configured, skipping publish for job {}", message.getJobId());
            return;
        }

        try {
            String json = objectMapper.writeValueAsString(message);
            kafkaTemplate.send(topic, message.getJobId(), json);
            log.info("Published encode result: jobId={}, status={}", message.getJobId(), message.getStatus());
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize encode result for job {}: {}", message.getJobId(), e.getMessage(), e);
        }
    }
}
