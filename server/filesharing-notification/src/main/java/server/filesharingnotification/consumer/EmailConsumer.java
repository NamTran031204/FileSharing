package server.filesharingnotification.consumer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import server.filesharingnotification.entity.dto.EmailSenderRequestDto;
import server.filesharingnotification.service.EmailService;

@Component
@RequiredArgsConstructor
public class EmailConsumer {

    @Value(value = "${kafka.topics.notification_email_sender}")
    private String emailSenderTopic;

    @Value(value = "${spring.kafka.consumer.group-id}")
    private String groupIdKafka;

    private final EmailService emailService;

    @KafkaListener(
            topics = "notification_email_sender",
            groupId = "notification",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(EmailSenderRequestDto messages) throws JsonProcessingException {

            try {
                emailService.sendDownloadLinkViaEmail(messages);
            } catch (MessagingException ignored) {}

    }
}
