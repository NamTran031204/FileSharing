package org.example.filesharing.entities.models.core;

import lombok.*;
import org.example.filesharing.entities.models.FolderPermission;
import org.example.filesharing.entities.models.FolderStats;
import org.example.filesharing.entities.models.core.base.EntityAuditBase;
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

    private String folderPath;
    private Integer level;

    private List<FolderPermission> permissions;
    private FolderStats stats;

    private String shareToken;
    private Instant shareExpiry;
}