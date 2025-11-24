package org.example.filesharing.services.impl;

import io.minio.MinioClient;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.models.Metadata;
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
public class MinIoServiceImpl implements MinIoService {
    private final MinioClient minioClient;
    private final OkHttpClient httpClient = new OkHttpClient();
    private final MetadataRepo metadataRepo;

    @Value("${minio.bucket-name}")
    private String bucketName;

    @Override
    public String initiateMultipartUpload(String objectName) {
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
                if (!response.isSuccessful()) {
                    throw new RuntimeException("Failed to initiate multipart upload: " + response.code());
                }

                String xmlResponse = response.body().string();

                return extractUploadIdFromXml(xmlResponse);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to initiate multipart upload: " + e.getMessage(), e);
        }
    }

    @Override
    public String getPresignedUrlForPart(String objectName, String uploadId, int partNumber) {
        try {
            Map<String, String> queryParams = new HashMap<>();
            queryParams.put("uploadId", uploadId);
            queryParams.put("partNumber", String.valueOf(partNumber));

            return minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.PUT)
                            .bucket(bucketName)
                            .object(objectName)
                            .expiry(10, TimeUnit.MINUTES)
                            .extraQueryParams(queryParams)
                            .build()
            );
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi tạo URL upload part", e);
        }
    }

    @Override
    public void completeMultipartUpload(String objectName, String uploadId, java.util.List<PartInfo> parts) {
        try {
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

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    throw new RuntimeException("Failed to complete multipart upload: " + response.code());
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi complete upload", e);
        }
    }

    @Override
    public void abortMultipartUpload(String objectName, String uploadId) {
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

            try (Response response = httpClient.newCall(request).execute()) {
                if (!response.isSuccessful()) {
                    throw new RuntimeException("Failed to abort multipart upload: " + response.code());
                }
                Metadata curent = metadataRepo.findByFileNameAndUploadId(objectName, uploadId)
                        .orElseThrow((() -> new RuntimeException("khong tim thay")));
                metadataRepo.delete(curent);
            }
        } catch (Exception e) {
            throw new RuntimeException("Lỗi khi abort upload", e);
        }
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

    @lombok.Data
    @lombok.AllArgsConstructor
    @lombok.NoArgsConstructor
    public static class PartInfo {
        private int partNumber;
        private String etag;
    }
}