package com.file.service.filesharing.core.entity.models;

import com.file.service.filesharing.core.entity.models.base.EntityAuditBase;
import com.file.service.filesharing.core.entity.models.project.ProjectCollaborator;
import com.file.service.filesharing.core.entity.models.project.ProjectStats;
import com.file.service.filesharing.core.enums.ProjectStatus;
import com.file.service.filesharing.core.enums.permission.GrantedVisibility;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document(collection = "projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class ProjectEntity extends EntityAuditBase {
    @Id
    private String projectId;

    private String projectName;
    private String projectCode;
    private String description;

    private String ownerId;
    private String ownerEmail;

    private String category;
    private Instant startDate;
    private Instant endDate;

    private List<ProjectCollaborator> collaborators;
    private GrantedVisibility visibility;
    private ProjectStats stats;

    private ProjectStatus status; // khi cho vao thung rac -> ARCHIVE

    private String shareToken;
    private Instant shareExpiry;
}