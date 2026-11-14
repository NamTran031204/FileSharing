package org.example.filesharing.services;

import com.file.service.filesharing.core.entity.PageRequestDto;
import com.file.service.filesharing.core.entity.PageResult;
import org.example.filesharing.entities.dtos.auditlog.AuditLogFilterDTO;
import org.example.filesharing.entities.dtos.project.*;
import com.file.service.filesharing.core.entity.models.project.ProjectStats;
import com.file.service.filesharing.core.entity.models.AuditLogEntity;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
import com.file.service.filesharing.core.enums.ProjectStatus;

import java.util.List;

public interface ProjectService {
    ProjectCheckResponseDTO checkProject(ProjectCheckInputDTO inputDTO);

    ProjectEntity createNewProject(ProjectCreateUpdateDTO projectCreateUpdateDTO);

    ProjectEntity updateProjectDetail(ProjectCreateUpdateDTO projectCreateUpdateDTO);

    String archiveProject(String projectId);

    PageResult<ProjectEntity> getProjectPage(PageRequestDto<ProjectFilterDTO> dto);

    /** Thanh vien nhan ban day du, nguoi chi co grant folder nhan ban rut gon, nguoi khac ACCESS_DENIED. */
    ProjectDetailDTO getProjectById(String projectId);

    /** Logic xoa thanh vien cua DELETE /api/access/project/{id}/grants/{userId}; xoa chinh minh = roi project. */
    ProjectEntity removeCollaboratorFromProject(String projectId, String collaboratorId);

    String deleteProject(String projectId);

    ProjectEntity restoreProject(String projectId);

    ProjectEntity updateProjectStatus(String projectId, ProjectStatus status);

    ProjectEntity leaveProject(String projectId);

    ProjectStats getProjectStats(String projectId);

    PageResult<AuditLogEntity> getProjectAuditLog(String projectId, PageRequestDto<AuditLogFilterDTO> dto);

    List<ProjectMemberDTO> getProjectMembers(String projectId, String searchQuery, String reviewSessionId);
}
