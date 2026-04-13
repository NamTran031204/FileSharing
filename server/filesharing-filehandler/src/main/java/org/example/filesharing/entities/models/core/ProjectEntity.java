package org.example.filesharing.entities.models.core;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.example.filesharing.entities.models.ProjectCollaborator;
import org.example.filesharing.entities.models.ProjectStats;
import org.example.filesharing.enums.ProjectStatus;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
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
public class ProjectEntity {
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
    private ProjectStats stats;

    private ProjectStatus status; // khi cho vao thung rac -> ARCHIVE
    private Boolean isActive; // khi xoa khoi thung rac: isActive = false, chua xoa khoi he thong, tao process xoa sau 30 ngay.
    private Instant trashedAt; // cap nhat khi status = ARCHIVE

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}