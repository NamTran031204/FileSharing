package org.example.filesharing.entities.models.core;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.example.filesharing.entities.models.FolderPermission;
import org.example.filesharing.entities.models.FolderStats;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
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
public class FolderEntity {
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

    private Boolean isActive;
    private String createdBy;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}