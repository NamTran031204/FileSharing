package org.example.filesharing.services.impl;

import lombok.RequiredArgsConstructor;
import com.file.service.filesharing.core.entity.PageResult;
import org.example.filesharing.entities.dtos.auditlog.AuditLogCreateDTO;
import org.example.filesharing.entities.dtos.auditlog.AuditLogItemDTO;
import com.file.service.filesharing.core.entity.models.AssetEntity;
import com.file.service.filesharing.core.entity.models.FolderEntity;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
import org.example.filesharing.entities.models.UserEntity;
import com.file.service.filesharing.core.entity.models.auditlog.AuditChanges;
import com.file.service.filesharing.core.entity.models.AuditLogEntity;
import com.file.service.filesharing.core.entity.models.folder.FolderPermission;
import com.file.service.filesharing.core.enums.AuditAction;
import com.file.service.filesharing.core.enums.AuditActorType;
import com.file.service.filesharing.core.enums.AuditTargetType;
import com.file.service.filesharing.core.enums.auth.UserGrantedRole;
import com.file.service.filesharing.core.enums.permission.GrantedProjectPermission;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import com.file.service.filesharing.core.exceptions.specException.UserBusinessException;
import org.example.filesharing.repositories.AssetRepo;
import org.example.filesharing.repositories.AuditLogRepo;
import org.example.filesharing.repositories.FolderRepo;
import org.example.filesharing.repositories.ProjectRepo;
import org.example.filesharing.services.AuditLogService;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.utils.ProjectPermissionResolver;
import com.file.service.filesharing.core.utils.StringUtils;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import static com.file.service.filesharing.core.utils.StringUtils.trimToNull;

@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepo auditLogRepo;
    private final AuditService auditService;
    private final MongoTemplate mongoTemplate;
    private final AssetRepo assetRepo;
    private final ProjectRepo projectRepo;
    private final FolderRepo folderRepo;

    private static final Set<AuditAction> WORKSPACE_ACTIONS = EnumSet.of(
            AuditAction.UPLOAD_NEW_VERSION,
            AuditAction.STATUS_CHANGE,
            AuditAction.CREATE,
            AuditAction.UPDATE,
            AuditAction.TRASH,
            AuditAction.RESTORE,
            AuditAction.DELETE
    );

    @Override
    @Transactional
    public AuditLogEntity createAuditLog(AuditLogCreateDTO dto) {
        validateCreatePayload(dto);

        ResolvedActor actor = resolveActor(dto);

        AuditLogEntity entity = AuditLogEntity.builder()
                .actorId(actor.actorId)
                .actorEmail(actor.actorEmail)
                .actorType(actor.actorType)
                .action(dto.getAction())
                .targetType(dto.getTargetType())
                .targetId(trimToNull(dto.getTargetId()))
                .targetName(trimToNull(dto.getTargetName()))
                .assetId(trimToNull(dto.getAssetId()))
                .versionNumber(dto.getVersionNumber())
                .reviewSessionId(trimToNull(dto.getReviewSessionId()))
                .projectId(resolveProjectId(dto))
                .changes(dto.getChanges())
                .requestInfo(dto.getRequestInfo())
                .timestamp(dto.getTimestamp() != null ? dto.getTimestamp() : Instant.now())
                .expiresAt(dto.getExpiresAt())
                .build();

        applyAuditMetadata(entity, actor);
        return auditLogRepo.save(entity);
    }

    @Override
    public PageResult<AuditLogItemDTO> getAssetAuditLog(String assetId, Integer versionNumber, Integer page, Integer size) {
        if (StringUtils.isNullOrBlank(assetId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "assetId is required");
        }

        AssetEntity asset = getActiveAssetOrThrow(assetId.trim());
        ensureAssetPermission(asset, GrantedProjectPermission.READ);

        int resolvedSize = size != null && size > 0 ? size : 20;
        int resolvedPage = page != null && page >= 0 ? page : 0;

        Query query = new Query();
        query.addCriteria(Criteria.where("isActive").is(true));
        query.addCriteria(Criteria.where("assetId").is(asset.getAssetId()));
        query.addCriteria(Criteria.where("action").in(WORKSPACE_ACTIONS));

        if (versionNumber != null) {
            query.addCriteria(Criteria.where("versionNumber").is(versionNumber));
        }

        query.with(Sort.by(Sort.Direction.DESC, "timestamp"));
        long totalCount = mongoTemplate.count(query, AuditLogEntity.class);

        query.skip((long) resolvedPage * resolvedSize).limit(resolvedSize);
        List<AuditLogEntity> logs = mongoTemplate.find(query, AuditLogEntity.class);

        List<AuditLogItemDTO> data = new ArrayList<>();
        for (AuditLogEntity log : logs) {
            data.add(toItemDto(log));
        }

        return PageResult.<AuditLogItemDTO>builder()
                .totalCount(totalCount)
                .data(data)
                .build();
    }

    private void validateCreatePayload(AuditLogCreateDTO dto) {
        if (dto == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Request body is required");
        }

        if (dto.getAction() == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "action is required");
        }

        if (dto.getTargetType() == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "targetType is required");
        }

        if (StringUtils.isNullOrBlank(dto.getTargetId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "targetId is required");
        }

        if (dto.getAction() == AuditAction.STATUS_CHANGE || dto.getAction() == AuditAction.PERMISSION_CHANGE) {
            ensureChangesRequired(dto.getChanges());
        }
    }

    private void ensureChangesRequired(AuditChanges changes) {
        if (changes == null || changes.getBefore() == null || changes.getAfter() == null) {
            throw new UserBusinessException(
                    ErrorCode.BAD_REQUEST,
                    "changes.before and changes.after are required for this action"
            );
        }
    }

    private ResolvedActor resolveActor(AuditLogCreateDTO dto) {
        AuditActorType actorType = dto.getActorType() != null ? dto.getActorType() : AuditActorType.USER;
        String actorId = trimToNull(dto.getActorId());
        String actorEmail = trimToNull(dto.getActorEmail());

        if (actorType == AuditActorType.USER) {
            if (actorId == null) {
                UserEntity currentUser = auditService.getCurrentUser();
                actorId = currentUser.getUserId();
                actorEmail = actorEmail != null ? actorEmail : currentUser.getEmail();
            }
        } else if (actorType == AuditActorType.SYSTEM) {
            if (actorId == null) {
                actorId = "SYSTEM";
            }
        } else {
            if (actorId == null) {
                throw new UserBusinessException(ErrorCode.BAD_REQUEST, "actorId is required for API_KEY");
            }
        }

        return new ResolvedActor(actorId, actorEmail, actorType);
    }

    private void applyAuditMetadata(AuditLogEntity entity, ResolvedActor actor) {
        entity.setIsActive(true);
        entity.setCreatedBy(actor.actorId);
        entity.setCreatedByEmail(actor.actorEmail);
    }

    private String resolveProjectId(AuditLogCreateDTO dto) {
        if (dto == null) {
            return null;
        }

        String targetId = trimToNull(dto.getTargetId());
        if (dto.getTargetType() == AuditTargetType.PROJECT && targetId != null) {
            return targetId;
        }

        String assetId = trimToNull(dto.getAssetId());
        if (assetId == null && (dto.getTargetType() == AuditTargetType.ASSET || dto.getTargetType() == AuditTargetType.FILE)) {
            assetId = targetId;
        }
        if (assetId != null) {
            AssetEntity asset = assetRepo.findById(assetId).orElse(null);
            if (asset != null) {
                return asset.getProjectId();
            }
        }

        if (dto.getTargetType() == AuditTargetType.FOLDER && targetId != null) {
            FolderEntity folder = folderRepo.findById(targetId).orElse(null);
            if (folder != null) {
                return folder.getProjectId();
            }
        }

        return null;
    }

    private AuditLogItemDTO toItemDto(AuditLogEntity log) {
        return AuditLogItemDTO.builder()
                .iconType(resolveIconType(log))
                .action(resolveActionName(log))
                .detail(resolveDetail(log))
                .timeAgo(formatTimeAgo(log.getTimestamp()))
                .actorName(resolveActorName(log))
                .build();
    }

    private String resolveActorName(AuditLogEntity log) {
        if (StringUtils.isNotNullOrBlank(log.getActorEmail())) {
            return log.getActorEmail();
        }
        return log.getActorId();
    }

    private String resolveIconType(AuditLogEntity log) {
        if (log == null || log.getAction() == null) {
            return "activity";
        }
        return switch (log.getAction()) {
            case UPLOAD_NEW_VERSION -> "upload";
            case STATUS_CHANGE -> "status";
            case CREATE -> "create";
            case UPDATE -> "edit";
            case DELETE -> "delete";
            case RESTORE -> "restore";
            case TRASH -> "trash";
            default -> "activity";
        };
    }

    private String resolveActionName(AuditLogEntity log) {
        if (log == null || log.getAction() == null) {
            return "Activity";
        }
        return switch (log.getAction()) {
            case UPLOAD_NEW_VERSION -> "Uploaded new version";
            case STATUS_CHANGE -> log.getTargetType() == AuditTargetType.REVIEW_SESSION
                    ? "Review status updated"
                    : "Status updated";
            case CREATE -> "Created";
            case UPDATE -> "Updated";
            case DELETE -> "Deleted";
            case RESTORE -> "Restored";
            case TRASH -> "Moved to trash";
            default -> log.getAction().name();
        };
    }

    private String resolveDetail(AuditLogEntity log) {
        if (log == null) {
            return null;
        }

        if (log.getAction() == AuditAction.STATUS_CHANGE && log.getTargetType() == AuditTargetType.REVIEW_SESSION) {
            String status = resolveStatusAfter(log.getChanges());
            return status != null ? "Review " + status : "Review status changed";
        }

        if (log.getAction() == AuditAction.UPLOAD_NEW_VERSION && log.getVersionNumber() != null) {
            return "Version " + log.getVersionNumber();
        }

        if (StringUtils.isNotNullOrBlank(log.getTargetName())) {
            return log.getTargetName();
        }

        if (log.getVersionNumber() != null) {
            return "Version " + log.getVersionNumber();
        }

        return log.getTargetId();
    }

    private String resolveStatusAfter(AuditChanges changes) {
        if (changes == null || changes.getAfter() == null) {
            return null;
        }
        Object status = changes.getAfter().get("status");
        if (status == null) {
            return null;
        }
        return status.toString().replace('_', ' ').toLowerCase(Locale.ROOT);
    }

    private String formatTimeAgo(Instant timestamp) {
        if (timestamp == null) {
            return null;
        }
        long seconds = ChronoUnit.SECONDS.between(timestamp, Instant.now());
        if (seconds < 60) {
            return "just now";
        }
        long minutes = seconds / 60;
        if (minutes < 60) {
            return minutes + "m ago";
        }
        long hours = minutes / 60;
        if (hours < 24) {
            return hours + "h ago";
        }
        long days = hours / 24;
        return days + "d ago";
    }

    private AssetEntity getActiveAssetOrThrow(String assetId) {
        if (StringUtils.isNullOrBlank(assetId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "assetId is required");
        }
        AssetEntity asset = assetRepo.findById(assetId.trim())
                .orElseThrow(() -> new FileBusinessException(ErrorCode.NOT_FOUND));
        if (Boolean.FALSE.equals(asset.getIsActive())) {
            throw new FileBusinessException(ErrorCode.NOT_FOUND);
        }
        return asset;
    }

    private ProjectEntity getActiveProjectOrThrow(String projectId) {
        ProjectEntity project = projectRepo.findById(projectId)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.PROJECT_NOT_FOUND));
        if (Boolean.FALSE.equals(project.getIsActive())) {
            throw new FileBusinessException(ErrorCode.PROJECT_NOT_FOUND);
        }
        return project;
    }

    private FolderEntity getActiveFolderOrThrow(String folderId) {
        FolderEntity folder = folderRepo.findById(folderId)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FOLDER_NOT_FOUND));
        if (Boolean.FALSE.equals(folder.getIsActive())) {
            throw new FileBusinessException(ErrorCode.FOLDER_NOT_FOUND);
        }
        return folder;
    }

    private void ensureAssetPermission(AssetEntity asset, GrantedProjectPermission required) {
        ProjectEntity project = getActiveProjectOrThrow(asset.getProjectId());
        if (StringUtils.isNotNullOrBlank(asset.getFolderId())) {
            FolderEntity folder = getActiveFolderOrThrow(asset.getFolderId());
            ensureFolderInProject(folder, project);
            ensureFolderPermission(folder, required);
        } else {
            ensureProjectPermission(project, auditService.getCurrentUser(), required);
        }
    }

    private void ensureFolderInProject(FolderEntity folder, ProjectEntity project) {
        if (!Objects.equals(folder.getProjectId(), project.getProjectId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Folder does not belong to project");
        }
    }

    private void ensureProjectPermission(ProjectEntity project, UserEntity user, GrantedProjectPermission required) {
        List<GrantedProjectPermission> permissions = ProjectPermissionResolver.resolveProjectPermissions(
                project,
                user,
                isAdmin(user)
        );
        if (!ProjectPermissionResolver.hasPermission(permissions, required)) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }
    }

    private void ensureFolderPermission(FolderEntity folder, GrantedProjectPermission required) {
        UserEntity currentUser = auditService.getCurrentUser();
        if (isAdmin(currentUser)) {
            return;
        }

        List<FolderPermission> userPermissions = folder.getUserPermissions();
        if (userPermissions == null || userPermissions.isEmpty()) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }

        String currentUserId = currentUser.getUserId();
        for (FolderPermission fp : userPermissions) {
            if (Objects.equals(fp.getUserId(), currentUserId)) {
                if (ProjectPermissionResolver.hasPermission(fp.getPermissions(), required)) {
                    return;
                }
                throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
            }
        }
        throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
    }

    private boolean isAdmin(UserEntity user) {
        if (user == null || user.getUserGrantedRoles() == null) {
            return false;
        }
        return user.getUserGrantedRoles().contains(UserGrantedRole.ROLE_ADMIN)
                || user.getUserGrantedRoles().contains(UserGrantedRole.ROLE_SA);
    }


    private static class ResolvedActor {
        private final String actorId;
        private final String actorEmail;
        private final AuditActorType actorType;

        private ResolvedActor(String actorId, String actorEmail, AuditActorType actorType) {
            this.actorId = actorId;
            this.actorEmail = actorEmail;
            this.actorType = actorType;
        }
    }
}
