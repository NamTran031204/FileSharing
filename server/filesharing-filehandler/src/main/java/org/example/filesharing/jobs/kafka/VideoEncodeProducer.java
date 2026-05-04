package org.example.filesharing.jobs.kafka;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
public class VideoEncodeProducer {

    @Autowired
    KafkaTemplate<String, String> videoEncodeKafkaTemplate;

    @Autowired
    ObjectMapper objectMapper;

    @Value(value = "${kafka.topics.video_encode_topic}")
    private String topic;

    /**
     * Send an encode request as JSON to Kafka.
     *
     * @param jobId    unique job identifier (UUID)
     * @param inputKey MinIO object key of the source video
     */
    public void sendEncodeRequest(String jobId, String inputKey) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("jobId", jobId);
            message.put("inputKey", inputKey);
            message.put("callbackUrl", null);
            message.put("submittedAt", Instant.now().toString());

            String json = objectMapper.writeValueAsString(message);
            videoEncodeKafkaTemplate.send(topic, jobId, json);
            log.info("Sent encode request to Kafka: jobId={}, inputKey={}", jobId, inputKey);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize encode request: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to serialize encode request", e);
        }
    }

    /**
     * @deprecated Use {@link #sendEncodeRequest(String, String)} instead.
     */
    @Deprecated
    public void sendPreSignedUrlViaKafka(String url) {
        videoEncodeKafkaTemplate.send(topic, url);
    }
}
