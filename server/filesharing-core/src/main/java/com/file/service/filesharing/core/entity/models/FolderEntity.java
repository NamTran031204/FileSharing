package com.file.service.filesharing.core.entity.models;

import com.file.service.filesharing.core.entity.models.base.EntityAuditBase;
import com.file.service.filesharing.core.entity.models.folder.FolderPermission;
import com.file.service.filesharing.core.entity.models.folder.FolderStats;
import com.file.service.filesharing.core.enums.FolderVisibility;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document(collection = "folder")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class FolderEntity extends EntityAuditBase {
    @Id
    private String folderId;

    private String projectId;
    private String parentFolderId;

    private String folderName;
    private String description;

    private List<String> ancestorIds;
    private Integer level;

    private List<FolderPermission> userPermissions;
    private FolderVisibility visibility;

    private FolderStats stats;

    private String shareToken;
    private Instant shareExpiry;
}