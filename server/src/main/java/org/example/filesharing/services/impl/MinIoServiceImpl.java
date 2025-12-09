package org.example.filesharing.services.impl;

import io.minio.MinioClient;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.entities.dtos.metadata.DownloadFileRequestDto;
import org.example.filesharing.entities.dtos.metadata.InitiateUploadResponseDto;
import org.example.filesharing.entities.models.MetadataEntity;
import org.example.filesharing.repositories.MetadataRepo;
import org.example.filesharing.services.MinIoService;
import org.springframework.beans.factory.annotation.Value;

import io.minio.GetPresignedObjectUrlArgs;
import okhttp3.*;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class MinIoServiceImpl implements MinIoService {
    private final MinioClient minioClient;
    private final OkHttpClient httpClient = new OkHttpClient();
    private final MetadataRepo metadataRepo;

    private Integer CHUNK_SIZE = 5 * 1024 * 1024;

    @Value("${minio.bucket-name}")
    private String bucketName;

    @Override
    public InitiateUploadResponseDto initiateMultipartUpload(String objectName, Double fileSize) {
        if (objectName == null || objectName.isBlank()) {
            throw new IllegalArgumentException("Object name cannot be null or empty");
        }
        try {
            Map<String, String> queryParams = new HashMap<>();
            queryParams.put("uploads", "");

            String initiateUrl = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.POST)
                            .bucket(bucketName)
                            .object(objectName)
                            .expiry(10, TimeUnit.MINUTES)
                            .extraQueryParams(queryParams)
                            .build()
            );

            Request request = new Request.Builder()
                    .url(initiateUrl)
                    .post(RequestBody.create(new byte[0]))
                    .build();

            try (Response response = httpClient.newCall(request).execute()) {

                // validate
                if (!response.isSuccessful()) {
                    String errorBody = response.body() != null ? response.body().string() : "Unknown error";
                    log.error("Failed to initiate multipart upload: {} - {}", response.code(), errorBody);
                    throw new RuntimeException("Failed to initiate multipart upload: " + response.code() + " - " + errorBody);
                }

                if (response.body() == null) {
                    throw new RuntimeException("Empty response body from MinIO");
                }

                String xmlResponse = response.body().string();

                log.info("Initiated multipart upload for object: {} - Response: {}", objectName, xmlResponse);

                String uploadId = extractUploadIdFromXml(xmlResponse);

                Map<Integer, String> partUrls = new HashMap<>();
                int numberOfPart = fileSize.intValue()/CHUNK_SIZE + 1;

                log.info("Number of parts: {}", numberOfPart);

                for (int i = 1; i <= numberOfPart; i++) {
                    String url = getPresignedUrlForPart(objectName, uploadId, i);
                    partUrls.put(i, url);
                }
                return InitiateUploadResponseDto.builder()
                        .uploadId(uploadId)
                        .partUrl(partUrls)
                        .build();
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            log.error("Failed to initiate multipart upload for object: {}", objectName, e);
            throw new RuntimeException("Failed to initiate multipart upload: " + e.getMessage(), e);
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

        try {
            Map<String, String> queryParams = new HashMap<>();
            queryParams.put("uploadId", uploadId);
            queryParams.put("partNumber", String.valueOf(partNumber));

            log.info("queryParams for part {}: {}", partNumber, queryParams);

            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.PUT)
                            .bucket(bucketName)
                            .object(objectName)
                            .expiry(calculateExpireTime(partNumber), TimeUnit.SECONDS)
                            .extraQueryParams(queryParams)
                            .build()
            );
        } catch (Exception e) {
            log.error("Failed to create pre-signed URL for part {} of object: {}", partNumber, objectName, e);
            throw new RuntimeException("Lỗi khi tạo URL upload part", e);
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

        try {
            parts.sort((a, b) -> Integer.compare(a.getPartNumber(), b.getPartNumber()));

            for (int i = 0; i < parts.size(); i++) {
                if (parts.get(i).getPartNumber() != i + 1) {
                    log.warn("Part numbers are not sequential. Expected: {}, Got: {}",
                            i + 1, parts.get(i).getPartNumber());
                }
            }

            Map<String, String> queryParams = new HashMap<>();
            queryParams.put("uploadId", uploadId);

            String completeUrl = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.POST)
                            .bucket(bucketName)
                            .object(objectName)
                            .expiry(10, TimeUnit.MINUTES)
                            .extraQueryParams(queryParams)
                            .build()
            );

            String xmlBody = buildCompleteMultipartUploadXml(parts);

            RequestBody requestBody = RequestBody.create(
                    xmlBody,
                    MediaType.parse("application/xml")
            );

            Request request = new Request.Builder()
                    .url(completeUrl)
                    .post(requestBody)
                    .build();

            log.info("Complete multipart upload xml: {}", xmlBody);
            log.info("Complete multipart upload completeUrl: {}", completeUrl);

            try (Response response = httpClient.newCall(request).execute()) {
                String responseBody = response.body() != null ? response.body().string() : "";

                if (!response.isSuccessful()) {
                    log.error("Failed to complete multipart upload: {} - {}", response.code(), responseBody);
                    throw new RuntimeException("Failed to complete multipart upload: " + response.code() + " - " + responseBody);
                }

                if (!responseBody.contains("<ETag>")) {
                    log.error("Complete upload response missing ETag. Response: {}", responseBody);
                    throw new RuntimeException("Invalid complete upload response - missing ETag");
                }

                log.info("Successfully completed multipart upload for object: {}", objectName);
                log.debug("Complete response: {}", responseBody);

                if (!response.isSuccessful()) {
                    throw new RuntimeException("Failed to complete multipart upload: " + response.code());
                }
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi complete upload", e);
        }
    }

    @Override
    public void abortMultipartUpload(String objectName, String uploadId) {
        if (objectName == null || objectName.isBlank()) {
            throw new IllegalArgumentException("Object name cannot be null or empty");
        }
        if (uploadId == null || uploadId.isBlank()) {
            throw new IllegalArgumentException("Upload ID cannot be null or empty");
        }

        try {
            Map<String, String> queryParams = new HashMap<>();
            queryParams.put("uploadId", uploadId);

            String abortUrl = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.DELETE)
                            .bucket(bucketName)
                            .object(objectName)
                            .expiry(10, TimeUnit.MINUTES)
                            .extraQueryParams(queryParams)
                            .build()
            );

            Request request = new Request.Builder()
                    .url(abortUrl)
                    .delete()
                    .build();

            log.info("Abort multipart upload: {}", abortUrl);
            log.info("Abort request: {}", request);

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    throw new RuntimeException("Failed to abort multipart upload: " + response.code());
                }

                MetadataEntity current = metadataRepo.findByObjectNameAndUploadId(objectName, uploadId)
                        .orElse(null);

                if (current != null) {
                    metadataRepo.delete(current);
                    log.info("Deleted metadata for aborted upload: {}", objectName);
                } else {
                    log.warn("Metadata not found for object: {}, uploadId: {}", objectName, uploadId);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi abort upload", e);
        }
    }

    @Override
    public String getPresignedDownloadUrl(DownloadFileRequestDto input) throws Exception {
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
                        .expiry(input.getExpireTime(), TimeUnit.SECONDS)
                        .extraQueryParams(queryParams)
                        .build()
        );
        return url;
    }

    private String extractUploadIdFromXml(String xml) {
        Pattern pattern = Pattern.compile("<UploadId>(.*?)</UploadId>");
        Matcher matcher = pattern.matcher(xml);
        if (matcher.find()) {
            return matcher.group(1);
        }
        throw new RuntimeException("Cannot extract UploadId from XML response");
    }

    private String buildCompleteMultipartUploadXml(java.util.List<PartInfo> parts) {
        StringBuilder xml = new StringBuilder();
        xml.append("<CompleteMultipartUpload>");
        for (PartInfo part : parts) {
            xml.append("<Part>");
            xml.append("<PartNumber>").append(part.getPartNumber()).append("</PartNumber>");
            xml.append("<ETag>").append(part.getEtag()).append("</ETag>");
            xml.append("</Part>");
        }
        xml.append("</CompleteMultipartUpload>");
        return xml.toString();
    }

    // tra ve so giay
    private int calculateExpireTime(int partNumber) {
        // chat gpt bao la voi toc do 4G o Viet Nam thi upload 1 chunk 5Mb mat 3s

        // do co the gap van de ve xu ly tai backend, hieu nang backend, thoi gian gui goi tin tu backend ve client,... nen 10 chunk dau tien moi set expireTime: 5 minutes / chunk
        if (partNumber < 10) {
            return partNumber * 60 * 5;
        } else if (partNumber < 100) {
            return partNumber * 60; // 500Mb dau cho du gia thoi gian: 60s/chunk
        } else {
            return 10*60*5 + 90*60 + partNumber * 10; // tu cac part sau thi chi cho 10s/chunk
        }
        // => voi 1 file 4Gb thi expireTime se la 4 hours 30 minutes
    }

    @lombok.Data
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    public static class PartInfo {
        private int partNumber;
        private String etag;
    }
}