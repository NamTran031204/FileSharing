package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.CommonResponse;
import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.project.ProjectCreateUpdateDTO;
import org.example.filesharing.entities.dtos.project.ProjectCreateUpdateResponseDTO;
import org.example.filesharing.entities.dtos.project.ProjectFilterDTO;
import org.example.filesharing.entities.models.core.ProjectEntity;
import org.example.filesharing.services.ProjectService;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RequestMapping("api/project")
@RestController
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping("/create-new")
    public CommonResponse<ProjectCreateUpdateResponseDTO> createNewProject(@RequestBody ProjectCreateUpdateDTO projectCreateUpdateDTO) {
        return CommonResponse.success(projectService.createNewProject(projectCreateUpdateDTO));
    }

    @PostMapping("/update-detail")
    public CommonResponse<ProjectCreateUpdateResponseDTO> updateProjectDetail(@RequestBody ProjectCreateUpdateDTO projectCreateUpdateDTO) {
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
}
