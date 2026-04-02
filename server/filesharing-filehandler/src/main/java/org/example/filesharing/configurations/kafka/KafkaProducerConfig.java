package org.example.filesharing.configurations.kafka;

import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.CommonClientConfigs;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.config.SaslConfigs;
import org.apache.kafka.common.security.plain.PlainLoginModule;
import org.apache.kafka.common.serialization.StringSerializer;
import org.example.filesharing.entities.dtos.file.EmailSenderRequestDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.core.ProducerFactory;
import org.springframework.kafka.support.serializer.JsonSerializer;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Configuration
public class KafkaProducerConfig {

    @Value(value = "${spring.kafka.bootstrap-servers}")
    private String bootstrapAddress;

    @Value(value = "${kafka.username}")
    private String kafkaUserName;

    @Value(value = "${kafka.password}")
    private String kafkaPassword;

    @Value(value = "${kafka.authen:true}")
    private boolean kafkaAuthen;

    @Value(value = "${spring.kafka.producer.acks}")
    private String acks;

    @Value(value = "${spring.kafka.producer.retries}")
    private String retries;

    @Value(value = "${spring.kafka.producer.batch-size}")
    private String batchSize;

    @Value(value = "${spring.kafka.producer.linger-ms}")
    private String lingerMs;

    @Value(value = "${spring.kafka.producer.buffer-memory}")
    private String bufferMemory;

    @Value(value = "${spring.kafka.producer.compression-type}")
    private String compressionType;

    @Value(value = "${spring.kafka.producer.properties.max.block.ms}")
    private String maxBlockMs;

    @Value(value = "${spring.kafka.producer.properties.request.timeout.ms}")
    private String requestTimeoutMs;

    @Value(value = "${spring.kafka.producer.properties.delivery.timeout.ms}")
    private String deliveryTimeoutMs;

    @Bean
    public ProducerFactory<String, EmailSenderRequestDto> emailSenderProducerFactory() {
        Map<String, Object> props = initConfig();
        props = specConfigProducer(props);
        return new DefaultKafkaProducerFactory<>(props);
    }

    @Bean
    public KafkaTemplate<String, EmailSenderRequestDto> emailSenderKafkaTemplate() {
        return new KafkaTemplate<>(emailSenderProducerFactory());
    }

    @Bean
    public ProducerFactory<String, String> videoEncodeProducerFactory() {
        Map<String, Object> props = initConfig();
        props = specConfigProducer(props);
        return new DefaultKafkaProducerFactory<>(props);
    }

    @Bean
    public KafkaTemplate<String, String> videoEncodeKafkaTemplate() {
        return new KafkaTemplate<>(videoEncodeProducerFactory());
    }

    public Map<String, Object> initConfig() {
        Map<String, Object> props = new HashMap<>();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapAddress);

        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, JsonSerializer.class);

        if (kafkaAuthen) {
            props.put(CommonClientConfigs.SECURITY_PROTOCOL_CONFIG, "SASL_PLAINTEXT");
            props.put(SaslConfigs.SASL_MECHANISM, "PLAIN");
            props.put(SaslConfigs.SASL_JAAS_CONFIG, String.format(
                    "%s required username=\"%s\" password=\"%s\";",
                    PlainLoginModule.class.getName(), kafkaUserName, kafkaPassword
            ));
        }

        return props;
    }

    public Map<String, Object> specConfigProducer(Map<String, Object> props) {
        props.put(ProducerConfig.ACKS_CONFIG, acks);
        props.put(ProducerConfig.RETRIES_CONFIG, retries);
        props.put(ProducerConfig.COMPRESSION_TYPE_CONFIG, compressionType);

        props.put(ProducerConfig.LINGER_MS_CONFIG, lingerMs);
        props.put(ProducerConfig.BUFFER_MEMORY_CONFIG, bufferMemory);
        props.put(ProducerConfig.BATCH_SIZE_CONFIG, batchSize);

        // --- Timeouts ---
        props.put(ProducerConfig.MAX_BLOCK_MS_CONFIG, maxBlockMs); // 10s
        props.put(ProducerConfig.REQUEST_TIMEOUT_MS_CONFIG, requestTimeoutMs); // 30s cho 1 request
        props.put(ProducerConfig.DELIVERY_TIMEOUT_MS_CONFIG, deliveryTimeoutMs); // 30s để retry gửi message

        return props;
    }

}
