package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.jobs.kafka.ImageEncodeProducer;
import org.example.filesharing.jobs.kafka.VideoEncodeProducer;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("api/test")
@RequiredArgsConstructor
@Slf4j
public class Test {

    private final VideoEncodeProducer videoEncodeProducer;
    private final ImageEncodeProducer imageEncodeProducer;

    /**
     * Test endpoint to trigger video encoding.
     * Sends a JSON encode request to Kafka with a random jobId.
     * In test mode (is-test: true), the videocodec service ignores inputKey
     * and uses hardcoded local file path instead.
     */
    @GetMapping(value = "/encode-video")
    public ResponseEntity<Map<String, String>> encodeVideo() {
        String jobId = UUID.randomUUID().toString();
        String inputKey = "test/activity.mp4";  // Ignored in test mode

        try {
            videoEncodeProducer.sendEncodeRequest(jobId, inputKey);
            log.info("Test encode request sent: jobId={}", jobId);

            return ResponseEntity.ok(Map.of(
                    "status", "SENT",
                    "jobId", jobId,
                    "message", "Encode request published to Kafka"
            ));
        } catch (Exception e) {
            log.error("Failed to send test encode request: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "ERROR",
                    "message", e.getMessage()
            ));
        }
    }

    @GetMapping(value = "/image-process")
    public ResponseEntity<Map<String, String>> imageProcess() {
        String jobId = UUID.randomUUID().toString();
        String inputKey = "test/activity.mp4";  // Ignored in test mode

        try {
            imageEncodeProducer.sendKafka(jobId, inputKey);
            log.info("Test encode request sent: jobId={}", jobId);

            return ResponseEntity.ok(Map.of(
                    "status", "SENT",
                    "jobId", jobId,
                    "message", "Encode request published to Kafka"
            ));
        } catch (Exception e) {
            log.error("Failed to send test encode request: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                    "status", "ERROR",
                    "message", e.getMessage()
            ));
        }
    }
}
