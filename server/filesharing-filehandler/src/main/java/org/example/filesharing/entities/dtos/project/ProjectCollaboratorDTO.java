package org.example.filesharing.entities.dtos.project;

import lombok.Data;
import org.example.filesharing.enums.permission.GrantedPermission;

@Data
public class ProjectCollaboratorDTO {
    private String email;
    private GrantedPermission permission;
}
