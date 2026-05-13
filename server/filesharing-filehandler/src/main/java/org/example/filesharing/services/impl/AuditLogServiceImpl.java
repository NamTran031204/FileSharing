package org.example.filesharing.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.dtos.auditlog.AuditLogCreateDTO;
import org.example.filesharing.entities.models.AuditChanges;
import org.example.filesharing.entities.models.core.AuditLogEntity;
import org.example.filesharing.entities.models.core.UserEntity;
import org.example.filesharing.enums.AuditAction;
import org.example.filesharing.enums.AuditActorType;
import org.example.filesharing.exceptions.ErrorCode;
import org.example.filesharing.exceptions.specException.UserBusinessException;
import org.example.filesharing.repositories.AuditLogRepo;
import org.example.filesharing.services.AuditLogService;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.utils.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

import static org.example.filesharing.utils.StringUtils.trimToNull;

@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private final AuditLogRepo auditLogRepo;
    private final AuditService auditService;

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
                .changes(dto.getChanges())
                .requestInfo(dto.getRequestInfo())
                .timestamp(dto.getTimestamp() != null ? dto.getTimestamp() : Instant.now())
                .expiresAt(dto.getExpiresAt())
                .build();

        applyAuditMetadata(entity, actor);
        return auditLogRepo.save(entity);
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
