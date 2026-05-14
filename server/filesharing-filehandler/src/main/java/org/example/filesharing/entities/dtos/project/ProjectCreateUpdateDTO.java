package org.example.filesharing.entities.dtos.project;

import lombok.Data;
import org.example.filesharing.enums.ProjectStatus;
import org.example.filesharing.enums.permission.GrantedVisibility;

import java.time.Instant;
import java.util.List;

@Data
public class ProjectCreateUpdateDTO {
    private String projectName;
    private String projectCode;
    private String description;

    private String projectId;

    // extend when create
    private Instant startDate;
    private Instant endDate;

    // danh sach user va quyen
    private List<ProjectCollaboratorDTO> collaborators;

    private GrantedVisibility visibility;

    // voi mode create mac dinh la ACTIVE
    private ProjectStatus status;
}
