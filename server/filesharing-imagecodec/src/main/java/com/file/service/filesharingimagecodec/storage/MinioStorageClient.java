package com.file.service.filesharingimagecodec.storage;

import com.file.service.filesharingimagecodec.config.ImageProcessingConfig;
import io.minio.*;
import io.minio.http.Method;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;

@Component
@Slf4j
public class MinioStorageClient {

    private final MinioClient minioClient;
    private final String inputBucket;
    private final String thumbnailBucket;
    private final String imagePreviewBucket;
    private final String minioEndpoint;
    private final long largeImageThresholdBytes;

    public MinioStorageClient(MinioClient minioClient,
                              @Value("${minio.buckets.files}") String inputBucket,
                              @Value("${minio.buckets.thumbnails}") String thumbnailBucket,
                              @Value("${minio.buckets.image-preview}") String imagePreviewBucket,
                              @Value("${minio.endpoint}") String minioEndpoint,
                              ImageProcessingConfig config) {
        this.minioClient = minioClient;
        this.inputBucket = inputBucket;
        this.thumbnailBucket = thumbnailBucket;
        this.imagePreviewBucket = imagePreviewBucket;
        this.minioEndpoint = minioEndpoint;
        this.largeImageThresholdBytes = config.getVips().getLargeImageThresholdMb() * 1024L * 1024L;
    }

    public String buildThumbnailPublicUrl(String objectKey) {
        return minioEndpoint + "/" + thumbnailBucket + "/" + objectKey;
    }

    public long getObjectSize(String objectKey) throws Exception {
        StatObjectResponse stat = minioClient.statObject(
                StatObjectArgs.builder()
                        .bucket(inputBucket)
                        .object(objectKey)
                        .build()
        );
        return stat.size();
    }

    public boolean isLargeImage(String objectKey) throws Exception {
        return getObjectSize(objectKey) >= largeImageThresholdBytes;
    }

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

    public void downloadToFile(String objectKey, Path destination) throws Exception {
        try (InputStream is = minioClient.getObject(
                GetObjectArgs.builder()
                        .bucket(inputBucket)
                        .object(objectKey)
                        .build()
        ); FileOutputStream fos = new FileOutputStream(destination.toFile())) {
            is.transferTo(fos);
        }
        log.info("da tai xuong {} den tep: {}", objectKey, destination);
    }

    public void uploadThumbnail(String objectKey, byte[] data, String contentType) throws Exception {
        upload(thumbnailBucket, objectKey, data, contentType);
        log.debug("thumbnail uploaded: {}/{}", thumbnailBucket, objectKey);
    }

    public void uploadPreview(String objectKey, byte[] data, String contentType) throws Exception {
        upload(imagePreviewBucket, objectKey, data, contentType);
        log.debug("preview uploaded: {}/{}", imagePreviewBucket, objectKey);
    }

    public void rollbackThumbnail(String objectKey) {
        rollback(thumbnailBucket, objectKey);
    }

    public void rollbackPreview(String objectKey) {
        rollback(imagePreviewBucket, objectKey);
    }

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

    private void upload(String bucket, String objectKey, byte[] data, String contentType) throws Exception {
        try (ByteArrayInputStream bais = new ByteArrayInputStream(data)) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectKey)
                            .stream(bais, data.length, -1)
                            .contentType(contentType)
                            .build()
            );
        }
    }

    private void rollback(String bucket, String objectKey) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucket)
                            .object(objectKey)
                            .build()
            );
        } catch (Exception e) {
            log.warn("rollback failed for {}/{}: {}", bucket, objectKey, e.getMessage());
        }
    }
}
