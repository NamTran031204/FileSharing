package com.file.service.filesharingcore.entity.models;

import lombok.*;
import org.example.filesharing.entities.models.base.EntityAuditBase;
import org.example.filesharing.entities.models.project.ProjectCollaborator;
import org.example.filesharing.entities.models.project.ProjectStats;
import org.example.filesharing.enums.ProjectStatus;
import org.example.filesharing.enums.permission.GrantedVisibility;
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