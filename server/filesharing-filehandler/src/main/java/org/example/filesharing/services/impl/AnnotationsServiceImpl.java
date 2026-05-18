package org.example.filesharing.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.annotations.AnnotationsCreateUpdateDTO;
import org.example.filesharing.entities.dtos.annotations.AnnotationsFilterDTO;
import org.example.filesharing.entities.models.*;
import org.example.filesharing.entities.models.annotation.AnnotationRegion;
import org.example.filesharing.entities.models.annotation.AnnotationTimeCode;
import org.example.filesharing.entities.models.folder.FolderPermission;
import org.example.filesharing.entities.models.project.ProjectCollaborator;
import org.example.filesharing.enums.AnnotationStatus;
import org.example.filesharing.enums.AnnotationType;
import org.example.filesharing.enums.auth.UserGrantedRole;
import org.example.filesharing.enums.permission.GrantedProjectPermission;
import org.example.filesharing.exceptions.ErrorCode;
import org.example.filesharing.exceptions.specException.FileBusinessException;
import org.example.filesharing.exceptions.specException.UserBusinessException;
import org.example.filesharing.repositories.AnnotationsRepo;
import org.example.filesharing.repositories.AssetRepo;
import org.example.filesharing.repositories.FolderRepo;
import org.example.filesharing.repositories.ProjectRepo;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.services.AnnotationsService;
import org.example.filesharing.services.baseService.BaseAuditService;
import org.example.filesharing.utils.ProjectPermissionResolver;
import org.example.filesharing.utils.StringUtils;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Objects;

import static org.example.filesharing.utils.NumberUtils.requireNumber;
import static org.example.filesharing.utils.ProjectPermissionResolver.resolveProjectPermissions;
import static org.example.filesharing.utils.StringUtils.trimToNull;

@Service
@RequiredArgsConstructor
public class AnnotationsServiceImpl extends BaseAuditService<AnnotationsEntity> implements AnnotationsService {

    private final AnnotationsRepo annotationsRepo;
    private final MongoTemplate mongoTemplate;
    private final AuditService auditService;
    private final FolderRepo folderRepo;
    private final ProjectRepo projectRepo;
    private final AssetRepo assetRepo;

    @Override
    @Transactional
    public AnnotationsEntity createNewAnnotation(AnnotationsCreateUpdateDTO dto) {
        validateCreatePayload(dto);

        AssetEntity assetEntity = assetRepo.findById(dto.getAssetId()).orElseThrow(() -> new UserBusinessException(ErrorCode.NOT_FOUND, "Asset not found"));
        ensureCommentPermission(assetEntity);

        AnnotationType annotationType = dto.getAnnotationType();
        AnnotationTimeCode normalizedTimeCode = normalizeTimeCode(dto.getTimeCode());
        AnnotationRegion normalizedRegion = normalizeRegion(dto.getRegion());
        Integer frameNumber = normalizeFrameNumber(dto.getFrameNumber());

        validateByType(annotationType, normalizedTimeCode, normalizedRegion, frameNumber);

        AnnotationStatus status = dto.getStatus() != null ? dto.getStatus() : AnnotationStatus.OPEN;

        AnnotationsEntity entity = AnnotationsEntity.builder()
                .assetId(StringUtils.requireNormalized(dto.getAssetId(), "assetId is required"))
                .versionNumber((Integer) requireNumber(dto.getVersionNumber(), "versionId is required"))
                .annotationType(annotationType)
                .timeCode(annotationType == AnnotationType.TIMECODE ? normalizedTimeCode : null)
                .region(annotationType == AnnotationType.TIMECODE ? null : normalizedRegion)
                .frameNumber(annotationType == AnnotationType.FRAME_REGION ? frameNumber : null)
                .status(status)
                .threadId(trimToNull(dto.getThreadId()))
                .build();

        buildAudit(entity, true);

        return annotationsRepo.save(entity);
    }

    @Override
    @Transactional
    public AnnotationsEntity updateAnnotationDetail(AnnotationsCreateUpdateDTO dto) {
        validateUpdatePayload(dto);

        String annotationId = dto.getAnnotationId().trim();
        AnnotationsEntity entity = getActiveAnnotationOrThrow(annotationId);

        if (StringUtils.isNotNullOrBlank(dto.getAssetId()) && !dto.getAssetId().trim().equals(entity.getAssetId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "assetId is immutable");
        }

        AssetEntity assetEntity = assetRepo.findById(dto.getAssetId()).orElseThrow(() -> new UserBusinessException(ErrorCode.NOT_FOUND, "Asset not found"));
        ensureCommentPermission(assetEntity);

        if (dto.getVersionNumber() != null && !dto.getVersionNumber().equals(entity.getVersionNumber())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "versionId is immutable");
        }

        if (dto.getAnnotationType() != null) {
            entity.setAnnotationType(dto.getAnnotationType());
        }

        if (dto.getTimeCode() != null) {
            entity.setTimeCode(normalizeTimeCode(dto.getTimeCode()));
        }

        if (dto.getRegion() != null) {
            entity.setRegion(normalizeRegion(dto.getRegion()));
        }

        if (dto.getFrameNumber() != null) {
            entity.setFrameNumber(normalizeFrameNumber(dto.getFrameNumber()));
        }

        if (dto.getThreadId() != null) {
            entity.setThreadId(trimToNull(dto.getThreadId()));
        }

        if (dto.getStatus() != null) {
            entity.setStatus(dto.getStatus());
            if (dto.getStatus() == AnnotationStatus.RESOLVED) {
                entity.setResolvedAt(Instant.now());
                entity.setResolvedBy(auditService.getCurrentUserId());
            } else {
                entity.setResolvedAt(null);
                entity.setResolvedBy(null);
            }
        }

        normalizeEntityByType(entity);
        validateByType(entity.getAnnotationType(), entity.getTimeCode(), entity.getRegion(), entity.getFrameNumber());

        buildAudit(entity, false);
        return annotationsRepo.save(entity);
    }

    @Override
    public PageResult<AnnotationsEntity> getAnnotationPage(PageRequestDto<AnnotationsFilterDTO> dto) {
        PageRequestDto<AnnotationsFilterDTO> pageRequest = dto != null ? dto : new PageRequestDto<>();
        AnnotationsFilterDTO filter = pageRequest.getFilter();

        Query query = new Query();
        query.addCriteria(Criteria.where("isActive").is(true));

        if (filter != null) {
            if (StringUtils.isNotNullOrBlank(filter.getAssetId())) {
                query.addCriteria(Criteria.where("assetId").is(filter.getAssetId().trim()));
            }

            if (filter.getVersionNumber() != null) {
                query.addCriteria(Criteria.where("versionId").is(filter.getVersionNumber()));
            }

            if (StringUtils.isNotNullOrBlank(filter.getThreadId())) {
                query.addCriteria(Criteria.where("threadId").is(filter.getThreadId().trim()));
            }

            if (filter.getAnnotationType() != null) {
                query.addCriteria(Criteria.where("annotationType").is(filter.getAnnotationType()));
            }

            if (filter.getStatus() != null) {
                query.addCriteria(Criteria.where("status").is(filter.getStatus()));
            }

            if (StringUtils.isNotNullOrBlank(filter.getCreatedBy())) {
                query.addCriteria(Criteria.where("createdBy").is(filter.getCreatedBy().trim()));
            }

            if (StringUtils.isNotNullOrBlank(filter.getCreatedByEmail())) {
                query.addCriteria(Criteria.where("createdByEmail").is(filter.getCreatedByEmail().trim()));
            }

            if (filter.getFrameNumber() != null) {
                query.addCriteria(Criteria.where("frameNumber").is(normalizeFrameNumber(filter.getFrameNumber())));
            }

            if (filter.getFromStartMs() != null || filter.getToStartMs() != null) {
                Criteria startMsCriteria = Criteria.where("timeCode.startMs");
                if (filter.getFromStartMs() != null && filter.getToStartMs() != null) {
                    query.addCriteria(startMsCriteria.gte(filter.getFromStartMs()).lte(filter.getToStartMs()));
                } else if (filter.getFromStartMs() != null) {
                    query.addCriteria(startMsCriteria.gte(filter.getFromStartMs()));
                } else {
                    query.addCriteria(startMsCriteria.lte(filter.getToStartMs()));
                }
            }

            if (filter.getFromCreatedAt() != null || filter.getToCreatedAt() != null) {
                Criteria createdAtCriteria = Criteria.where("createdAt");
                if (filter.getFromCreatedAt() != null && filter.getToCreatedAt() != null) {
                    query.addCriteria(createdAtCriteria.gte(filter.getFromCreatedAt()).lte(filter.getToCreatedAt()));
                } else if (filter.getFromCreatedAt() != null) {
                    query.addCriteria(createdAtCriteria.gte(filter.getFromCreatedAt()));
                } else {
                    query.addCriteria(createdAtCriteria.lte(filter.getToCreatedAt()));
                }
            }
        }

        long totalCount = mongoTemplate.count(query, AnnotationsEntity.class);

        int maxResultCount = pageRequest.getMaxResultCount() == null || pageRequest.getMaxResultCount() <= 0
                ? 10
                : pageRequest.getMaxResultCount();
        int skipCount = pageRequest.getSkipCount() == null || pageRequest.getSkipCount() < 0
                ? 0
                : pageRequest.getSkipCount();
        int pageIndex = skipCount / maxResultCount;

        Sort sort = parseSortFromRequest(pageRequest.getSorting());
        query.with(PageRequest.of(pageIndex, maxResultCount, sort));

        List<AnnotationsEntity> data = mongoTemplate.find(query, AnnotationsEntity.class);

        return PageResult.<AnnotationsEntity>builder()
                .totalCount(totalCount)
                .data(data)
                .build();
    }

    @Override
    public AnnotationsEntity getAnnotationById(String annotationId) {
        if (StringUtils.isNullOrBlank(annotationId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "annotationId is required");
        }

        return getActiveAnnotationOrThrow(annotationId.trim());
    }

    @Override
    @Transactional
    public String deleteAnnotation(String annotationId) {
        if (StringUtils.isNullOrBlank(annotationId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "annotationId is required");
        }

        AnnotationsEntity entity = getActiveAnnotationOrThrow(annotationId.trim());
        buildAudit(entity, false);
        entity.setIsActive(false);
        annotationsRepo.save(entity);

        return "Annotation deleted successfully";
    }

    private void ensureCommentPermission(AssetEntity asset) {
        if (asset.getFolderId() != null) {
            FolderEntity folder = folderRepo.findById(asset.getFolderId())
                    .orElseThrow(() -> new UserBusinessException(ErrorCode.BAD_REQUEST, "folderId not found"));
            ensureFolderPermission(folder, GrantedProjectPermission.COMMENT);
        } else {
            ProjectEntity project = projectRepo.findById(asset.getProjectId())
                    .orElseThrow(() -> new UserBusinessException(ErrorCode.BAD_REQUEST, "project not found"));
            ensureProjectPermission(project, GrantedProjectPermission.COMMENT);
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

    private void ensureProjectPermission(ProjectEntity project, GrantedProjectPermission required) {
        UserEntity currentUser = auditService.getCurrentUser();
        if (isAdmin(currentUser)) {
            return;
        }

        List<ProjectCollaborator> collaborators = project.getCollaborators();
        if (collaborators == null || collaborators.isEmpty()) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }

        String currentUserId = currentUser.getUserId();
        for (ProjectCollaborator collaborator : collaborators) {
            if (Objects.equals(collaborator.getUserId(), currentUserId)) {
                if (ProjectPermissionResolver.hasPermission(collaborator.getProjectPermissions(), required)) {
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

    private void validateCreatePayload(AnnotationsCreateUpdateDTO dto) {
        if (dto == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Request body is required");
        }

        if (StringUtils.isNullOrBlank(dto.getAssetId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "assetId is required");
        }

        if (dto.getVersionNumber() != null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "version is required");
        }

        if (dto.getAnnotationType() == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "annotationType is required");
        }
    }

    private void validateUpdatePayload(AnnotationsCreateUpdateDTO dto) {
        if (dto == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Request body is required");
        }

        if (StringUtils.isNullOrBlank(dto.getAnnotationId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "annotationId is required");
        }
    }

    private AnnotationsEntity getActiveAnnotationOrThrow(String annotationId) {
        return annotationsRepo.findByAnnotationIdAndIsActiveTrue(annotationId)
                .orElseThrow(() -> new FileBusinessException(
                        ErrorCode.FILE_NOT_FOUND,
                        "Cannot find active annotation with id: " + annotationId
                ));
    }

    private void normalizeEntityByType(AnnotationsEntity entity) {
        AnnotationType annotationType = entity.getAnnotationType();
        if (annotationType == AnnotationType.TIMECODE) {
            entity.setRegion(null);
            entity.setFrameNumber(null);
            return;
        }

        entity.setTimeCode(null);
        if (annotationType == AnnotationType.REGION) {
            entity.setFrameNumber(null);
        }
    }

    private void validateByType(
            AnnotationType annotationType,
            AnnotationTimeCode timeCode,
            AnnotationRegion region,
            Integer frameNumber
    ) {
        if (annotationType == AnnotationType.TIMECODE) {
            if (timeCode == null || timeCode.getStartMs() == null || timeCode.getEndMs() == null) {
                throw new UserBusinessException(ErrorCode.BAD_REQUEST, "timeCode.startMs and timeCode.endMs are required");
            }
            if (timeCode.getEndMs() < timeCode.getStartMs()) {
                throw new UserBusinessException(ErrorCode.BAD_REQUEST, "timeCode.endMs must be greater than or equal to timeCode.startMs");
            }
            return;
        }

        if (region == null || region.getShape() == null || region.getPoints() == null || region.getPoints().isEmpty()) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "region with shape and points is required");
        }

        if (annotationType == AnnotationType.FRAME_REGION && frameNumber == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "frameNumber is required for FRAME_REGION");
        }
    }

    private AnnotationTimeCode normalizeTimeCode(AnnotationTimeCode input) {
        if (input == null) {
            return null;
        }

        return AnnotationTimeCode.builder()
                .startMs(input.getStartMs())
                .endMs(input.getEndMs())
                .build();
    }

    private AnnotationRegion normalizeRegion(AnnotationRegion input) {
        if (input == null) {
            return null;
        }

        return AnnotationRegion.builder()
                .shape(input.getShape())
                .points(input.getPoints())
                .strokeColor(trimToNull(input.getStrokeColor()))
                .strokeWidth(input.getStrokeWidth())
                .fillColor(trimToNull(input.getFillColor()))
                .build();
    }

    private Integer normalizeFrameNumber(Integer frameNumber) {
        if (frameNumber == null) {
            return null;
        }

        if (frameNumber < 0) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "frameNumber must be greater than or equal to 0");
        }
        return frameNumber;
    }

    private Sort parseSortFromRequest(String sorting) {
        if (sorting == null || sorting.isBlank()) {
            return Sort.unsorted();
        }

        String[] parts = sorting.split(",", 2);
        if (parts.length < 2) {
            return Sort.unsorted();
        }

        String directionRaw = parts[0].trim();
        String field = parts[1].trim();
        if (field.isEmpty()) {
            return Sort.unsorted();
        }

        Sort.Direction direction = "DESC".equalsIgnoreCase(directionRaw)
                ? Sort.Direction.DESC
                : Sort.Direction.ASC;
        return Sort.by(direction, field);
    }
}
