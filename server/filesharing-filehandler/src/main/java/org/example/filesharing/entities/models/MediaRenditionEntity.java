package org.example.filesharing.entities.models;

import lombok.*;
import org.example.filesharing.entities.models.metadata.RenditionResolution;
import org.example.filesharing.entities.models.base.EntityAuditBase;
import org.example.filesharing.enums.RenditionStatus;
import org.example.filesharing.enums.RenditionType;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "media_renditions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class MediaRenditionEntity extends EntityAuditBase {
    @Id
    private String renditionId;

    private Integer versionNumber;
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
}