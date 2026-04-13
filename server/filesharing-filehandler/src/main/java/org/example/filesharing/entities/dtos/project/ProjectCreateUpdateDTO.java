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

    // tu email, tim user de cap nhat ProjectCollaborator
    private List<String> emails;

    // voi mode create, khong truyen gi mac dinh la ACTIVE
    private ProjectStatus status;
}
