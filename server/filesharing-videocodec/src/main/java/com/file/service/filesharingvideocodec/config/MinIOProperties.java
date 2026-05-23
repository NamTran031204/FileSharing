package com.file.service.filesharingvideocodec.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.HashMap;
import java.util.Map;

@ConfigurationProperties(prefix = "minio")
@Data
public class MinIOProperties {
    private String endpoint;
    private String accessKey;
    private String secretKey;
    private Map<String, String> buckets = new HashMap<>();
}
