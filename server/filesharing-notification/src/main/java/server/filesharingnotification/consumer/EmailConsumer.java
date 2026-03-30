package server.filesharingnotification.consumer;

import lombok.RequiredArgsConstructor;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import server.filesharingnotification.entity.dto.EmailSenderRequestDto;
import server.filesharingnotification.service.EmailService;

import java.util.List;

@Component
@RequiredArgsConstructor
public class EmailConsumer {

    private final EmailService emailService;

    @KafkaListener(topics = "")
    public void consume(List<EmailSenderRequestDto> messages) {

    }
}
