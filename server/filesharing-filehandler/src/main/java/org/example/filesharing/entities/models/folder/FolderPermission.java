package org.example.filesharing.entities.models.folder;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.enums.permission.GrantedProjectPermission;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FolderPermission {
    private String userId;
    private List<GrantedProjectPermission> permissions;

    /**
     * false or null: khi chuyen tu FolderVisibility.RESTRICTED sang FolderVisibility.INHERIT thi xoa nhung user nay
     * true: khi chuyen tu FolderVisibility.RESTRICTED sang FolderVisibility.INHERIT thi khong xoa user
     */
    private Boolean isPrivateCollaborator;
    private Instant grantedAt;
}