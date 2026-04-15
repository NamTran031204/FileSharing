# Hướng dẫn xuất OpenAPI JSON tự động cho module `filesharing-filehandler`

## 1) Kết quả kiểm tra cấu hình hiện tại

Trong module `filesharing-filehandler`, bạn **đã có sẵn nền tảng đúng**:

- Dependency springdoc: `filesharing-filehandler/pom.xml:60`
- Cấu hình OpenAPI bean: `filesharing-filehandler/src/main/java/org/example/filesharing/configurations/OpenApiConfig.java:25`
- Bật endpoint docs: `filesharing-filehandler/src/main/resources/application.yml:76`

=> Nghĩa là chỉ cần bổ sung cơ chế **tự export file JSON khi app start** là đạt mục tiêu.

---

## 2) Mục tiêu bạn yêu cầu

- Chạy dự án là có file JSON docs đầy đủ để frontend dùng ngay.
- Không cần thêm annotation ở controller khi code.
- Chỉ cấu hình trong module `filehandler`.
- Schema chi tiết cả input/output/enum.

---

## 3) Cách làm chuẩn (không cần annotation controller)

## Bước A — giữ springdoc scan theo controller + DTO (đã đúng)

Trong `application.yml`, giữ/điều chỉnh:

```yaml
springdoc:
  api-docs:
    enabled: true
    path: /v3/api-docs
    resolve-schema-properties: true
  packages-to-scan: org.example.filesharing.controllers
  default-produces-media-type: application/json
  default-consumes-media-type: application/json
  writer-with-default-pretty-printer: true
```

> `resolve-schema-properties: true` giúp schema lấy tốt metadata từ model/validation.

---

## Bước B — bật enum thành schema riêng để frontend dễ generate

Thêm vào `OpenApiConfig`:

```java
import io.swagger.v3.core.jackson.ModelResolver;

@Configuration
public class OpenApiConfig {
    static {
        ModelResolver.enumsAsRef = true;
    }

    // giữ các bean hiện tại
}
```

Hiệu quả:
- Enum sẽ nằm trong `components/schemas` (thay vì inline rời rạc),
- openapi-generator cho frontend sẽ tạo type/enum rõ ràng hơn.

---

## Bước C — tự động ghi file JSON khi app startup

Tạo file mới trong module filehandler:

**`filesharing-filehandler/src/main/java/org/example/filesharing/configurations/OpenApiJsonExporter.java`**

```java
package org.example.filesharing.configurations;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Slf4j
@Component
@RequiredArgsConstructor
public class OpenApiJsonExporter {

    private final ObjectMapper objectMapper;

    @Value("${server.port:8080}")
    private int serverPort;

    @Value("${openapi.export.enabled:true}")
    private boolean enabled;

    @Value("${openapi.export.output-file:docs/filehandler-openapi.json}")
    private String outputFile;

    @EventListener(ApplicationReadyEvent.class)
    public void export() {
        if (!enabled) {
            return;
        }

        String url = "http://localhost:" + serverPort + "/v3/api-docs";
        ResponseEntity<String> response = new RestTemplate().getForEntity(url, String.class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new IllegalStateException("Cannot fetch OpenAPI from: " + url);
        }

        try {
            Path outputPath = Paths.get(outputFile).toAbsolutePath().normalize();
            Files.createDirectories(outputPath.getParent());

            Object jsonNode = objectMapper.readValue(response.getBody(), Object.class);
            String pretty = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(jsonNode);
            Files.writeString(outputPath, pretty, StandardCharsets.UTF_8);

            log.info("OpenAPI JSON exported to {}", outputPath);
        } catch (Exception e) {
            throw new RuntimeException("Failed to write OpenAPI json", e);
        }
    }
}
```

---

## Bước D — cấu hình output path trong filehandler

Thêm vào `filesharing-filehandler/src/main/resources/application.yml`:

```yaml
openapi:
  export:
    enabled: true
    output-file: docs/filehandler-openapi.json
```

Nếu bạn luôn chạy ở root `server/`, file sẽ nằm đúng ở:

- `server/docs/filehandler-openapi.json`

Nếu chạy từ thư mục `filesharing-filehandler/`, đổi path thành:

```yaml
output-file: ../docs/filehandler-openapi.json
```

---

## 4) Để docs “đủ input/output” mà không cần annotation controller

Bạn đang làm đúng hướng nếu:

1. Endpoint luôn dùng DTO typed rõ ràng (không dùng `Map<String, Object>` bừa).
2. Request body dùng DTO + `@Valid`.
3. Response trả DTO typed (`CommonResponse<T>` + `T` cụ thể).
4. Enum dùng Java enum chuẩn.

Springdoc sẽ tự suy luận schema từ chữ ký method + DTO + Jackson + Bean Validation, không bắt buộc `@Operation` hay `@Schema` trên controller.

---

## 5) Chạy và kiểm tra

Từ thư mục `server/`:

```bash
mvn -pl filesharing-filehandler spring-boot:run
```

Sau khi app lên, kiểm tra file:

- `docs/filehandler-openapi.json`

Kiểm tra nhanh trong JSON:
- Có `paths` đầy đủ endpoint.
- Có `components.schemas` chứa DTO.
- Có schema enum (nếu bật `ModelResolver.enumsAsRef = true`).

---

## 6) Frontend generate client ngay

Ví dụ Typescript Axios:

```bash
npx @openapitools/openapi-generator-cli generate \
  -i docs/filehandler-openapi.json \
  -g typescript-axios \
  -o ../frontend/src/api-client
```

---

## 7) Lưu ý quan trọng

- Với yêu cầu “không annotation ở controller”, bạn vẫn có thể dùng javadoc/comment cho người đọc, nhưng generator frontend không phụ thuộc vào đó.
- `operationId` nên ổn định và unique. Nếu có nguy cơ trùng method name giữa controller, nên đổi customizer sang format `ControllerName_methodName` để tránh generator ghi đè hàm.

Ví dụ ý tưởng:

```java
String operationId = handlerMethod.getBeanType().getSimpleName()
        + "_" + handlerMethod.getMethod().getName();
operation.setOperationId(operationId);
```

Điều này giúp codegen frontend an toàn hơn khi API lớn.
