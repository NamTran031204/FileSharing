package org.example.filesharing.services;

import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.auditlog.AuditLogFilterDTO;
import org.example.filesharing.entities.dtos.project.*;
import org.example.filesharing.entities.models.ProjectCollaborator;
import org.example.filesharing.entities.models.ProjectStats;
import org.example.filesharing.entities.models.core.AuditLogEntity;
import org.example.filesharing.entities.models.core.ProjectEntity;
import org.example.filesharing.enums.ProjectStatus;
import org.example.filesharing.enums.permission.GrantedVisibility;

import java.util.List;

public interface ProjectService {
    ProjectCheckResponseDTO checkProject(ProjectCheckInputDTO inputDTO);

    ProjectEntity createNewProject(ProjectCreateUpdateDTO projectCreateUpdateDTO);

    ProjectEntity updateProjectDetail(ProjectCreateUpdateDTO projectCreateUpdateDTO);

    String archiveProject(String projectId);

    PageResult<ProjectEntity> getProjectPage(PageRequestDto<ProjectFilterDTO> dto);

    ProjectEntity getProjectById(String projectId);

    ProjectEntity removeCollaboratorFromProject(String projectId, String collaboratorId);

    ShareTokenCreateResponseDTO createShareToken(ShareTokenCreateDTO input);

    ProjectEntity joinProject(String shareToken);

    String deleteProject(String projectId);

    ProjectEntity restoreProject(String projectId);

    ProjectEntity updateProjectStatus(String projectId, ProjectStatus status);

    List<ProjectCollaborator> getProjectCollaborators(String projectId);

    ProjectEntity addCollaboratorToProject(String projectId, ProjectCollaboratorDTO collaborator);

    ProjectEntity changeCollaboratorPermission(ProjectCollaboratorDTO collaborator);

    ProjectEntity leaveProject(String projectId);

    String revokeShareToken(String projectId);

    ShareTokenCreateResponseDTO refreshShareToken(String projectId, ShareTokenCreateDTO input);

    ShareTokenInfoDTO getShareTokenInfo(String shareToken);

    ProjectEntity updateProjectVisibility(String projectId, GrantedVisibility visibility);

    ProjectStats getProjectStats(String projectId);

    PageResult<AuditLogEntity> getProjectAuditLog(String projectId, PageRequestDto<AuditLogFilterDTO> dto);
}
