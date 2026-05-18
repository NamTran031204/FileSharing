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
public class FolderTreeResponseDTO {
    private String projectId;
    private List<FolderBreadcrumbItemDTO> breadcrumb;
    private List<FolderTreeItemDTO> tree;
}
