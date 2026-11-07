package org.example.filesharing.jobs.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.file.service.filesharing.core.job.relay.JobResultMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.services.JobResultService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

/**
 * Consumer duy nhat cua ket qua job. Exception duoc nem lai de DefaultErrorHandler retry (khong ack khi loi).
 */
@Component
@Slf4j
@RequiredArgsConstructor
public class JobResultConsumer {

    private final ObjectMapper objectMapper;
    private final JobResultService jobResultService;

    @KafkaListener(
            topics = "${kafka.topics.job_result_topic}",
            groupId = "${spring.kafka.consumer.group-id}",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void onMessage(String message, Acknowledgment acknowledgment) throws Exception {
        JobResultMessage result = objectMapper.readValue(message, JobResultMessage.class);
        jobResultService.apply(result);
        acknowledgment.acknowledge();
    }
}
