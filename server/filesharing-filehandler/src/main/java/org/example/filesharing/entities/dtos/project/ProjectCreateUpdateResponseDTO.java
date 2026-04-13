package org.example.filesharing.entities.dtos.project;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.entities.models.ProjectCollaborator;
import org.example.filesharing.enums.ProjectStatus;

import java.time.Instant;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProjectCreateUpdateResponseDTO {
	private String projectId;
	private String projectName;
	private String projectCode;
	private String description;

	private String ownerId;
	private String ownerEmail;

	private Instant startDate;
	private Instant endDate;

	private List<ProjectCollaborator> collaborators;

	private ProjectStatus status;
	private Boolean isActive;
	private Instant trashedAt;

	private Instant createdAt;
	private Instant updatedAt;

}
