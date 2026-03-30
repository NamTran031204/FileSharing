package server.filesharingnotification.config;

import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import server.filesharingnotification.entity.dto.EmailSenderRequestDto;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Configuration
public class KafkaProducerConfig {

    @Bean
    public ProducerFactory<String, EmailSenderRequestDto> emailSenderProducerFactory() {
        Map<String, Object> props = initConfig();
        return new DefaultKafkaProducerFactory<>(props);
    }

    @Bean
    public KafkaTemplate<String, EmailSenderRequestDto> emailSenderKafkaTemplate() {
        return new KafkaTemplate<>(emailSenderProducerFactory());
    }

    public Map<String, Object> initConfig() {
        Map<String, Object> props = new HashMap<>();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, KafkaConfig.BOOTSTRAP_SERVERS_CONFIG);

        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, KafkaConfig.KEY_SERIALIZER_CLASS_CONFIG);
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, KafkaConfig.VALUE_SERIALIZER_CLASS_CONFIG);

        props.put(ProducerConfig.ACKS_CONFIG, KafkaConfig.ACKS_CONFIG);
        props.put(ProducerConfig.RETRIES_CONFIG, KafkaConfig.RETRIES_CONFIG);
        props.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, KafkaConfig.COMPRESSION_TYPE_CONFIG);

        props.put(ProducerConfig.LINGER_MS_CONFIG, KafkaConfig.LINGER_MS_CONFIG);
        props.put(ProducerConfig.BUFFER_MEMORY_CONFIG, KafkaConfig.BUFFER_MEMORY_CONFIG);
        props.put(ProducerConfig.BATCH_SIZE_CONFIG, KafkaConfig.BATCH_SIZE_CONFIG);

        // --- Timeouts ---
        props.put(ProducerConfig.MAX_BLOCK_MS_CONFIG, KafkaConfig.MAX_BLOCK_MS_CONFIG); // 10s
        props.put(ProducerConfig.REQUEST_TIMEOUT_MS_CONFIG, KafkaConfig.REQUEST_TIMEOUT_MS_CONFIG); // 30s cho 1 request
        props.put(ProducerConfig.DELIVERY_TIMEOUT_MS_CONFIG, KafkaConfig.DELIVERY_TIMEOUT_MS_CONFIG); // 30s để retry gửi message

        return props;
    }

}
