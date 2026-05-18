package org.example.filesharing.entities.dtos.folder;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FolderTreeMappingDTO {
    private String clientFolderKey;
    private String relativeFolderPath;
    private String folderId;
    private String parentFolderId;
    private String status;
}
