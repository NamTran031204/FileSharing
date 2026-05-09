package org.example.filesharing.entities.dtos.folder;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FolderTreeCreateRequestDTO {
    private String projectId;
    private String parentFolderId;
    private String baseFolderPath;
    private String rootFolderName;
    private List<FolderTreeNodeDTO> folders;
    private String createdBy;
}
