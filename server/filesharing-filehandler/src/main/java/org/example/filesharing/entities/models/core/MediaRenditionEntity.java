package org.example.filesharing.entities.models.core;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.example.filesharing.entities.models.RenditionResolution;
import org.example.filesharing.enums.RenditionStatus;
import org.example.filesharing.enums.RenditionType;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "media_renditions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class MediaRenditionEntity {
    @Id
    private String renditionId;

    private String versionId;
    private String assetId;

    private RenditionType renditionType;

    private String profile;
    private String manifestKey;
    private String segmentPathPrefix;
    private Long bandwidth;
    private RenditionResolution resolution;

    private Integer thumbnailCount;
    private Long intervalMs;
    private String spriteKey;
    private String spriteMetadataKey;

    private String posterKey;
    private Long posterTimestamp;

    private Long fileSize;
    private RenditionStatus status;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}