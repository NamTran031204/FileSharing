package com.file.service.filesharingvideocodec.service;

import com.file.service.filesharingvideocodec.config.VideoEncodingConfig;
import com.file.service.filesharingvideocodec.exception.EncodingException;
import com.file.service.filesharingvideocodec.model.EncodingProfile;
import com.file.service.filesharingvideocodec.util.EncodingLogger;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class VideoUploadService {

    private final MinioClient minioClient;
    private final VideoEncodingConfig encodingConfig;
    private final EncodingLogger encodingLogger;

    public List<String> uploadEncodedSegments(String jobId, File outputDir, EncodingProfile profile) {
        encodingLogger.logUploadStart(jobId, profile.getName(), 0);
        
        List<String> uploadedUrls = new ArrayList<>();
        String bucketName = encodingConfig.getOutput().getBucket();
        String basePath = String.format("videos/%s/%s", jobId, profile.getSuffix());

        try {
            File[] files = outputDir.listFiles();
            if (files == null || files.length == 0) {
                throw new EncodingException("No files found in output directory: " + outputDir.getAbsolutePath());
            }

            int fileCount = 0;
            for (File file : files) {
                if (file.isFile()) {
                    String objectName = basePath + "/" + file.getName();
                    uploadFileToMinio(bucketName, objectName, file);
                    uploadedUrls.add(objectName);
                    fileCount++;
                }
            }

            encodingLogger.logUploadComplete(jobId, profile.getName(), fileCount);
            return uploadedUrls;

        } catch (Exception e) {
            encodingLogger.logEncodingError(jobId, profile.getName(), "Upload failed: " + e.getMessage());
            throw new EncodingException("Failed to upload segments for job: " + jobId, e);
        }
    }

    private void uploadFileToMinio(String bucketName, String objectName, File file) throws Exception {
        try (FileInputStream fis = new FileInputStream(file)) {
            String contentType = determineContentType(file.getName());
            
            minioClient.putObject(
                PutObjectArgs.builder()
                    .bucket(bucketName)
                    .object(objectName)
                    .stream(fis, file.length(), -1)
                    .contentType(contentType)
                    .build()
            );
            
            log.debug("Uploaded {} to {}/{}", file.getName(), bucketName, objectName);
        } catch (IOException e) {
            throw new EncodingException("Failed to read file: " + file.getName(), e);
        }
    }

    private String determineContentType(String fileName) {
        if (fileName.endsWith(".m3u8")) {
            return "application/vnd.apple.mpegurl";
        } else if (fileName.endsWith(".ts")) {
            return "video/mp2t";
        }
        return "application/octet-stream";
    }

    public String getObjectUrl(String bucketName, String objectName) {
        return String.format("%s/%s/%s", 
            minioClient.toString(), bucketName, objectName);
    }
}
