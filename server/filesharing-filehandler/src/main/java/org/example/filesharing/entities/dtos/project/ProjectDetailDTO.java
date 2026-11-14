package org.example.filesharing.entities.dtos.project;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
import com.file.service.filesharing.core.entity.models.access.AccessSettings;
import com.file.service.filesharing.core.entity.models.base.EntityAuditBase;
import com.file.service.filesharing.core.entity.models.project.ProjectCollaborator;
import com.file.service.filesharing.core.entity.models.project.ProjectStats;
import com.file.service.filesharing.core.enums.ProjectStatus;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.filesharing.entities.dtos.access.MyAccessDTO;
import org.example.filesharing.entities.dtos.folder.FolderBreadcrumbItemDTO;
import org.springframework.beans.BeanUtils;

import java.time.Instant;
import java.util.List;

/**
 * get-by-id project: truong cua ProjectEntity (khong co visibility/token cua mo hinh cu) + myAccess.
 * Ban rut gon cho nguoi chi co grant folder chi co projectId, projectName, status, myAccess, accessRoots (design 3.7);
 * truong null khong ghi ra JSON.
 */
@Getter
@Setter
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ProjectDetailDTO extends EntityAuditBase {
    private String projectId;
    private String projectName;
    private String projectCode;
    private String description;
    private String ownerId;
    private String ownerEmail;
    private String category;
    private Instant startDate;
    private Instant endDate;
    private List<ProjectCollaborator> collaborators;
    private ProjectStats stats;
    private ProjectStatus status;
    private AccessSettings settings;

    private MyAccessDTO myAccess;
    // goc truy cap cua nguoi khong la thanh vien; null voi thanh vien
    private List<FolderBreadcrumbItemDTO> accessRoots;

    public static ProjectDetailDTO full(ProjectEntity project, MyAccessDTO myAccess) {
        ProjectDetailDTO dto = new ProjectDetailDTO();
        BeanUtils.copyProperties(project, dto);
        dto.setMyAccess(myAccess);
        return dto;
    }

    public static ProjectDetailDTO reduced(ProjectEntity project, MyAccessDTO myAccess, List<FolderBreadcrumbItemDTO> roots) {
        ProjectDetailDTO dto = new ProjectDetailDTO();
        dto.setProjectId(project.getProjectId());
        dto.setProjectName(project.getProjectName());
        dto.setStatus(project.getStatus());
        dto.setMyAccess(myAccess);
        dto.setAccessRoots(roots);
        return dto;
    }
}
