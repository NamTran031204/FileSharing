package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import com.file.service.filesharing.core.entity.CommonResponse;
import com.file.service.filesharing.core.entity.PageRequestDto;
import com.file.service.filesharing.core.entity.PageResult;
import org.example.filesharing.entities.dtos.auditlog.AuditLogFilterDTO;
import org.example.filesharing.entities.dtos.project.ProjectCheckInputDTO;
import org.example.filesharing.entities.dtos.project.ProjectCheckResponseDTO;
import org.example.filesharing.entities.dtos.project.ProjectCreateUpdateDTO;
import org.example.filesharing.entities.dtos.project.ProjectDetailDTO;
import org.example.filesharing.entities.dtos.project.ProjectFilterDTO;
import org.example.filesharing.entities.dtos.project.ProjectMemberDTO;
import org.example.filesharing.entities.dtos.project.ProjectStatusUpdateDTO;
import com.file.service.filesharing.core.entity.models.project.ProjectStats;
import com.file.service.filesharing.core.entity.models.AuditLogEntity;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
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
    public CommonResponse<ProjectDetailDTO> getProjectById(@PathVariable("projectId") String projectId) {
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

    @GetMapping("/{projectId}/members")
    public CommonResponse<List<ProjectMemberDTO>> getProjectMembers(
            @PathVariable("projectId") String projectId,
            @RequestParam(value = "searchQuery", required = false) String searchQuery,
            @RequestParam(value = "reviewSessionId", required = false) String reviewSessionId) {
        return CommonResponse.success(projectService.getProjectMembers(projectId, searchQuery, reviewSessionId));
    }

    @PostMapping("/{projectId}/leave")
    public CommonResponse<ProjectEntity> leaveProject(@PathVariable("projectId") String projectId) {
        return CommonResponse.success(projectService.leaveProject(projectId));
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
