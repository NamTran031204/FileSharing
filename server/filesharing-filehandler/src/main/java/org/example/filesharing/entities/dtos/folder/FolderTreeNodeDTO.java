package org.example.filesharing.entities.dtos.folder;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FolderTreeNodeDTO {
    private String clientFolderKey;
    private String folderName;
    private String relativeFolderPath;
    private String parentRelativeFolderPath;
    private Integer level;
}
