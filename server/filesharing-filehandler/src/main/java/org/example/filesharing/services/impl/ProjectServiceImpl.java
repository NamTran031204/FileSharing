package org.example.filesharing.services.impl;

import lombok.RequiredArgsConstructor;
import org.eclipse.angus.mail.iap.CommandFailedException;
import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.project.*;
import org.example.filesharing.entities.models.ProjectCollaborator;
import org.example.filesharing.entities.models.ProjectStats;
import org.example.filesharing.entities.models.core.ProjectEntity;
import org.example.filesharing.entities.models.core.UserEntity;
import org.example.filesharing.enums.ProjectCollaboratorRole;
import org.example.filesharing.enums.ProjectStatus;
import org.example.filesharing.exceptions.ErrorCode;
import org.example.filesharing.exceptions.specException.CommonException;
import org.example.filesharing.exceptions.specException.FileBusinessException;
import org.example.filesharing.exceptions.specException.UserBusinessException;
import org.example.filesharing.repositories.ProjectRepo;
import org.example.filesharing.repositories.UserRepo;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.services.ProjectService;
import org.example.filesharing.utils.StringUtils;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepo projectRepo;
    private final UserRepo userRepo;
    private final MongoTemplate mongoTemplate;
    private final AuditService auditService;

    @Override
    public ProjectCheckResponseDTO checkProject(ProjectCheckInputDTO inputDTO) {
        if (inputDTO == null) throw new CommonException(ErrorCode.VALIDATION_ERROR);

        if (inputDTO.getProjectName() != null) {
            if (projectRepo.existsByProjectName(inputDTO.getProjectName())) {
                return ProjectCheckResponseDTO.builder()
                        .isSuccess(false)
                        .message("Project name already exists")
                        .build();
            }
        }

        if (inputDTO.getProjectCode() != null) {
            if (projectRepo.existsByProjectCode(inputDTO.getProjectCode())) {
                return ProjectCheckResponseDTO.builder()
                        .isSuccess(false)
                        .message("Project code already exists")
                        .build();
            }
        }

        return ProjectCheckResponseDTO.builder()
                .isSuccess(true)
                .build();
    }

    @Override
    public ProjectCreateUpdateResponseDTO createNewProject(ProjectCreateUpdateDTO projectCreateUpdateDTO) {
        validateCreatePayload(projectCreateUpdateDTO);

        String projectCode = projectCreateUpdateDTO.getProjectCode().trim();
        if (projectRepo.existsByProjectCode(projectCode)) {
            throw new UserBusinessException(
                    ErrorCode.BAD_REQUEST,
                    "projectCode already exists: " + projectCode
            );
        }

        String ownerId = auditService.getCurrentUserId();
        String ownerEmail = auditService.getCurrentUserEmail();
        ProjectStatus status = projectCreateUpdateDTO.getStatus() != null
                ? projectCreateUpdateDTO.getStatus()
                : ProjectStatus.ACTIVE;

        ProjectEntity project = ProjectEntity.builder()
                .projectName(projectCreateUpdateDTO.getProjectName().trim())
                .projectCode(projectCode)
                .description(trimToNull(projectCreateUpdateDTO.getDescription()))
                .ownerId(ownerId)
                .ownerEmail(ownerEmail)
                .startDate(projectCreateUpdateDTO.getStartDate())
                .endDate(projectCreateUpdateDTO.getEndDate())
                .collaborators(buildCollaborators(projectCreateUpdateDTO.getEmails(), ownerEmail))
                .stats(defaultStats())
                .status(status)
                .isActive(true)
                .trashedAt(status == ProjectStatus.ARCHIVED ? Instant.now() : null)
                .build();

        ProjectEntity savedProject = projectRepo.save(project);
        return mapToResponse(savedProject);
    }

    @Override
    public ProjectCreateUpdateResponseDTO updateProjectDetail(ProjectCreateUpdateDTO projectCreateUpdateDTO) {
        validateUpdatePayload(projectCreateUpdateDTO);

        ProjectEntity project = getProjectOrThrow(projectCreateUpdateDTO.getProjectId().trim());
        ensureOwnerPermission(project);

        if (StringUtils.isNotNullOrBlank(projectCreateUpdateDTO.getProjectName())) {
            project.setProjectName(projectCreateUpdateDTO.getProjectName().trim());
        }

        if (StringUtils.isNotNullOrBlank(projectCreateUpdateDTO.getProjectCode())) {
            String newProjectCode = projectCreateUpdateDTO.getProjectCode().trim();
            if (!newProjectCode.equals(project.getProjectCode())
                    && projectRepo.existsByProjectCodeAndProjectIdNot(newProjectCode, project.getProjectId())) {
                throw new UserBusinessException(
                        ErrorCode.BAD_REQUEST,
                        "projectCode already exists: " + newProjectCode
                );
            }
            project.setProjectCode(newProjectCode);
        }

        if (projectCreateUpdateDTO.getDescription() != null) {
            project.setDescription(trimToNull(projectCreateUpdateDTO.getDescription()));
        }

        if (projectCreateUpdateDTO.getStartDate() != null) {
            project.setStartDate(projectCreateUpdateDTO.getStartDate());
        }

        if (projectCreateUpdateDTO.getEndDate() != null) {
            project.setEndDate(projectCreateUpdateDTO.getEndDate());
        }

        validateProjectDateRange(project.getStartDate(), project.getEndDate());

        if (projectCreateUpdateDTO.getEmails() != null) {
            project.setCollaborators(buildCollaborators(projectCreateUpdateDTO.getEmails(), project.getOwnerEmail()));
        }

        if (projectCreateUpdateDTO.getStatus() != null) {
            project.setStatus(projectCreateUpdateDTO.getStatus());
            if (projectCreateUpdateDTO.getStatus() == ProjectStatus.ARCHIVED) {
                project.setTrashedAt(Instant.now());
            } else {
                project.setTrashedAt(null);
            }
        }

        ProjectEntity savedProject = projectRepo.save(project);
        return mapToResponse(savedProject);
    }

    @Override
    public String archiveProject(String projectId) {
        if (StringUtils.isNullOrBlank(projectId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }

        ProjectEntity project = getProjectOrThrow(projectId.trim());
        ensureOwnerPermission(project);

        project.setStatus(ProjectStatus.ARCHIVED);
        project.setTrashedAt(Instant.now());
        projectRepo.save(project);

        return "Project archived successfully";
    }

    @Override
    public PageResult<ProjectEntity> getProjectPage(PageRequestDto<ProjectFilterDTO> dto) {
        PageRequestDto<ProjectFilterDTO> pageRequest = dto != null ? dto : new PageRequestDto<>();
        ProjectFilterDTO filter = pageRequest.getFilter();

        Query query = new Query();
        addScopeCriteria(query, filter);

        if (filter != null) {
            if (StringUtils.isNotNullOrBlank(filter.getCategory())) {
                query.addCriteria(Criteria.where("category").is(filter.getCategory().trim()));
            }

            if (filter.getStatus() != null) {
                query.addCriteria(Criteria.where("status").is(filter.getStatus()));
            }

            if (filter.getIsActive() != null) {
                query.addCriteria(Criteria.where("isActive").is(filter.getIsActive()));
            }

            if (filter.getStartDate() != null) {
                query.addCriteria(Criteria.where("startDate").gte(filter.getStartDate()));
            }

            if (filter.getEndDate() != null) {
                query.addCriteria(Criteria.where("endDate").lte(filter.getEndDate()));
            }
        }

        long totalCount = mongoTemplate.count(query, ProjectEntity.class);
        query.with(pageRequest.getPageRequest());
        List<ProjectEntity> projects = mongoTemplate.find(query, ProjectEntity.class);

        return PageResult.<ProjectEntity>builder()
                .totalCount(totalCount)
                .data(projects)
                .build();
    }

    @Override
    public ProjectEntity getProjectById(String projectId) {
        if (StringUtils.isNullOrBlank(projectId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }

        ProjectEntity project = getProjectOrThrow(projectId.trim());
        if (!hasProjectAccess(project)) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }

        return project;
    }

    private void addScopeCriteria(Query query, ProjectFilterDTO filter) {
        String currentUserId = auditService.getCurrentUserId();
        String currentUserEmail = auditService.getCurrentUserEmail();

        String targetUserId = currentUserId;
        if (filter != null && StringUtils.isNotNullOrBlank(filter.getUserId())) {
            targetUserId = filter.getUserId().trim();
            if (!currentUserId.equals(targetUserId)) {
                throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
            }
        }

        String targetEmail = currentUserEmail;
        if (filter != null && StringUtils.isNotNullOrBlank(filter.getEmail())) {
            targetEmail = filter.getEmail().trim();
            if (!currentUserEmail.equalsIgnoreCase(targetEmail)) {
                throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
            }
        }

        Criteria ownerCriteria = Criteria.where("ownerId").is(targetUserId);
        Criteria collaboratorByUserId = Criteria.where("collaborators")
                .elemMatch(Criteria.where("userId").is(targetUserId));
        Criteria collaboratorByEmail = Criteria.where("collaborators")
                .elemMatch(Criteria.where("email").is(targetEmail));

        query.addCriteria(new Criteria().orOperator(ownerCriteria, collaboratorByUserId, collaboratorByEmail));
    }

    private void validateCreatePayload(ProjectCreateUpdateDTO payload) {
        if (payload == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Request body is required");
        }

        if (StringUtils.isNullOrBlank(payload.getProjectName())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectName is required");
        }

        if (StringUtils.isNullOrBlank(payload.getProjectCode())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectCode is required");
        }

        validateProjectDateRange(payload.getStartDate(), payload.getEndDate());
    }

    private void validateUpdatePayload(ProjectCreateUpdateDTO payload) {
        if (payload == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Request body is required");
        }

        if (StringUtils.isNullOrBlank(payload.getProjectId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }
    }

    private void validateProjectDateRange(Instant startDate, Instant endDate) {
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new UserBusinessException(
                    ErrorCode.BAD_REQUEST,
                    "endDate must be greater than or equal to startDate"
            );
        }
    }

    private ProjectEntity getProjectOrThrow(String projectId) {
        return projectRepo.findById(projectId)
                .orElseThrow(() -> new FileBusinessException(
                        ErrorCode.FILE_NOT_FOUND,
                        "Cannot find project with id: " + projectId
                ));
    }

    private void ensureOwnerPermission(ProjectEntity project) {
        String currentUserId = auditService.getCurrentUserId();
        if (!currentUserId.equals(project.getOwnerId())) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }
    }

    private boolean hasProjectAccess(ProjectEntity project) {
        String currentUserId = auditService.getCurrentUserId();
        String currentUserEmail = auditService.getCurrentUserEmail();

        if (currentUserId.equals(project.getOwnerId())) {
            return true;
        }

        if (project.getCollaborators() == null || project.getCollaborators().isEmpty()) {
            return false;
        }

        return project.getCollaborators().stream().anyMatch(collaborator ->
                (collaborator.getUserId() != null && collaborator.getUserId().equals(currentUserId))
                        || (collaborator.getEmail() != null
                        && collaborator.getEmail().equalsIgnoreCase(currentUserEmail))
        );
    }

    private List<ProjectCollaborator> buildCollaborators(List<String> emails, String ownerEmail) {
        if (emails == null) {
            return List.of();
        }

        String normalizedOwnerEmail = ownerEmail != null ? ownerEmail.trim().toLowerCase() : null;

        return emails.stream()
                .filter(StringUtils::isNotNullOrBlank)
                .map(String::trim)
                .map(String::toLowerCase)
                .filter(email -> normalizedOwnerEmail == null || !normalizedOwnerEmail.equals(email))
                .distinct()
                .map(this::mapEmailToCollaborator)
                .toList();
    }

    private ProjectCollaborator mapEmailToCollaborator(String email) {
        if (!StringUtils.isEmail(email)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Invalid email: " + email);
        }

        UserEntity user = userRepo.findByEmail(email)
                .orElseThrow(() -> new UserBusinessException(
                        ErrorCode.USER_NOT_FOUND,
                        "Cannot find user with email: " + email
                ));

        return ProjectCollaborator.builder()
                .userId(user.getUserId())
                .email(user.getEmail())
                .role(ProjectCollaboratorRole.VIEWER)
                .addedAt(Instant.now())
                .build();
    }

    private ProjectStats defaultStats() {
        return ProjectStats.builder()
                .assetCount(0)
                .folderCount(0)
                .pendingReviews(0)
                .totalVersions(0)
                .build();
    }

    private String trimToNull(String input) {
        if (input == null) {
            return null;
        }
        String trimmed = input.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private ProjectCreateUpdateResponseDTO mapToResponse(ProjectEntity project) {
        return ProjectCreateUpdateResponseDTO.builder()
                .projectId(project.getProjectId())
                .projectName(project.getProjectName())
                .projectCode(project.getProjectCode())
                .description(project.getDescription())
                .ownerId(project.getOwnerId())
                .ownerEmail(project.getOwnerEmail())
                .startDate(project.getStartDate())
                .endDate(project.getEndDate())
                .collaborators(project.getCollaborators())
                .status(project.getStatus())
                .isActive(project.getIsActive())
                .trashedAt(project.getTrashedAt())
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }
}
