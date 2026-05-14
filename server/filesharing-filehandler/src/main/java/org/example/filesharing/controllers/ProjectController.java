package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.CommonResponse;
import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.project.ProjectCheckInputDTO;
import org.example.filesharing.entities.dtos.project.ProjectCheckResponseDTO;
import org.example.filesharing.entities.dtos.project.ProjectCreateUpdateDTO;
import org.example.filesharing.entities.dtos.project.ProjectFilterDTO;
import org.example.filesharing.entities.dtos.project.ShareTokenCreateDTO;
import org.example.filesharing.entities.dtos.project.ShareTokenCreateResponseDTO;
import org.example.filesharing.entities.models.core.ProjectEntity;
import org.example.filesharing.services.ProjectService;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/join-project/{shareToken}")
    public CommonResponse<ProjectEntity> joinProject(@PathVariable("shareToken") String shareToken) {
        return CommonResponse.success(projectService.joinProject(shareToken));
    }

    @PostMapping("/move-to-project/{projectId}")
    public CommonResponse<ProjectEntity> moveToProject(
            @PathVariable("projectId") String projectId) {
        return CommonResponse.success();
    }
}
