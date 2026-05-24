package org.example.filesharing.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.dtos.annotations.*;
import org.example.filesharing.entities.models.AnnotationsEntity;
import org.example.filesharing.enums.AnnotationStatus;
import org.example.filesharing.exceptions.ErrorCode;
import org.example.filesharing.exceptions.specException.UserBusinessException;
import org.example.filesharing.repositories.AnnotationsRepo;
import org.example.filesharing.repositories.AssetRepo;
import org.example.filesharing.services.AnnotationsService;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.services.baseService.BaseAuditService;
import org.example.filesharing.utils.StringUtils;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnnotationsServiceImpl extends BaseAuditService<AnnotationsEntity> implements AnnotationsService {

    private final AnnotationsRepo annotationsRepo;
    private final AssetRepo assetRepo;
    private final AuditService auditService;

    private static final Sort SORT_BY_CREATED_AT_ASC = Sort.by(Sort.Direction.ASC, "createdAt");

    // ================================================================
    //  3.1. Tao comment / reply
    // ================================================================
    @Override
    @Transactional
    public AnnotationsEntity createAnnotation(AnnotationCreateDTO dto) {
        if (dto == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Request body is required");
        }

        String parentCommentId = StringUtils.isNullOrBlank(dto.getParentCommentId())
                ? null : dto.getParentCommentId().trim();

        if (parentCommentId == null) {
            // --- Tao root comment ---
            return createRootComment(dto);
        } else {
            // --- Tao reply ---
            return createReply(dto, parentCommentId);
        }
    }

    private AnnotationsEntity createRootComment(AnnotationCreateDTO dto) {
        // 1. Xac thuc assetId ton tai va versionNumber hop le
        if (StringUtils.isNullOrBlank(dto.getAssetId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "assetId is required");
        }
        if (dto.getVersionNumber() == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "versionNumber is required");
        }
        assetRepo.findById(dto.getAssetId().trim())
                .orElseThrow(() -> new UserBusinessException(ErrorCode.NOT_FOUND, "Asset not found"));

        // 2. Sinh annotationId moi
        String annotationId = UUID.randomUUID().toString();

        // 3-8. Build entity
        AnnotationsEntity entity = AnnotationsEntity.builder()
                .annotationId(annotationId)
                .assetId(dto.getAssetId().trim())
                .versionNumber(dto.getVersionNumber())
                .commentBody(dto.getCommentBody())
                .authorId(auditService.getCurrentUserId())
                .mediaType(dto.getMediaType())
                .timeCode(dto.getTimeCode())
                .frameNumber(dto.getFrameNumber())
                .region(dto.getRegion())
                .status(AnnotationStatus.OPEN)
                .parentCommentId(null)
                .threadRootId(annotationId) // threadRootId = chinh annotationId vua tao
                .build();

        // 7. buildAudit — isActive=true, isTrash=false, createdBy/At
        buildAudit(entity, true);

        // 8. Luu document
        AnnotationsEntity saved = annotationsRepo.save(entity);

        // 9. TODO: gui notification cho userMentions
        // if (dto.getCommentBody() != null && dto.getCommentBody().getUserMentions() != null) {
        //     // TODO: gui notification
        // }

        // 10. Tra ve
        return saved;
    }

    private AnnotationsEntity createReply(AnnotationCreateDTO dto, String parentCommentId) {
        // 1. Xac thuc parentCommentId ton tai
        AnnotationsEntity parentAnnotation = getActiveAnnotationOrThrow(parentCommentId);

        // 2. Lay threadRootId tu annotation cha
        String threadRootId = parentAnnotation.getThreadRootId();

        // 3. Kiem tra annotation cha khong bi ARCHIVED
        if (parentAnnotation.getStatus() == AnnotationStatus.ARCHIVED) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Cannot reply to an archived comment");
        }

        // 4. Sinh annotationId moi
        String annotationId = UUID.randomUUID().toString();

        // 5-9. Build entity — ke thua assetId, versionNumber tu annotation cha
        AnnotationsEntity entity = AnnotationsEntity.builder()
                .annotationId(annotationId)
                .assetId(parentAnnotation.getAssetId())
                .versionNumber(parentAnnotation.getVersionNumber())
                .commentBody(dto.getCommentBody())
                .authorId(auditService.getCurrentUserId())
                .mediaType(parentAnnotation.getMediaType())
                .timeCode(dto.getTimeCode())
                .frameNumber(dto.getFrameNumber())
                .region(dto.getRegion())
                .status(AnnotationStatus.OPEN)
                .parentCommentId(parentCommentId)
                .threadRootId(threadRootId) // ke thua tu root
                .build();

        // 8. buildAudit
        buildAudit(entity, true);

        // 9. Luu document
        AnnotationsEntity saved = annotationsRepo.save(entity);

        // 10. TODO: gui notification cho userMentions
        // if (dto.getCommentBody() != null && dto.getCommentBody().getUserMentions() != null) {
        //     // TODO: gui notification
        // }

        // 11. TODO: gui notification cho authorId cua root comment
        // notify parentAnnotation root author about new reply

        // 12. Tra ve
        return saved;
    }

    // ================================================================
    //  3.2. Sua noi dung comment
    // ================================================================
    @Override
    @Transactional
    public AnnotationsEntity editAnnotation(AnnotationEditDTO dto) {
        if (dto == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Request body is required");
        }
        if (StringUtils.isNullOrBlank(dto.getAnnotationId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "annotationId is required");
        }

        // 1-2. Load annotation, kiem tra ton tai va isActive = true
        AnnotationsEntity entity = getActiveAnnotationOrThrow(dto.getAnnotationId().trim());

        // 3. Kiem tra quyen: chi authorId moi duoc sua
        String currentUserId = auditService.getCurrentUserId();
        if (!Objects.equals(entity.getAuthorId(), currentUserId)) {
            throw new UserBusinessException(ErrorCode.FORBIDDEN, "Only the author can edit this annotation");
        }

        // 4. Kiem tra status != ARCHIVED
        if (entity.getStatus() == AnnotationStatus.ARCHIVED) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Cannot edit an archived annotation");
        }

        // 5. Cap nhat commentBody va region
        entity.setCommentBody(dto.getCommentBody());
        entity.setRegion(dto.getRegion());

        // 6. buildAudit(entity, false) — cap nhat updateBy/At
        buildAudit(entity, false);

        // 7. TODO: gui notification cho userMentions moi
        // if (dto.getCommentBody() != null && dto.getCommentBody().getUserMentions() != null) {
        //     // TODO: gui notification
        // }

        // 8. Luu va tra ve
        return annotationsRepo.save(entity);
    }

    // ================================================================
    //  3.3. Resolve comment
    // ================================================================
    @Override
    @Transactional
    public AnnotationsEntity resolveAnnotation(AnnotationIdDTO dto) {
        if (dto == null || StringUtils.isNullOrBlank(dto.getAnnotationId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "annotationId is required");
        }

        // 1-2. Load annotation, kiem tra ton tai va isActive = true
        AnnotationsEntity entity = getActiveAnnotationOrThrow(dto.getAnnotationId().trim());

        // 3. Kiem tra phai la root comment
        if (entity.getParentCommentId() != null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Only root comments can be resolved");
        }

        // 4. Kiem tra status == OPEN
        if (entity.getStatus() != AnnotationStatus.OPEN) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST,
                    "Cannot resolve annotation with status: " + entity.getStatus());
        }

        // 5-8. Cap nhat status, resolvedAt, resolvedBy
        entity.setStatus(AnnotationStatus.RESOLVED);
        entity.setResolvedAt(Instant.now());
        entity.setResolvedBy(auditService.getCurrentUserId());

        // 9. buildAudit(entity, false)
        buildAudit(entity, false);

        // 10. Luu va tra ve
        return annotationsRepo.save(entity);
    }

    // ================================================================
    //  3.4. Reopen comment
    // ================================================================
    @Override
    @Transactional
    public AnnotationsEntity reopenAnnotation(AnnotationIdDTO dto) {
        if (dto == null || StringUtils.isNullOrBlank(dto.getAnnotationId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "annotationId is required");
        }

        // 1-2. Load annotation, kiem tra ton tai va isActive = true
        AnnotationsEntity entity = getActiveAnnotationOrThrow(dto.getAnnotationId().trim());

        // 3. Kiem tra phai la root comment
        if (entity.getParentCommentId() != null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Only root comments can be reopened");
        }

        // 4. Kiem tra status == RESOLVED
        if (entity.getStatus() != AnnotationStatus.RESOLVED) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST,
                    "Cannot reopen annotation with status: " + entity.getStatus());
        }

        // 5-7. Cap nhat status ve OPEN, xoa resolvedAt va resolvedBy
        entity.setStatus(AnnotationStatus.OPEN);
        entity.setResolvedAt(null);
        entity.setResolvedBy(null);

        // 8. buildAudit(entity, false)
        buildAudit(entity, false);

        // 9. Luu va tra ve
        return annotationsRepo.save(entity);
    }

    // ================================================================
    //  3.5. Archive comment
    // ================================================================
    @Override
    @Transactional
    public String archiveAnnotation(AnnotationIdDTO dto) {
        if (dto == null || StringUtils.isNullOrBlank(dto.getAnnotationId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "annotationId is required");
        }

        // 1-2. Load annotation, kiem tra ton tai va isActive = true
        AnnotationsEntity entity = getActiveAnnotationOrThrow(dto.getAnnotationId().trim());

        // 3. Kiem tra phai la root comment
        if (entity.getParentCommentId() != null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Only root comments can be archived");
        }

        // 4. Kiem tra status != ARCHIVED
        if (entity.getStatus() == AnnotationStatus.ARCHIVED) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Annotation is already archived");
        }

        // 5. Kiem tra quyen: chi authorId cua root comment moi duoc archive
        String currentUserId = auditService.getCurrentUserId();
        if (!Objects.equals(entity.getAuthorId(), currentUserId)) {
            throw new UserBusinessException(ErrorCode.FORBIDDEN, "Only the author can archive this annotation");
        }

        // 6. Cap nhat status = ARCHIVED tren root comment
        entity.setStatus(AnnotationStatus.ARCHIVED);
        buildAudit(entity, false);
        annotationsRepo.save(entity);

        // 7. Bulk update toan bo reply co cung threadRootId
        List<AnnotationsEntity> replies = annotationsRepo
                .findByThreadRootIdAndParentCommentIdIsNotNullAndIsActiveTrue(entity.getAnnotationId());
        for (AnnotationsEntity reply : replies) {
            reply.setStatus(AnnotationStatus.ARCHIVED);
            buildAudit(reply, false);
        }
        if (!replies.isEmpty()) {
            annotationsRepo.saveAll(replies);
        }

        // 8. Tra ve thong bao thanh cong
        return "Annotation archived successfully";
    }

    // ================================================================
    //  3.6. Xoa comment
    // ================================================================
    @Override
    @Transactional
    public String deleteAnnotation(AnnotationIdDTO dto) {
        if (dto == null || StringUtils.isNullOrBlank(dto.getAnnotationId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "annotationId is required");
        }

        // 1-2. Load annotation, kiem tra ton tai va isActive = true
        AnnotationsEntity entity = getActiveAnnotationOrThrow(dto.getAnnotationId().trim());

        // 3. Kiem tra quyen: chi authorId moi duoc xoa
        String currentUserId = auditService.getCurrentUserId();
        if (!Objects.equals(entity.getAuthorId(), currentUserId)) {
            throw new UserBusinessException(ErrorCode.FORBIDDEN, "Only the author can delete this annotation");
        }

        if (entity.getParentCommentId() != null) {
            // 4. Neu la reply: soft delete chi reply do
            softDeleteAudit(entity);
            annotationsRepo.save(entity);
        } else {
            // 5. Neu la root comment: soft delete root + toan bo replies
            softDeleteAudit(entity);
            annotationsRepo.save(entity);

            List<AnnotationsEntity> replies = annotationsRepo
                    .findByThreadRootIdAndParentCommentIdIsNotNullAndIsActiveTrue(entity.getAnnotationId());
            for (AnnotationsEntity reply : replies) {
                softDeleteAudit(reply);
            }
            if (!replies.isEmpty()) {
                annotationsRepo.saveAll(replies);
            }
        }

        // 6. Tra ve thong bao thanh cong
        return "Annotation deleted successfully";
    }

    // ================================================================
    //  3.7. Lay danh sach root comments cua asset/version
    // ================================================================
    @Override
    public List<AnnotationsEntity> listByAsset(String assetId, Integer versionNumber, AnnotationStatus status) {
        if (StringUtils.isNullOrBlank(assetId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "assetId is required");
        }
        if (versionNumber == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "versionNumber is required");
        }

        // query: parentCommentId = null, isActive = true, sap xep theo createdAt ASC
        if (status != null) {
            return annotationsRepo.findByAssetIdAndVersionNumberAndParentCommentIdIsNullAndIsActiveTrueAndStatus(
                    assetId.trim(), versionNumber, status, SORT_BY_CREATED_AT_ASC);
        }
        return annotationsRepo.findByAssetIdAndVersionNumberAndParentCommentIdIsNullAndIsActiveTrue(
                assetId.trim(), versionNumber, SORT_BY_CREATED_AT_ASC);
    }

    // ================================================================
    //  3.8. Lay danh sach replies cua mot root comment
    // ================================================================
    @Override
    public List<AnnotationsEntity> listReplies(String threadRootId) {
        if (StringUtils.isNullOrBlank(threadRootId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "threadRootId is required");
        }

        // 1-2. Load root comment, kiem tra ton tai, la root comment va isActive = true
        AnnotationsEntity rootComment = getActiveAnnotationOrThrow(threadRootId.trim());
        if (rootComment.getParentCommentId() != null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST,
                    "threadRootId must refer to a root comment (parentCommentId must be null)");
        }

        // 4-6. Query replies, sap xep theo createdAt ASC
        return annotationsRepo.findByThreadRootIdAndParentCommentIdIsNotNullAndIsActiveTrue(
                threadRootId.trim(), SORT_BY_CREATED_AT_ASC);
    }

    // ================================================================
    //  3.9. Lay chi tiet mot annotation
    // ================================================================
    @Override
    public AnnotationsEntity getById(String annotationId) {
        if (StringUtils.isNullOrBlank(annotationId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "annotationId is required");
        }

        // 1-2. Load annotation, kiem tra ton tai va isActive = true
        return getActiveAnnotationOrThrow(annotationId.trim());
    }

    // ================================================================
    //  3.10. Dashboard tong hop
    // ================================================================
    @Override
    public AnnotationSummaryResponse getSummary(String assetId, Integer versionNumber) {
        if (StringUtils.isNullOrBlank(assetId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "assetId is required");
        }

        List<AnnotationsEntity> allAnnotations;
        List<AnnotationsEntity> rootComments;

        if (versionNumber != null) {
            allAnnotations = annotationsRepo.findByAssetIdAndVersionNumberAndIsActiveTrue(assetId.trim(), versionNumber);
            rootComments = allAnnotations.stream()
                    .filter(a -> a.getParentCommentId() == null)
                    .collect(Collectors.toList());
        } else {
            allAnnotations = annotationsRepo.findByAssetIdAndIsActiveTrue(assetId.trim());
            rootComments = allAnnotations.stream()
                    .filter(a -> a.getParentCommentId() == null)
                    .collect(Collectors.toList());
        }

        long openCount = rootComments.stream()
                .filter(a -> a.getStatus() == AnnotationStatus.OPEN).count();
        long resolvedCount = rootComments.stream()
                .filter(a -> a.getStatus() == AnnotationStatus.RESOLVED).count();
        long archivedCount = rootComments.stream()
                .filter(a -> a.getStatus() == AnnotationStatus.ARCHIVED).count();
        long totalThreads = rootComments.size();

        long totalReplies = allAnnotations.stream()
                .filter(a -> a.getParentCommentId() != null).count();

        // tap hop participants tu authorId cua toan bo annotation (ca root va reply)
        List<String> participants = allAnnotations.stream()
                .map(AnnotationsEntity::getAuthorId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());

        return AnnotationSummaryResponse.builder()
                .assetId(assetId.trim())
                .versionNumber(versionNumber)
                .totalThreads(totalThreads)
                .open(openCount)
                .resolved(resolvedCount)
                .archived(archivedCount)
                .totalReplies(totalReplies)
                .participants(participants)
                .build();
    }

    // ================================================================
    //  Helper
    // ================================================================
    private AnnotationsEntity getActiveAnnotationOrThrow(String annotationId) {
        return annotationsRepo.findByAnnotationIdAndIsActiveTrue(annotationId)
                .orElseThrow(() -> new UserBusinessException(
                        ErrorCode.NOT_FOUND,
                        "Cannot find active annotation with id: " + annotationId
                ));
    }
}
