package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.services.StorageService;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.convert.DurationStyle;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.exception.SdkException;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.AbortMultipartUploadRequest;
import software.amazon.awssdk.services.s3.model.CompleteMultipartUploadRequest;
import software.amazon.awssdk.services.s3.model.CompleteMultipartUploadResponse;
import software.amazon.awssdk.services.s3.model.CompletedMultipartUpload;
import software.amazon.awssdk.services.s3.model.CompletedPart;
import software.amazon.awssdk.services.s3.model.CreateMultipartUploadRequest;
import software.amazon.awssdk.services.s3.model.CreateMultipartUploadResponse;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.ListPartsRequest;
import software.amazon.awssdk.services.s3.model.ListPartsResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.Part;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.model.UploadPartRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class S3StorageServiceImpl implements StorageService {

    private static final long DOWNLOAD_TTL_MIN_SECONDS = 900L;
    private static final long DOWNLOAD_TTL_MAX_SECONDS = 14400L;
    private static final String NO_SUCH_UPLOAD_ERROR_CODE = "NoSuchUpload";

    private final S3Client s3Client;
    private final S3Presigner uploadPresigner;
    private final S3Presigner downloadPresigner;

    @Value("${minio.buckets.files}")
    private String bucketName;

    private Duration partUrlTtl;

    public S3StorageServiceImpl(S3Client s3Client,
                                 @Qualifier("uploadPresigner") S3Presigner uploadPresigner,
                                 @Qualifier("downloadPresigner") S3Presigner downloadPresigner) {
        this.s3Client = s3Client;
        this.uploadPresigner = uploadPresigner;
        this.downloadPresigner = downloadPresigner;
    }

    @Value("${upload.part-url-ttl}")
    public void setPartUrlTtl(String rawPartUrlTtl) {
        this.partUrlTtl = DurationStyle.detectAndParse(rawPartUrlTtl);
    }

    @Override
    public String createMultipartUpload(String objectName) {
        try {
            CreateMultipartUploadResponse response = s3Client.createMultipartUpload(
                    CreateMultipartUploadRequest.builder()
                            .bucket(bucketName)
                            .key(objectName)
                            .build());
            return response.uploadId();
        } catch (SdkException e) {
            log.error("Failed to create multipart upload for object: {}", objectName, e);
            throw new FileBusinessException(ErrorCode.FILE_ERROR, "Failed to initiate multipart upload");
        }
    }

    @Override
    public String presignUploadPart(String objectName, String uploadId, int partNumber) {
        try {
            if (uploadId == null || uploadId.isBlank()) {
                PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(objectName)
                        .build();
                var presigned = uploadPresigner.presignPutObject(b -> b
                        .signatureDuration(partUrlTtl)
                        .putObjectRequest(putObjectRequest));
                return presigned.url().toString();
            }

            UploadPartRequest uploadPartRequest = UploadPartRequest.builder()
                    .bucket(bucketName)
                    .key(objectName)
                    .uploadId(uploadId)
                    .partNumber(partNumber)
                    .build();
            var presigned = uploadPresigner.presignUploadPart(b -> b
                    .signatureDuration(partUrlTtl)
                    .uploadPartRequest(uploadPartRequest));
            return presigned.url().toString();
        } catch (SdkException e) {
            log.error("Failed to presign part {} for object: {}", partNumber, objectName, e);
            throw new FileBusinessException(ErrorCode.FILE_ERROR, "Failed to presign part url");
        }
    }

    @Override
    public List<PartSummary> listParts(String objectName, String uploadId) {
        try {
            List<PartSummary> result = new ArrayList<>();
            Integer partNumberMarker = null;
            boolean truncated = true;

            while (truncated) {
                ListPartsRequest request = ListPartsRequest.builder()
                        .bucket(bucketName)
                        .key(objectName)
                        .uploadId(uploadId)
                        .partNumberMarker(partNumberMarker)
                        .build();
                ListPartsResponse response = s3Client.listParts(request);
                for (Part part : response.parts()) {
                    result.add(new PartSummary(part.partNumber(), part.size(), stripQuotes(part.eTag())));
                }
                truncated = Boolean.TRUE.equals(response.isTruncated());
                partNumberMarker = response.nextPartNumberMarker();
                if (partNumberMarker == null) {
                    truncated = false;
                }
            }
            return result;
        } catch (S3Exception e) {
            if (isNoSuchUpload(e)) {
                return List.of();
            }
            log.error("Failed to list parts for object: {}", objectName, e);
            throw new FileBusinessException(ErrorCode.FILE_ERROR, "Failed to list uploaded parts");
        } catch (SdkException e) {
            log.error("Failed to list parts for object: {}", objectName, e);
            throw new FileBusinessException(ErrorCode.FILE_ERROR, "Failed to list uploaded parts");
        }
    }

    @Override
    public String completeMultipartUpload(String objectName, String uploadId, List<CompletedPartSpec> parts) {
        try {
            List<CompletedPart> completedParts = parts.stream()
                    .map(p -> CompletedPart.builder().partNumber(p.partNumber()).eTag(p.etag()).build())
                    .toList();

            CompleteMultipartUploadResponse response = s3Client.completeMultipartUpload(
                    CompleteMultipartUploadRequest.builder()
                            .bucket(bucketName)
                            .key(objectName)
                            .uploadId(uploadId)
                            .multipartUpload(CompletedMultipartUpload.builder().parts(completedParts).build())
                            .build());
            return stripQuotes(response.eTag());
        } catch (SdkException e) {
            log.error("Failed to complete multipart upload for object: {}", objectName, e);
            throw new FileBusinessException(ErrorCode.FILE_ERROR, "Failed to complete multipart upload");
        }
    }

    @Override
    public void abortMultipartUpload(String objectName, String uploadId) {
        try {
            s3Client.abortMultipartUpload(AbortMultipartUploadRequest.builder()
                    .bucket(bucketName)
                    .key(objectName)
                    .uploadId(uploadId)
                    .build());
        } catch (S3Exception e) {
            if (!isNoSuchUpload(e)) {
                log.error("Failed to abort multipart upload for object: {}", objectName, e);
                throw new FileBusinessException(ErrorCode.FILE_ERROR, "Failed to abort multipart upload");
            }
        } catch (SdkException e) {
            log.error("Failed to abort multipart upload for object: {}", objectName, e);
            throw new FileBusinessException(ErrorCode.FILE_ERROR, "Failed to abort multipart upload");
        }
    }

    @Override
    public HeadObjectResult headObject(String objectName) {
        try {
            HeadObjectResponse response = s3Client.headObject(HeadObjectRequest.builder()
                    .bucket(bucketName)
                    .key(objectName)
                    .build());
            return new HeadObjectResult(response.contentLength(), stripQuotes(response.eTag()), response.contentType());
        } catch (NoSuchKeyException e) {
            throw new FileBusinessException(ErrorCode.FILE_ERROR, "Object not found after commit");
        } catch (SdkException e) {
            log.error("Failed to head object: {}", objectName, e);
            throw new FileBusinessException(ErrorCode.FILE_ERROR, "Failed to read object metadata");
        }
    }

    @Override
    public String presignGetObject(String objectName, String downloadFileName, long fileSize) {
        try {
            long ttlSeconds = Math.max(DOWNLOAD_TTL_MIN_SECONDS,
                    Math.min(DOWNLOAD_TTL_MAX_SECONDS, fileSize / 1_000_000L));

            GetObjectRequest.Builder getObjectRequestBuilder = GetObjectRequest.builder()
                    .bucket(bucketName)
                    .key(objectName);
            if (downloadFileName != null && !downloadFileName.isBlank()) {
                getObjectRequestBuilder.responseContentDisposition("attachment; filename=\"" + downloadFileName + "\"");
            }
            GetObjectRequest getObjectRequest = getObjectRequestBuilder.build();

            var presigned = downloadPresigner.presignGetObject(b -> b
                    .signatureDuration(Duration.ofSeconds(ttlSeconds))
                    .getObjectRequest(getObjectRequest));
            return presigned.url().toString();
        } catch (SdkException e) {
            log.error("Failed to presign download url for object: {}", objectName, e);
            throw new FileBusinessException(ErrorCode.FILE_ERROR, "Failed to presign download url");
        }
    }

    private boolean isNoSuchUpload(S3Exception e) {
        return e.awsErrorDetails() != null && NO_SUCH_UPLOAD_ERROR_CODE.equals(e.awsErrorDetails().errorCode());
    }

    private String stripQuotes(String etag) {
        return etag == null ? null : etag.replace("\"", "");
    }
}
