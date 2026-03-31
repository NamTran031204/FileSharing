package server.filesharingnotification.config;

import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.CommonClientConfigs;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.config.SaslConfigs;
import org.apache.kafka.common.security.plain.PlainLoginModule;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.listener.ContainerProperties;
import org.springframework.kafka.support.serializer.ErrorHandlingDeserializer;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import server.filesharingnotification.entity.dto.EmailSenderRequestDto;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Configuration
public class KafkaConsumerConfig {

    @Value(value = "${spring.kafka.bootstrap-servers}")
    private String bootstrapAddress;

    @Value(value = "${kafka.username}")
    private String kafkaUserName;

    @Value(value = "${kafka.password}")
    private String kafkaPassword;

    @Value(value = "${kafka.authen:true}")
    private boolean kafkaAuthen;

    @Value(value = "${spring.kafka.consumer.group-id}")
    private String kafkaGroupId;

    @Value(value = "${spring.kafka.consumer.enable-auto-commit:false}")
    private boolean enableAutoCommit;

    @Value(value = "${spring.kafka.consumer.auto-offset-reset:latest}")
    private String autoOffsetReset;

    @Value(value = "${spring.kafka.listener.concurrency:1}")
    private Integer concurrency;

    @Bean
    public ConsumerFactory<String, EmailSenderRequestDto> consumerFactory() {
        Map<String, Object> props = configProps();
        return new DefaultKafkaConsumerFactory<>(props);
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, EmailSenderRequestDto> kafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, EmailSenderRequestDto> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(consumerFactory());
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL);
        factory.setConcurrency(concurrency);
        return factory;
    }

    private Map<String, Object> configProps() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapAddress);

        props.put(ConsumerConfig.GROUP_ID_CONFIG, kafkaGroupId);

        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        // Use ErrorHandlingDeserializer to surface serialization errors as recoverable
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, ErrorHandlingDeserializer.class);
        props.put(ErrorHandlingDeserializer.VALUE_DESERIALIZER_CLASS, JsonDeserializer.class);
        props.put(JsonDeserializer.VALUE_DEFAULT_TYPE, EmailSenderRequestDto.class);
        props.put(JsonDeserializer.TRUSTED_PACKAGES, "server.filesharingnotification.entity.dto,org.example.filesharing.entities.dtos.file");
        props.put(JsonDeserializer.USE_TYPE_INFO_HEADERS, false);
        props.put(JsonDeserializer.REMOVE_TYPE_INFO_HEADERS, false);

        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, enableAutoCommit);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, autoOffsetReset);

        if (kafkaAuthen) {
            props.put(CommonClientConfigs.SECURITY_PROTOCOL_CONFIG, "SASL_PLAINTEXT");
            props.put(SaslConfigs.SASL_MECHANISM, "PLAIN");
            props.put(SaslConfigs.SASL_JAAS_CONFIG, String.format(
                    "%s required username=\"%s\" password=\"%s\";",
                    PlainLoginModule.class.getName(), kafkaUserName, kafkaPassword
            ));
        }

        props.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, "30000");

        return props;
    }
}
