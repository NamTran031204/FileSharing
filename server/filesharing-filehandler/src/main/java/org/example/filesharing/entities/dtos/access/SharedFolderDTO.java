package org.example.filesharing.entities.dtos.access;

import com.file.service.filesharing.core.enums.access.AccessRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** Folder trong "Duoc chia se voi toi"; role la vai tro grant tai folder (viaLink thi lay theo link). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SharedFolderDTO {
    private String folderId;
    private String folderName;
    private String projectId;
    private String projectName;
    private AccessRole role;
    private boolean viaLink;
    private Instant grantedAt;
}
