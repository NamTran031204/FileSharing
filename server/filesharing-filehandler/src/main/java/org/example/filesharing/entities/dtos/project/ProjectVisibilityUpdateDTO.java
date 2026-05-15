package org.example.filesharing.entities.dtos.project;

import lombok.Data;
import org.example.filesharing.enums.permission.GrantedVisibility;

@Data
public class ProjectVisibilityUpdateDTO {
    private GrantedVisibility visibility;
}
