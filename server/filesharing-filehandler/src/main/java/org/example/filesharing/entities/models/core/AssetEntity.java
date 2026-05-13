package org.example.filesharing.entities.models.core;

import lombok.*;
import org.example.filesharing.entities.models.core.base.EntityAuditBase;
import org.example.filesharing.enums.AssetStatus;
import org.example.filesharing.enums.MediaType;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
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