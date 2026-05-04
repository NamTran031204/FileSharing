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
 * Handles parallel batch upload of HLS files to MinIO.
 *
 * Upload order is critical:
 * 1. Upload ALL .ts segments in parallel batches (CompletableFuture.allOf)
 * 2. Only after ALL .ts succeed → upload index.m3u8
 *
 * This ensures clients never see a playlist before segments are ready.
 * If any upload fails, all uploaded objects are rolled back.
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
     * Generate a pre-signed download URL for FFmpeg to read input video from MinIO.
     *
     * @param objectKey  the object key in the input bucket
     * @param ttlHours   how long the URL should be valid
     * @return pre-signed URL string
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
     * Upload all HLS files from the output directory to MinIO.
     * Segments first (parallel), then playlist (single).
     *
     * @param jobId     used as prefix in MinIO: videos/{jobId}/
     * @param outputDir local directory containing index.m3u8 and seg_*.ts files
     * @return the MinIO object key of the uploaded playlist
     */
    public String uploadAll(String jobId, String outputDir) throws Exception {
        File dir = new File(outputDir);
        String prefix = "videos/" + jobId;

        // Separate .ts files and .m3u8 file
        File[] tsFiles = dir.listFiles((d, name) -> name.endsWith(".ts"));
        File m3u8File = new File(dir, "index.m3u8");

        if (tsFiles == null || tsFiles.length == 0) {
            throw new RuntimeException("No .ts segments found in " + outputDir);
        }
        if (!m3u8File.exists()) {
            throw new RuntimeException("index.m3u8 not found in " + outputDir);
        }

        log.info("Job {}: uploading {} ts segments + 1 m3u8 to MinIO (batch size: {})",
                jobId, tsFiles.length, batchSize);

        List<String> uploadedKeys = new ArrayList<>();

        try {
            // Step 1: Upload all .ts files in parallel batches
            List<List<File>> batches = partitionFiles(Arrays.asList(tsFiles), batchSize);

            for (int i = 0; i < batches.size(); i++) {
                List<File> batch = batches.get(i);
                log.info("Job {}: uploading batch {}/{} ({} files)", jobId, i + 1, batches.size(), batch.size());

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

                // Wait for entire batch to complete
                CompletableFuture.allOf(futures).join();
            }

            // Step 2: Upload index.m3u8 LAST (after all segments are confirmed)
            String playlistKey = prefix + "/index.m3u8";
            uploadFile(playlistKey, m3u8File);
            uploadedKeys.add(playlistKey);

            log.info("Job {}: all {} files uploaded to MinIO successfully", jobId, uploadedKeys.size());
            return playlistKey;

        } catch (Exception e) {
            // Rollback: delete any objects that were successfully uploaded
            log.error("Job {}: upload failed, rolling back {} uploaded objects", jobId, uploadedKeys.size());
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
                    log.warn("Failed to delete object during rollback: {}", e.getMessage());
                }
            });
        } catch (Exception e) {
            log.error("Rollback failed: {}", e.getMessage());
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
