package org.example.filesharing.jobs.kafka;

import org.example.filesharing.entities.dtos.file.EmailSenderRequestDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class EmailProducer {

    @Autowired
    private KafkaTemplate<String, EmailSenderRequestDto> emailSenderKafkaTemplate;

    @Value(value = "${kafka.topics.notification_email_sender}")
    private String notificationEmailSender;

    public void sendEmail(EmailSenderRequestDto email) {
        emailSenderKafkaTemplate.send(notificationEmailSender, email);
    }
}
