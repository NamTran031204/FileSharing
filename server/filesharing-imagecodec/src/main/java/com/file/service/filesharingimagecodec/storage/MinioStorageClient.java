package com.file.service.filesharingimagecodec.storage;

import com.file.service.filesharingimagecodec.config.ImageProcessingConfig;
import io.minio.*;
import io.minio.http.Method;
import io.minio.messages.DeleteObject;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * MinIO storage client for image processing.
 * Handles download (byte[] or file), upload (byte[]), and presigned URL generation.
 */
@Component
@Slf4j
public class MinioStorageClient {

    private final MinioClient minioClient;
    private final String inputBucket;
    private final String outputBucket;
    private final long largeImageThresholdBytes;

    public MinioStorageClient(MinioClient minioClient,
                              @Value("${minio.bucket-name}") String inputBucket,
                              ImageProcessingConfig config) {
        this.minioClient = minioClient;
        this.inputBucket = inputBucket;
        this.outputBucket = config.getOutput().getBucket();
        this.largeImageThresholdBytes = config.getVips().getLargeImageThresholdMb() * 1024L * 1024L;
    }

    /**
     * Check the size of an object in MinIO.
     */
    public long getObjectSize(String objectKey) throws Exception {
        StatObjectResponse stat = minioClient.statObject(
                StatObjectArgs.builder()
                        .bucket(inputBucket)
                        .object(objectKey)
                        .build()
        );
        return stat.size();
    }

    /**
     * Check if image is "large" (≥ threshold).
     */
    public boolean isLargeImage(String objectKey) throws Exception {
        return getObjectSize(objectKey) >= largeImageThresholdBytes;
    }

    /**
     * Download object to byte array (for images < 50MB).
     */
    public byte[] downloadToBytes(String objectKey) throws Exception {
        try (InputStream is = minioClient.getObject(
                GetObjectArgs.builder()
                        .bucket(inputBucket)
                        .object(objectKey)
                        .build()
        )) {
            return is.readAllBytes();
        }
    }

    /**
     * Download object to a local file (for images ≥ 50MB).
     */
    public void downloadToFile(String objectKey, Path destination) throws Exception {
        try (InputStream is = minioClient.getObject(
                GetObjectArgs.builder()
                        .bucket(inputBucket)
                        .object(objectKey)
                        .build()
        ); FileOutputStream fos = new FileOutputStream(destination.toFile())) {
            is.transferTo(fos);
        }
        log.info("Downloaded {} to file: {}", objectKey, destination);
    }

    /**
     * Upload byte array to MinIO.
     */
    public void upload(String objectKey, byte[] data, String contentType) throws Exception {
        try (ByteArrayInputStream bais = new ByteArrayInputStream(data)) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(outputBucket)
                            .object(objectKey)
                            .stream(bais, data.length, -1)
                            .contentType(contentType)
                            .build()
            );
        }
        log.debug("Uploaded {} ({} bytes) to {}/{}", objectKey, data.length, outputBucket, objectKey);
    }

    /**
     * Upload multiple results in parallel using Virtual Threads.
     * As specified in plan Section 4.4.
     */
    public void uploadAllParallel(String prefix, List<UploadItem> items) throws Exception {
        List<CompletableFuture<Void>> futures = items.stream()
                .map(item -> CompletableFuture.runAsync(
                        () -> {
                            try {
                                String key = prefix + "/" + item.fileName();
                                upload(key, item.data(), item.contentType());
                            } catch (Exception e) {
                                throw new RuntimeException("Upload failed for " + item.fileName(), e);
                            }
                        },
                        runnable -> Thread.ofVirtual().start(runnable)
                ))
                .toList();

        CompletableFuture
                .allOf(futures.toArray(new CompletableFuture[0]))
                .orTimeout(30, TimeUnit.SECONDS)
                .join();

        log.info("Uploaded {} files to prefix {}", items.size(), prefix);
    }

    /**
     * Rollback: delete uploaded objects.
     */
    public void rollback(List<String> objectKeys) {
        try {
            List<DeleteObject> deleteObjects = objectKeys.stream()
                    .map(DeleteObject::new)
                    .toList();
            minioClient.removeObjects(
                    RemoveObjectsArgs.builder()
                            .bucket(outputBucket)
                            .objects(deleteObjects)
                            .build()
            ).forEach(result -> {
                try { result.get(); } catch (Exception e) {
                    log.warn("Rollback delete failed: {}", e.getMessage());
                }
            });
        } catch (Exception e) {
            log.error("Rollback failed: {}", e.getMessage());
        }
    }

    /**
     * Generate presigned URL for FFmpeg/external tools to read from MinIO.
     */
    public String generatePresignedUrl(String objectKey, int ttlHours) throws Exception {
        return minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                        .method(Method.GET)
                        .bucket(inputBucket)
                        .object(objectKey)
                        .expiry(ttlHours, TimeUnit.HOURS)
                        .build()
        );
    }

    /**
     * Simple record for parallel upload items.
     */
    public record UploadItem(String fileName, byte[] data, String contentType) {}
}
