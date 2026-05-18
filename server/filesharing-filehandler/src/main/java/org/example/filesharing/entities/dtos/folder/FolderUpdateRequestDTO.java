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
public class FolderUpdateRequestDTO {
    private String folderId;
    private String folderName;
    private String description;
    private String parentFolderId; // Có thể dùng để di chuyển thư mục
    private Boolean isActive;
    private List<String> restrictedUserIds; // userId list for RESTRICTED folders (require ADD_USER permission)
}
