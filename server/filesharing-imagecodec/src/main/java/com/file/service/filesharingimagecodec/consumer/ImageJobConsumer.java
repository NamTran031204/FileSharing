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
        log.info("da nhan job anh tu Kafka: {}",
                message.length() > 100 ? message.substring(0, 100) + "..." : message);

        try {
            ImageJobMessage request = objectMapper.readValue(message, ImageJobMessage.class);

            if (request.getJobId() == null || request.getJobId().isBlank()) {
                log.warn("da nhan thong bao co jobId null/trong, bo qua");
                acknowledgment.acknowledge();
                return;
            }

            // kiểm tra tính luỹ đẳng + lưu trữ
            boolean isNew = jobService.createJobIfAbsent(request);
            if (!isNew) {
                log.info("job trung lap {}, xac nhan va bo qua", request.getJobId());
                acknowledgment.acknowledge();
                return;
            }

            // đưa vào hàng đợi để xử lý
            boolean enqueued = jobQueue.offer(request.getJobId());
            if (!enqueued) {
                log.warn("JobQueue da day, khong xac nhan thong bao cho job {}", request.getJobId());
                return;
            }

            acknowledgment.acknowledge();
            log.info("job anh {} duoc luu tru va dua vao hang doi thanh cong", request.getJobId());

        } catch (Exception e) {
            log.error("khong the xu ly yeu cau job anh: {}", e.getMessage(), e);
        }
    }
}
