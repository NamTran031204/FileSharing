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

    @Value("${server.port:5000}")
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