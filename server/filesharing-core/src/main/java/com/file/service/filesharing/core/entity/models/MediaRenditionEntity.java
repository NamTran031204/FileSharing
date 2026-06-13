package com.file.service.filesharing.core.entity.models;

import com.file.service.filesharing.core.entity.models.base.EntityAuditBase;
import com.file.service.filesharing.core.entity.models.metadata.RenditionResolution;
import com.file.service.filesharing.core.enums.RenditionStatus;
import com.file.service.filesharing.core.enums.RenditionType;
import lombok.*;
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

    private String metadataId;
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