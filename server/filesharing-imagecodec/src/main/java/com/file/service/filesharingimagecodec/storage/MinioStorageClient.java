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


@Component
@Slf4j
public class MinioStorageClient {

    private final MinioClient minioClient;
    private final String inputBucket;
    private final String outputBucket;
    private final long largeImageThresholdBytes;

    public MinioStorageClient(MinioClient minioClient,
                              @Value("${minio.buckets.files}") String inputBucket,
                              @Value("${minio.buckets.thumbnails}") String outputBucket,
                              ImageProcessingConfig config) {
        this.minioClient = minioClient;
        this.inputBucket = inputBucket;
        this.outputBucket = outputBucket;
        this.largeImageThresholdBytes = config.getVips().getLargeImageThresholdMb() * 1024L * 1024L;
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
        log.debug("da tai len {} ({} bytes) den {}/{}", objectKey, data.length, outputBucket, objectKey);
    }

    /**
     * tải lên nhiều kết quả song song bằng Virtual Threads.
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

        log.info("da tai len {} tep den tien to {}", items.size(), prefix);
    }

    /**
     * khôi phục: xoá các đối tượng đã tải lên.
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
                    log.warn("xoa khoi phuc that bai: {}", e.getMessage());
                }
            });
        } catch (Exception e) {
            log.error("khoi phuc that bai: {}", e.getMessage());
        }
    }

    /**
     * tạo presigned URL cho FFmpeg/các công cụ bên ngoài để đọc từ MinIO.
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
     * bản ghi đơn giản cho các mục tải lên song song.
     */
    public record UploadItem(String fileName, byte[] data, String contentType) {}
}
