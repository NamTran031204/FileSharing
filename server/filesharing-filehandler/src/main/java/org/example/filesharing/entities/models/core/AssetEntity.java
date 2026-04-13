package org.example.filesharing.entities.models.core;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.example.filesharing.enums.AssetStatus;
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
public class AssetEntity {
    @Id
    private String assetId;

    private String assetName;
    private String description;

    private String projectId;
    private String folderId;

    private String ownerId;
    private String ownerEmail;

    private Integer versionCount;
    private AssetStatus assetStatus;
    private String latestReviewSessionId;

    private String shareToken;
    private Instant shareExpiry;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}