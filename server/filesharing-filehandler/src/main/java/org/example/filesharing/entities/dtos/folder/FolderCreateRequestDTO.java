package org.example.filesharing.entities.dtos.folder;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.enums.FolderVisibility;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FolderCreateRequestDTO {
    private String projectId;
    private String parentFolderId;
    private String folderName;
    private String description;

    private FolderVisibility visibility;
}
