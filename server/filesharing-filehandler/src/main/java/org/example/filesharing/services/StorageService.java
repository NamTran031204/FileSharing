package org.example.filesharing.services;

import java.time.Instant;
import java.util.List;

public interface StorageService {

    String createMultipartUpload(String objectName);

    String presignUploadPart(String objectName, String uploadId, int partNumber);

    List<PartSummary> listParts(String objectName, String uploadId);

    String completeMultipartUpload(String objectName, String uploadId, List<CompletedPartSpec> parts);

    void abortMultipartUpload(String objectName, String uploadId);

    HeadObjectResult headObject(String objectName);

    String presignGetObject(String objectName, String downloadFileName, long fileSize);

    /**
     * WP6 — every in-progress multipart upload on the files bucket, paged through completely.
     * Used by the reconcile job to find uploads that no longer have a session.
     */
    List<MultipartUploadSummary> listMultipartUploads();

    record PartSummary(int partNumber, long size, String etag) {
    }

    record MultipartUploadSummary(String objectName, String uploadId, Instant initiated) {
    }

    record CompletedPartSpec(int partNumber, String etag) {
    }

    record HeadObjectResult(long contentLength, String etag, String contentType) {
    }
}
