package server.filesharingnotification.consumer;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.mail.MessagingException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import server.filesharingnotification.config.KafkaConfig;
import server.filesharingnotification.config.KafkaTopic;
import server.filesharingnotification.entity.dto.EmailSenderRequestDto;
import server.filesharingnotification.service.EmailService;

import java.util.List;

@Component
@RequiredArgsConstructor
public class EmailConsumer {

    private final EmailService emailService;
    private final ObjectMapper objectMapper;

    @KafkaListener(
            topics = KafkaTopic.EMAIL_TOPIC,
            groupId = KafkaConfig.GROUP_ID_CONFIG,
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(EmailSenderRequestDto messages) throws JsonProcessingException {

            try {
                emailService.sendDownloadLinkViaEmail(messages);
            } catch (MessagingException ignored) {}

    }
}
