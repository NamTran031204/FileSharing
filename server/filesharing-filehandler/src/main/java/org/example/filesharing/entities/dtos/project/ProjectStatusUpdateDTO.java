package org.example.filesharing.entities.dtos.project;

import lombok.Data;
import com.file.service.filesharing.core.enums.ProjectStatus;

@Data
public class ProjectStatusUpdateDTO {
    private ProjectStatus status;
}
