# Dependencies cho FFmpeg Integration

## 1. Apache Commons Exec (Khuyến nghị - CLI Wrapper)

### Maven (pom.xml)
```xml
<!-- Apache Commons Exec - Để chạy FFmpeg CLI -->
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-exec</artifactId>
    <version>1.4.0</version>
</dependency>

<!-- Spring Boot Async Support -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter</artifactId>
</dependency>
```

### Gradle (build.gradle)
```gradle
implementation 'org.apache.commons:commons-exec:1.4.0'
implementation 'org.springframework.boot:spring-boot-starter'
```

**Ưu điểm:**
- ✅ Nhẹ (~50KB)
- ✅ Linh hoạt tối đa
- ✅ Dễ debug
- ✅ Không bundle FFmpeg binary

**Yêu cầu:**
- ⚠️ Phải cài FFmpeg trên hệ thống

---

## 2. JAVE2 (Java Audio Video Encoder)

### Maven - All Platforms
```xml
<!-- JAVE2 - Bao gồm FFmpeg binary cho mọi platform -->
<dependency>
    <groupId>ws.schild</groupId>
    <artifactId>jave-all-deps</artifactId>
    <version>3.5.0</version>
</dependency>
```

### Maven - Windows Only
```xml
<!-- JAVE2 Core -->
<dependency>
    <groupId>ws.schild</groupId>
    <artifactId>jave-core</artifactId>
    <version>3.5.0</version>
</dependency>

<!-- Windows 64-bit Binary -->
<dependency>
    <groupId>ws.schild</groupId>
    <artifactId>jave-nativebin-win64</artifactId>
    <version>3.5.0</version>
</dependency>
```

### Maven - Linux Only
```xml
<dependency>
    <groupId>ws.schild</groupId>
    <artifactId>jave-core</artifactId>
    <version>3.5.0</version>
</dependency>

<dependency>
    <groupId>ws.schild</groupId>
    <artifactId>jave-nativebin-linux64</artifactId>
    <version>3.5.0</version>
</dependency>
```

### Gradle
```gradle
implementation 'ws.schild:jave-all-deps:3.5.0'
// Hoặc
implementation 'ws.schild:jave-core:3.5.0'
implementation 'ws.schild:jave-nativebin-win64:3.5.0'
```

**Ưu điểm:**
- ✅ Đóng gói sẵn FFmpeg
- ✅ Không cần cài FFmpeg riêng
- ✅ API Java đơn giản

**Nhược điểm:**
- ❌ Kích thước lớn (~50MB)
- ❌ Không hỗ trợ trực tiếp HLS (cần wrapper thêm)

---

## 3. JavaCV (Wrapper cho FFmpeg, OpenCV)

### Maven
```xml
<!-- JavaCV Core -->
<dependency>
    <groupId>org.bytedeco</groupId>
    <artifactId>javacv</artifactId>
    <version>1.5.10</version>
</dependency>

<!-- FFmpeg Platform -->
<dependency>
    <groupId>org.bytedeco</groupId>
    <artifactId>ffmpeg-platform</artifactId>
    <version>6.1-1.5.10</version>
</dependency>
```

### Gradle
```gradle
implementation 'org.bytedeco:javacv:1.5.10'
implementation 'org.bytedeco:ffmpeg-platform:6.1-1.5.10'
```

**Ưu điểm:**
- ✅ Low-level API mạnh mẽ
- ✅ Hỗ trợ nhiều platform

**Nhược điểm:**
- ❌ Rất nặng (~200MB+)
- ❌ Phức tạp hơn JAVE2
- ❌ Overkill cho use case HLS đơn giản

---

## 4. Dependencies Bổ Sung

### 4.1. Spring Async Support

**Enable trong Application class:**
```java
@SpringBootApplication
@EnableAsync
public class FileSharingApplication {
    public static void main(String[] args) {
        SpringApplication.run(FileSharingApplication.class, args);
    }
}
```

**AsyncConfig:**
```java
@Configuration
@EnableAsync
public class AsyncConfig {
    
    @Bean(name = "videoProcessingExecutor")
    public Executor videoProcessingExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("video-");
        executor.initialize();
        return executor;
    }
}
```

### 4.2. Lombok (Optional)

```xml
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>
```

### 4.3. Validation

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

### 4.4. MinIO Client (Nếu dùng MinIO)

```xml
<dependency>
    <groupId>io.minio</groupId>
    <artifactId>minio</artifactId>
    <version>8.5.7</version>
</dependency>
```

---

## 5. Complete POM.xml Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
        <relativePath/>
    </parent>
    
    <groupId>org.example</groupId>
    <artifactId>filesharing-filehandler</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <name>FileSharing Video Processing</name>
    
    <properties>
        <java.version>17</java.version>
    </properties>
    
    <dependencies>
        <!-- Spring Boot Core -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        
        <!-- MongoDB -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-mongodb</artifactId>
        </dependency>
        
        <!-- FFmpeg CLI Wrapper (Khuyến nghị) -->
        <dependency>
            <groupId>org.apache.commons</groupId>
            <artifactId>commons-exec</artifactId>
            <version>1.4.0</version>
        </dependency>
        
        <!-- MinIO Client -->
        <dependency>
            <groupId>io.minio</groupId>
            <artifactId>minio</artifactId>
            <version>8.5.7</version>
        </dependency>
        
        <!-- Lombok -->
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
        
        <!-- Kafka (Nếu cần gửi notification) -->
        <dependency>
            <groupId>org.springframework.kafka</groupId>
            <artifactId>spring-kafka</artifactId>
        </dependency>
        
        <!-- Testing -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
    
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
                <configuration>
                    <excludes>
                        <exclude>
                            <groupId>org.projectlombok</groupId>
                            <artifactId>lombok</artifactId>
                        </exclude>
                    </excludes>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

---

## 6. So Sánh Các Phương Án

| Tiêu chí | Commons Exec | JAVE2 | JavaCV |
|----------|--------------|-------|--------|
| **Kích thước** | ~50KB | ~50MB | ~200MB+ |
| **Cần cài FFmpeg** | ✅ Có | ❌ Không | ❌ Không |
| **HLS Support** | ✅ Full | ⚠️ Cần wrapper | ✅ Full |
| **Độ phức tạp** | Thấp | Thấp | Cao |
| **Linh hoạt** | Cao nhất | Trung bình | Cao |
| **Performance** | Tốt | Tốt | Tốt |
| **Use Case** | Production | Quick start | Advanced |

---

## 7. Khuyến Nghị cho Dự Án FileSharing

### ✅ Phương án được khuyến nghị: **Apache Commons Exec**

**Lý do:**
1. **Nhẹ:** Chỉ ~50KB, không làm phình to artifact
2. **Linh hoạt:** Chạy mọi lệnh FFmpeg, dễ customize
3. **Production-ready:** Dễ deploy trên server (cài FFmpeg 1 lần)
4. **Maintainable:** Code dễ debug, dễ nâng cấp FFmpeg version
5. **Performance:** Không overhead so với gọi FFmpeg trực tiếp

### Cài đặt FFmpeg trên Production Server

**Docker:**
```dockerfile
FROM openjdk:17-slim

# Install FFmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

# Copy application
COPY target/*.jar app.jar

ENTRYPOINT ["java", "-jar", "/app.jar"]
```

**Ubuntu Server:**
```bash
sudo apt update
sudo apt install -y ffmpeg
ffmpeg -version
```

**Windows Server:**
```powershell
choco install ffmpeg
```

---

## 8. Maven Commands

### Build project
```bash
mvn clean install
```

### Run application
```bash
mvn spring-boot:run
```

### Package JAR
```bash
mvn clean package
```

### Dependency tree
```bash
mvn dependency:tree
```

### Update dependencies
```bash
mvn versions:display-dependency-updates
```

---

## 9. Verify Installation

### Java code để verify FFmpeg
```java
@PostConstruct
public void verifyFFmpeg() {
    try {
        CommandLine cmdLine = new CommandLine(ffmpegConfig.getBinPath());
        cmdLine.addArgument("-version");
        
        DefaultExecutor executor = new DefaultExecutor();
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        executor.setStreamHandler(new PumpStreamHandler(outputStream));
        
        int exitCode = executor.execute(cmdLine);
        
        if (exitCode == 0) {
            log.info("FFmpeg verified: {}", outputStream.toString().split("\n")[0]);
        }
    } catch (Exception e) {
        log.error("FFmpeg not found! Please install FFmpeg: {}", e.getMessage());
    }
}
```

### Expected output
```
FFmpeg verified: ffmpeg version 6.1 Copyright (c) 2000-2023 the FFmpeg developers
```

---

**Tài liệu liên quan:**
- [FFMPEG_SPRING_BOOT_GUIDE.md](./FFMPEG_SPRING_BOOT_GUIDE.md)
- [README.md](./README.md)
