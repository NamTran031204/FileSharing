package org.example.filesharing.services;

import java.util.List;

public interface StorageService {

    String createMultipartUpload(String objectName);

    String presignUploadPart(String objectName, String uploadId, int partNumber);

    List<PartSummary> listParts(String objectName, String uploadId);

    String completeMultipartUpload(String objectName, String uploadId, List<CompletedPartSpec> parts);

    void abortMultipartUpload(String objectName, String uploadId);

    HeadObjectResult headObject(String objectName);

    String presignGetObject(String objectName, String downloadFileName, long fileSize);

    record PartSummary(int partNumber, long size, String etag) {
    }

    record CompletedPartSpec(int partNumber, String etag) {
    }

    record HeadObjectResult(long contentLength, String etag, String contentType) {
    }
}
