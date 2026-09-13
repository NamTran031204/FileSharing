package com.file.service.filesharing.core.entity.models;

import com.file.service.filesharing.core.enums.MediaType;
import com.file.service.filesharing.core.enums.ProcessingStatus;
import com.file.service.filesharing.core.enums.UploadStatus;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;
import org.springframework.data.mongodb.core.mapping.FieldType;

import java.time.Instant;

@Document(collection = "metadata")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class MetadataEntity {
    @Id
    private String fileId;
    private String fileName;
    private String objectName;

    private String assetId;
    private String projectId;

    private String downloadFileName;

    private Integer versionNumber;

    private MediaType mediaType;

    private String changeNote;

    private String mimeType;
    // ghi moi luon la int64; document cu luu BSON double van doc duoc qua ConversionService
    @Field(targetType = FieldType.INT64)
    private Long fileSize;
    private String compressionAlgo;
    private String uploadId;
    private String shareToken;

    private String thumbnailUrl;

    private UploadStatus status;
    private ProcessingStatus processingStatus;
    private String processingError;
    private Instant processingStartAt;
    private Instant processingCompleteAt;
    private MediaInfo mediaInfo;

    private String ownerId;
    private String ownerEmail;
    private int timeToLive;
    private Boolean isActive;

    private Boolean isTrash;
    private Instant trashedAt;

    private Integer renditionCount;

    @CreatedDate
    private Instant creationTimestamp;

    @LastModifiedDate
    private Instant modificationTimestamp;

    @Data
    public static class MediaInfo {
        private Integer durationMs;
        private Integer width;
        private Integer height;
        private Integer frameRate;
        private String codec;
        private String colorSpace;
        private String hasAlpha;
    }
}
