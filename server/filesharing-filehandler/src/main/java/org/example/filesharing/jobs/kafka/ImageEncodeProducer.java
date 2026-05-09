package org.example.filesharing.jobs.kafka;

import com.fasterxml.jackson.core.JsonProcessingException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class ImageEncodeProducer {

    @Autowired
    KafkaTemplate<String, Object> imageProcessKafkaTemplate;

    @Value(value = "${kafka.topics.image_process_topic}")
    private String imageProcessTopic;


    public void sendKafka(String jobId, String inputKey) {
        Map<String, Object> message = new HashMap<>();
        message.put("jobId", jobId);
        message.put("inputKey", inputKey);
        message.put("outputPrefix", null);
        message.put("thumbnailWidth", 200);
        message.put("quality", 200);
        message.put("submittedAt", Instant.now());

        imageProcessKafkaTemplate.send(imageProcessTopic, jobId, message);
        log.info("Sent encode request to Kafka: jobId={}, inputKey={}", jobId, inputKey);
    }
}
