package org.example.filesharing.configurations;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

@Configuration
public class S3Config {

    private static final Region S3_REGION = Region.US_EAST_1;

    @Value("${minio.endpoint}")                 private String endpoint;
    @Value("${minio.svc-upload.access-key}")    private String uploadAccessKey;
    @Value("${minio.svc-upload.secret-key}")    private String uploadSecretKey;
    @Value("${minio.svc-download.access-key}")  private String downloadAccessKey;
    @Value("${minio.svc-download.secret-key}")  private String downloadSecretKey;

    /** Control plane: createMultipartUpload / listParts / completeMultipartUpload
     *  / abortMultipartUpload / headObject / listMultipartUploads — ký bằng svc-upload. */
    @Bean
    public S3Client s3Client() {
        return S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(S3_REGION)
                .forcePathStyle(true)
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(uploadAccessKey, uploadSecretKey)))
                .build();
    }

    /** Presign PUT part (E1, E2) — svc-upload. */
    @Bean("uploadPresigner")
    public S3Presigner uploadPresigner() {
        return S3Presigner.builder()
                .endpointOverride(URI.create(endpoint))
                .region(S3_REGION)
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build())
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(uploadAccessKey, uploadSecretKey)))
                .build();
    }

    /** Presign GET (E6) — svc-download. */
    @Bean("downloadPresigner")
    public S3Presigner downloadPresigner() {
        return S3Presigner.builder()
                .endpointOverride(URI.create(endpoint))
                .region(S3_REGION)
                .serviceConfiguration(S3Configuration.builder()
                        .pathStyleAccessEnabled(true)
                        .build())
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(downloadAccessKey, downloadSecretKey)))
                .build();
    }
}
