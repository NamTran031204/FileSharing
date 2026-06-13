package org.example.filesharing.services;

import com.file.service.filesharing.core.entity.PageRequestDto;
import com.file.service.filesharing.core.entity.PageResult;
import org.example.filesharing.entities.dtos.auditlog.AuditLogFilterDTO;
import org.example.filesharing.entities.dtos.project.*;
import com.file.service.filesharing.core.entity.models.project.ProjectCollaborator;
import com.file.service.filesharing.core.entity.models.project.ProjectStats;
import com.file.service.filesharing.core.entity.models.AuditLogEntity;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
import com.file.service.filesharing.core.enums.ProjectStatus;
import com.file.service.filesharing.core.enums.permission.GrantedVisibility;

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

    List<ProjectMemberDTO> getProjectMembers(String projectId, String searchQuery, String reviewSessionId);
}
