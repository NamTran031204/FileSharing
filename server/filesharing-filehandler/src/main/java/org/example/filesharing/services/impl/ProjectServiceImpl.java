package org.example.filesharing.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.auditlog.AuditLogCreateDTO;
import org.example.filesharing.entities.dtos.project.*;
import org.example.filesharing.entities.models.ProjectCollaborator;
import org.example.filesharing.entities.models.ProjectStats;
import org.example.filesharing.entities.models.core.ProjectEntity;
import org.example.filesharing.entities.models.core.UserEntity;
import org.example.filesharing.enums.AuditAction;
import org.example.filesharing.enums.AuditTargetType;
import org.example.filesharing.enums.ProjectStatus;
import org.example.filesharing.enums.auth.UserGrantedRole;
import org.example.filesharing.enums.permission.GrantedProjectRole;
import org.example.filesharing.enums.permission.GrantedVisibility;
import org.example.filesharing.exceptions.ErrorCode;
import org.example.filesharing.exceptions.specException.CommonException;
import org.example.filesharing.exceptions.specException.FileBusinessException;
import org.example.filesharing.exceptions.specException.UserBusinessException;
import org.example.filesharing.repositories.ProjectRepo;
import org.example.filesharing.repositories.UserRepo;
import org.example.filesharing.services.AuditLogService;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.services.ProjectService;
import org.example.filesharing.services.baseService.BaseAuditService;
import org.example.filesharing.utils.StringUtils;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl extends BaseAuditService<ProjectEntity> implements ProjectService {

    private final ProjectRepo projectRepo;
    private final UserRepo userRepo;
    private final MongoTemplate mongoTemplate;
    private final AuditService auditService;
    private final AuditLogService auditLogService;

    @Override
    public ProjectCheckResponseDTO checkProject(ProjectCheckInputDTO inputDTO) {
        if (inputDTO == null) throw new CommonException(ErrorCode.VALIDATION_ERROR);

        if (inputDTO.getProjectName() != null) {
            if (projectRepo.existsByProjectNameAndIsActiveAndOwnerId(inputDTO.getProjectName(),true, auditService.getCurrentUserId())) {
                return ProjectCheckResponseDTO.builder()
                        .isSuccess(false)
                        .message("Project name already exists")
                        .build();
            }
        }

        if (inputDTO.getProjectCode() != null) {
            if (projectRepo.existsByProjectCodeAndIsActiveAndOwnerId(inputDTO.getProjectCode(), true, auditService.getCurrentUserId())) {
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
    public ProjectEntity createNewProject(ProjectCreateUpdateDTO projectCreateUpdateDTO) {
        Instant startDate = Instant.now();
        validateCreatePayload(projectCreateUpdateDTO, startDate);

        String projectCode;
        if (StringUtils.isNotNullOrBlank(projectCreateUpdateDTO.getProjectCode())) {
            projectCode = projectCreateUpdateDTO.getProjectCode().trim();
        } else {
            projectCode = "PRJ_" + UUID.randomUUID();
        }


        String ownerId = auditService.getCurrentUserId();
        String ownerEmail = auditService.getCurrentUserEmail();
        ProjectStatus status = ProjectStatus.ACTIVE;
        GrantedVisibility visibility = projectCreateUpdateDTO.getVisibility() != null
            ? projectCreateUpdateDTO.getVisibility()
            : GrantedVisibility.PRIVATE;

        ProjectEntity project = ProjectEntity.builder()
                .projectName(projectCreateUpdateDTO.getProjectName().trim())
                .projectCode(projectCode)
                .description(trimToNull(projectCreateUpdateDTO.getDescription()))
                .ownerId(ownerId)
                .ownerEmail(ownerEmail)
                .startDate(startDate)
                .endDate(projectCreateUpdateDTO.getEndDate())
                .collaborators(buildCollaborators(projectCreateUpdateDTO.getCollaborators(), new ArrayList<>(), true))
                .visibility(visibility)
                .stats(defaultStats())
                .status(status)
                .trashedAt(Instant.now())
                .build();

        buildAudit(project, true);
        ProjectEntity savedProject = projectRepo.save(project);
        writeCreateProjectAuditLog(savedProject);
        return savedProject;
    }

    @Override
    public ProjectEntity updateProjectDetail(ProjectCreateUpdateDTO projectCreateUpdateDTO) {
        validateUpdatePayload(projectCreateUpdateDTO);

        ProjectEntity project = getProjectOrThrow(projectCreateUpdateDTO.getProjectId().trim());
        ensureOwnerOrAdminPermission(project);

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

        if (projectCreateUpdateDTO.getCollaborators() != null) {
            List<ProjectCollaboratorDTO> newCollaborators = projectCreateUpdateDTO.getCollaborators();
            List<ProjectCollaborator> oldCollab = project.getCollaborators();
            var listNewCollab = buildCollaborators(newCollaborators, oldCollab, false);
            project.setCollaborators(listNewCollab);
        }

        if (projectCreateUpdateDTO.getStatus() != null) {
            project.setStatus(projectCreateUpdateDTO.getStatus());
            if (projectCreateUpdateDTO.getStatus() == ProjectStatus.ARCHIVED) {
                project.setTrashedAt(Instant.now());
            } else {
                project.setTrashedAt(null);
            }
        }

        buildAudit(project, false);
        ProjectEntity savedProject = projectRepo.save(project);
        return savedProject;
    }

    @Override
    public String archiveProject(String projectId) {
        if (StringUtils.isNullOrBlank(projectId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }

        ProjectEntity project = getProjectOrThrow(projectId.trim());
        ensureOwnerOrAdminPermission(project);

        project.setStatus(ProjectStatus.ARCHIVED);
        project.setTrashedAt(Instant.now());

        buildAudit(project, false);
        projectRepo.save(project);

        return "Project archived successfully";
    }

    @Override
    public PageResult<ProjectEntity> getProjectPage(PageRequestDto<ProjectFilterDTO> dto) {
        PageRequestDto<ProjectFilterDTO> pageRequest = dto != null ? dto : new PageRequestDto<>();
        ProjectFilterDTO filter = pageRequest.getFilter();

        Query query = new Query();
        addScopeCriteria(query, filter);

        query.addCriteria(Criteria.where("isActive").is(true));

        if (filter != null) {

            if (filter.getStatus() != null) {
                query.addCriteria(Criteria.where("status").is(filter.getStatus()));
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

    @Override
    public ProjectEntity removeCollaboratorFromProject(String projectId, String collaboratorId) {
        ProjectEntity project = getProjectOrThrow(projectId.trim());
        ensureProducerOrOwner(project);
        List<ProjectCollaborator> collabs = project.getCollaborators();
        var tempCollaborators = collabs;
        for (var collaborator : tempCollaborators) {
            if (collaborator.getUserId().equals(collaboratorId)) {
                collabs.remove(collaborator);
            }
        }
        project.setCollaborators(collabs);
        projectRepo.save(project);
        return project;
    }

    @Override
    public ShareTokenCreateResponseDTO createShareToken(ShareTokenCreateDTO input) {
        ProjectEntity project = getProjectOrThrow(input.getProjectId().trim());
        ensureProducerOrOwner(project);
        String shareToken = UUID.randomUUID().toString();

        project.setShareToken(shareToken);

        var startDate = Instant.now();
        switch (input.getRangeTime()) {
            case ONE_DAY -> project.setShareExpiry(startDate.plus(1, ChronoUnit.DAYS));
            case ONE_MONTH -> project.setShareExpiry(startDate.plus(1, ChronoUnit.MONTHS));
            case ONE_WEEK -> project.setShareExpiry(startDate.plus(1, ChronoUnit.WEEKS));
            case ONE_YEAR -> project.setShareExpiry(startDate.plus(1, ChronoUnit.YEARS));
            case UNLIMITED -> project.setShareExpiry(Instant.MAX);
            default -> {
                if (input.getExpireDate() != null) {
                    project.setShareExpiry(input.getExpireDate().toInstant(ZoneOffset.UTC));
                } else
                    throw new UserBusinessException(ErrorCode.BAD_REQUEST, "rangeTime is required");
            }
        }
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")
                .withZone(ZoneOffset.UTC);

        String formattedDate = formatter.format(project.getShareExpiry());

        return ShareTokenCreateResponseDTO.builder()
                .shareToken(shareToken)
                .message("Share token created successfully, due date: " + formattedDate)
                .build();
    }

    @Override
    public ProjectEntity joinProject(String shareToken) {
        if (shareToken == null || shareToken.isBlank()) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "shareToken is required");
        }

        var projectOpt = projectRepo.findByShareToken(shareToken);

        if (projectOpt.isEmpty()) {
            throw new UserBusinessException(ErrorCode.PROJECT_NOT_FOUND);
        }
        ProjectEntity project = projectOpt.get();

        boolean isAfter = project.getShareExpiry().isAfter(Instant.now());
        if (isAfter) throw new UserBusinessException(ErrorCode.INTERNAL_SERVER_ERROR, "shareToken already expired");
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

    private void validateCreatePayload(ProjectCreateUpdateDTO payload, Instant startDate) {
        if (payload == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Request body is required");
        }

        if (StringUtils.isNullOrBlank(payload.getProjectName())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectName is required");
        }

        validateProjectDateRange(startDate, payload.getEndDate());
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

    private void ensureOwnerOrAdminPermission(ProjectEntity project) {
        UserEntity currentUser = auditService.getCurrentUser();
        if (isAdmin(currentUser)) {
            return;
        }

        if (!Objects.equals(project.getOwnerId(), currentUser.getUserId())) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }
    }

    private void ensureProducerOrOwner(ProjectEntity project) {
        UserEntity currentUser = auditService.getCurrentUser();
        GrantedProjectRole role = resolveProjectPermission(project, currentUser);
        if (role != GrantedProjectRole.OWNER && role != GrantedProjectRole.PRODUCER) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }
    }

    private GrantedProjectRole resolveProjectPermission(ProjectEntity project, UserEntity user) {
        if (project == null || user == null) {
            return null;
        }

        if (Objects.equals(project.getOwnerId(), user.getUserId())) {
            return GrantedProjectRole.OWNER;
        }

        if (project.getCollaborators() == null || project.getCollaborators().isEmpty()) {
            return null;
        }

        String currentUserId = user.getUserId();
        for (ProjectCollaborator collaborator : project.getCollaborators()) {
            if (collaborator.getUserId() != null && collaborator.getUserId().equals(currentUserId)) {
                return collaborator.getProjectRole();
            }
        }

        return null;
    }

    private boolean isAdmin(UserEntity user) {
        if (user == null || user.getUserGrantedRoles() == null) {
            return false;
        }
        return user.getUserGrantedRoles().contains(UserGrantedRole.ROLE_ADMIN)
                || user.getUserGrantedRoles().contains(UserGrantedRole.ROLE_SA);
    }

    private boolean hasProjectAccess(ProjectEntity project) {
        String currentUserId = auditService.getCurrentUserId();

        if (currentUserId.equals(project.getOwnerId())) {
            return true;
        }

        if (project.getCollaborators() == null || project.getCollaborators().isEmpty()) {
            return false;
        }

        return project.getCollaborators().stream().anyMatch(collaborator ->
                (collaborator.getUserId() != null && collaborator.getUserId().equals(currentUserId))
        );
    }

    // neu danh sach collab moi khong co permission, mac dinh la Guest
    private List<ProjectCollaborator> buildCollaborators(List<ProjectCollaboratorDTO> newCollab, List<ProjectCollaborator> oldCollab, Boolean isCreate) {

        List<ProjectCollaborator> collaborators = new ArrayList<>();
        if (isCreate) {
            String currentUserId = auditService.getCurrentUserId();

            // owner la mot collaborator
            ProjectCollaborator projectCollaborator = ProjectCollaborator.builder()
                    .userId(currentUserId)
                    .projectRole(GrantedProjectRole.OWNER)
                    .addedAt(Instant.now())
                    .build();
            collaborators.add(projectCollaborator);
            if (newCollab == null || newCollab.isEmpty()) {
                return collaborators;
            }
        }

        if (newCollab == null) {
            return collaborators;
        }

        collaborators = oldCollab;

        Set<String> oldCollaborator = new HashSet<>();
        oldCollab.forEach(x -> oldCollaborator.add(x.getUserId()));
        for (var newCollaborator : newCollab) {
            if (newCollaborator.getUserId() != null && !newCollaborator.getUserId().isBlank()) {
                if (!oldCollaborator.contains(newCollaborator.getUserId())) {
                    oldCollaborator.add(newCollaborator.getUserId());
                    var newCob = ProjectCollaborator.builder()
                            .userId(newCollaborator.getUserId())
                            .projectRole(newCollaborator.getProjectRole() != null ? newCollaborator.getProjectRole() : GrantedProjectRole.GUEST)
                            .addedAt(Instant.now())
                            .build();
                    collaborators.add(newCob);
                }
            } else if (newCollaborator.getEmail() != null && !newCollaborator.getEmail().isBlank()) {
                Optional<UserEntity> user = userRepo.findByEmail(newCollaborator.getEmail());
                if (user.isPresent()) {
                    var userId = user.get().getUserId();
                    if (!oldCollaborator.contains(userId)) {
                        oldCollaborator.add(userId);
                        var newCob = ProjectCollaborator.builder()
                                .userId(userId)
                                .projectRole(newCollaborator.getProjectRole() != null ? newCollaborator.getProjectRole() : GrantedProjectRole.GUEST)
                                .addedAt(Instant.now())
                                .build();
                        collaborators.add(newCob);
                    }
                }
            }
        }

        return collaborators;

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

    private void writeCreateProjectAuditLog(ProjectEntity project) {
        if (project == null || StringUtils.isNullOrBlank(project.getProjectId())) {
            return;
        }

        AuditLogCreateDTO dto = new AuditLogCreateDTO();
        dto.setAction(AuditAction.CREATE);
        dto.setTargetType(AuditTargetType.PROJECT);
        dto.setTargetId(project.getProjectId());
        dto.setTargetName(project.getProjectName());

        auditLogService.createAuditLog(dto);
    }
}
