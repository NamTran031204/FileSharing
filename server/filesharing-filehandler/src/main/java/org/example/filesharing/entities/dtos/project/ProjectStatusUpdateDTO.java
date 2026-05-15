package org.example.filesharing.entities.dtos.project;

import lombok.Data;
import org.example.filesharing.enums.ProjectStatus;

@Data
public class ProjectStatusUpdateDTO {
    private ProjectStatus status;
}
