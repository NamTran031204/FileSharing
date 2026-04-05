# Hướng dẫn Cấu hình Kafka cho Dự án Mới - Từ A đến Z

**Tài liệu này dành cho người mới bắt đầu với Kafka.** Bạn sẽ học được cách cấu hình Kafka từ các khái niệm cốt lõi, qua cấu hình ứng dụng, cho đến viết Producer/Consumer chạy thực tế. Ví dụ được lấy từ các dự án thực tế trong hệ thống.

---

## Mục lục
1. [Kafka là gì? Tại sao cần nó?](#kafka-là-gì-tại-sao-cần-nó)
2. [Kiến trúc và các thành phần](#kiến-trúc-và-các-thành-phần)
3. [Cấu hình Kafka cơ bản](#cấu-hình-kafka-cơ-bản)
4. [Cấu hình Producer](#cấu-hình-producer)
5. [Cấu hình Consumer](#cấu-hình-consumer)
6. [Best Practices](#best-practices)
7. [Code Examples](#code-examples)
8. [Hướng dẫn chạy thực tế](#hướng-dẫn-chạy-thực-tế)
9. [Troubleshooting](#troubleshooting)

---

## Kafka là gì? Tại sao cần nó?

### Khái niệm cơ bản
**Kafka** là một **Message Broker** - một hệ thống trung gian giúp các ứng dụng giao tiếp với nhau bằng cách gửi/nhận messages. Thay vì ứng dụng A gọi trực tiếp API của ứng dụng B (coupling chặt), chúng ta dùng Kafka làm "người trung gian":

```
Ứng dụng A (Producer) → Kafka (Message Queue) → Ứng dụng B (Consumer)
```

### Tại sao dùng Kafka?

| Vấn đề | Giải pháp Kafka |
|--------|-----------------|
| Ứng dụng B tạm thời không có sẵn | Kafka giữ messages đến khi B có sẵn |
| A gửi 1 message đến 10 ứng dụng | A gửi 1 lần, 10 ứng dụng cùng lắng nghe |
| Xử lý message chậm, gây chậm hệ thống | Kafka cho phép xử lý bất đồng bộ (async) |
| Cần theo dõi lịch sử -> audit trail | Kafka lưu trữ messages theo thời gian |

### Ví dụ thực tế từ dự án
- **smart-process**: Scheduler quét DB tìm SIM nghi ngờ → gửi batch lên Kafka topic → Consumer xử lý chan/cảnh báo → ghi log.
- **Server-ZTE-v2**: Thiết bị IoT gửi data → Producer Kafka → nhiều Consumer xử lý (lưu log, gửi notification, cập nhật trạng thái).

---

## Kiến trúc và các thành phần

### 1. Topic (Chủ đề)
- **Khái niệm**: Topic giống như một "kênh" hoặc "bảng tin". Producer gửi message đến Topic, Consumer lắng nghe từ Topic.
- **Ví dụ đặt tên**:
  - `forbidden-transport-scan` - để xử lý SIM nghi ngờ
  - `zte-kafka` - data từ thiết bị ZTE
  - `device-connect-status-kafka` - trạng thái kết nối thiết bị
  - `smart-notification` - gửi thông báo

### 2. Partition (Phân vùng)
- **Khái niệm**: Mỗi Topic được chia thành nhiều Partition để xử lý song song.
  - Topic `forbidden-transport-scan` có 8 partition → 8 thread có thể xử lý đồng thời.
  - Mỗi message trong partition có thứ tự, nhưng giữa các partition không đảm bảo thứ tự.

**Quan trọng: Sử dụng Key để đảm bảo thứ tự**
```
Message 1: Key="SIM_001" → Partition 0
Message 2: Key="SIM_001" → Partition 0 (cùng SIM, cùng partition)
Message 3: Key="SIM_002" → Partition 1 (SIM khác, partition khác)
```
Cùng Key → cùng Partition → đảm bảo thứ tự xử lý.

### 3. Producer (Người gửi)
- **Nhiệm vụ**: Lấy dữ liệu từ ứng dụng, chuyển thành JSON, gửi lên Kafka.
- **Ví dụ**: `ForbiddenScanProducer` quét DB để gửi batch SIM nghi ngờ.

### 4. Consumer (Người nhận)
- **Nhiệm vụ**: Lắng nghe Topic hoặc Partition, nhận message, xử lý logic, commit offset.
- **Ví dụ**: `ForbiddenScanConsumer` nhận từng message, gọi service để chan SIM.

### 5. Consumer Group (Nhóm người nhận)
- **Khái niệm**: Một nhóm consumer có cùng `group.id`.
  - Nếu 1 Topic có 8 Partition và Consumer Group có 3 consumer → mỗi consumer nhân 2-3 partition.
  - Nếu 1 consumer trong group → nó xử lý tất cả 8 partition.

**Mục đích**: Phân tán công việc và hỗ trợ Scale-out.

### 6. Offset (Vị trí tin nhắn)
- **Khái niệm**: Vị trí của message trong Partition (0, 1, 2, ...).
- Consumer lưu offset đã xử lý → khi restart, nó biết tiếp tục từ đâu.

### Sơ đồ tổng quát
```
┌─────────────────────────────────────────────────────┐
│                    KAFKA CLUSTER                     │
│                                                      │
│  ┌────────────────────────────────────────────────┐ │
│  │ Topic: forbidden-transport-scan (8 Partitions) │ │
│  │                                                │ │
│  │  ┌──Partition 0─┐  ┌──Partition 1─┐  ...      │ │
│  │  │ Msg offset   │  │ Msg offset   │           │ │
│  │  │ [0,1,2,3...] │  │ [0,1,2,3...] │           │ │
│  │  └──────────────┘  └──────────────┘           │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
└─────────────────────────────────────────────────────┘
       ↑                                ↓
   Producer                         Consumer Group
 (Gửi message)              (group.id=forbidden-scan-group)
                           - Consumer 1 (P0,P1)
                           - Consumer 2 (P2,P3)
                           - ...
```

---

## Cấu hình Kafka cơ bản

### 1. Cấu hình Spring Boot (application.yml / application.properties)

#### A. Thông tin Connection
```yaml
# Thông tin Kafka Broker
spring:
  kafka:
    bootstrap-servers: 192.168.1.127:9092  # Địa chỉ Kafka cluster
    # Nếu Kafka nằm trên máy khác, thay 192.168.1.127 bằng IP/hostname thực tế
```

**Giải thích**:
- `bootstrap-servers`: Danh sách broker mà client sẽ kết nối. Spring Boot sẽ tự động phát hiện các broker khác trong cluster.

#### B. Cấu hình Producer (Toàn cục)
```yaml
spring:
  kafka:
    producer:
      bootstrap-servers: 192.168.1.127:9092
      # Serializer
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
      
      # Tham số hiệu năng
      acks: 1                    # Broker leader xác nhận (cân bằng tốc độ và an toàn)
      retries: 5                 # Thử lại tối đa 5 lần nếu lỗi tạm thời
      batch-size: 32768         # Gom 32KB message trước khi gửi
      linger-ms: 30              # Chờ tối đa 30ms để đủ batch
      buffer-memory: 67108864    # Buffer 64MB
      compression-type: lz4      # Nén LZ4 (nhanh, nhẹ, phù hợp IoT)
      
      # Timeout
      max-block-ms: 10000        # Chờ tối đa 10s trước khi fail
      request-timeout-ms: 20000  # Timeout request = 20s
      delivery-timeout-ms: 30000 # Timeout delivery = 30s
      
      # Bảo mật (nếu broker yêu cầu SASL/PLAIN)
      # security:
      #   protocol: SASL_PLAINTEXT
      # sasl:
      #   mechanism: PLAIN
      #   jaas-config: org.apache.kafka.common.security.plain.PlainLoginModule required username="admin" password="password";
```

**Ý nghĩa từng tham số**:

| Tham số | Giá trị | Ý nghĩa |
|--------|--------|---------|
| `acks` | `0` | Producer không chờ broker, tốc độ tối đa, rủi ro mất dữ liệu cao |
| `acks` | `1` | Broker leader xác nhận, cân bằng (producer log dùng giá trị này) |
| `acks` | `all` | Tất cả replica đồng bộ, an toàn nhất nhưng chậm nhất |
| `retries` | `5` | Thử lại 5 lần nếu lỗi tạm thời (network glitch, broker busy) |
| `batch-size` | `32768` | Gom tối đa 32KB trước gửi; lớn = throughput cao, độ trễ cao |
| `linger-ms` | `30` | Chờ 30ms để đủ batch; tuân theo: gửi khi `batch-size` đầy HOẶC `linger-ms` hết |
| `compression-type` | `lz4` | LZ4 nhanh, Snappy công bằng, GZIP tốt nhất nhưng chậm |

#### C. Cấu hình Consumer (Toàn cục)
```yaml
spring:
  kafka:
    consumer:
      bootstrap-servers: 192.168.1.127:9092
      
      # Deserializer
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      
      # Group ID (PHẢI thiết lập, mỗi service có group ID riêng)
      group-id: forbidden-scan-group  # Ví dụ: dùng cho ForbiddenScanConsumer
      
      # Offset & Commit
      enable-auto-commit: false         # Tắt auto-commit, chỉ commit sau xử lý thành công
      auto-offset-reset: latest         # Nếu chưa có offset, bắt đầu từ message mới nhất
      
      # Hiệu năng
      max-poll-records: 50              # Mỗi lần poll tối đa 50 record
      max-poll-interval-ms: 300000      # Timeout giữa 2 lần poll = 5 phút
      session-timeout-ms: 30000         # Consumer die được coi là mất sau 30s
      heartbeat-interval-ms: 10000      # Gửi heartbeat mỗi 10s để broker biết vẫn sống
      
      # Bảo mật (nếu cần)
      # security:
      #   protocol: SASL_PLAINTEXT
      # sasl:
      #   mechanism: PLAIN
      #   jaas-config: org.apache.kafka.common.security.plain.PlainLoginModule required username="admin" password="password";

# Cấu hình listener
spring:
  kafka:
    listener:
      ack-mode: manual  # Tắc auto-commit, phải gọi acknowledgment.acknowledge() trong code
      concurrency: 8    # 8 thread consumer cùng lúc (phải <= partition count)
```

**Ý nghĩa từng tham số Consumer**:

| Tham số | Từ ví dụ 1 | Từ ví dụ 2 | Ý nghĩa |
|--------|-----------|-----------|---------|
| `group-id` | `forbidden-scan-group` | `java-producer-zte-consumer-{serverId}` | Định danh consumer group để chia pending partition |
| `enable-auto-commit` | `false` | `false` | Nếu true, Spring tự commit. False = phải commit thủ công |
| `auto-offset-reset` | `latest` | `latest` | Nếu chưa có offset: latest = bắt từ mới; earliest = bắt từ cũ nhất |
| `max-poll-records` | `50` | `100` | Mỗi lần poll tối đa bao nhiêu record (batch size consumer) |
| `session-timeout-ms` | `30000` | `30000` | Consumer chết nếu không heartbeat sau 30s |
| `heartbeat-interval-ms` | `10000` | `10000` | Gửi heartbeat mỗi 10s (phải < session-timeout) |

#### D. Danh sách Topic
```yaml
kafka:
  topics:
    forbidden-transport-scan: forbidden-transport-scan
    forbidden-scan-log: forbidden-scan-log
    zte-kafka: zte-kafka
    device-connect-status: device-connect-status-kafka
    save-message-device-log: save-message-device-log-kafka
    notification: smart-notification
```

#### E. Bảo mật (nếu broker bật SASL/PLAIN)
```yaml
kafka:
  authen: true  # Bật auth SASL
  username: admin
  password: Password@123
  # Sau đó Spring tự apply security.protocol + sasl.mechanism + sasl.jaas.config
```

### 2. File cấu hình riêng (mtr_config.conf hoặc application-prod.yml)
Nếu dự án dùng file config riêng (không phải properties/yml của Spring):

```properties
# mtr_config.conf
kafka.server=192.168.1.133:9092
kafka.group.id=java-producer
kafka.authen=0                    # 0=off, 1=on SASL
kafka.username=admin
kafka.password=Smartmot0@2023

kafka.topics.zte=zte-kafka
kafka.topics.sendCommandDeviceLogProcess=send-command-log-kafka
kafka.topics.saveDeviceConnectStatus=device-connect-status-kafka
kafka.topics.save-message-device-log=save-message-device-log-kafka
kafka.topics.notification=smart-notification
```

Sau đó code Java sẽ parse file này và apply cấu hình.

---

## Cấu hình Producer

### 1. Khái niệm Producer
Producer là thành phần **gửi message** lên Kafka:
- Đọc dữ liệu từ DB / API / Event / ...
- Serialization (convert object → JSON bytes)
- Gửi lên Topic với Key (để định tuyến Partition)
- Có thể chờ confirmation hoặc gửi async

### 2. Cấu hình Producer Pool (Hiệu năng)
Thay vì tạo KafkaProducer mới mỗi lần gửi (overhead), tạo **một pool dùng chung**:

**File: KafkaConnectionPool.java**
```java
public class KafkaConnectionPool {
    private static KafkaConnectionPool instance;
    private KafkaProducer<String, String> producer;
    
    private KafkaConnectionPool() {}
    
    public static synchronized KafkaConnectionPool getInstance() {
        if (instance == null) {
            instance = new KafkaConnectionPool();
        }
        return instance;
    }
    
    public void initConnect() {
        Properties props = new Properties();
        props.put("bootstrap.servers", "192.168.1.133:9092");
        props.put("key.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        props.put("value.serializer", "org.apache.kafka.common.serialization.StringSerializer");
        
        // ========== Tham số quan trọng ==========
        props.put("acks", "1");                    // Leader xác nhận (cân bằng)
        props.put("retries", "5");                 // Thử lại 5 lần
        props.put("batch.size", "32768");          // 32KB batch
        props.put("linger.ms", "30");              // Chờ 30ms
        props.put("buffer.memory", "67108864");    // 64MB buffer
        props.put("compression.type", "lz4");      // Nén LZ4
        
        // Timeout
        props.put("max.block.ms", "10000");
        props.put("request.timeout.ms", "20000");
        props.put("delivery.timeout.ms", "30000");
        
        // Nếu bật SASL
        if (kafkaAuthEnable) {
            props.put("security.protocol", "SASL_PLAINTEXT");
            props.put("sasl.mechanism", "PLAIN");
            props.put("sasl.jaas.config", 
                "org.apache.kafka.common.security.plain.PlainLoginModule required " +
                "username=\"admin\" password=\"password\";");
        }
        
        producer = new KafkaProducer<>(props);
    }
    
    public KafkaProducer<String, String> getProducer() {
        return producer;
    }
    
    public void close() {
        if (producer != null) {
            producer.close();
        }
    }
}
```

### 3. Producer riêng cho Log (acks=0, nhanh nhất)
Để lưu log nhanh mà không cần đảm bảo 100%, dùng `acks=0`:

**File: KafkaLogConnectionPool.java**
```java
public class KafkaLogConnectionPool {
    private static KafkaLogConnectionPool instance;
    private KafkaProducer<String, String> logProducer;
    
    public void initConnect() {
        Properties props = new Properties();
        // ... cấu hình giống trên ...
        
        props.put("acks", "0");          // Không chờ broker, tốc độ tối đa
        props.put("retries", "0");       // Không retry, chấp nhận mất log
        props.put("linger.ms", "50");    // Gom log nhiều hơn (50ms)
        
        logProducer = new KafkaProducer<>(props);
    }
    
    // Các method tương tự ...
}
```

**Lý do dùng acks=0 cho log**: Log không quan trọng bằng data chính. Nếu mất vài log, chấp nhận được, nhưng lợi ích là gửi cực nhanh.

### 4. Producer Service (gửi message thực tế)
**File: KafkaProducerService.java**
```java
@Service
public class KafkaProducerService {
    private static final ObjectMapper objectMapper = new ObjectMapper();
    private static final int DATA_THREAD_COUNT = Runtime.getRuntime().availableProcessors() * 3;
    private static final int LOG_THREAD_COUNT = Runtime.getRuntime().availableProcessors() * 2;
    
    private ExecutorService dataExecutor = Executors.newFixedThreadPool(DATA_THREAD_COUNT);
    private ExecutorService logExecutor = Executors.newFixedThreadPool(LOG_THREAD_COUNT);
    
    private static KafkaProducerService instance;
    
    public static synchronized KafkaProducerService getInstance() {
        if (instance == null) {
            instance = new KafkaProducerService();
            // Khởi tạo pools
            KafkaConnectionPool.getInstance().initConnect();
            KafkaLogConnectionPool.getInstance().initConnect();
        }
        return instance;
    }
    
    /**
     * Gửi một message bình thường (data)
     * @param topic Tên topic (VD: forbidden-transport-scan)
     * @param key   Key định tuyến (VD: sim)
     * @param data  Object để convert thành JSON
     */
    public void sendMessage(String topic, String key, Object data) {
        ExecutorService executor = isLogTopic(topic) ? logExecutor : dataExecutor;
        
        executor.submit(() -> {
            try {
                String jsonValue = objectMapper.writeValueAsString(data);
                KafkaProducer<String, String> producer = 
                    isLogTopic(topic) 
                        ? KafkaLogConnectionPool.getInstance().getProducer()
                        : KafkaConnectionPool.getInstance().getProducer();
                
                // Gửi async với callback
                producer.send(new ProducerRecord<>(topic, key, jsonValue), (metadata, exception) -> {
                    if (exception == null) {
                        log.info("Message sent to topic={}, partition={}, offset={}", 
                            metadata.topic(), metadata.partition(), metadata.offset());
                    } else {
                        log.error("Failed to send message to topic={}: {}", topic, exception.getMessage());
                    }
                });
                
                // Flush để gửi ngay (không chờ linger-ms)
                // producer.flush();  // Tùy chọn: bỏ comment nếu cần send ngay
            } catch (JsonProcessingException e) {
                log.error("JSON serialization error: {}", e.getMessage());
            }
        });
    }
    
    /**
     * Gửi batch message (càng nhiều càng tốt)
     */
    public void sendBatch(String topic, List<? extends Object> dataList) {
        for (Object data : dataList) {
            sendMessage(topic, extractKey(data), data);
        }
    }
    
    private String extractKey(Object data) {
        // Lấy SIM hoặc ID để làm key (tùy object)
        if (data instanceof NotEnoughMoneyDTO) {
            return ((NotEnoughMoneyDTO) data).getSim();
        }
        return UUID.randomUUID().toString();
    }
    
    private boolean isLogTopic(String topic) {
        return topic.contains("log");
    }
    
    public void shutdown() {
        dataExecutor.shutdown();
        logExecutor.shutdown();
        KafkaConnectionPool.getInstance().close();
        KafkaLogConnectionPool.getInstance().close();
    }
}
```

**Cách sử dụng**:
```java
// Gửi một message
KafkaProducerService.getInstance().sendMessage(
    "forbidden-transport-scan",
    "SIM_001",  // Key
    new NotEnoughMoneyDTO(sim, productCode, registerNo, ...)
);

// Gửi batch
List<NotEnoughMoneyDTO> dtos = getFromDB();  // Lấy 1000 SIM
KafkaProducerService.getInstance().sendBatch("forbidden-transport-scan", dtos);
```

---

## Cấu hình Consumer

### 1. Khái niệm Consumer
Consumer là thành phần **nhận message** từ Kafka:
- Lắng nghe Topic / Partition
- Deserialize JSON → Object
- Xử lý logic
- Commit offset (báo rằng đã xử lý)

### 2. Consumer Config (Cấu hình Factory)
**File: KafkaConsumerConfig.java** - Sử dụng Spring Boot để auto-create Consumer:

```java
@Configuration
@EnableKafka
public class KafkaConsumerConfig {
    
    @Value("${spring.kafka.bootstrap-servers:192.168.1.127:9092}")
    private String bootstrapServers;
    
    @Value("${kafka.authen:false}")
    private boolean authEnabled;
    
    @Value("${kafka.username:}")
    private String username;
    
    @Value("${kafka.password:}")
    private String password;
    
    /**
     * Consumer Factory cho dữ liệu bình thường (concurrent listener)
     */
    @Bean
    public ConsumerFactory<String, NotEnoughMoneyDTO> forbiddenScanConsumerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        configProps.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        configProps.put(ConsumerConfig.GROUP_ID_CONFIG, "forbidden-scan-group");
        configProps.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        configProps.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        
        // Cấu hình Offset & Commit
        configProps.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);  // Commit thủ công
        configProps.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "latest");
        
        // Hiệu năng
        configProps.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 50);
        configProps.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, 30000);
        configProps.put(ConsumerConfig.HEARTBEAT_INTERVAL_MS_CONFIG, 10000);
        
        // Trusted packages (bảo mật deserialization)
        configProps.put(JsonDeserializer.TRUSTED_PACKAGES, "*");
        configProps.put(JsonDeserializer.VALUE_DEFAULT_TYPE, NotEnoughMoneyDTO.class.getName());
        
        // SASL nếu bật
        if (authEnabled) {
            applySaslConfig(configProps);
        }
        
        return new DefaultConsumerFactory<>(configProps);
    }
    
    /**
     * Listener container factory cho concurrent listener
     */
    @Bean(name = "forbiddenScanKafkaListenerContainerFactory")
    public ConcurrentKafkaListenerContainerFactory<String, NotEnoughMoneyDTO> 
            forbiddenScanKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, NotEnoughMoneyDTO> factory =
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(forbiddenScanConsumerFactory());
        factory.setConcurrency(8);  // 8 thread consumer
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL);  // Manual commit
        return factory;
    }
    
    /**
     * Consumer Factory cho batch (log consumer)
     * Nhận List<ConsumerRecord> để bulk insert DB
     */
    @Bean
    public ConsumerFactory<String, ForbiddenScanLogDTO> logBatchConsumerFactory() {
        Map<String, Object> configProps = new HashMap<>();
        // ... config giống như trên ...
        configProps.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 200);  // Batch 200
        
        return new DefaultConsumerFactory<>(configProps);
    }
    
    @Bean(name = "logBatchKafkaListenerContainerFactory")
    public ConcurrentKafkaListenerContainerFactory<String, ForbiddenScanLogDTO> 
            logBatchKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, ForbiddenScanLogDTO> factory =
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(logBatchConsumerFactory());
        factory.setConcurrency(2);  // 2 thread cho batch log
        factory.setBatchListener(true);  // Nhận List<ConsumerRecord>
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL);
        return factory;
    }
    
    private void applySaslConfig(Map<String, Object> configProps) {
        configProps.put("security.protocol", "SASL_PLAINTEXT");
        configProps.put("sasl.mechanism", "PLAIN");
        configProps.put("sasl.jaas.config",
            String.format("org.apache.kafka.common.security.plain.PlainLoginModule required " +
                "username=\"%s\" password=\"%s\";", username, password));
    }
}
```

**Giải thích từng phần**:
- `GROUP_ID_CONFIG`: định danh consumer group - các consumer có cùng group sẽ chia partition
- `ENABLE_AUTO_COMMIT_CONFIG = false`: phải commit thủ công (an toàn hơn)
- `MAX_POLL_RECORDS_CONFIG`: batch size mỗi lần poll
- `BATCH_LISTENER = true`: nhận List (để bulk DB); false = nhận từng record
- `CONCURRENCY`: số thread consumer (≤ partition count)

### 3. Consumer Listener (nhận & xử lý)

**File: ForbiddenScanConsumer.java** - Nhận từng message
```java
@Component
public class ForbiddenScanConsumer {
    
    @Autowired
    private ForbiddenScanService forbiddenScanService;
    
    /**
     * Lắng nghe topic forbidden-transport-scan
     * Nhận từng message -> xử lý -> manual commit
     */
    @KafkaListener(
        topics = "forbidden-transport-scan",
        groupId = "forbidden-scan-group",
        containerFactory = "forbiddenScanKafkaListenerContainerFactory"
    )
    public void listen(
        ConsumerRecord<String, NotEnoughMoneyDTO> record,
        Acknowledgment acknowledgment) {
        
        try {
            String sim = record.key();
            NotEnoughMoneyDTO dto = record.value();
            
            log.info("[ForbiddenScanConsumer] Received SIM={}, partition={}, offset={}", 
                sim, record.partition(), record.offset());
            
            // Gọi service xử lý
            forbiddenScanService.processOne(dto);
            
            // Commit offset (báo rằng đã xử lý xong)
            acknowledgment.acknowledge();
            
        } catch (Exception e) {
            log.error("[ForbiddenScanConsumer] Error processing: {}", e.getMessage());
            // Tùy chọn: throw lại để retry hoặc ghi vào dead-letter topic
        }
    }
}
```

**File: ForbiddenScanLogConsumer.java** - Nhận batch để bulk insert
```java
@Component
public class ForbiddenScanLogConsumer {
    
    @Autowired
    private ForbiddenScanRepository repository;
    
    /**
     * Lắng nghe topic forbidden-scan-log
     * Nhận batch (List) -> bulk insert -> commit
     */
    @KafkaListener(
        topics = "forbidden-scan-log",
        groupId = "forbidden-scan-log-group",
        containerFactory = "logBatchKafkaListenerContainerFactory"
    )
    public void listenBatch(
        List<ConsumerRecord<String, ForbiddenScanLogDTO>> records,
        Acknowledgment acknowledgment) {
        
        try {
            List<ForbiddenScanLog> logs = new ArrayList<>();
            
            for (ConsumerRecord<String, ForbiddenScanLogDTO> record : records) {
                ForbiddenScanLogDTO dto = record.value();
                logs.add(new ForbiddenScanLog(
                    dto.getSim(),
                    dto.getStatus(),
                    dto.getTimestamp()
                ));
            }
            
            log.info("[ForbiddenScanLogConsumer] Batch: received={}, inserting...", logs.size());
            
            // Bulk insert (1 lần query)
            repository.insertLogBatch(logs);
            
            log.info("[ForbiddenScanLogConsumer] Batch: inserted={} records", logs.size());
            
            // Commit offset
            acknowledgment.acknowledge();
            
        } catch (Exception e) {
            log.error("[ForbiddenScanLogConsumer] Batch error: {}", e.getMessage());
        }
    }
}
```

---

## Best Practices

### 1. Cách đặt tên Topic
| Loại | Quy tắc | Ví dụ |
|------|--------|-------|
| Data chính | `{feature}-data` | `forbidden-transport-scan`, `zte-kafka` |
| Log | `{feature}-log` | `forbidden-scan-log`, `send-command-log-kafka` |
| Status | `{subject}-status` | `device-connect-status-kafka` |
| Event | `{event}-event` | `device-reboot-event` |
| Notification | `notification` hoặc `{channel}-notification` | `smart-notification`, `sms-notification` |

### 2. Cách chọn Key
- **Mục đích**: Đảm bảo message về cùng Partition → xử lý theo thứ tự
- **Ví dụ**:
  - SIM data → Key = `sim` (tất cả message của 1 SIM vào 1 partition)
  - Device data → Key = `deviceId` (nhất quán per device)
  - User action → Key = `userId` (user's action xử lý tuần tự)
- **Nếu không quan tâm thứ tự** → Key = null (random partition)

### 3. Serialization
- **Value**: Luôn dùng **JSON** (dễ dàng debug, integrate)
- **Key**: Dùng **String** (thường là ID/SIM)
- **Spring Boot**: Tự động xử lý via `JsonSerializer` / `JsonDeserializer`

### 4. Tham số cho Data vs Log

| Tham số | Data (Quan trọng) | Log (Nhanh) |
|--------|-------------------|------------|
| `acks` | `1` (cân bằng) | `0` (tốc độ) |
| `retries` | `5` | `0` |
| `batch.size` | `32KB` | `32KB` |
| `linger.ms` | `30ms` | `50ms` |
| `compression` | `lz4` | `lz4` |

### 5. Consumer Group & Concurrency
```
Topic: 8 partitions
Consumer Group: forbidden-scan-group

Kịch bản 1: 1 consumer
  → Consumer 1 xử lý 8 partition (concurrency=8 thread)
  → Throughput: 8 thread * speed per thread

Kịch bản 2: 3 consumers
  → Consumer 1: Partition 0,1,2 (concurrency=8)
  → Consumer 2: Partition 3,4,5 (concurrency=8)
  → Consumer 3: Partition 6,7 (concurrency=8)
  → Tổng: 24 thread xử lý song song

⚠️ Quy tắc: concurrency ≤ partitions (nếu > thì thread dư không có việc)
⚠️ Nếu có 8 consumer nhưng chỉ 8 partition → mỗi consumer 1 partition
```

### 6. Offset Management
```java
// ❌ KHÔNG NÊN
@KafkaListener(topics = "my-topic")
public void listenAuto(String message) {
    // Spring tự commit ngay, dù chưa xử lý
    longRunningOperation(message);
}

// ✅ NÊN
@KafkaListener(topics = "my-topic")
public void listenManual(
    String message,
    Acknowledgment acknowledgment) {
    
    try {
        process(message);
        acknowledgment.acknowledge();  // Commit sau khi xong
    } catch (Exception e) {
        log.error("Error, requeue next time");
        // Không commit → message quay lại topic khi restart
    }
}
```

### 7. Error Handling
```java
// Cách 1: Retry built-in
@KafkaListener(topics = "my-topic")
public void listen(String message) throws Exception {
    // Nếu throw Exception → Spring tự retry
    process(message);
}

// Cách 2: Dead Letter Topic (advanced)
@KafkaListener(topics = "my-topic")
public void listenWithDLT(
    String message,
    @Header(KafkaHeaders.RECEIVED_PARTITION_ID) int partition,
    SendTo("my-topic.DLT") String sendToDlt) throws Exception {
    
    try {
        process(message);
    } catch (Exception e) {
        // Gửi sang dead letter topic
        return "Failed: " + e.getMessage();
    }
}
```

### 8. Monitoring & Logging
```java
// Producer
log.info("Message sent: topic={}, partition={}, offset={}", 
    metadata.topic(), metadata.partition(), metadata.offset());

// Consumer
log.info("[Consumer] topic={}, partition={}, offset={}, key={}", 
    record.topic(), record.partition(), record.offset(), record.key());
```

### 9. Graceful Shutdown
```java
@Component
public class KafkaShutdownHook {
    
    @PreDestroy
    public void shutdown() {
        KafkaProducerService.getInstance().shutdown();
        log.info("Kafka services shut down gracefully");
    }
}
```

---

## Advanced: Nhiều Consumer Groups trong một Service

### Câu hỏi: Một service có thể có nhiều groupId không?

**Trả lời: CÓ, hoàn toàn được phép!** 

### Khi nào nên dùng nhiều groupId?

| Trường hợp | Giải thích | Ví dụ |
|-----------|-----------|--------|
| **Xử lý khác nhau từ 1 topic** | Cùng topic nhưng 2 consumer group xử lý khác nhau | Topic `device-status`: group1 lưu DB, group2 gửi SMS |
| **Multiple processor** | 1 topic, nhiều consumer xử lý độc lập | Log topic: group1 insert DB, group2 gửi Elasticsearch, group3 gửi Slack |
| **Retry logic khác nhau** | Cùng topic, group1 retry ngay, group2 retry sau 1 giờ | group1=urgent, group2=batch |
| **Feature toggle** | Bật/tắt xử lý mà không deploy lại | group1=enabled, group2=disabled trong config |

### Sơ đồ: 1 Topic, Nhiều Consumer Groups

```
┌──────────────────────────────────────────────────────────────┐
│                    TOPIC: device-status                       │
│  Message: {"deviceId": 123, "status": "offline"}              │
│                                                               │
│  ┌──Partition 0──┐  ┌──Partition 1──┐  ┌──Partition 2──┐    │
│  │ Offset 0,1... │  │ Offset 0,1... │  │ Offset 0,1... │    │
│  └────────────┬──┘  └────────────┬──┘  └────────────┬──┘    │
└─────────────┼─────────────────────┼─────────────────┼─────────┘
              │                     │                 │
        ┌─────┴─────┐         ┌─────┴─────┐     ┌────┴────┐
        │            │         │            │     │         │
        ▼            ▼         ▼            ▼     ▼         ▼
   Group1-c1      Group1-c2  Group2-c1  Group3-c1
   (DB-Logger)    (DB-Logger)(SMS-Sender)(Update-Cache)
   offset: 45     offset: 46 offset: 23  offset: 78
   
   Same groupId    Same groupId Different Different
   (chia partition) (chia partition) groupId  groupId
```

**Cách nó hoạt động**:
- **Group1** (groupId=`device-status-db-group`): 2 consumer chia 3 partition, mỗi message được lưu vào DB 1 lần
- **Group2** (groupId=`device-status-sms-group`): 1 consumer lấy toàn bộ 3 partition, gửi SMS
- **Group3** (groupId=`device-status-cache-group`): 1 consumer update cache Redis

Mỗi group có **offset riêng**, nên có thể **lag khác nhau**.

### Code Example: Cùng Service, 2 GroupIds

**File: application.yml**
```yaml
spring:
  kafka:
    bootstrap-servers: localhost:9092
    
kafka:
  topics:
    device-status: device-status-kafka
```

**File: DeviceStatusConfig.java** - Tạo 2 Consumer Factory
```java
@Configuration
@EnableKafka
public class DeviceStatusConfig {
    
    // ========== Consumer Factory 1: Lưu DB ==========
    @Bean
    public ConsumerFactory<String, DeviceStatusDTO> dbConsumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "device-status-db-group");  // ← GroupId 1
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 50);
        props.put(JsonDeserializer.TRUSTED_PACKAGES, "*");
        props.put(JsonDeserializer.VALUE_DEFAULT_TYPE, DeviceStatusDTO.class.getName());
        
        return new DefaultConsumerFactory<>(props);
    }
    
    @Bean(name = "dbListenerContainerFactory")
    public ConcurrentKafkaListenerContainerFactory<String, DeviceStatusDTO> 
            dbListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, DeviceStatusDTO> factory =
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(dbConsumerFactory());
        factory.setConcurrency(4);
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL);
        return factory;
    }
    
    // ========== Consumer Factory 2: Gửi SMS ==========
    @Bean
    public ConsumerFactory<String, DeviceStatusDTO> smsConsumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092");
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "device-status-sms-group");  // ← GroupId 2 (khác)
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG, 100);  // Khác batch size
        props.put(JsonDeserializer.TRUSTED_PACKAGES, "*");
        props.put(JsonDeserializer.VALUE_DEFAULT_TYPE, DeviceStatusDTO.class.getName());
        
        return new DefaultConsumerFactory<>(props);
    }
    
    @Bean(name = "smsListenerContainerFactory")
    public ConcurrentKafkaListenerContainerFactory<String, DeviceStatusDTO> 
            smsListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, DeviceStatusDTO> factory =
            new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(smsConsumerFactory());
        factory.setConcurrency(2);  // Khác concurrency
        factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL);
        return factory;
    }
}
```

**File: DeviceStatusConsumer.java** - 2 Listeners khác nhau
```java
@Component
public class DeviceStatusConsumer {
    
    @Autowired
    private DeviceStatusRepository repository;
    
    @Autowired
    private SmsService smsService;
    
    /**
     * Listener 1: Lưu tất cả status vào DB
     * groupId = device-status-db-group
     */
    @KafkaListener(
        topics = "device-status-kafka",
        groupId = "device-status-db-group",  // GroupId 1
        containerFactory = "dbListenerContainerFactory"
    )
    public void listenForDB(
        ConsumerRecord<String, DeviceStatusDTO> record,
        Acknowledgment acknowledgment) {
        
        try {
            DeviceStatusDTO dto = record.value();
            
            log.info("[DB-Consumer] Saving device status: deviceId={}, status={}, offset={}", 
                dto.getDeviceId(), dto.getStatus(), record.offset());
            
            // Lưu vào DB
            repository.save(new DeviceStatus(
                dto.getDeviceId(),
                dto.getStatus(),
                LocalDateTime.now()
            ));
            
            acknowledgment.acknowledge();
            
        } catch (Exception e) {
            log.error("[DB-Consumer] Error: {}", e.getMessage());
        }
    }
    
    /**
     * Listener 2: Gửi SMS khi device offline
     * groupId = device-status-sms-group
     */
    @KafkaListener(
        topics = "device-status-kafka",
        groupId = "device-status-sms-group",  // GroupId 2 (khác)
        containerFactory = "smsListenerContainerFactory"
    )
    public void listenForSMS(
        ConsumerRecord<String, DeviceStatusDTO> record,
        Acknowledgment acknowledgment) {
        
        try {
            DeviceStatusDTO dto = record.value();
            
            log.info("[SMS-Consumer] Processing device status: deviceId={}, status={}, offset={}", 
                dto.getDeviceId(), dto.getStatus(), record.offset());
            
            // Chỉ gửi SMS nếu offline
            if ("OFFLINE".equals(dto.getStatus())) {
                log.warn("[SMS-Consumer] Device offline! Sending SMS...");
                smsService.sendAlert(
                    dto.getDeviceId(),
                    "Device " + dto.getDeviceId() + " is OFFLINE!"
                );
            }
            
            acknowledgment.acknowledge();
            
        } catch (Exception e) {
            log.error("[SMS-Consumer] Error: {}", e.getMessage());
        }
    }
}
```

### Output: 2 GroupIds Xử lý tương tự

```
Topic: device-status-kafka
Message: {"deviceId": 123, "status": "OFFLINE"}

┌─────────────────────────────────────────────────────┐
│ GROUP 1: device-status-db-group (DB Logger)        │
├─────────────────────────────────────────────────────┤
│ [DB-Consumer] Saving device status: deviceId=123   │
│ Saved to table: device_status_log                  │
│ Current offset: 50                                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ GROUP 2: device-status-sms-group (SMS Alerter)     │
├─────────────────────────────────────────────────────┤
│ [SMS-Consumer] Device offline! Sending SMS...      │
│ SMS sent to admin                                  │
│ Current offset: 45                                 │
└─────────────────────────────────────────────────────┘
```

### Lợi ích của Multiple GroupIds

| Lợi ích | Chi tiết |
|---------|---------|
| **Decoupling** | 2 xử lý độc lập, lỗi ở group1 không ảnh hưởng group2 |
| **Scale độc lập** | Scale DB processor riêng, SMS processor riêng |
| **Retry khác nhau** | Group1 retry ngay, group2 retry sau 1h |
| **Monitoring riêng** | Mỗi group có lag độc lập, dễ phát hiện bottleneck |
| **Feature toggle** | Enable/disable group mà không restart app |
| **Offset độc lập** | Consumer restart → mỗi group từ offset riêng |

### Kiểm tra Multiple GroupIds

```bash
# Xem tất cả consumer groups
kafka-consumer-groups --bootstrap-server localhost:9092 --list

# Output:
# device-status-db-group
# device-status-sms-group

# Chi tiết group 1
kafka-consumer-groups --bootstrap-server localhost:9092 \
  --group device-status-db-group --describe

# Output:
# GROUP                        TOPIC             PARTITION CURRENT-OFFSET LOG-END-OFFSET LAG
# device-status-db-group       device-status-kafka 0 50  100 50
# device-status-db-group       device-status-kafka 1 45  100 55

# Chi tiết group 2
kafka-consumer-groups --bootstrap-server localhost:9092 \
  --group device-status-sms-group --describe

# Output:
# GROUP                        TOPIC             PARTITION CURRENT-OFFSET LOG-END-OFFSET LAG
# device-status-sms-group      device-status-kafka 0 45  100 55
# device-status-sms-group      device-status-kafka 1 40  100 60
```

### ⚠️ Lưu ý khi dùng Multiple GroupIds

1. **Mỗi group consuming tất cả messages** (không chia)
   - Group1 lấy offset 0-100
   - Group2 cũng lấy offset 0-100
   - **NOT** chia offset, mỗi group lấy full

2. **Memory & Network cost tăng**
   - Nếu có 3 groupIds → Kafka gửi message 3 lần (1 lần/group)
   - Tuy nhiên broker chỉ lưu 1 bản, các consumer độc lập lấy

3. **Offset độc lập** → khó track nếu không có monitoring tốt
   - Dùng Kafka UI hoặc Prometheus để monitor lag

4. **Thứ tự không đảm bảo giữa các group**
   - Group1 xử lý message 1
   - Group2 còn đang xử lý message 0
   - Đó là OK, mỗi group độc lập

### Production Best Practice

```yaml
# application-prod.yml
spring:
  kafka:
    bootstrap-servers: kafka-cluster.company.com:9092

# Database processor (critical)
kafka:
  consumer:
    db:
      group-id: device-status-db-group
      max-poll-records: 50
      concurrency: 8
      ack-mode: manual

# SMS processor (non-critical, retry needed)
kafka:
  consumer:
    sms:
      group-id: device-status-sms-group
      max-poll-records: 100
      concurrency: 4
      ack-mode: manual
      max-retry: 3

# Cache processor (best-effort)
kafka:
  consumer:
    cache:
      group-id: device-status-cache-group
      max-poll-records: 200
      concurrency: 2
      ack-mode: auto  # Có thể auto-commit vì không critical
```

---

## Code Examples

### 1. Complete Producer Example

**File: NotEnoughMoneyDTO.java** (DTO để gửi Kafka)
```java
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotEnoughMoneyDTO {
    private String sim;
    private String productCode;
    private String registerNo;
    private String deviceId;
    private String deviceCode;
    private Long connectDeviceId;
    private Long transportId;
    private Double remainMoney;
    private LocalDateTime promotionExpiredTime;
    private Boolean isActive;
    private String chargingStatus;
}
```

**File: ForbiddenTransportScanProcess.java** (Scheduler gửi batch)
```java
@Component
@EnableScheduling
public class ForbiddenTransportScanProcess {
    
    @Autowired
    private ForbiddenScanRepository repository;
    
    @Autowired
    private ForbiddenScanProducer forbiddenScanProducer;
    
    // Chạy cứ 30 phút một lần
    @Scheduled(cron = "0 */30 * * * *")
    public void execute() {
        try {
            log.info("[ForbiddenTransportScanProcess] Starting scan...");
            
            // Lấy danh sách SIM nghi ngờ từ DB
            // VD: SIM có tiền dưới 10K, chưa được warning trong 24h, ...
            List<NotEnoughMoneyDTO> suspiciousSims = repository.findSuspiciousSims();
            
            log.info("[ForbiddenTransportScanProcess] Found {} suspicious SIMs", 
                     suspiciousSims.size());
            
            // Gửi batch lên Kafka
            forbiddenScanProducer.sendBatch(suspiciousSims);
            
            log.info("[ForbiddenTransportScanProcess] Batch pushed to Kafka");
            
        } catch (Exception e) {
            log.error("[ForbiddenTransportScanProcess] Error: {}", e.getMessage(), e);
        }
    }
}
```

**File: ForbiddenScanProducer.java**
```java
@Component
public class ForbiddenScanProducer {
    
    @Autowired
    private KafkaTemplate<String, NotEnoughMoneyDTO> kafkaTemplate;
    
    @Value("${kafka.topics.forbidden-transport-scan:forbidden-transport-scan}")
    private String topic;
    
    /**
     * Gửi từng message
     */
    public void send(NotEnoughMoneyDTO dto) {
        kafkaTemplate.send(
            new ProducerRecord<>(
                topic,
                dto.getSim(),      // Key = SIM để định tuyến partition
                dto               // Value = DTO
            )
        );
        log.info("Sent message: SIM={}", dto.getSim());
    }
    
    /**
     * Gửi batch
     */
    public void sendBatch(List<NotEnoughMoneyDTO> dtoList) {
        for (NotEnoughMoneyDTO dto : dtoList) {
            send(dto);
        }
    }
}
```

### 2. Complete Consumer Example

**File: ForbiddenScanConsumer.java**
```java
@Component
public class ForbiddenScanConsumer {
    
    @Autowired
    private ForbiddenScanService forbiddenScanService;
    
    /**
     * Lắng nghe topic, xử lý từng message
     */
    @KafkaListener(
        topics = "${kafka.topics.forbidden-transport-scan:forbidden-transport-scan}",
        groupId = "forbidden-scan-group",
        containerFactory = "forbiddenScanKafkaListenerContainerFactory"
    )
    public void listen(
        ConsumerRecord<String, NotEnoughMoneyDTO> record,
        Acknowledgment acknowledgment) {
        
        try {
            String sim = record.key();
            NotEnoughMoneyDTO dto = record.value();
            
            log.info("[ForbiddenScanConsumer] Received: SIM={}, partition={}, offset={}", 
                sim, record.partition(), record.offset());
            
            // Xử lý: chan hay cảnh báo SIM
            forbiddenScanService.processOne(dto);
            
            // Commit offset
            acknowledgment.acknowledge();
            
        } catch (Exception e) {
            log.error("[ForbiddenScanConsumer] Error processing message", e);
            // Không commit → sẽ retry lần sau
        }
    }
}
```

**File: ForbiddenScanService.java** (Logic xử lý)
```java
@Service
public class ForbiddenScanService {
    
    @Autowired
    private ForbiddenScanRepository repository;
    
    @Autowired
    private ForbiddenScanLogProducer logProducer;
    
    @Autowired
    private SmsService smsService;
    
    /**
     * Xử lý 1 SIM: check remaining money, send warning, insert log
     */
    public void processOne(NotEnoughMoneyDTO dto) {
        String sim = dto.getSim();
        
        try {
            // Kiểm tra tiền còn lại
            if (dto.getRemainMoney() < 10000) {
                log.info("[Service] SIM {} has low money: {}", sim, dto.getRemainMoney());
                
                // Cảnh báo: gửi SMS
                smsService.sendWarning(sim, "Your balance is low");
                
                // Ghi log
                ForbiddenScanLogDTO logDto = new ForbiddenScanLogDTO(
                    sim, "WARNING_SENT", LocalDateTime.now()
                );
                logProducer.sendLog(logDto);
            }
            
            // Update DB: đánh dấu đã warning
            repository.markAsWarned(sim);
            
        } catch (Exception e) {
            log.error("[Service] Error processing SIM {}: {}", sim, e.getMessage());
            throw e;  // Rethrow để consumer không commit
        }
    }
}
```

### 3. Configuration Example (application.yml)

```yaml
spring:
  kafka:
    bootstrap-servers: 192.168.1.127:9092
    
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer
      acks: 1
      retries: 5
      batch-size: 32768
      linger-ms: 30
      buffer-memory: 67108864
      compression-type: lz4
    
    consumer:
      group-id: forbidden-scan-group
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer
      enable-auto-commit: false
      auto-offset-reset: latest
      max-poll-records: 50
      properties:
        spring.json.trusted.packages: "*"
    
    listener:
      ack-mode: manual
      concurrency: 8

kafka:
  topics:
    forbidden-transport-scan: forbidden-transport-scan
    forbidden-scan-log: forbidden-scan-log
  authen: false
```

---

## Hướng dẫn chạy thực tế

### 1. Chuẩn bị môi trường

#### A. Cài đặt Kafka (Docker)
```bash
# Chạy Kafka cluster + Zookeeper
docker-compose up -d

# File docker-compose.yml:
version: '3'
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:7.0.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  kafka:
    image: confluentinc/cp-kafka:7.0.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:29092,PLAINTEXT_HOST://localhost:9092
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT
      KAFKA_INTER_BROKER_LISTENER_NAME: PLAINTEXT
```

#### B. Tạo Topic (nếu không auto)
```bash
# Vào container Kafka
docker exec -it kafka bash

# Tạo topic
kafka-topics --bootstrap-server localhost:9092 \
  --create --topic forbidden-transport-scan \
  --partitions 8 --replication-factor 1

# Kiểm tra
kafka-topics --bootstrap-server localhost:9092 --list
```

### 2. Setup dự án Spring Boot

```
pom.xml
├── spring-kafka
├── spring-boot-starter-web
└── lombok
```

### 3. Chạy ứng dụng
```bash
# Terminal 1: Chạy ứng dụng
mvn spring-boot:run

# Terminal 2: Gửi test message
curl -X POST http://localhost:8080/api/scan/trigger

# Terminal 3: Monitor log
tail -f app.log | grep "ForbiddenScan"
```

### 4. Kiểm tra kết quả
```bash
# Xem message trong topic (Terminal)
kafka-console-consumer \
  --bootstrap-server localhost:9092 \
  --topic forbidden-transport-scan \
  --from-beginning

# Output:
# {"sim":"0917123456","productCode":"D50","registerNo":"REG001",...}
# {"sim":"0917123457","productCode":"D50","registerNo":"REG002",...}
```

### 5. Monitoring Consumer Lag
```bash
# Xem offset của consumer group
kafka-consumer-groups \
  --bootstrap-server localhost:9092 \
  --group forbidden-scan-group \
  --describe

# Output:
# GROUP             TOPIC                    PARTITION CURRENT-OFFSET LOG-END-OFFSET LAG
# forbidden-scan-group forbidden-transport-scan 0 100 150 50
# forbidden-scan-group forbidden-transport-scan 1 100 150 50
```

---

## Troubleshooting

### 1. Lỗi: "Failed to connect to broker"

**Nguyên nhân**: Kafka broker không có sẵn hoặc address sai

**Giải pháp**:
```yaml
# Kiểm tra bootstrap-servers
spring:
  kafka:
    bootstrap-servers: 127.0.0.1:9092  # Thay 127.0.0.1 bằng IP thực tế
```

### 2. Lỗi: "Topic not found"

**Nguyên nhân**: Topic chưa tạo

**Giải pháp**:
```bash
# Tạo topic
kafka-topics --bootstrap-server localhost:9092 \
  --create --topic my-topic --partitions 4 --replication-factor 1

# Hoặc: enable auto.create.topics.enable=true trên broker
```

### 3. Lỗi: "Consumer lag quá cao"

**Nguyên nhân**: 
- Consumer xử lý chậm
- Partition quá ít
- Concurrency quá thấp

**Giải pháp**:
```yaml
# Tăng concurrency
spring:
  kafka:
    listener:
      concurrency: 16  # từ 8 → 16

# Hoặc tăng partition (tạo topic mới)
kafka-topics --bootstrap-server localhost:9092 \
  --alter --topic my-topic --partitions 16
```

### 4. Lỗi: "Timeout waiting for response"

**Nguyên nhân**: Broker bận/network chậm

**Giải pháp**:
```yaml
spring:
  kafka:
    producer:
      request-timeout-ms: 30000  # Tăng từ 20000
      delivery-timeout-ms: 60000 # Tăng từ 30000
```

### 5. Message bị mất (không thấy trong topic)

**Nguyên nhân**: `acks=0` (producer không chờ broker confirm)

**Giải pháp**:
```yaml
spring:
  kafka:
    producer:
      acks: 1  # từ 0 → 1 (an toàn hơn)
```

### 6. Consumer không commit offset

**Nguyên nhân**: Exception xảy ra, không gọi `acknowledgment.acknowledge()`

**Giải pháp**:
```java
@KafkaListener(topics = "my-topic")
public void listen(String message, Acknowledgment ack) {
    try {
        process(message);
        ack.acknowledge();  // ✅ PHẢI có
    } catch (Exception e) {
        log.error("Error", e);
        // Không commit → retry lần sau
    }
}
```

### 7. Lỗi: "Max poll interval exceeded"

**Nguyên nhân**: Consumer mất quá lâu để process một batch (> `max.poll.interval.ms`)

**Giải pháp**:
```yaml
spring:
  kafka:
    consumer:
      max-poll-records: 10  # Giảm batch size
    listener:
      concurrency: 16       # Tăng thread process
```

### 8. SASL/Plain auth fail

**Nguyên nhân**: Username/password sai hoặc broker không bật SASL

**Giải pháp**:
```yaml
kafka:
  authen: true
  username: admin
  password: correct-password

# Kiểm tra broker config
# Nếu broker không bật auth: kafka.authen=false
```

---

## Checklkist: Từng bước setup Kafka

- [ ] 1. Cài Kafka broker (docker hoặc local)
- [ ] 2. Cấu hình `application.yml`: bootstrap-servers, producer/consumer config
- [ ] 3. Thêm dependency Spring Kafka vào `pom.xml`
- [ ] 4. Tạo DTO class (VD: `NotEnoughMoneyDTO`)
- [ ] 5. Tạo `KafkaConnectionPool` (producer pool)
- [ ] 6. Tạo `KafkaProducerService` (gửi message)
- [ ] 7. Tạo `KafkaConsumerConfig` (factory)
- [ ] 8. Tạo Consumer listener (VD: `ForbiddenScanConsumer`)
- [ ] 9. Tạo Topic (via CLI hoặc auto-create)
- [ ] 10. Test: send message → verify consumer nhận
- [ ] 11. Monitor: check lag, offset
- [ ] 12. Production: enable SASL, proper acks, error handling

---

## Tài liệu tham khảo

1. **Apache Kafka Official**: https://kafka.apache.org/documentation/
2. **Spring for Apache Kafka**: https://spring.io/projects/spring-kafka
3. **Kafka Partitioning**: https://kafka.apache.org/documentation/#design_partsandconsumergroups
4. **Producer Configs**: https://kafka.apache.org/documentation/#producerconfigs
5. **Consumer Configs**: https://kafka.apache.org/documentation/#consumerconfigs

---

## Tóm tắt

| Khái niệm | Ý nghĩa | Ví dụ |
|-----------|---------|-------|
| **Topic** | Kênh giao tiếp | `forbidden-transport-scan` |
| **Partition** | Chia nhỏ topic để parallel | 8 partitions = 8 consumer thread |
| **Key** | Định tuyến partition | Key=`sim` → cùng SIM vào 1 partition |
| **Producer** | Gửi message | `ForbiddenScanProducer` |
| **Consumer** | Nhận message | `ForbiddenScanConsumer` |
| **Group** | Chia sẻ partition | `forbidden-scan-group` |
| **Offset** | Vị trí message | Consumer commit offset → next start từ đây |
| **acks** | Mức confirm | `1` = leader xác nhận, cân bằng |
| **batch** | Gom message | 32KB/30ms, sau đó gửi 1 lần |
| **concurrency** | Số thread | 8 thread consumer cùng lúc |

---

**Chúc bạn thành công với Kafka! 🚀**
