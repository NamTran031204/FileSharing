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
    private Instant grantedAt;
}