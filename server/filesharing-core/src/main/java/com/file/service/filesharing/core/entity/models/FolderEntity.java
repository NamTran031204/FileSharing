package com.file.service.filesharing.core.entity.models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.file.service.filesharing.core.entity.models.access.AccessGrant;
import com.file.service.filesharing.core.entity.models.access.AccessSettings;
import com.file.service.filesharing.core.entity.models.access.LinkAccess;
import com.file.service.filesharing.core.entity.models.base.EntityAuditBase;
import com.file.service.filesharing.core.entity.models.folder.FolderStats;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

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

    private FolderStats stats;

    // chi grant truc tiep tai folder nay; token link chi tra o API quan ly link
    @JsonIgnore
    private List<AccessGrant> grants;
    @JsonIgnore
    private LinkAccess link;
    // null = theo cha
    private AccessSettings settings;
}