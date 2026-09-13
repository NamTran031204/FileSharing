package org.example.filesharing.services;

import org.example.filesharing.entities.dtos.metadata.DownloadFileRequestDto;
import org.example.filesharing.entities.dtos.metadata.InitiateUploadResponseDto;
import org.example.filesharing.services.impl.MinIoServiceImpl;
import org.springframework.web.multipart.MultipartFile;

public interface MinIoService {
    InitiateUploadResponseDto initiateMultipartUpload(String objectName, long fileSize);

    String getPresignedUrlForPart(String objectName, String uploadId, int partNumber);

    void completeMultipartUpload(String objectName, String uploadId, java.util.List<MinIoServiceImpl.PartInfo> parts);

    void abortMultipartUpload(String objectName, String uploadId);

    String getPresignedDownloadUrl(DownloadFileRequestDto input, long fileSize) throws Exception;

    String uploadSmallFile(MultipartFile file, String objectName);

    void deleteFile(String objectName);

    String generatePresignedUrl(String bucket, String objectName, int expirySeconds) throws Exception;

    String getHlsObjectContent(String objectKey);

    java.io.InputStream getHlsSegmentStream(String objectKey) throws Exception;
}
