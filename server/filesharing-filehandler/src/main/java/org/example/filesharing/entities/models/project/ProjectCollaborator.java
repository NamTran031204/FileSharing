package org.example.filesharing.entities.models.project;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.enums.permission.GrantedProjectPermission;
import org.example.filesharing.enums.permission.GrantedProjectRole;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectCollaborator {
    private String userId;
    private GrantedProjectRole projectRole;
    private List<GrantedProjectPermission> projectPermissions;
    private Instant addedAt;
}