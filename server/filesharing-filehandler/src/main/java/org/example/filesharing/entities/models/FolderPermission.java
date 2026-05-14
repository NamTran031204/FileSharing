package org.example.filesharing.entities.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.enums.objectPermission.FileAppPermission;
import org.example.filesharing.enums.permission.GrantedProjectRole;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FolderPermission {
    private String userId;
    private GrantedProjectRole role;
    private List<FileAppPermission> permissions;
    private Instant grantedAt;
}