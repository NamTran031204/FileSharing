package org.example.filesharing.services.impl;

import lombok.RequiredArgsConstructor;
import com.file.service.filesharing.core.entity.PageRequestDto;
import com.file.service.filesharing.core.entity.PageResult;
import org.example.filesharing.entities.dtos.auditlog.AuditLogCreateDTO;
import org.example.filesharing.entities.dtos.access.MyAccessDTO;
import org.example.filesharing.entities.dtos.auditlog.AuditLogFilterDTO;
import org.example.filesharing.entities.dtos.folder.FolderBreadcrumbItemDTO;
import org.example.filesharing.entities.dtos.project.*;
import com.file.service.filesharing.core.entity.models.auditlog.AuditChanges;
import com.file.service.filesharing.core.entity.models.project.ProjectCollaborator;
import com.file.service.filesharing.core.entity.models.project.ProjectStats;
import com.file.service.filesharing.core.entity.models.AuditLogEntity;
import com.file.service.filesharing.core.entity.models.FolderEntity;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
import com.file.service.filesharing.core.entity.models.access.AccessSettings;
import com.file.service.filesharing.core.entity.models.ReviewSessionEntity;
import org.example.filesharing.entities.models.UserEntity;
import com.file.service.filesharing.core.entity.models.review.ReviewerInfo;
import com.file.service.filesharing.core.enums.AuditAction;
import com.file.service.filesharing.core.enums.AuditTargetType;
import com.file.service.filesharing.core.enums.ProjectStatus;
import com.file.service.filesharing.core.enums.access.AccessRole;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.CommonException;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import com.file.service.filesharing.core.exceptions.specException.UserBusinessException;
import org.bson.Document;
import org.example.filesharing.repositories.ProjectRepo;
import org.example.filesharing.repositories.ReviewSessionRepo;
import org.example.filesharing.repositories.UserRepo;
import org.example.filesharing.services.AccessService;
import org.example.filesharing.services.AuditLogService;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.services.ProjectService;
import org.example.filesharing.services.baseService.BaseAuditService;
import org.example.filesharing.utils.access.AccessContext;
import org.example.filesharing.utils.access.AccessResolver;
import org.example.filesharing.utils.access.Action;
import org.example.filesharing.utils.access.ResourceRef;
import com.file.service.filesharing.core.utils.StringUtils;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl extends BaseAuditService<ProjectEntity> implements ProjectService {

    private final ProjectRepo projectRepo;
    private final UserRepo userRepo;
    private final ReviewSessionRepo reviewSessionRepo;
    private final MongoTemplate mongoTemplate;
    private final AuditService auditService;
    private final AuditLogService auditLogService;
    private final AccessService accessService;

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

        ProjectEntity project = ProjectEntity.builder()
                .projectName(projectCreateUpdateDTO.getProjectName().trim())
                .projectCode(projectCode)
                .description(trimToNull(projectCreateUpdateDTO.getDescription()))
                .ownerId(ownerId)
                .ownerEmail(ownerEmail)
                .startDate(startDate)
                .endDate(projectCreateUpdateDTO.getEndDate())
                .collaborators(buildCollaborators(projectCreateUpdateDTO.getCollaborators(), ownerId))
                .stats(defaultStats())
                .status(status)
                .settings(AccessSettings.builder().viewersCanDownload(true).build())
                .build();

        buildAudit(project, true);
        ProjectEntity savedProject = projectRepo.save(project);
        writeCreateProjectAuditLog(savedProject);
        return savedProject;
    }

    @Override
    public ProjectEntity updateProjectDetail(ProjectCreateUpdateDTO projectCreateUpdateDTO) {
        validateUpdatePayload(projectCreateUpdateDTO);
        if (projectCreateUpdateDTO.getCollaborators() != null) {
            // thanh vien chi doi qua /api/access (design 6.2)
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "collaborators khong doi qua update-detail, dung /api/access");
        }

        ProjectEntity project = getActiveProjectOrThrow(projectCreateUpdateDTO.getProjectId().trim());
        ProjectStatus newStatus = projectCreateUpdateDTO.getStatus();
        requireProject(project, newStatus != null ? statusAction(project.getStatus(), newStatus) : Action.MANAGE_PROJECT);
        Update update = new Update();

        if (StringUtils.isNotNullOrBlank(projectCreateUpdateDTO.getProjectName())) {
            project.setProjectName(projectCreateUpdateDTO.getProjectName().trim());
            update.set("projectName", project.getProjectName());
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
            update.set("projectCode", newProjectCode);
        }

        if (projectCreateUpdateDTO.getDescription() != null) {
            project.setDescription(trimToNull(projectCreateUpdateDTO.getDescription()));
            setOrUnset(update, "description", project.getDescription());
        }

        if (projectCreateUpdateDTO.getStartDate() != null) {
            project.setStartDate(projectCreateUpdateDTO.getStartDate());
            update.set("startDate", project.getStartDate());
        }

        if (projectCreateUpdateDTO.getEndDate() != null) {
            project.setEndDate(projectCreateUpdateDTO.getEndDate());
            update.set("endDate", project.getEndDate());
        }

        validateProjectDateRange(project.getStartDate(), project.getEndDate());

        if (projectCreateUpdateDTO.getStatus() != null) {
            project.setStatus(projectCreateUpdateDTO.getStatus());
            if (projectCreateUpdateDTO.getStatus() == ProjectStatus.ARCHIVED) {
                project.setTrashedAt(Instant.now());
            } else {
                project.setTrashedAt(null);
            }
            update.set("status", project.getStatus());
            setOrUnset(update, "trashedAt", project.getTrashedAt());
        }

        buildAudit(project, false);
        updateProject(project.getProjectId(), update);
        return project;
    }

    @Override
    public String archiveProject(String projectId) {
        if (StringUtils.isNullOrBlank(projectId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }

        ProjectEntity project = getActiveProjectOrThrow(projectId.trim());
        requireProject(project, Action.ARCHIVE_PROJECT);

        // ban save cu: moveToTrashAudit roi buildAudit dat lai isTrash=false, nen chi luu status va trashedAt
        updateProject(project.getProjectId(), new Update()
                .set("status", ProjectStatus.ARCHIVED)
                .set("trashedAt", Instant.now()));

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
    public ProjectDetailDTO getProjectById(String projectId) {
        if (StringUtils.isNullOrBlank(projectId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }

        ProjectEntity project = getActiveProjectOrThrow(projectId.trim());
        MyAccessDTO myAccess = accessService.myAccess(ResourceRef.project(project.getProjectId()));
        if (myAccess.getRole() != null) {
            return ProjectDetailDTO.full(project, myAccess);
        }
        // nguoi chi co grant folder: ban rut gon de trang folder mo duoc (design 3.7)
        List<FolderBreadcrumbItemDTO> roots = accessRoots(project);
        if (roots.isEmpty()) {
            requireProject(project, Action.VIEW);
        }
        return ProjectDetailDTO.reduced(project, myAccess, roots);
    }

    // folder thay duoc ma cha khong thay duoc; 1 query cac folder cua project, chi cho nguoi khong la thanh vien
    private List<FolderBreadcrumbItemDTO> accessRoots(ProjectEntity project) {
        Query query = Query.query(Criteria.where("projectId").is(project.getProjectId())
                .and("isActive").is(true)
                .and("isTrash").ne(true));
        query.fields().include("projectId", "parentFolderId", "folderName", "level", "grants", "link", "isTrash");
        List<FolderEntity> visible = accessService.filterVisible(project, mongoTemplate.find(query, FolderEntity.class));
        Set<String> visibleIds = visible.stream().map(FolderEntity::getFolderId).collect(Collectors.toSet());
        return visible.stream()
                .filter(f -> !visibleIds.contains(f.getParentFolderId()))
                .sorted(Comparator.comparing(FolderEntity::getFolderName, Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .map(f -> FolderBreadcrumbItemDTO.builder()
                        .folderId(f.getFolderId())
                        .folderName(f.getFolderName())
                        .level(f.getLevel())
                        .build())
                .toList();
    }

    @Override
    public ProjectEntity removeCollaboratorFromProject(String projectId, String collaboratorId) {
        // xoa chinh minh = tu roi, khong can MANAGE_ACCESS
        if (Objects.equals(collaboratorId, auditService.getCurrentUserId())) {
            return leaveProject(projectId);
        }
        ProjectEntity project = getActiveProjectOrThrow(projectId.trim());
        AccessContext caller = requireProject(project, Action.MANAGE_ACCESS);
        requireNotAbove(caller, project, collaboratorId);
        removeMember(project, collaboratorId);
        return getProjectOrThrow(project.getProjectId());
    }

    @Override
    public String deleteProject(String projectId) {
        if (StringUtils.isNullOrBlank(projectId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }

        ProjectEntity project = getActiveProjectOrThrow(projectId.trim());
        requireProject(project, Action.ARCHIVE_PROJECT);

        // ban save cu goi buildAudit sau setIsActive(false) nen isActive bi dat lai true; nay luu dung isActive=false
        project.setIsActive(false);
        updateProject(project.getProjectId(), new Update().set("isActive", false));

        writeProjectAuditLog(project, AuditAction.DELETE, null);
        return "Project deleted successfully";
    }

    @Override
    public ProjectEntity restoreProject(String projectId) {
        if (StringUtils.isNullOrBlank(projectId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }

        // project da xoa (isActive=false) coi nhu khong ton tai, chi khoi phuc tu ARCHIVED
        ProjectEntity project = getActiveProjectOrThrow(projectId.trim());
        requireProject(project, Action.ARCHIVE_PROJECT);

        ProjectStatus beforeStatus = project.getStatus();
        Instant beforeTrashedAt = project.getTrashedAt();

        project.setIsActive(true);
        project.setStatus(ProjectStatus.ACTIVE);
        project.setTrashedAt(null);

        buildAudit(project, false);
        updateProject(project.getProjectId(), new Update()
                .set("isActive", true)
                .set("isTrash", false)
                .set("status", ProjectStatus.ACTIVE)
                .unset("trashedAt"));

        AuditChanges changes = buildStatusChanges(beforeStatus, project.getStatus(), beforeTrashedAt, project.getTrashedAt());
        writeProjectAuditLog(project, AuditAction.STATUS_CHANGE, changes);
        return project;
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
        requireProject(project, statusAction(project.getStatus(), status));

        ProjectStatus beforeStatus = project.getStatus();
        Instant beforeTrashedAt = project.getTrashedAt();

        project.setStatus(status);
        if (status == ProjectStatus.ARCHIVED) {
            project.setTrashedAt(Instant.now());
        } else {
            project.setTrashedAt(null);
        }

        buildAudit(project, false);
        Update update = new Update().set("status", status);
        setOrUnset(update, "trashedAt", project.getTrashedAt());
        updateProject(project.getProjectId(), update);

        AuditChanges changes = buildStatusChanges(beforeStatus, project.getStatus(), beforeTrashedAt, project.getTrashedAt());
        writeProjectAuditLog(project, AuditAction.STATUS_CHANGE, changes);
        return project;
    }

    @Override
    public List<ProjectMemberDTO> getProjectMembers(String projectId, String searchQuery, String reviewSessionId) {
        if (StringUtils.isNullOrBlank(projectId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }

        ProjectEntity project = getActiveProjectOrThrow(projectId.trim());
        requireProject(project, Action.VIEW_PEOPLE);

        // userId -> vai tro; owner dat sau cung de uu tien OWNER hon collaborator
        Map<String, AccessRole> roleByUserId = new HashMap<>();
        if (project.getCollaborators() != null) {
            for (ProjectCollaborator collaborator : project.getCollaborators()) {
                if (StringUtils.isNotNullOrBlank(collaborator.getUserId())) {
                    roleByUserId.put(collaborator.getUserId(), collaborator.getRole());
                }
            }
        }
        if (StringUtils.isNotNullOrBlank(project.getOwnerId())) {
            roleByUserId.put(project.getOwnerId(), AccessRole.OWNER);
        }

        if (roleByUserId.isEmpty()) {
            return Collections.emptyList();
        }

        String normalizedQuery = normalizeSearch(searchQuery);
        List<ProjectMemberDTO> members = userRepo.findAllById(roleByUserId.keySet()).stream()
                .filter(user -> matchesSearch(user, normalizedQuery))
                .map(user -> mapToProjectMember(user, roleByUserId.get(user.getUserId())))
                .collect(Collectors.toCollection(ArrayList::new));

        Set<String> prioritized = resolveReviewerPriority(project, reviewSessionId);
        members.sort(Comparator
                .comparing((ProjectMemberDTO member) -> !prioritized.contains(member.getUserId()))
                .thenComparing(member -> normalizeSortKey(member.getName()), String.CASE_INSENSITIVE_ORDER));

        return members;
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

        // tu roi khong can Action, chi can dang la thanh vien project
        List<ProjectCollaborator> collabs = project.getCollaborators();
        boolean member = collabs != null
                && collabs.stream().anyMatch(collaborator -> Objects.equals(collaborator.getUserId(), currentUser.getUserId()));
        if (!member) {
            throw new FileBusinessException(ErrorCode.ACCESS_DENIED);
        }
        removeMember(project, currentUser.getUserId());

        ProjectEntity savedProject = getProjectOrThrow(project.getProjectId());
        writeProjectAuditLog(savedProject, AuditAction.UPDATE, null);
        return savedProject;
    }

    @Override
    public ProjectStats getProjectStats(String projectId) {
        if (StringUtils.isNullOrBlank(projectId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }

        ProjectEntity project = getActiveProjectOrThrow(projectId.trim());
        requireProject(project, Action.VIEW);
        return project.getStats() != null ? project.getStats() : defaultStats();
    }

    @Override
    public PageResult<AuditLogEntity> getProjectAuditLog(String projectId, PageRequestDto<AuditLogFilterDTO> dto) {
        if (StringUtils.isNullOrBlank(projectId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }

        ProjectEntity project = getActiveProjectOrThrow(projectId.trim());
        requireProject(project, Action.VIEW_AUDIT_LOG);

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

        // luon loc theo user hien tai, filter.userId cua nguoi khac bi bo qua
        String targetUserId = currentUserId;

        String targetEmail = currentUserEmail;
        if (filter != null && StringUtils.isNotNullOrBlank(filter.getEmail())) {
            targetEmail = filter.getEmail().trim();
            if (!currentUserEmail.equalsIgnoreCase(targetEmail)) {
                // khong xem danh sach project cua nguoi khac
                throw new FileBusinessException(ErrorCode.ACCESS_DENIED);
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

    private AccessContext requireProject(ProjectEntity project, Action action) {
        return accessService.require(ResourceRef.project(project.getProjectId()), action);
    }

    // vao/ra ARCHIVED la luu tru/khoi phuc (chi owner), con lai ACTIVE <-> COMPLETED la quan ly project
    private static Action statusAction(ProjectStatus from, ProjectStatus to) {
        if (from != to && (from == ProjectStatus.ARCHIVED || to == ProjectStatus.ARCHIVED)) {
            return Action.ARCHIVE_PROJECT;
        }
        return Action.MANAGE_PROJECT;
    }

    // khong doi/xoa nguoi co vai tro project cao hon minh; owner luon cao nhat
    private void requireNotAbove(AccessContext caller, ProjectEntity project, String targetUserId) {
        AccessRole target = AccessResolver.resolve(project, List.of(), targetUserId, Instant.now()).own();
        if (target != null && caller.own() != null && target.compareTo(caller.own()) > 0) {
            throw new FileBusinessException(ErrorCode.ACTION_NOT_ALLOWED);
        }
    }

    private Set<String> resolveReviewerPriority(ProjectEntity project, String reviewSessionId) {
        if (StringUtils.isNotNullOrBlank(reviewSessionId)) {
            ReviewSessionEntity session = reviewSessionRepo.findByReviewSessionIdAndIsActiveTrue(reviewSessionId.trim())
                    .orElse(null);
            if (session != null
                    && Objects.equals(session.getProjectId(), project.getProjectId())
                    && session.getReviewers() != null) {
                return session.getReviewers().stream()
                        .map(ReviewerInfo::getUserId)
                        .filter(StringUtils::isNotNullOrBlank)
                        .collect(Collectors.toSet());
            }
        }

        if (project.getCollaborators() == null) {
            return Collections.emptySet();
        }

        return project.getCollaborators().stream()
                .filter(collaborator -> collaborator.getRole() == AccessRole.COMMENTER)
                .map(ProjectCollaborator::getUserId)
                .filter(StringUtils::isNotNullOrBlank)
                .collect(Collectors.toSet());
    }

    private ProjectMemberDTO mapToProjectMember(UserEntity user, AccessRole role) {
        String name = trimToNull(user.getPublicUserName());
        String fallback = name != null ? name : user.getEmail();
        return ProjectMemberDTO.builder()
                .userId(user.getUserId())
                .username(fallback)
                .name(fallback)
                .avatar(resolveAvatar(user.getMetadata()))
                .role(role)
                .build();
    }

    private boolean matchesSearch(UserEntity user, String normalizedQuery) {
        if (normalizedQuery == null) {
            return true;
        }

        String name = normalizeSearch(user.getPublicUserName());
        String email = normalizeSearch(user.getEmail());
        return (name != null && name.contains(normalizedQuery))
                || (email != null && email.contains(normalizedQuery));
    }

    private String normalizeSearch(String value) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            return null;
        }
        return StringUtils.removeVietnameseAccents(normalized).toLowerCase(Locale.ROOT);
    }

    private String normalizeSortKey(String value) {
        String normalized = trimToNull(value);
        return normalized != null ? normalized : "";
    }

    private String resolveAvatar(Map<String, Object> metadata) {
        if (metadata == null || metadata.isEmpty()) {
            return null;
        }
        Object avatar = metadata.get("avatar");
        if (avatar == null) {
            avatar = metadata.get("avatarUrl");
        }
        return avatar != null ? avatar.toString() : null;
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

    // chi dung khi tao project; role cua collaborator do client gui theo pham vi cap project (VIEWER..MANAGER)
    private List<ProjectCollaborator> buildCollaborators(List<ProjectCollaboratorDTO> collaboratorDTOS, String ownerId) {
        if (collaboratorDTOS != null) {
            collaboratorDTOS.forEach(x -> AccessGrantServiceImpl.parseRole(x.getRole(), ResourceRef.Type.PROJECT));
        }

        List<ProjectCollaborator> collaborators = new ArrayList<>();
        String currentUserId = auditService.getCurrentUserId();
        // owner la mot collaborator vai tro MANAGER, quyen OWNER tinh theo ownerId
        collaborators.add(newCollaborator(currentUserId, AccessRole.MANAGER, currentUserId));
        if (collaboratorDTOS == null || collaboratorDTOS.isEmpty()) {
            return collaborators;
        }

        Set<String> added = new HashSet<>();
        if (ownerId == null || !ownerId.isBlank()) {
            added.add(ownerId);
        }
        collaborators.forEach(x -> added.add(x.getUserId()));
        for (var newCollaborator : collaboratorDTOS) {
            if (newCollaborator.getUserId() != null && !newCollaborator.getUserId().isBlank()) {
                if (!added.contains(newCollaborator.getUserId())) {
                    userRepo.findById(newCollaborator.getUserId()).ifPresent(x -> {
                        added.add(newCollaborator.getUserId());
                        collaborators.add(newCollaborator(newCollaborator.getUserId(),
                                AccessGrantServiceImpl.parseRole(newCollaborator.getRole(), ResourceRef.Type.PROJECT),
                                currentUserId));
                    });
                }
            } else if (newCollaborator.getEmail() != null && !newCollaborator.getEmail().isBlank()) {
                Optional<UserEntity> user = userRepo.findByEmail(newCollaborator.getEmail());
                if (user.isPresent()) {
                    var userId = user.get().getUserId();
                    if (!added.contains(userId)) {
                        added.add(userId);
                        collaborators.add(newCollaborator(userId,
                                AccessGrantServiceImpl.parseRole(newCollaborator.getRole(), ResourceRef.Type.PROJECT),
                                currentUserId));
                    }
                }
            }
        }

        return collaborators;

    }

    private ProjectCollaborator newCollaborator(String userId, AccessRole role, String addedBy) {
        return ProjectCollaborator.builder()
                .userId(userId)
                .role(role)
                .addedBy(addedBy)
                .addedAt(Instant.now())
                .build();
    }

    // go grant folder truoc, collaborator sau: bi ngat giua chung thi user mat quyen chu khong giu quyen thua
    private void removeMember(ProjectEntity project, String userId) {
        pullMemberFromFolders(project, userId);
        updateProject(project.getProjectId(), new Update().pull("collaborators", new Document("userId", userId)));
    }

    // mot updateMulti go grant folder cua user trong project; khong dong vao muc cua owner
    private void pullMemberFromFolders(ProjectEntity project, String userId) {
        if (userId == null || Objects.equals(userId, project.getOwnerId())) {
            return;
        }
        mongoTemplate.updateMulti(
                Query.query(Criteria.where("projectId").is(project.getProjectId()).and("grants.userId").is(userId)),
                new Update().pull("grants", new Document("userId", userId)),
                FolderEntity.class);
    }

    private void updateProject(String projectId, Update update) {
        updateProject(projectId, null, update);
    }

    // $set dung truong doi + truong audit, khong save() ca document de khong ghi de collaborators/settings
    private void updateProject(String projectId, Criteria extra, Update update) {
        Query query = Query.query(Criteria.where("_id").is(projectId));
        if (extra != null) {
            query.addCriteria(extra);
        }
        update.set("updateBy", auditService.getCurrentUserId())
                .set("updateByEmail", auditService.getCurrentUserEmail())
                .set("updatedAt", Instant.now());
        mongoTemplate.updateFirst(query, update, ProjectEntity.class);
    }

    // gia tri null thi unset, giong save() cu bo qua field null
    private static void setOrUnset(Update update, String field, Object value) {
        if (value == null) {
            update.unset(field);
        } else {
            update.set(field, value);
        }
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
