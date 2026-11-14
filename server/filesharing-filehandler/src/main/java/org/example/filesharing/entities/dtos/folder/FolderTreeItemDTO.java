package org.example.filesharing.entities.dtos.folder;

import com.file.service.filesharing.core.enums.access.AccessRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.file.service.filesharing.core.entity.models.folder.FolderStats;

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
    private FolderStats stats;
    private List<FolderTreeItemDTO> children;
    // vai tro cua toi tai node; badge: co link, co grant thuong truc tiep
    private AccessRole myRole;
    private boolean hasLink;
    private boolean hasDirectGrants;
}
