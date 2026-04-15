package org.example.filesharing.entities.dtos.project;

import lombok.Data;

@Data
public class ProjectMoveDTO {
    private Boolean isFolder;
    private String folderId;
    private String assetId;
}
