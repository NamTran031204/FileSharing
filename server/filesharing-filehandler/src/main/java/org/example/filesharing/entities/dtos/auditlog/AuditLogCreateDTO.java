package org.example.filesharing.entities.dtos.auditlog;

import lombok.Data;
import org.example.filesharing.entities.models.AuditChanges;
import org.example.filesharing.entities.models.AuditRequestInfo;
import org.example.filesharing.enums.AuditAction;
import org.example.filesharing.enums.AuditActorType;
import org.example.filesharing.enums.AuditTargetType;

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
    private String versionId;
    private String reviewSessionId;

    private AuditChanges changes;
    private AuditRequestInfo requestInfo;

    private Instant timestamp;
    private Instant expiresAt;
}
