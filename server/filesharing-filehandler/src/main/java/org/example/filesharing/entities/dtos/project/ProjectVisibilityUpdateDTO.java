package org.example.filesharing.entities.dtos.project;

import lombok.Data;
import com.file.service.filesharing.core.enums.permission.GrantedVisibility;

@Data
public class ProjectVisibilityUpdateDTO {
    private GrantedVisibility visibility;
}
