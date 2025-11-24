package org.example.filesharing.services;

import org.example.filesharing.services.impl.MinIoServiceImpl;

public interface MinIoService {
    String initiateMultipartUpload(String objectName);
    String getPresignedUrlForPart(String objectName, String uploadId, int partNumber);
    void completeMultipartUpload(String objectName, String uploadId, java.util.List<MinIoServiceImpl.PartInfo> parts);
    void abortMultipartUpload(String objectName, String uploadId);
}
