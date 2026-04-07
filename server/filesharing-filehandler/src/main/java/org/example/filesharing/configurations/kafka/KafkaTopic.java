package org.example.filesharing.configurations.kafka;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopic {

    @Value(value = "${kafka.topics.notification_email_sender}")
    private String notificationEmailSender;

    @Value(value = "${kafka.topics.video_encode_topic}")
    private String videoEncodeTopic;

    @Bean
    public NewTopic emailSenderTopic() {
        return TopicBuilder.name(notificationEmailSender)
                .partitions(1)
                .replicas(1)      // 1 bản sao (dev). Production: 3.
                .build();
    }

    @Bean
    public NewTopic videoEncodeTopic() {
        return TopicBuilder.name(videoEncodeTopic)
                .partitions(1)
                .replicas(1)
                .build();
    }
}
