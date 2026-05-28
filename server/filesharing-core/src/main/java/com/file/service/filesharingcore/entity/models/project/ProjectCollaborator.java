package com.file.service.filesharingcore.entity.models.project;

import com.file.service.filesharingcore.enums.permission.GrantedProjectPermission;
import com.file.service.filesharingcore.enums.permission.GrantedProjectRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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