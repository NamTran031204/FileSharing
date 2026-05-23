package com.file.service.filesharingimagerawproccess.config;

import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(MinIOProperties.class)
public class MinIOConfig {

    @Bean
    public MinioClient minioClient(MinIOProperties props) {
        try {
            MinioClient client = MinioClient.builder()
                    .endpoint(props.getEndpoint())
                    .credentials(props.getAccessKey(), props.getSecretKey())
                    .build();

            for (String bucketName : props.getBuckets().values()) {
                boolean exists = client.bucketExists(
                        BucketExistsArgs.builder().bucket(bucketName).build());
                if (!exists) {
                    client.makeBucket(MakeBucketArgs.builder().bucket(bucketName).build());
                }
            }
            return client;
        } catch (Exception e) {
            throw new RuntimeException("MinIO setup failed: " + e.getMessage());
        }
    }
}
