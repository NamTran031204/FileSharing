package com.file.service.filesharingcore.entity.models;

import com.file.service.filesharingcore.enums.MediaType;
import com.file.service.filesharingcore.enums.ProcessingStatus;
import com.file.service.filesharingcore.enums.UploadStatus;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

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

    private String downloadFileName;

    private Integer versionNumber;

    private MediaType mediaType;

    private String changeNote;

    private String mimeType;
    private Double fileSize;
    private String compressionAlgo;
    private String uploadId;
    private String shareToken;

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
