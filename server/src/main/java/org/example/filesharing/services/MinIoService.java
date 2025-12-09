package org.example.filesharing.services;

import org.example.filesharing.entities.dtos.metadata.DownloadFileRequestDto;
import org.example.filesharing.entities.dtos.metadata.InitiateUploadResponseDto;
import org.example.filesharing.services.impl.MinIoServiceImpl;

public interface MinIoService {
    InitiateUploadResponseDto initiateMultipartUpload(String objectName, Double fileSize);
    String getPresignedUrlForPart(String objectName, String uploadId, int partNumber);
    void completeMultipartUpload(String objectName, String uploadId, java.util.List<MinIoServiceImpl.PartInfo> parts);
    void abortMultipartUpload(String objectName, String uploadId);
    String getPresignedDownloadUrl(DownloadFileRequestDto input) throws Exception;
}
