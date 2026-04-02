package server.filesharingnotification.consumer;

import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;
import server.filesharingnotification.entity.dto.EmailSenderRequestDto;
import server.filesharingnotification.service.EmailService;

@Slf4j
@Component
@RequiredArgsConstructor
public class EmailConsumer {

    private final EmailService emailService;

    @KafkaListener(
            topics = "${kafka.topics.notification_email_sender:notification_email_sender}",
            groupId = "${spring.kafka.consumer.group-id:notification}",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(EmailSenderRequestDto messages, Acknowledgment acknowledgment) {
        try {
            log.info("Starting to send email");
            emailService.sendDownloadLinkViaEmail(messages);

            acknowledgment.acknowledge();
            log.info("Message acknowledged successfully for: {}", messages.getToEmail());
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", messages.getToEmail(), e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error processing message: {}", e.getMessage(), e);
            acknowledgment.acknowledge();
        }
    }
}
