package org.example.filesharing.services;

import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.project.ProjectCreateUpdateDTO;
import org.example.filesharing.entities.dtos.project.ProjectCreateUpdateResponseDTO;
import org.example.filesharing.entities.dtos.project.ProjectFilterDTO;
import org.example.filesharing.entities.models.core.ProjectEntity;

public interface ProjectService {
    ProjectCreateUpdateResponseDTO createNewProject(ProjectCreateUpdateDTO projectCreateUpdateDTO);

    ProjectCreateUpdateResponseDTO updateProjectDetail(ProjectCreateUpdateDTO projectCreateUpdateDTO);

    String archiveProject(String projectId);

    PageResult<ProjectEntity> getProjectPage(PageRequestDto<ProjectFilterDTO> dto);

    ProjectEntity getProjectById(String projectId);
}
