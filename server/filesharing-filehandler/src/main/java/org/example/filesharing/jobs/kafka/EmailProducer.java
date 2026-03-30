package org.example.filesharing.jobs.kafka;

import org.example.filesharing.configurations.kafka.KafkaTopic;
import org.example.filesharing.entities.dtos.file.EmailSenderRequestDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class EmailProducer {

    @Autowired
    private KafkaTemplate<String, EmailSenderRequestDto> emailSenderKafkaTemplate;

    public void sendEmail(EmailSenderRequestDto email) {
        emailSenderKafkaTemplate.send(KafkaTopic.EMAIL_TOPIC, email);
    }
}
