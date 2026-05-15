package org.example.filesharing.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.auditlog.AuditLogCreateDTO;
import org.example.filesharing.entities.dtos.auditlog.AuditLogFilterDTO;
import org.example.filesharing.entities.dtos.project.*;
import org.example.filesharing.entities.models.auditlog.AuditChanges;
import org.example.filesharing.entities.models.project.ProjectCollaborator;
import org.example.filesharing.entities.models.project.ProjectStats;
import org.example.filesharing.entities.models.AuditLogEntity;
import org.example.filesharing.entities.models.ProjectEntity;
import org.example.filesharing.entities.models.UserEntity;
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
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final PasswordEncoder passwordEncoder;

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

        ProjectEntity project = getActiveProjectOrThrow(projectCreateUpdateDTO.getProjectId().trim());
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

        ProjectEntity project = getActiveProjectOrThrow(projectId.trim());
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

        ProjectEntity project = getActiveProjectOrThrow(projectId.trim());
        if (!hasProjectAccess(project)) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }

        return project;
    }

    @Override
    public ProjectEntity removeCollaboratorFromProject(String projectId, String collaboratorId) {
        ProjectEntity project = getActiveProjectOrThrow(projectId.trim());
        ensureProducerOrOwner(project);
        List<ProjectCollaborator> collabs = project.getCollaborators();
        if (collabs != null) {
            collabs.removeIf(collaborator -> Objects.equals(collaborator.getUserId(), collaboratorId));
        }
        project.setCollaborators(collabs);
        projectRepo.save(project);
        return project;
    }

    @Override
    public ShareTokenCreateResponseDTO createShareToken(ShareTokenCreateDTO input) {
        if (input == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Request body is required");
        }
        if (StringUtils.isNullOrBlank(input.getProjectId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }

        ProjectEntity project = getActiveProjectOrThrow(input.getProjectId().trim());
        ensureProducerOrOwner(project);
        ShareTokenCreateResponseDTO response = createShareTokenInternal(project, input);
        projectRepo.save(project);
        writeProjectAuditLog(project, AuditAction.SHARE, null);
        return response;
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

        ensureShareTokenValid(project);
        return project;
    }

    @Override
    public String deleteProject(String projectId) {
        if (StringUtils.isNullOrBlank(projectId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }

        ProjectEntity project = getProjectOrThrow(projectId.trim());
        ensureOwnerOrAdminPermission(project);

        project.setIsActive(false);
        buildAudit(project, false);
        projectRepo.save(project);

        writeProjectAuditLog(project, AuditAction.DELETE, null);
        return "Project deleted successfully";
    }

    @Override
    public ProjectEntity restoreProject(String projectId) {
        if (StringUtils.isNullOrBlank(projectId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }

        ProjectEntity project = getProjectOrThrow(projectId.trim());
        ensureOwnerOrAdminPermission(project);

        ProjectStatus beforeStatus = project.getStatus();
        Instant beforeTrashedAt = project.getTrashedAt();

        project.setIsActive(true);
        project.setStatus(ProjectStatus.ACTIVE);
        project.setTrashedAt(null);

        buildAudit(project, false);
        ProjectEntity savedProject = projectRepo.save(project);

        AuditChanges changes = buildStatusChanges(beforeStatus, project.getStatus(), beforeTrashedAt, project.getTrashedAt());
        writeProjectAuditLog(savedProject, AuditAction.STATUS_CHANGE, changes);
        return savedProject;
    }

    @Override
    public ProjectEntity updateProjectStatus(String projectId, ProjectStatus status) {
        if (StringUtils.isNullOrBlank(projectId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }
        if (status == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "status is required");
        }

        ProjectEntity project = getActiveProjectOrThrow(projectId.trim());
        ensureOwnerOrAdminPermission(project);

        ProjectStatus beforeStatus = project.getStatus();
        Instant beforeTrashedAt = project.getTrashedAt();

        project.setStatus(status);
        if (status == ProjectStatus.ARCHIVED) {
            project.setTrashedAt(Instant.now());
        } else {
            project.setTrashedAt(null);
        }

        buildAudit(project, false);
        ProjectEntity savedProject = projectRepo.save(project);

        AuditChanges changes = buildStatusChanges(beforeStatus, project.getStatus(), beforeTrashedAt, project.getTrashedAt());
        writeProjectAuditLog(savedProject, AuditAction.STATUS_CHANGE, changes);
        return savedProject;
    }

    @Override
    public List<ProjectCollaborator> getProjectCollaborators(String projectId) {
        if (StringUtils.isNullOrBlank(projectId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }

        ProjectEntity project = getActiveProjectOrThrow(projectId.trim());
        ensureProjectAccessOrAdmin(project);

        if (project.getCollaborators() == null) {
            return Collections.emptyList();
        }

        return project.getCollaborators();
    }

    @Override
    public ProjectEntity addCollaboratorToProject(String projectId, ProjectCollaboratorDTO collaborator) {
        if (StringUtils.isNullOrBlank(projectId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }
        if (collaborator == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Request body is required");
        }

        ProjectEntity project = getActiveProjectOrThrow(projectId.trim());
        ensureProducerOrOwner(project);

        String resolvedUserId = resolveCollaboratorUserId(collaborator);
        collaborator.setUserId(resolvedUserId);
        collaborator.setEmail(null);

        List<ProjectCollaborator> oldCollab = project.getCollaborators();
        if (oldCollab == null) {
            oldCollab = new ArrayList<>();
        }

        List<ProjectCollaboratorDTO> newCollaborators = Collections.singletonList(collaborator);
        List<ProjectCollaborator> updated = buildCollaborators(newCollaborators, oldCollab, false);
        project.setCollaborators(updated);

        buildAudit(project, false);
        ProjectEntity savedProject = projectRepo.save(project);
        writeProjectAuditLog(savedProject, AuditAction.UPDATE, null);
        return savedProject;
    }

    @Override
    public ProjectEntity changeCollaboratorPermission(ProjectCollaboratorDTO collaborator) {
        if (collaborator == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Request body is required");
        }
        if (StringUtils.isNullOrBlank(collaborator.getProjectId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }
        if (collaborator.getProjectRole() == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectRole is required");
        }

        ProjectEntity project = getActiveProjectOrThrow(collaborator.getProjectId().trim());
        ensureOwnerOrAdminPermission(project);

        String targetUserId = resolveCollaboratorUserId(collaborator);
        List<ProjectCollaborator> collabs = project.getCollaborators();
        if (collabs == null || collabs.isEmpty()) {
            throw new FileBusinessException(ErrorCode.FILE_NOT_FOUND, "collaborator not found");
        }

        GrantedProjectRole beforeRole = null;
        boolean updated = false;
        for (ProjectCollaborator collaboratorItem : collabs) {
            if (Objects.equals(collaboratorItem.getUserId(), targetUserId)) {
                beforeRole = collaboratorItem.getProjectRole();
                collaboratorItem.setProjectRole(collaborator.getProjectRole());
                updated = true;
                break;
            }
        }

        if (!updated) {
            throw new FileBusinessException(ErrorCode.FILE_NOT_FOUND, "collaborator not found");
        }

        buildAudit(project, false);
        ProjectEntity savedProject = projectRepo.save(project);

        AuditChanges changes = buildPermissionChanges(beforeRole, collaborator.getProjectRole());
        writeProjectAuditLog(savedProject, AuditAction.PERMISSION_CHANGE, changes);
        return savedProject;
    }

    @Override
    public ProjectEntity leaveProject(String projectId) {
        if (StringUtils.isNullOrBlank(projectId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }

        ProjectEntity project = getActiveProjectOrThrow(projectId.trim());
        UserEntity currentUser = auditService.getCurrentUser();

        if (Objects.equals(project.getOwnerId(), currentUser.getUserId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "owner cannot leave project");
        }

        if (!hasProjectAccess(project)) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }

        List<ProjectCollaborator> collabs = project.getCollaborators();
        if (collabs == null) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }

        boolean removed = collabs.removeIf(collaborator -> Objects.equals(collaborator.getUserId(), currentUser.getUserId()));
        if (!removed) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }

        project.setCollaborators(collabs);
        buildAudit(project, false);
        ProjectEntity savedProject = projectRepo.save(project);
        writeProjectAuditLog(savedProject, AuditAction.UPDATE, null);
        return savedProject;
    }

    @Override
    public String revokeShareToken(String projectId) {
        if (StringUtils.isNullOrBlank(projectId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }

        ProjectEntity project = getActiveProjectOrThrow(projectId.trim());
        ensureProducerOrOwner(project);

        project.setShareToken(null);
        project.setShareExpiry(null);

        buildAudit(project, false);
        projectRepo.save(project);
        writeProjectAuditLog(project, AuditAction.SHARE, null);

        return "Share token revoked successfully";
    }

    @Override
    public ShareTokenCreateResponseDTO refreshShareToken(String projectId, ShareTokenCreateDTO input) {
        if (StringUtils.isNullOrBlank(projectId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }
        if (input == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Request body is required");
        }
        if (StringUtils.isNotNullOrBlank(input.getProjectId())
                && !projectId.trim().equals(input.getProjectId().trim())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId mismatch");
        }

        ProjectEntity project = getActiveProjectOrThrow(projectId.trim());
        ensureProducerOrOwner(project);

        ShareTokenCreateResponseDTO response = createShareTokenInternal(project, input);
        projectRepo.save(project);
        writeProjectAuditLog(project, AuditAction.SHARE, null);
        return response;
    }

    @Override
    public ShareTokenInfoDTO getShareTokenInfo(String shareToken) {
        if (StringUtils.isNullOrBlank(shareToken)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "shareToken is required");
        }

        ProjectEntity project = projectRepo.findByShareToken(shareToken)
                .orElseThrow(() -> new UserBusinessException(ErrorCode.PROJECT_NOT_FOUND));

        ensureShareTokenValid(project);

        return ShareTokenInfoDTO.builder()
                .shareToken(project.getShareToken())
                .shareExpiry(project.getShareExpiry())
                .projectId(project.getProjectId())
                .projectName(project.getProjectName())
                .visibility(project.getVisibility())
                .build();
    }

    @Override
    public ProjectEntity updateProjectVisibility(String projectId, GrantedVisibility visibility) {
        if (StringUtils.isNullOrBlank(projectId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }
        if (visibility == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "visibility is required");
        }

        ProjectEntity project = getActiveProjectOrThrow(projectId.trim());
        ensureOwnerOrAdminPermission(project);

        project.setVisibility(visibility);
        buildAudit(project, false);
        ProjectEntity savedProject = projectRepo.save(project);
        writeProjectAuditLog(savedProject, AuditAction.UPDATE, null);
        return savedProject;
    }

    @Override
    public ProjectStats getProjectStats(String projectId) {
        if (StringUtils.isNullOrBlank(projectId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }

        ProjectEntity project = getActiveProjectOrThrow(projectId.trim());
        ensureProjectAccessOrAdmin(project);
        return project.getStats() != null ? project.getStats() : defaultStats();
    }

    @Override
    public PageResult<AuditLogEntity> getProjectAuditLog(String projectId, PageRequestDto<AuditLogFilterDTO> dto) {
        if (StringUtils.isNullOrBlank(projectId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }

        ProjectEntity project = getActiveProjectOrThrow(projectId.trim());
        ensureOwnerOrAdminPermission(project);

        PageRequestDto<AuditLogFilterDTO> pageRequest = dto != null ? dto : new PageRequestDto<>();
        AuditLogFilterDTO filter = pageRequest.getFilter();

        Query query = new Query();
        query.addCriteria(Criteria.where("isActive").is(true));
        query.addCriteria(Criteria.where("targetType").is(AuditTargetType.PROJECT));
        query.addCriteria(Criteria.where("targetId").is(project.getProjectId()));

        if (filter != null) {
            if (StringUtils.isNotNullOrBlank(filter.getActorId())) {
                query.addCriteria(Criteria.where("actorId").is(filter.getActorId()));
            }

            if (StringUtils.isNotNullOrBlank(filter.getActorEmail())) {
                query.addCriteria(Criteria.where("actorEmail").is(filter.getActorEmail()));
            }

            if (filter.getAction() != null) {
                query.addCriteria(Criteria.where("action").is(filter.getAction()));
            }

            if (filter.getFromTimestamp() != null || filter.getToTimestamp() != null) {
                Criteria timestampCriteria = Criteria.where("timestamp");
                if (filter.getFromTimestamp() != null && filter.getToTimestamp() != null) {
                    query.addCriteria(timestampCriteria.gte(filter.getFromTimestamp()).lte(filter.getToTimestamp()));
                } else if (filter.getFromTimestamp() != null) {
                    query.addCriteria(timestampCriteria.gte(filter.getFromTimestamp()));
                } else {
                    query.addCriteria(timestampCriteria.lte(filter.getToTimestamp()));
                }
            }
        }

        long totalCount = mongoTemplate.count(query, AuditLogEntity.class);
        query.with(pageRequest.getPageRequest());
        List<AuditLogEntity> data = mongoTemplate.find(query, AuditLogEntity.class);

        return PageResult.<AuditLogEntity>builder()
                .totalCount(totalCount)
                .data(data)
                .build();
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
        if (isAdmin(currentUser)) {
            return;
        }
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
        UserEntity currentUser = auditService.getCurrentUser();
        if (isAdmin(currentUser)) {
            return true;
        }

        String currentUserId = currentUser.getUserId();
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

    private void ensureProjectAccessOrAdmin(ProjectEntity project) {
        if (!hasProjectAccess(project)) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }
    }

    private ProjectEntity getActiveProjectOrThrow(String projectId) {
        ProjectEntity project = getProjectOrThrow(projectId);
        if (project.getIsActive() != null && !project.getIsActive()) {
            throw new FileBusinessException(
                    ErrorCode.FILE_NOT_FOUND,
                    "Cannot find project with id: " + projectId
            );
        }
        return project;
    }

    private void ensureShareTokenValid(ProjectEntity project) {
        if (project.getIsActive() != null && !project.getIsActive()) {
            throw new UserBusinessException(ErrorCode.PROJECT_NOT_FOUND);
        }
        if (project.getShareExpiry() != null && project.getShareExpiry().isBefore(Instant.now())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "shareToken already expired");
        }
    }

    private String resolveCollaboratorUserId(ProjectCollaboratorDTO collaborator) {
        if (collaborator == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Request body is required");
        }

        if (StringUtils.isNotNullOrBlank(collaborator.getUserId())) {
            return collaborator.getUserId().trim();
        }

        if (StringUtils.isNotNullOrBlank(collaborator.getEmail())) {
            Optional<UserEntity> user = userRepo.findByEmail(collaborator.getEmail().trim());
            if (user.isPresent()) {
                return user.get().getUserId();
            }
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "user not found by email");
        }

        throw new UserBusinessException(ErrorCode.BAD_REQUEST, "userId or email is required");
    }

    private AuditChanges buildStatusChanges(ProjectStatus beforeStatus,
                                           ProjectStatus afterStatus,
                                           Instant beforeTrashedAt,
                                           Instant afterTrashedAt) {
        Map<String, Object> before = new HashMap<>();
        Map<String, Object> after = new HashMap<>();
        before.put("status", beforeStatus);
        before.put("trashedAt", beforeTrashedAt);
        after.put("status", afterStatus);
        after.put("trashedAt", afterTrashedAt);
        return AuditChanges.builder()
                .before(before)
                .after(after)
                .build();
    }

    private AuditChanges buildPermissionChanges(GrantedProjectRole beforeRole, GrantedProjectRole afterRole) {
        Map<String, Object> before = new HashMap<>();
        Map<String, Object> after = new HashMap<>();
        before.put("projectRole", beforeRole);
        after.put("projectRole", afterRole);
        return AuditChanges.builder()
                .before(before)
                .after(after)
                .build();
    }

    private void writeProjectAuditLog(ProjectEntity project, AuditAction action, AuditChanges changes) {
        if (project == null || StringUtils.isNullOrBlank(project.getProjectId()) || action == null) {
            return;
        }

        AuditLogCreateDTO dto = new AuditLogCreateDTO();
        dto.setAction(action);
        dto.setTargetType(AuditTargetType.PROJECT);
        dto.setTargetId(project.getProjectId());
        dto.setTargetName(project.getProjectName());
        dto.setChanges(changes);

        auditLogService.createAuditLog(dto);
    }

    private ShareTokenCreateResponseDTO createShareTokenInternal(ProjectEntity project, ShareTokenCreateDTO input) {
        if (input == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Request body is required");
        }

        String shareToken = passwordEncoder.encode(project.getProjectName() + UUID.randomUUID());
        while (projectRepo.existsByShareToken(shareToken)) {
            passwordEncoder.encode(project.getProjectName() + UUID.randomUUID());
        }
        project.setShareToken(shareToken);

        Instant startDate = Instant.now();
        if (input.getRangeTime() != null) {
            switch (input.getRangeTime()) {
                case ONE_DAY -> project.setShareExpiry(startDate.plus(1, ChronoUnit.DAYS));
                case ONE_MONTH -> project.setShareExpiry(startDate.plus(1, ChronoUnit.MONTHS));
                case ONE_WEEK -> project.setShareExpiry(startDate.plus(1, ChronoUnit.WEEKS));
                case ONE_YEAR -> project.setShareExpiry(startDate.plus(1, ChronoUnit.YEARS));
                case UNLIMITED -> project.setShareExpiry(Instant.MAX);
                default -> {
                    if (input.getExpireDate() != null) {
                        project.setShareExpiry(input.getExpireDate().toInstant(ZoneOffset.UTC));
                    } else {
                        throw new UserBusinessException(ErrorCode.BAD_REQUEST, "rangeTime is required");
                    }
                }
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

        if (oldCollab == null) {
            oldCollab = new ArrayList<>();
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
