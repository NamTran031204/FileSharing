package com.file.service.filesharing.core.entity.models;

import com.file.service.filesharing.core.enums.UploadSessionStatus;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

@Document(collection = "upload_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class UploadSessionEntity {

    @Id
    private String sessionId;

    @Indexed(name = "idx_upload_sessions_owner")
    private String ownerId;

    private String assetId;
    private String metadataId;
    private String objectName;
    private String uploadId;

    private long declaredSize;
    private long partSize;
    private int partCount;

    private Map<Integer, String> partMd5;

    private UploadSessionStatus status;

    private Instant createdAt;

    @Indexed(name = "idx_upload_sessions_ttl", expireAfterSeconds = 172800)
    private Instant expiresAt;

    private Instant hardExpiresAt;
    private Instant completedAt;
    private String resultEtag;
}
