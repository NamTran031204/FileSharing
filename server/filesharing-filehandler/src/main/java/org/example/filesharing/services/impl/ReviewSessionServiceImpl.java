package org.example.filesharing.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.dtos.auditlog.AuditLogCreateDTO;
import org.example.filesharing.entities.dtos.review.ReviewSessionCreateDTO;
import org.example.filesharing.entities.dtos.review.ReviewSessionDecisionDTO;
import org.example.filesharing.entities.models.AssetEntity;
import org.example.filesharing.entities.models.FolderEntity;
import org.example.filesharing.entities.models.MetadataEntity;
import org.example.filesharing.entities.models.ProjectEntity;
import org.example.filesharing.entities.models.ReviewSessionEntity;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.entities.models.auditlog.AuditChanges;
import org.example.filesharing.entities.models.base.EntityAuditBase;
import org.example.filesharing.entities.models.review.ReviewStatusHistory;
import org.example.filesharing.entities.models.review.ReviewerInfo;
import org.example.filesharing.enums.AuditAction;
import org.example.filesharing.enums.AuditTargetType;
import org.example.filesharing.enums.ReviewSessionStatus;
import org.example.filesharing.enums.ReviewerRole;
import org.example.filesharing.enums.auth.UserGrantedRole;
import org.example.filesharing.enums.permission.GrantedProjectPermission;
import org.example.filesharing.exceptions.ErrorCode;
import org.example.filesharing.exceptions.specException.FileBusinessException;
import org.example.filesharing.exceptions.specException.UserBusinessException;
import org.example.filesharing.repositories.AssetRepo;
import org.example.filesharing.repositories.FolderRepo;
import org.example.filesharing.repositories.MetadataRepo;
import org.example.filesharing.repositories.ProjectRepo;
import org.example.filesharing.repositories.ReviewSessionRepo;
import org.example.filesharing.repositories.UserRepo;
import org.example.filesharing.services.AuditLogService;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.services.ReviewSessionService;
import org.example.filesharing.services.baseService.BaseAuditService;
import org.example.filesharing.utils.ProjectPermissionResolver;
import org.example.filesharing.utils.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

import static org.example.filesharing.utils.StringUtils.requireNormalized;
import static org.example.filesharing.utils.StringUtils.trimToNull;

@Service
@RequiredArgsConstructor
public class ReviewSessionServiceImpl extends BaseAuditService<ReviewSessionEntity> implements ReviewSessionService {

    private final ReviewSessionRepo reviewSessionRepo;
    private final ProjectRepo projectRepo;
    private final AssetRepo assetRepo;
    private final MetadataRepo metadataRepo;
    private final FolderRepo folderRepo;
    private final UserRepo userRepo;
    private final AuditService auditService;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public ReviewSessionEntity createReviewSession(ReviewSessionCreateDTO dto) {
        if (dto == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Request body is required");
        }

        String projectId = requireNormalized(dto.getProjectId(), "projectId is required");
        String assetId = requireNormalized(dto.getAssetId(), "assetId is required");
        Integer versionNumber = dto.getVersionNumber();
        if (versionNumber == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "versionNumber is required");
        }

        ProjectEntity project = getActiveProjectOrThrow(projectId);
        AssetEntity asset = getActiveAssetOrThrow(assetId);
        ensureAssetInProject(asset, project);
        ensureAssetPermission(asset, GrantedProjectPermission.CREATE_FOLDER_ASSET);

        MetadataEntity version = metadataRepo.findByAssetIdAndVersionNumber(asset.getAssetId(), versionNumber)
                .orElseThrow(() -> new UserBusinessException(ErrorCode.BAD_REQUEST, "Asset version not found"));
        if (Boolean.FALSE.equals(version.getIsActive())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Asset version not active");
        }

        if (reviewSessionRepo.existsByAssetIdAndVersionNumberAndStatusAndIsActiveTrue(
                asset.getAssetId(),
                versionNumber,
                ReviewSessionStatus.IN_REVIEW
        )) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Review session already in progress");
        }

        List<ReviewerInfo> reviewers = buildReviewers(project, dto.getReviewerIds());

        ReviewStatusHistory initialHistory = ReviewStatusHistory.builder()
                .status(ReviewSessionStatus.IN_REVIEW)
                .changedBy(auditService.getCurrentUserId())
                .changedByEmail(auditService.getCurrentUserEmail())
                .changedAt(Instant.now())
                .note("Session created")
                .build();

        ReviewSessionEntity session = ReviewSessionEntity.builder()
                .projectId(project.getProjectId())
                .assetId(asset.getAssetId())
                .versionNumber(versionNumber)
                .title(trimToNull(dto.getTitle()))
                .description(trimToNull(dto.getDescription()))
                .dueDate(dto.getDueDate())
                .status(ReviewSessionStatus.IN_REVIEW)
                .reviewers(reviewers)
                .statusHistory(new ArrayList<>(List.of(initialHistory)))
                .build();

        buildAudit(session, true);
        ReviewSessionEntity saved = reviewSessionRepo.save(session);

        asset.setLatestReviewSessionId(saved.getReviewSessionId());
        applyUpdateAudit(asset);
        assetRepo.save(asset);

        return saved;
    }

    @Override
    @Transactional
    public ReviewSessionEntity submitDecision(String reviewSessionId, ReviewSessionDecisionDTO dto) {
        if (StringUtils.isNullOrBlank(reviewSessionId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "reviewSessionId is required");
        }
        if (dto == null || dto.getDecision() == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "decision is required");
        }
        if (dto.getDecision() != ReviewSessionStatus.APPROVED
                && dto.getDecision() != ReviewSessionStatus.REQUEST_CHANGES) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Invalid decision");
        }

        ReviewSessionEntity session = getActiveReviewSessionOrThrow(reviewSessionId.trim());
        if (session.getStatus() != ReviewSessionStatus.IN_REVIEW) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Review session is not active");
        }

        String currentUserId = auditService.getCurrentUserId();
        if (!isReviewer(session, currentUserId)) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }

        ReviewSessionStatus beforeStatus = session.getStatus();
        session.setStatus(dto.getDecision());
        session.setCompletedAt(Instant.now());

        List<ReviewStatusHistory> history = session.getStatusHistory() != null
                ? new ArrayList<>(session.getStatusHistory())
                : new ArrayList<>();
        history.add(ReviewStatusHistory.builder()
                .status(dto.getDecision())
                .changedBy(currentUserId)
                .changedByEmail(auditService.getCurrentUserEmail())
                .changedAt(Instant.now())
                .note(trimToNull(dto.getNote()))
                .build());
        session.setStatusHistory(history);

        buildAudit(session, false);
        ReviewSessionEntity saved = reviewSessionRepo.save(session);

        writeReviewDecisionAuditLog(saved, beforeStatus);
        return saved;
    }

    @Override
    public List<ReviewSessionEntity> getReviewSessionsByAsset(String assetId, Integer versionNumber) {
        if (StringUtils.isNullOrBlank(assetId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "assetId is required");
        }

        AssetEntity asset = getActiveAssetOrThrow(assetId.trim());
        ensureAssetPermission(asset, GrantedProjectPermission.READ);

        if (versionNumber != null) {
            return reviewSessionRepo.findByAssetIdAndVersionNumberAndIsActiveTrueOrderByCreatedAtDesc(
                    asset.getAssetId(),
                    versionNumber
            );
        }

        return reviewSessionRepo.findByAssetIdAndIsActiveTrueOrderByCreatedAtDesc(asset.getAssetId());
    }

    private void writeReviewDecisionAuditLog(ReviewSessionEntity session, ReviewSessionStatus beforeStatus) {
        Map<String, Object> before = new HashMap<>();
        Map<String, Object> after = new HashMap<>();
        before.put("status", beforeStatus);
        after.put("status", session.getStatus());

        AuditLogCreateDTO dto = new AuditLogCreateDTO();
        dto.setAction(AuditAction.STATUS_CHANGE);
        dto.setTargetType(AuditTargetType.REVIEW_SESSION);
        dto.setTargetId(session.getReviewSessionId());
        dto.setTargetName(trimToNull(session.getTitle()));
        dto.setAssetId(session.getAssetId());
        dto.setVersionNumber(session.getVersionNumber());
        dto.setReviewSessionId(session.getReviewSessionId());
        dto.setChanges(AuditChanges.builder().before(before).after(after).build());
        auditLogService.createAuditLog(dto);
    }

    private List<ReviewerInfo> buildReviewers(ProjectEntity project, List<String> reviewerIds) {
        if (reviewerIds == null || reviewerIds.isEmpty()) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "reviewerIds is required");
        }

        List<String> normalizedIds = reviewerIds.stream()
                .map(StringUtils::trimToNull)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        if (normalizedIds.isEmpty()) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "reviewerIds is required");
        }

        Map<String, UserEntity> userMap = userRepo.findAllById(normalizedIds).stream()
                .collect(Collectors.toMap(UserEntity::getUserId, user -> user));

        if (userMap.size() != normalizedIds.size()) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Reviewer not found");
        }

        Instant now = Instant.now();
        List<ReviewerInfo> reviewers = new ArrayList<>();
        for (String reviewerId : normalizedIds) {
            UserEntity user = userMap.get(reviewerId);
            if (!ProjectPermissionResolver.isProjectMember(project, user)) {
                throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Reviewer must be a project member");
            }
            reviewers.add(ReviewerInfo.builder()
                    .userId(user.getUserId())
                    .email(user.getEmail())
                    .role(ReviewerRole.REVIEWER)
                    .invitedAt(now)
                    .hasCommented(false)
                    .build());
        }

        return reviewers;
    }

    private boolean isReviewer(ReviewSessionEntity session, String userId) {
        if (session == null || session.getReviewers() == null || userId == null) {
            return false;
        }
        for (ReviewerInfo reviewer : session.getReviewers()) {
            if (Objects.equals(reviewer.getUserId(), userId)) {
                return true;
            }
        }
        return false;
    }

    private void ensureAssetInProject(AssetEntity asset, ProjectEntity project) {
        if (!Objects.equals(asset.getProjectId(), project.getProjectId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Asset does not belong to project");
        }
    }

    private ProjectEntity getActiveProjectOrThrow(String projectId) {
        ProjectEntity project = projectRepo.findById(projectId)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.PROJECT_NOT_FOUND));
        if (Boolean.FALSE.equals(project.getIsActive())) {
            throw new FileBusinessException(ErrorCode.PROJECT_NOT_FOUND);
        }
        return project;
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

        List<org.example.filesharing.entities.models.folder.FolderPermission> userPermissions = folder.getUserPermissions();
        if (userPermissions == null || userPermissions.isEmpty()) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }

        String currentUserId = currentUser.getUserId();
        for (org.example.filesharing.entities.models.folder.FolderPermission fp : userPermissions) {
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

    private void applyUpdateAudit(EntityAuditBase entity) {
        entity.setUpdateBy(auditService.getCurrentUserId());
        entity.setUpdateByEmail(auditService.getCurrentUserEmail());
        entity.setUpdatedAt(Instant.now());
    }

    ReviewSessionEntity getActiveReviewSessionOrThrow(String reviewSessionId) {
        Optional<ReviewSessionEntity> entityOptional = reviewSessionRepo.findByReviewSessionIdAndIsActiveTrue(reviewSessionId);
        if (entityOptional.isPresent()) {
            return entityOptional.get();
        }
        throw new UserBusinessException(ErrorCode.NOT_FOUND, "Review session not found");
    }
}
