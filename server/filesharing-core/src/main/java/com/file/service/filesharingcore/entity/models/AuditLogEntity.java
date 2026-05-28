package com.file.service.filesharingcore.entity.models;

import com.file.service.filesharingcore.entity.models.auditlog.AuditChanges;
import com.file.service.filesharingcore.entity.models.auditlog.AuditRequestInfo;
import com.file.service.filesharingcore.entity.models.base.EntityAuditBase;
import com.file.service.filesharingcore.enums.AuditAction;
import com.file.service.filesharingcore.enums.AuditActorType;
import com.file.service.filesharingcore.enums.AuditTargetType;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class AuditLogEntity extends EntityAuditBase {
    @Id
    private String logId;

    private String actorId;
    private String actorEmail;
    private AuditActorType actorType;

    private AuditAction action;

    private AuditTargetType targetType;
    private String targetId;
    private String targetName;

    private String assetId;
    private Integer versionNumber;
    private String reviewSessionId;

    private AuditChanges changes;
    private AuditRequestInfo requestInfo;

    private Instant timestamp;
    private Instant expiresAt;
}