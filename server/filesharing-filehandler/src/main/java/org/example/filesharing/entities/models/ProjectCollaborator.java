package org.example.filesharing.entities.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.enums.ProjectCollaboratorRole;
import org.example.filesharing.enums.permission.GrantedPermission;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectCollaborator {
    private String userId;
    private String email;
    private GrantedPermission permission;
    private Instant addedAt;
}