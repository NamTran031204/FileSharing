package org.example.filesharing.entities.dtos.auditlog;

import lombok.Data;
import com.file.service.filesharing.core.entity.models.auditlog.AuditChanges;
import com.file.service.filesharing.core.entity.models.auditlog.AuditRequestInfo;
import com.file.service.filesharing.core.enums.AuditAction;
import com.file.service.filesharing.core.enums.AuditActorType;
import com.file.service.filesharing.core.enums.AuditTargetType;

import java.time.Instant;

@Data
public class AuditLogCreateDTO {
    private AuditAction action;
    private AuditTargetType targetType;
    private String targetId;
    private String targetName;

    private String actorId;
    private String actorEmail;
    private AuditActorType actorType;

    private String assetId;
    private Integer versionNumber;
    private String reviewSessionId;

    private AuditChanges changes;
    private AuditRequestInfo requestInfo;

    private Instant timestamp;
    private Instant expiresAt;
}
