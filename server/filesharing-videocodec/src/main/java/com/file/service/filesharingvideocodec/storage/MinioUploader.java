package com.file.service.filesharingvideocodec.storage;

import com.file.service.filesharingvideocodec.config.VideoEncodingConfig;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectsArgs;
import io.minio.messages.DeleteObject;
import io.minio.http.Method;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * xử lý việc tải lên hàng loạt song song các tệp HLS lên MinIO.
 *
 * thứ tự tải lên là rất quan trọng:
 * 1. tải lên tất cả các phân đoạn .ts thành các lô song song (CompletableFuture.allOf)
 * 2. chỉ sau khi tất cả .ts thành công → tải lên index.m3u8
 *
 * điều này đảm bảo máy khách không bao giờ thấy playlist trước khi các phân đoạn sẵn sàng.
 * nếu bất kỳ lần tải lên nào thất bại, tất cả các đối tượng đã tải lên sẽ được khôi phục.
 */
@Component
@Slf4j
public class MinioUploader {

    private final MinioClient minioClient;
    private final String outputBucket;
    private final int batchSize;

    public MinioUploader(MinioClient minioClient, VideoEncodingConfig config) {
        this.minioClient = minioClient;
        this.outputBucket = config.getOutput().getBucket();
        this.batchSize = config.getUpload().getBatchSize();
    }

    /**
     * tạo presigned URL tải xuống để FFmpeg đọc video đầu vào từ MinIO.
     *
     * @param objectKey  khoá đối tượng trong bucket đầu vào
     * @param ttlHours   thời gian URL có hiệu lực
     * @return chuỗi presigned URL
     */
    public String generatePresignedUrl(String objectKey, int ttlHours) throws Exception {
        return minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                        .method(Method.GET)
                        .bucket("file-sharing")
                        .object(objectKey)
                        .expiry(ttlHours, TimeUnit.HOURS)
                        .build()
        );
    }

    /**
     * tải lên tất cả các tệp HLS từ thư mục đầu ra lên MinIO.
     * các phân đoạn trước (song song), sau đó là playlist (đơn lẻ).
     *
     * @param jobId     được sử dụng làm tiền tố trong MinIO: videos/{jobId}/
     * @param outputDir thư mục cục bộ chứa index.m3u8 và các tệp seg_*.ts
     * @return khoá đối tượng MinIO của playlist đã tải lên
     */
    public String uploadAll(String jobId, String outputDir) throws Exception {
        File dir = new File(outputDir);
        String prefix = "videos/" + jobId;

        // tách các tệp .ts và tệp .m3u8
        File[] tsFiles = dir.listFiles((d, name) -> name.endsWith(".ts"));
        File m3u8File = new File(dir, "index.m3u8");

        if (tsFiles == null || tsFiles.length == 0) {
            throw new RuntimeException("No .ts segments found in " + outputDir);
        }
        if (!m3u8File.exists()) {
            throw new RuntimeException("index.m3u8 not found in " + outputDir);
        }

        log.info("job {}: dang tai len {} phan doan ts + 1 m3u8 len MinIO (kich thuoc lo: {})",
                jobId, tsFiles.length, batchSize);

        List<String> uploadedKeys = new ArrayList<>();

        try {
            // bước 1: tải lên tất cả các tệp .ts thành các lô song song
            List<List<File>> batches = partitionFiles(Arrays.asList(tsFiles), batchSize);

            for (int i = 0; i < batches.size(); i++) {
                List<File> batch = batches.get(i);
                log.info("job {}: dang tai len lo {}/{} ({} tep)", jobId, i + 1, batches.size(), batch.size());

                CompletableFuture<?>[] futures = batch.stream()
                        .map(file -> CompletableFuture.runAsync(() -> {
                            try {
                                String objectKey = prefix + "/" + file.getName();
                                uploadFile(objectKey, file);
                                synchronized (uploadedKeys) {
                                    uploadedKeys.add(objectKey);
                                }
                            } catch (Exception e) {
                                throw new RuntimeException("Upload failed for " + file.getName(), e);
                            }
                        }, runnable -> Thread.ofVirtual().start(runnable)))
                        .toArray(CompletableFuture[]::new);

                // đợi cho toàn bộ lô hoàn thành
                CompletableFuture.allOf(futures).join();
            }

            // bước 2: tải lên index.m3u8 CUỐI CÙNG (sau khi tất cả các phân đoạn được xác nhận)
            String playlistKey = prefix + "/index.m3u8";
            uploadFile(playlistKey, m3u8File);
            uploadedKeys.add(playlistKey);

            log.info("job {}: tat ca {} tep da duoc tai len MinIO thanh cong", jobId, uploadedKeys.size());
            return playlistKey;

        } catch (Exception e) {
            // khôi phục: xoá bất kỳ đối tượng nào đã được tải lên thành công
            log.error("job {}: tai len that bai, dang khoi phuc {} doi tuong da tai len", jobId, uploadedKeys.size());
            rollback(uploadedKeys);
            throw new RuntimeException("MinIO upload failed for job " + jobId, e);
        }
    }

    private void uploadFile(String objectKey, File file) throws Exception {
        String contentType = file.getName().endsWith(".m3u8")
                ? "application/vnd.apple.mpegurl"
                : file.getName().endsWith(".ts")
                ? "video/mp2t"
                : "application/octet-stream";

        try (FileInputStream fis = new FileInputStream(file)) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(outputBucket)
                            .object(objectKey)
                            .stream(fis, file.length(), -1)
                            .contentType(contentType)
                            .build()
            );
        }
    }

    private void rollback(List<String> objectKeys) {
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
                try {
                    result.get();
                } catch (Exception e) {
                    log.warn("khong the xoa doi tuong trong qua trinh khoi phuc: {}", e.getMessage());
                }
            });
        } catch (Exception e) {
            log.error("khoi phuc that bai: {}", e.getMessage());
        }
    }

    private <T> List<List<T>> partitionFiles(List<T> list, int size) {
        List<List<T>> partitions = new ArrayList<>();
        for (int i = 0; i < list.size(); i += size) {
            partitions.add(list.subList(i, Math.min(i + size, list.size())));
        }
        return partitions;
    }
}
