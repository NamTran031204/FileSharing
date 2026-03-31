package server.filesharingnotification.config;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopic {

    @Value(value = "${kafka.topics.notification_email_sender}")
    private String notificationEmailSender;

    @Bean
    public NewTopic forbiddenTransportScanTopic() {
        return TopicBuilder.name(notificationEmailSender)
                .partitions(1)    // 8 partition
                .replicas(1)      // 1 bản sao (dev). Production: 3.
                .build();
    }
}
