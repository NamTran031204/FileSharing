package org.example.filesharing.entities.dtos.folder;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FolderFilterRequestDTO {
    private String projectId;
    private String parentFolderId;
    private String folderName;
    private Boolean isActive;
    private Boolean isTrash;
}
