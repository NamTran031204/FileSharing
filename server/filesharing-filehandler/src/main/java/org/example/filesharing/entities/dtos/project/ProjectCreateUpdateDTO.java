package org.example.filesharing.entities.dtos.project;

import lombok.Data;
import org.example.filesharing.enums.ProjectStatus;

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

    // voi mode create, khong truyen gi mac dinh la ACTIVE
    private ProjectStatus status;
}
