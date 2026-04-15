package org.example.filesharing.entities.dtos.project;

import lombok.Data;
import org.example.filesharing.enums.ProjectStatus;

import java.time.Instant;

@Data
public class ProjectFilterDTO {

    // email va userId se tim ca project cua ban than va project ma user la collaborator
    private String email;
    private String userId;

    // start or/and end
    private Instant startDate; // >= start date
    private Instant endDate; // <= endDate

    private ProjectStatus status;
    private Boolean isActive; // lay trong thung rac thi truyen isActive = false
}
