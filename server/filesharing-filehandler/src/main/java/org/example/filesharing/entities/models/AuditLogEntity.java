package org.example.filesharing.entities.models;

import lombok.*;
import org.example.filesharing.entities.models.auditlog.AuditChanges;
import org.example.filesharing.entities.models.auditlog.AuditRequestInfo;
import org.example.filesharing.entities.models.base.EntityAuditBase;
import org.example.filesharing.enums.AuditAction;
import org.example.filesharing.enums.AuditActorType;
import org.example.filesharing.enums.AuditTargetType;
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
    private String projectId;

    private AuditChanges changes;
    private AuditRequestInfo requestInfo;

    private Instant timestamp;
    private Instant expiresAt;
}