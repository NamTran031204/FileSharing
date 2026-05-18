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
public class FolderChangeVisibilityRequestDTO {
    private String folderId;
    private FolderVisibility visibility;
    private List<String> restrictedUserIds; // required when visibility = RESTRICTED
}
