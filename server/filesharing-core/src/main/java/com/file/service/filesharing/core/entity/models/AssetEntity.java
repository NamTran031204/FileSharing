package com.file.service.filesharing.core.entity.models;

import com.file.service.filesharing.core.entity.models.base.EntityAuditBase;
import com.file.service.filesharing.core.enums.AssetStatus;
import com.file.service.filesharing.core.enums.MediaType;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "asset")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class AssetEntity extends EntityAuditBase {
    @Id
    private String assetId;

    private String assetName;
    private String description;

    private String projectId;
    private String folderId;

    private String ownerId;
    private String ownerEmail;

    private MediaType mediaType; // khoi tao tu dau, khong cho phep thay doi

    private Integer versionCount;
    private AssetStatus assetStatus;
    private String latestReviewSessionId;

    private String shareToken;
    private Instant shareExpiry;
}