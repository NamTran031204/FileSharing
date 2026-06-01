package org.example.filesharing.services.impl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.entities.dtos.annotations.*;
import org.example.filesharing.entities.models.AnnotationsEntity;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.enums.AnnotationStatus;
import org.example.filesharing.exceptions.ErrorCode;
import org.example.filesharing.exceptions.specException.UserBusinessException;
import org.example.filesharing.repositories.AnnotationsRepo;
import org.example.filesharing.repositories.AssetRepo;
import org.example.filesharing.repositories.UserRepo;
import org.example.filesharing.services.AnnotationsService;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.services.SseService;
import org.example.filesharing.services.baseService.BaseAuditService;
import org.example.filesharing.utils.StringUtils;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnnotationsServiceImpl extends BaseAuditService<AnnotationsEntity> implements AnnotationsService {

    private final AnnotationsRepo annotationsRepo;
    private final AssetRepo assetRepo;
    private final AuditService auditService;
    private final SseService sseService;
    private final MongoTemplate mongoTemplate;
    private final UserRepo userRepo;

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

        // 3-8. Build entity
        AnnotationsEntity entity = AnnotationsEntity.builder()
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
                .replyCount(0)
                .build();

        // 7. buildAudit — isActive=true, isTrash=false, createdBy/At
        buildAudit(entity, true);

        // 8. Luu document
        AnnotationsEntity saved = annotationsRepo.save(entity);

        // 9. TODO: gui notification cho userMentions
        // if (dto.getCommentBody() != null && dto.getCommentBody().getUserMentions() != null) {
        //     // TODO: gui notification
        // }

        // Broadcast realtime SSE event to all reviewers on this asset (after transaction commit)
        String actorId = auditService.getCurrentUserId();
        AnnotationSseEventDTO createdEvent = AnnotationSseEventDTO.builder()
                .eventType("CREATED")
                .assetId(saved.getAssetId())
                .annotationId(saved.getAnnotationId())
                .actorId(actorId)
                .authorName(resolveAuthorName(actorId))
                .annotation(saved)
                .build();
        publishSseAfterCommit(saved.getAssetId(), createdEvent);

        // 10. Tra ve — enrich authorName so the REST response includes the display name
        enrichWithAuthorName(saved);
        return saved;
    }

    private AnnotationsEntity createReply(AnnotationCreateDTO dto, String parentCommentId) {
        // 1. Xac thuc parentCommentId ton tai
        AnnotationsEntity parentAnnotation = getActiveAnnotationOrThrow(parentCommentId);

        // 2. Lay threadRootId tu annotation cha
        String threadRootId = parentAnnotation.getThreadRootId() == null ? parentAnnotation.getAnnotationId() : parentAnnotation.getThreadRootId();

        // 3. Kiem tra annotation cha khong bi ARCHIVED
        if (parentAnnotation.getStatus() == AnnotationStatus.ARCHIVED) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Cannot reply to an archived comment");
        }

        // 5-9. Build entity — ke thua assetId, versionNumber tu annotation cha
        AnnotationsEntity entity = AnnotationsEntity.builder()
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

        // 10. Tang replyCount cua root comment len 1 (atomic), lay gia tri moi de gui SSE
        AnnotationsEntity updatedRoot = mongoTemplate.findAndModify(
                Query.query(Criteria.where("_id").is(threadRootId)),
                new Update().inc("replyCount", 1),
                FindAndModifyOptions.options().returnNew(true),
                AnnotationsEntity.class
        );

        // 11. TODO: gui notification cho userMentions
        // if (dto.getCommentBody() != null && dto.getCommentBody().getUserMentions() != null) {
        //     // TODO: gui notification
        // }

        // 12. TODO: gui notification cho authorId cua root comment
        // notify parentAnnotation root author about new reply

        // Broadcast realtime SSE event — dinh kem replyCount chinh xac tu DB (after transaction commit)
        String replyActorId = auditService.getCurrentUserId();
        AnnotationSseEventDTO replyCreatedEvent = AnnotationSseEventDTO.builder()
                .eventType("CREATED")
                .assetId(saved.getAssetId())
                .annotationId(saved.getAnnotationId())
                .actorId(replyActorId)
                .authorName(resolveAuthorName(replyActorId))
                .annotation(saved)
                .replyCount(updatedRoot != null ? updatedRoot.getReplyCount() : null)
                .threadRootId(threadRootId)
                .build();
        publishSseAfterCommit(saved.getAssetId(), replyCreatedEvent);

        // 13. Tra ve — enrich authorName so the REST response includes the display name
        enrichWithAuthorName(saved);
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
        AnnotationsEntity edited = annotationsRepo.save(entity);

        AnnotationSseEventDTO updatedEvent = AnnotationSseEventDTO.builder()
                .eventType("UPDATED")
                .assetId(edited.getAssetId())
                .annotationId(edited.getAnnotationId())
                .actorId(currentUserId)
                .annotation(edited)
                .build();
        publishSseAfterCommit(edited.getAssetId(), updatedEvent);

        return edited;
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
        AnnotationsEntity resolved = annotationsRepo.save(entity);

        AnnotationSseEventDTO resolvedEvent = AnnotationSseEventDTO.builder()
                .eventType("RESOLVED")
                .assetId(resolved.getAssetId())
                .annotationId(resolved.getAnnotationId())
                .actorId(auditService.getCurrentUserId())
                .annotation(resolved)
                .build();
        publishSseAfterCommit(resolved.getAssetId(), resolvedEvent);

        return resolved;
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
        AnnotationsEntity reopened = annotationsRepo.save(entity);

        AnnotationSseEventDTO reopenedEvent = AnnotationSseEventDTO.builder()
                .eventType("REOPENED")
                .assetId(reopened.getAssetId())
                .annotationId(reopened.getAnnotationId())
                .actorId(auditService.getCurrentUserId())
                .annotation(reopened)
                .build();
        publishSseAfterCommit(reopened.getAssetId(), reopenedEvent);

        return reopened;
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

        // Capture identifiers before soft-delete for SSE event
        String deletedAssetId = entity.getAssetId();
        String deletedAnnotationId = entity.getAnnotationId();
        String replyThreadRootId = null;
        Integer updatedReplyCount = null;

        if (entity.getParentCommentId() != null) {
            // 4. Neu la reply: soft delete chi reply do
            replyThreadRootId = entity.getThreadRootId();
            softDeleteAudit(entity);
            annotationsRepo.save(entity);

            // Giam replyCount cua root comment di 1 (atomic), lay gia tri moi de gui SSE
            AnnotationsEntity updatedRoot = mongoTemplate.findAndModify(
                    Query.query(Criteria.where("_id").is(replyThreadRootId)),
                    new Update().inc("replyCount", -1),
                    FindAndModifyOptions.options().returnNew(true),
                    AnnotationsEntity.class
            );
            updatedReplyCount = updatedRoot != null ? updatedRoot.getReplyCount() : null;
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

        AnnotationSseEventDTO deletedEvent = AnnotationSseEventDTO.builder()
                .eventType("DELETED")
                .assetId(deletedAssetId)
                .annotationId(deletedAnnotationId)
                .actorId(currentUserId)
                .annotation(null)
                .replyCount(updatedReplyCount)
                .threadRootId(replyThreadRootId)
                .build();
        publishSseAfterCommit(deletedAssetId, deletedEvent);

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
        List<AnnotationsEntity> results;
        if (status != null) {
            results = annotationsRepo.findByAssetIdAndVersionNumberAndParentCommentIdIsNullAndIsActiveTrueAndStatus(
                    assetId.trim(), versionNumber, status, SORT_BY_CREATED_AT_ASC);
        } else {
            results = annotationsRepo.findByAssetIdAndVersionNumberAndParentCommentIdIsNullAndIsActiveTrue(
                    assetId.trim(), versionNumber, SORT_BY_CREATED_AT_ASC);
        }
        return enrichWithAuthorNames(results);
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
        return enrichWithAuthorNames(annotationsRepo.findByThreadRootIdAndParentCommentIdIsNotNullAndIsActiveTrue(
                threadRootId.trim(), SORT_BY_CREATED_AT_ASC));
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
    //  3.11. Dem so luong root comments theo trang thai
    // ================================================================
    @Override
    public AnnotationCountsDTO getCounts(String assetId, Integer versionNumber) {
        if (StringUtils.isNullOrBlank(assetId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "assetId is required");
        }
        if (versionNumber == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "versionNumber is required");
        }
        long openCount = annotationsRepo
                .countByAssetIdAndVersionNumberAndParentCommentIdIsNullAndIsActiveTrueAndStatus(
                        assetId.trim(), versionNumber, AnnotationStatus.OPEN);
        long resolvedCount = annotationsRepo
                .countByAssetIdAndVersionNumberAndParentCommentIdIsNullAndIsActiveTrueAndStatus(
                        assetId.trim(), versionNumber, AnnotationStatus.RESOLVED);
        return AnnotationCountsDTO.builder()
                .openCount(openCount)
                .resolvedCount(resolvedCount)
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

    /** Resolve publicUserName from UserEntity; falls back to "Unknown" if not found. */
    private String resolveAuthorName(String userId) {
        if (userId == null) return "Unknown";
        return userRepo.findById(userId)
                .map(UserEntity::getPublicUserName)
                .orElse("Unknown");
    }

    /** Set authorName on a single entity (single DB lookup). */
    private void enrichWithAuthorName(AnnotationsEntity entity) {
        if (entity != null) {
            entity.setAuthorName(resolveAuthorName(entity.getAuthorId()));
        }
    }

    /** Batch-resolve authorName for a list to avoid N+1 queries. */
    private List<AnnotationsEntity> enrichWithAuthorNames(List<AnnotationsEntity> entities) {
        if (entities == null || entities.isEmpty()) return entities;
        List<String> ids = entities.stream()
                .map(AnnotationsEntity::getAuthorId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        Map<String, String> nameMap = new HashMap<>();
        userRepo.findAllById(ids).forEach(u -> nameMap.put(u.getUserId(), u.getPublicUserName()));
        entities.forEach(e -> e.setAuthorName(
                e.getAuthorId() != null ? nameMap.getOrDefault(e.getAuthorId(), "Unknown") : "Unknown"
        ));
        return entities;
    }

    /**
     * Publish SSE event after the current transaction commits.
     * Falls back to immediate publish when no transaction is active.
     */
    private void publishSseAfterCommit(String assetId, AnnotationSseEventDTO eventDto) {
        log.info("[SSE] Queuing {} event assetId={} annotationId={}",
                eventDto.getEventType(), assetId, eventDto.getAnnotationId());
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    sseService.publishAnnotationEvent(assetId, eventDto);
                }
            });
        } else {
            sseService.publishAnnotationEvent(assetId, eventDto);
        }
    }
}
