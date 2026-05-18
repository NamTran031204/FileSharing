package org.example.filesharing.entities.dtos.folder;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.entities.models.folder.FolderStats;
import org.example.filesharing.enums.FolderVisibility;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FolderTreeItemDTO {
    private String folderId;
    private String projectId;
    private String parentFolderId;
    private String folderName;
    private List<String> ancestorIds;
    private Integer level;
    private FolderVisibility visibility;
    private FolderStats stats;
    private List<FolderTreeItemDTO> children;
}
