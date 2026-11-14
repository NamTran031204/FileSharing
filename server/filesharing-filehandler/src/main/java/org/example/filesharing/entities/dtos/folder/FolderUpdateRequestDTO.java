package org.example.filesharing.entities.dtos.folder;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FolderUpdateRequestDTO {
    private String folderId;
    private String folderName;
    private String description;
    private String parentFolderId; // Có thể dùng để di chuyển thư mục
    private Boolean isActive;
}
