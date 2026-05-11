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
 * consumer Kafka cho các yêu cầu mã hoá video.
 * nhận thông báo JSON, lưu trữ job vào MongoDB, đưa vào hàng đợi để xử lý.
 * chỉ commit offset sau khi lưu trữ + đưa vào hàng đợi thành công.
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
        log.info("da nhan yeu cau ma hoa tu Kafka: {}",
                message.length() > 100 ? message.substring(0, 100) + "..." : message);

        try {
            // giải mã thông báo JSON
            EncodeRequestMessage request = objectMapper.readValue(message, EncodeRequestMessage.class);

            if (request.getJobId() == null || request.getJobId().isBlank()) {
                log.warn("da nhan thong bao co jobId null/trong, bo qua");
                acknowledgment.acknowledge();
                return;
            }

            // kiểm tra tính luỹ đẳng + lưu trữ
            boolean isNew = jobService.createJobIfAbsent(request);
            if (!isNew) {
                // job đã tồn tại — commit offset và bỏ qua
                log.info("job trung lap {}, xac nhan va bo qua", request.getJobId());
                acknowledgment.acknowledge();
                return;
            }

            // đưa vào hàng đợi để xử lý
            boolean enqueued = jobQueue.offer(request.getJobId());
            if (!enqueued) {
                // hàng đợi đầy — KHÔNG commit offset → áp lực ngược Kafka
                log.warn("JobQueue da day, khong xac nhan thong bao cho job {}", request.getJobId());
                return;
            }

            // tất cả đều ổn — commit offset
            acknowledgment.acknowledge();
            log.info("job {} duoc luu tru va dua vao hang doi thanh cong", request.getJobId());

        } catch (Exception e) {
            log.error("khong the xu ly yeu cau ma hoa: {}", e.getMessage(), e);
            // KHÔNG xác nhận — để Kafka gửi lại
        }
    }
}
