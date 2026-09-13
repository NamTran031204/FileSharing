package org.example.filesharing.services.impl;

import io.minio.GetObjectArgs;
import io.minio.GetPresignedObjectUrlArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.http.Method;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.entities.dtos.metadata.DownloadFileRequestDto;
import org.example.filesharing.entities.dtos.metadata.InitiateUploadResponseDto;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import org.example.filesharing.repositories.MetadataRepo;
import org.example.filesharing.services.MinIoService;
import org.example.filesharing.services.StorageService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.services.s3.model.UploadPartRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class MinIoServiceImpl implements MinIoService {
    private static final long MAX_DIRECT_UPLOAD_SIZE = 5 * 1024 * 1024;

    // TTL đồng nhất cho lô part URL của luồng legacy E7 (user duyệt 2026-09-01):
    // clamp(partCount * 60s, 1h, 6h) — thay cho calculateExpireTime(partNumber) cũ.
    private static final long LEGACY_PART_URL_TTL_STEP_SECONDS = 60L;
    private static final long LEGACY_PART_URL_TTL_MIN_SECONDS = 3600L;
    private static final long LEGACY_PART_URL_TTL_MAX_SECONDS = 21600L;

    // TTL presigned GET cua cac duong khong thuoc E6 (processing / image data)
    private static final long DOWNLOAD_TTL_MIN_SECONDS = 900L;
    private static final long DOWNLOAD_TTL_MAX_SECONDS = 14400L;

    private final MinioClient minioClient;
    private final MetadataRepo metadataRepo;
    private final StorageService storageService;
    private final S3Presigner uploadPresigner;
    private final Integer CHUNK_SIZE = 5 * 1024 * 1024;
    @Value("${minio.buckets.files}")
    private String bucketName;

    @Value("${minio.buckets.hls}")
    private String hlsBucketName;

    public MinIoServiceImpl(MinioClient minioClient,
                             MetadataRepo metadataRepo,
                             StorageService storageService,
                             @Qualifier("uploadPresigner") S3Presigner uploadPresigner) {
        this.minioClient = minioClient;
        this.metadataRepo = metadataRepo;
        this.storageService = storageService;
        this.uploadPresigner = uploadPresigner;
    }

    @Override
    public InitiateUploadResponseDto initiateMultipartUpload(String objectName, long fileSize) {
        if (objectName == null || objectName.isBlank()) {
            throw new IllegalArgumentException("Object name cannot be null or empty");
        }
        try {
            String uploadId = storageService.createMultipartUpload(objectName);

            int numberOfPart = (int) (fileSize / CHUNK_SIZE + 1);
            long ttlSeconds = clampLegacyPartUrlTtl(numberOfPart);

            log.info("Number of parts: {}", numberOfPart);

            Map<Integer, String> partUrls = new HashMap<>();
            for (int i = 1; i <= numberOfPart; i++) {
                partUrls.put(i, presignLegacyPart(objectName, uploadId, i, ttlSeconds));
            }
            return InitiateUploadResponseDto.builder()
                    .uploadId(uploadId)
                    .partUrl(partUrls)
                    .build();
        } catch (IllegalArgumentException e) {
            throw e;
        }
    }

    @Override
    public String getPresignedUrlForPart(String objectName, String uploadId, int partNumber) {
        if (objectName == null || objectName.isBlank()) {
            throw new IllegalArgumentException("Object name cannot be null or empty");
        }
        if (uploadId == null || uploadId.isBlank()) {
            throw new IllegalArgumentException("Upload ID cannot be null or empty");
        }
        if (partNumber < 1 || partNumber > 10000) {
            throw new IllegalArgumentException("Part number must be between 1 and 10000");
        }

        return presignLegacyPart(objectName, uploadId, partNumber, clampLegacyPartUrlTtl(1));
    }

    private long clampLegacyPartUrlTtl(int partCount) {
        long ttl = (long) partCount * LEGACY_PART_URL_TTL_STEP_SECONDS;
        return Math.max(LEGACY_PART_URL_TTL_MIN_SECONDS, Math.min(LEGACY_PART_URL_TTL_MAX_SECONDS, ttl));
    }

    private String presignLegacyPart(String objectName, String uploadId, int partNumber, long ttlSeconds) {
        try {
            UploadPartRequest uploadPartRequest = UploadPartRequest.builder()
                    .bucket(bucketName)
                    .key(objectName)
                    .uploadId(uploadId)
                    .partNumber(partNumber)
                    .build();
            var presigned = uploadPresigner.presignUploadPart(b -> b
                    .signatureDuration(Duration.ofSeconds(ttlSeconds))
                    .uploadPartRequest(uploadPartRequest));
            return presigned.url().toString();
        } catch (SdkException e) {
            log.error("Failed to create pre-signed URL for part {} of object: {}", partNumber, objectName, e);
            throw new FileBusinessException(ErrorCode.FILE_ERROR, "Failed to presign part url");
        }
    }

    @Override
    public void completeMultipartUpload(String objectName, String uploadId, java.util.List<PartInfo> parts) {
        if (objectName == null || objectName.isBlank()) {
            throw new IllegalArgumentException("Object name cannot be null or empty");
        }
        if (uploadId == null || uploadId.isBlank()) {
            throw new IllegalArgumentException("Upload ID cannot be null or empty");
        }
        if (parts == null || parts.isEmpty()) {
            throw new IllegalArgumentException("Parts list cannot be null or empty");
        }

        parts.sort((a, b) -> Integer.compare(a.getPartNumber(), b.getPartNumber()));

        for (int i = 0; i < parts.size(); i++) {
            if (parts.get(i).getPartNumber() != i + 1) {
                log.warn("Part numbers are not sequential. Expected: {}, Got: {}",
                        i + 1, parts.get(i).getPartNumber());
            }
        }

        java.util.List<StorageService.CompletedPartSpec> specs = parts.stream()
                .map(p -> new StorageService.CompletedPartSpec(p.getPartNumber(), p.getEtag()))
                .toList();

        storageService.completeMultipartUpload(objectName, uploadId, specs);
        log.info("Successfully completed multipart upload for object: {}", objectName);
    }

    @Override
    public void abortMultipartUpload(String objectName, String uploadId) {
        if (objectName == null || objectName.isBlank()) {
            throw new IllegalArgumentException("Object name cannot be null or empty");
        }
        if (uploadId == null || uploadId.isBlank()) {
            throw new IllegalArgumentException("Upload ID cannot be null or empty");
        }

        storageService.abortMultipartUpload(objectName, uploadId);
        log.info("Successfully aborted multipart upload for object: {}", objectName);
    }

    @Override
    public String getPresignedDownloadUrl(DownloadFileRequestDto input, long fileSize) throws Exception {
        Map<String, String> queryParams = new HashMap<>();

        // Content-Disposition header để browser download với tên file custom
        queryParams.put(
                "response-content-disposition",
                "attachment; filename=\"" + input.getDownloadFileName() + "\""
        );

        String url = minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                        .method(Method.GET)
                        .bucket(bucketName)
                        .object(input.getObjectName())
                        .expiry((int) clampDownloadTtl(fileSize), TimeUnit.SECONDS)
                        .extraQueryParams(queryParams)
                        .build()
        );
        return url;
    }

    @Override
    public String uploadSmallFile(MultipartFile file, String objectName) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be null or empty");
        }
        if (objectName == null || objectName.isBlank()) {
            throw new IllegalArgumentException("Object name cannot be null or empty");
        }
        if (file.getSize() > MAX_DIRECT_UPLOAD_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum allowed size for direct upload (5MB). Use multipart upload instead.");
        }

        try (InputStream inputStream = file.getInputStream()) {
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .stream(inputStream, file.getSize(), -1)
                            .contentType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                            .build()
            );

            log.info("Successfully uploaded small file '{}' to bucket '{}', size: {} bytes",
                    objectName, bucketName, file.getSize());

            return objectName;
        } catch (Exception e) {
            log.error("Failed to upload small file '{}' to bucket '{}'", objectName, bucketName, e);
            throw new RuntimeException("Failed to upload file: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteFile(String objectName) {
        if (objectName == null || objectName.isBlank()) {
            throw new FileBusinessException(ErrorCode.FILE_OBJECT_NAME_CANNOT_BE_EMPTY, "Object name cannot be null or empty");
        }

        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectName)
                            .build()
            );
            log.info("Successfully deleted file '{}' from bucket '{}'", objectName, bucketName);
        } catch (Exception e) {
            log.error("Failed to delete file '{}' from bucket '{}'", objectName, bucketName, e);
            throw new FileBusinessException(ErrorCode.FILE_ERROR, "Failed to delete file: " + e.getMessage());
        }
    }

    // TTL download dong nhat theo kich thuoc: clamp(size / 1MBps, 15 phut, 4 gio)
    private long clampDownloadTtl(long fileSize) {
        long ttlSeconds = fileSize / 1_000_000L;
        if (ttlSeconds < DOWNLOAD_TTL_MIN_SECONDS) {
            return DOWNLOAD_TTL_MIN_SECONDS;
        }
        return Math.min(ttlSeconds, DOWNLOAD_TTL_MAX_SECONDS);
    }

    @Override
    public String generatePresignedUrl(String bucket, String objectName, int expirySeconds) throws Exception {
        return minioClient.getPresignedObjectUrl(
                GetPresignedObjectUrlArgs.builder()
                        .method(Method.GET)
                        .bucket(bucket)
                        .object(objectName)
                        .expiry(expirySeconds, TimeUnit.SECONDS)
                        .build()
        );
    }

    @Override
    public String getHlsObjectContent(String objectKey) {
        try (InputStream stream = minioClient.getObject(
                GetObjectArgs.builder()
                        .bucket(hlsBucketName)
                        .object(objectKey)
                        .build()
        )) {
            return new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("Failed to read HLS object '{}' from bucket '{}'", objectKey, hlsBucketName, e);
            throw new FileBusinessException(ErrorCode.FILE_ERROR, "Failed to read HLS manifest");
        }
    }

    @Override
    public InputStream getHlsSegmentStream(String objectKey) throws Exception {
        return minioClient.getObject(
                GetObjectArgs.builder()
                        .bucket(hlsBucketName)
                        .object(objectKey)
                        .build()
        );
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    public static class PartInfo {
        private int partNumber;
        private String etag;
    }
}