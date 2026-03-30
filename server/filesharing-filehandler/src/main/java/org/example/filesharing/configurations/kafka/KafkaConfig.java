package org.example.filesharing.configurations.kafka;

import com.fasterxml.jackson.databind.JsonSerializer;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;

public final class KafkaConfig {

    public static final String GROUP_ID_CONFIG = "filehandler_file_sharing";

    public static final String BOOTSTRAP_SERVERS_CONFIG = "localhost:9092";
    public static final Object KEY_SERIALIZER_CLASS_CONFIG = StringSerializer.class;
    public static final Object VALUE_SERIALIZER_CLASS_CONFIG = JsonSerializer.class;

    public static final String ACKS_CONFIG = "1";
    public static final Integer RETRIES_CONFIG = 5;
    public static final Integer BATCH_SIZE_CONFIG = 16384; // 16KB
    public static final Integer LINGER_MS_CONFIG = 5;
    public static final Integer BUFFER_MEMORY_CONFIG = 67108864; // 64Mb

    public static final String COMPRESSION_TYPE_CONFIG = "lz4";

    public static final Integer MAX_BLOCK_MS_CONFIG = 10000;
    public static final Integer REQUEST_TIMEOUT_MS_CONFIG = 20000;
    public static final Integer DELIVERY_TIMEOUT_MS_CONFIG = 30000;

    // =========== Consumer =================
    public static final Object KEY_DESERIALIZER_CLASS_CONFIG = StringDeserializer.class;
    public static final Object VALUE_DESERIALIZER_CLASS_CONFIG = StringDeserializer.class;

}
