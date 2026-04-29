package org.example.filesharing.entities.dtos.folder;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.entities.models.FolderPermission;

import java.util.List;

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
    private List<FolderPermission> permissions; // override permissions (Owner only)
}
