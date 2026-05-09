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
public class FolderTreeCreateResponseDTO {
    private String folderUploadSessionId;
    private String projectId;
    private String rootFolderId;
    private List<FolderTreeMappingDTO> createdFolders;
    private List<FolderTreeMappingDTO> existingFolders;
    private List<FolderTreeMappingDTO> folderMappings;
}
