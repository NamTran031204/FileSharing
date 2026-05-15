package org.example.filesharing.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.notification.NotificationCreateUpdateDTO;
import org.example.filesharing.entities.dtos.notification.NotificationFilterDTO;
import org.example.filesharing.entities.models.notification.NotificationContext;
import org.example.filesharing.entities.models.notification.NotificationDelivery;
import org.example.filesharing.entities.models.NotificationEntity;
import org.example.filesharing.enums.DeliveryStatus;
import org.example.filesharing.exceptions.ErrorCode;
import org.example.filesharing.exceptions.specException.FileBusinessException;
import org.example.filesharing.exceptions.specException.UserBusinessException;
import org.example.filesharing.repositories.NotificationRepo;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.services.NotificationService;
import org.example.filesharing.services.baseService.BaseAuditService;
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
import java.util.regex.Pattern;

import static org.example.filesharing.utils.StringUtils.requireNormalized;
import static org.example.filesharing.utils.StringUtils.trimToNull;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl extends BaseAuditService<NotificationEntity> implements NotificationService {

    private final NotificationRepo notificationRepo;
    private final MongoTemplate mongoTemplate;
    private final AuditService auditService;

    @Override
    @Transactional
    public NotificationEntity createNewNotification(NotificationCreateUpdateDTO dto) {
        validateCreatePayload(dto);

        Instant now = Instant.now();

        NotificationEntity entity = NotificationEntity.builder()
                .userId(resolveTargetUserId(dto.getUserId()))
                .type(dto.getType())
                .title(requireNormalized(dto.getTitle(), "title is required"))
                .message(requireNormalized(dto.getMessage(), "message is required"))
                .link(trimToNull(dto.getLink()))
                .context(normalizeContext(dto.getContext()))
                .isRead(Boolean.TRUE.equals(dto.getIsRead()))
                .readAt(Boolean.TRUE.equals(dto.getIsRead()) ? now : null)
                .deliveryStatus(normalizeDeliveryStatus(dto.getDeliveryStatus()))
                .expiresAt(dto.getExpiresAt())
                .build();

        buildAudit(entity, true);
        return notificationRepo.save(entity);
    }

    @Override
    @Transactional
    public NotificationEntity updateNotificationDetail(NotificationCreateUpdateDTO dto) {
        validateUpdatePayload(dto);

        NotificationEntity entity = getActiveNotificationOrThrow(dto.getNotificationId().trim());
        ensureNotificationOwner(entity);

        if (StringUtils.isNotNullOrBlank(dto.getUserId()) && !dto.getUserId().trim().equals(entity.getUserId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "userId is immutable");
        }

        if (dto.getType() != null) {
            entity.setType(dto.getType());
        }

        if (dto.getTitle() != null) {
            entity.setTitle(requireNormalized(dto.getTitle(), "title cannot be blank"));
        }

        if (dto.getMessage() != null) {
            entity.setMessage(requireNormalized(dto.getMessage(), "message cannot be blank"));
        }

        if (dto.getLink() != null) {
            entity.setLink(trimToNull(dto.getLink()));
        }

        if (dto.getContext() != null) {
            entity.setContext(normalizeContext(dto.getContext()));
        }

        if (dto.getDeliveryStatus() != null) {
            entity.setDeliveryStatus(normalizeDeliveryStatus(dto.getDeliveryStatus()));
        }

        if (dto.getIsRead() != null) {
            boolean isRead = dto.getIsRead();
            entity.setIsRead(isRead);
            if (isRead) {
                entity.setReadAt(entity.getReadAt() != null ? entity.getReadAt() : Instant.now());
            } else {
                entity.setReadAt(null);
            }
        }

        if (dto.getExpiresAt() != null) {
            entity.setExpiresAt(dto.getExpiresAt());
        }

        buildAudit(entity, false);

        return notificationRepo.save(entity);
    }

    @Override
    public PageResult<NotificationEntity> getNotificationPage(PageRequestDto<NotificationFilterDTO> dto) {
        PageRequestDto<NotificationFilterDTO> pageRequest = dto != null ? dto : new PageRequestDto<>();
        NotificationFilterDTO filter = pageRequest.getFilter();

        Query query = new Query();
        query.addCriteria(Criteria.where("isActive").is(true));

        String targetUserId = resolveFilterUserId(filter);
        query.addCriteria(Criteria.where("userId").is(targetUserId));

        if (filter != null) {
            if (filter.getType() != null) {
                query.addCriteria(Criteria.where("type").is(filter.getType()));
            }

            if (filter.getIsRead() != null) {
                query.addCriteria(Criteria.where("isRead").is(filter.getIsRead()));
            }

            if (StringUtils.isNotNullOrBlank(filter.getAssetId())) {
                query.addCriteria(Criteria.where("context.assetId").is(filter.getAssetId().trim()));
            }

            if (StringUtils.isNotNullOrBlank(filter.getActorId())) {
                query.addCriteria(Criteria.where("context.actorId").is(filter.getActorId().trim()));
            }

            if (filter.getInAppStatus() != null) {
                query.addCriteria(Criteria.where("deliveryStatus.inApp").is(filter.getInAppStatus()));
            }

            if (filter.getEmailStatus() != null) {
                query.addCriteria(Criteria.where("deliveryStatus.email").is(filter.getEmailStatus()));
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

            if (StringUtils.isNotNullOrBlank(filter.getKeyword())) {
                String escapedKeyword = Pattern.quote(filter.getKeyword().trim());
                Criteria titleCriteria = Criteria.where("title").regex(escapedKeyword, "i");
                Criteria messageCriteria = Criteria.where("message").regex(escapedKeyword, "i");
                query.addCriteria(new Criteria().orOperator(titleCriteria, messageCriteria));
            }
        }

        long totalCount = mongoTemplate.count(query, NotificationEntity.class);

        int maxResultCount = pageRequest.getMaxResultCount() == null || pageRequest.getMaxResultCount() <= 0
                ? 10
                : pageRequest.getMaxResultCount();
        int skipCount = pageRequest.getSkipCount() == null || pageRequest.getSkipCount() < 0
                ? 0
                : pageRequest.getSkipCount();
        int pageIndex = skipCount / maxResultCount;

        Sort sort = parseSortFromRequest(pageRequest.getSorting());
        query.with(PageRequest.of(pageIndex, maxResultCount, sort));

        List<NotificationEntity> data = mongoTemplate.find(query, NotificationEntity.class);

        return PageResult.<NotificationEntity>builder()
                .totalCount(totalCount)
                .data(data)
                .build();
    }

    @Override
    public NotificationEntity getNotificationById(String notificationId) {
        if (StringUtils.isNullOrBlank(notificationId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "notificationId is required");
        }

        NotificationEntity entity = getActiveNotificationOrThrow(notificationId.trim());
        ensureNotificationOwner(entity);
        return entity;
    }

    @Override
    @Transactional
    public String deleteNotification(String notificationId) {
        if (StringUtils.isNullOrBlank(notificationId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "notificationId is required");
        }

        NotificationEntity entity = getActiveNotificationOrThrow(notificationId.trim());
        ensureNotificationOwner(entity);

        entity.setIsActive(false);
        notificationRepo.save(entity);

        return "Notification deleted successfully";
    }

    private void validateCreatePayload(NotificationCreateUpdateDTO dto) {
        if (dto == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Request body is required");
        }

        if (dto.getType() == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "type is required");
        }

        requireNormalized(dto.getTitle(), "title is required");
        requireNormalized(dto.getMessage(), "message is required");
    }

    private void validateUpdatePayload(NotificationCreateUpdateDTO dto) {
        if (dto == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Request body is required");
        }

        if (StringUtils.isNullOrBlank(dto.getNotificationId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "notificationId is required");
        }
    }

    private NotificationEntity getActiveNotificationOrThrow(String notificationId) {
        return notificationRepo.findByNotificationIdAndIsActiveTrue(notificationId)
                .orElseThrow(() -> new FileBusinessException(
                        ErrorCode.FILE_NOT_FOUND,
                        "Cannot find active notification with id: " + notificationId
                ));
    }

    private String resolveTargetUserId(String userIdInput) {
        if (StringUtils.isNotNullOrBlank(userIdInput)) {
            return userIdInput.trim();
        }
        return auditService.getCurrentUserId();
    }

    private String resolveFilterUserId(NotificationFilterDTO filter) {
        String currentUserId = auditService.getCurrentUserId();
        if (filter == null || StringUtils.isNullOrBlank(filter.getUserId())) {
            return currentUserId;
        }

        String inputUserId = filter.getUserId().trim();
        if (!currentUserId.equals(inputUserId)) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }

        return inputUserId;
    }

    private void ensureNotificationOwner(NotificationEntity entity) {
        String currentUserId = auditService.getCurrentUserId();
        if (!currentUserId.equals(entity.getUserId())) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }
    }

    private NotificationContext normalizeContext(NotificationContext context) {
        if (context == null) {
            return null;
        }

        return NotificationContext.builder()
                .assetId(trimToNull(context.getAssetId()))
                .assetName(trimToNull(context.getAssetName()))
                .versionNumber(context.getVersionNumber())
                .annotationId(trimToNull(context.getAnnotationId()))
                .commentId(trimToNull(context.getCommentId()))
                .reviewSessionId(trimToNull(context.getReviewSessionId()))
                .actorId(trimToNull(context.getActorId()))
                .actorName(trimToNull(context.getActorName()))
                .build();
    }

    private NotificationDelivery normalizeDeliveryStatus(NotificationDelivery input) {
        if (input == null) {
            return NotificationDelivery.builder()
                    .inApp(DeliveryStatus.PENDING)
                    .email(DeliveryStatus.PENDING)
                    .build();
        }

        DeliveryStatus inApp = input.getInApp() != null ? input.getInApp() : DeliveryStatus.PENDING;
        DeliveryStatus email = input.getEmail() != null ? input.getEmail() : DeliveryStatus.PENDING;

        return NotificationDelivery.builder()
                .inApp(inApp)
                .email(email)
                .build();
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
