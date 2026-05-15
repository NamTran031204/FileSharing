package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.CommonResponse;
import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.auditlog.AuditLogFilterDTO;
import org.example.filesharing.entities.dtos.project.ProjectCheckInputDTO;
import org.example.filesharing.entities.dtos.project.ProjectCheckResponseDTO;
import org.example.filesharing.entities.dtos.project.ProjectCollaboratorDTO;
import org.example.filesharing.entities.dtos.project.ProjectCreateUpdateDTO;
import org.example.filesharing.entities.dtos.project.ProjectFilterDTO;
import org.example.filesharing.entities.dtos.project.ProjectStatusUpdateDTO;
import org.example.filesharing.entities.dtos.project.ProjectVisibilityUpdateDTO;
import org.example.filesharing.entities.dtos.project.ShareTokenCreateDTO;
import org.example.filesharing.entities.dtos.project.ShareTokenCreateResponseDTO;
import org.example.filesharing.entities.dtos.project.ShareTokenInfoDTO;
import org.example.filesharing.entities.models.ProjectCollaborator;
import org.example.filesharing.entities.models.ProjectStats;
import org.example.filesharing.entities.models.core.AuditLogEntity;
import org.example.filesharing.entities.models.core.ProjectEntity;
import org.example.filesharing.services.ProjectService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RequestMapping("api/project")
@RestController
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping("/check-project")
    public CommonResponse<ProjectCheckResponseDTO> checkProject(@RequestBody ProjectCheckInputDTO dto) {
        return CommonResponse.success(projectService.checkProject(dto));
    }

    @PostMapping("/create-new")
    public CommonResponse<ProjectEntity> createNewProject(@RequestBody ProjectCreateUpdateDTO projectCreateUpdateDTO) {
        return CommonResponse.success(projectService.createNewProject(projectCreateUpdateDTO));
    }

    @PostMapping("/update-detail")
    public CommonResponse<ProjectEntity> updateProjectDetail(@RequestBody ProjectCreateUpdateDTO projectCreateUpdateDTO) {
        return CommonResponse.success(projectService.updateProjectDetail(projectCreateUpdateDTO));
    }

    // move to trash, cap nhat status = ARCHIVE va trashedAt, khong cap nhat isActive
    @PostMapping("/archive/{projectId}")
    public CommonResponse<String> archiveProject(@PathVariable("projectId") String projectId) {
        return CommonResponse.success(projectService.archiveProject(projectId));
    }

    // lay danh sach
    @PostMapping("/get-page")
    public CommonResponse<PageResult<ProjectEntity>> getProjectPage(@RequestBody PageRequestDto<ProjectFilterDTO> dto) {
        return CommonResponse.success(projectService.getProjectPage(dto));
    }

    @GetMapping("/get-by-id/{projectId}")
    public CommonResponse<ProjectEntity> getProjectById(@PathVariable("projectId") String projectId) {
        return CommonResponse.success(projectService.getProjectById(projectId));
    }

    @DeleteMapping("/delete/{projectId}")
    public CommonResponse<String> deleteProject(@PathVariable("projectId") String projectId) {
        return CommonResponse.success(projectService.deleteProject(projectId));
    }

    @PostMapping("/restore/{projectId}")
    public CommonResponse<ProjectEntity> restoreProject(@PathVariable("projectId") String projectId) {
        return CommonResponse.success(projectService.restoreProject(projectId));
    }

    @PostMapping("/{projectId}/status")
    public CommonResponse<ProjectEntity> updateProjectStatus(
            @PathVariable("projectId") String projectId,
            @RequestBody ProjectStatusUpdateDTO dto) {
        return CommonResponse.success(projectService.updateProjectStatus(projectId, dto != null ? dto.getStatus() : null));
    }

    @GetMapping("/{projectId}/getCollaborators")
    public CommonResponse<List<ProjectCollaborator>> getProjectCollaborators(
            @PathVariable("projectId") String projectId) {
        return CommonResponse.success(projectService.getProjectCollaborators(projectId));
    }

    @PostMapping("/{projectId}/addCollaborator")
    public CommonResponse<ProjectEntity> addCollaboratorToProject(
            @PathVariable("projectId") String projectId,
            @RequestBody ProjectCollaboratorDTO collaborator) {
        return CommonResponse.success(projectService.addCollaboratorToProject(projectId, collaborator));
    }

    @PostMapping("/collaborators/changePermission")
    public CommonResponse<ProjectEntity> changeCollaboratorPermission(
            @RequestBody ProjectCollaboratorDTO collaborator) {
        return CommonResponse.success(projectService.changeCollaboratorPermission(collaborator));
    }

    @PostMapping("/{projectId}/leave")
    public CommonResponse<ProjectEntity> leaveProject(@PathVariable("projectId") String projectId) {
        return CommonResponse.success(projectService.leaveProject(projectId));
    }

    @PostMapping("/remove-collaborator/{projectId}/{collaboratorId}")
    public CommonResponse<ProjectEntity> removeCollaboratorFromProject(
            @PathVariable("projectId") String projectId,
            @PathVariable("collaboratorId") String collaboratorId) {
        return CommonResponse.success(projectService.removeCollaboratorFromProject(projectId, collaboratorId));
    }

    @PostMapping("/create-share-token")
    public CommonResponse<ShareTokenCreateResponseDTO> createShareToken(@RequestBody ShareTokenCreateDTO input) {
        return CommonResponse.success(projectService.createShareToken(input));
    }

    @DeleteMapping("/{projectId}/delete-share-token")
    public CommonResponse<String> revokeShareToken(@PathVariable("projectId") String projectId) {
        return CommonResponse.success(projectService.revokeShareToken(projectId));
    }

    @GetMapping("/share-token/{shareToken}")
    public CommonResponse<ShareTokenInfoDTO> getShareTokenInfo(@PathVariable("shareToken") String shareToken) {
        return CommonResponse.success(projectService.getShareTokenInfo(shareToken));
    }

    @PostMapping("/{projectId}/share-token/refresh")
    public CommonResponse<ShareTokenCreateResponseDTO> refreshShareToken(
            @PathVariable("projectId") String projectId,
            @RequestBody ShareTokenCreateDTO input) {
        return CommonResponse.success(projectService.refreshShareToken(projectId, input));
    }

    @GetMapping("/join-project/{shareToken}")
    public CommonResponse<ProjectEntity> joinProject(@PathVariable("shareToken") String shareToken) {
        return CommonResponse.success(projectService.joinProject(shareToken));
    }

    @PostMapping("/{projectId}/visibility")
    public CommonResponse<ProjectEntity> updateProjectVisibility(
            @PathVariable("projectId") String projectId,
            @RequestBody ProjectVisibilityUpdateDTO dto) {
        return CommonResponse.success(projectService.updateProjectVisibility(projectId, dto != null ? dto.getVisibility() : null));
    }

    @GetMapping("/{projectId}/stats")
    public CommonResponse<ProjectStats> getProjectStats(@PathVariable("projectId") String projectId) {
        return CommonResponse.success(projectService.getProjectStats(projectId));
    }

    @GetMapping("/{projectId}/audit-log")
    public CommonResponse<PageResult<AuditLogEntity>> getProjectAuditLog(
            @PathVariable("projectId") String projectId,
            @RequestBody(required = false) PageRequestDto<AuditLogFilterDTO> dto) {
        return CommonResponse.success(projectService.getProjectAuditLog(projectId, dto));
    }

    @PostMapping("/move-to-project/{projectId}")
    public CommonResponse<ProjectEntity> moveToProject(
            @PathVariable("projectId") String projectId) {
        return CommonResponse.success();
    }
}
