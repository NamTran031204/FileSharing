package org.example.filesharing.services;

import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.project.*;
import org.example.filesharing.entities.models.core.ProjectEntity;

public interface ProjectService {
    ProjectCheckResponseDTO checkProject(ProjectCheckInputDTO inputDTO);

    ProjectCreateUpdateResponseDTO createNewProject(ProjectCreateUpdateDTO projectCreateUpdateDTO);

    ProjectCreateUpdateResponseDTO updateProjectDetail(ProjectCreateUpdateDTO projectCreateUpdateDTO);

    String archiveProject(String projectId);

    PageResult<ProjectEntity> getProjectPage(PageRequestDto<ProjectFilterDTO> dto);

    ProjectEntity getProjectById(String projectId);
}
