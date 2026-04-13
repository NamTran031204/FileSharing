package org.example.filesharing.entities.models.core;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.example.filesharing.entities.models.AuditChanges;
import org.example.filesharing.entities.models.AuditRequestInfo;
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
public class AuditLogEntity {
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
    private String versionId;
    private String reviewSessionId;

    private AuditChanges changes;
    private AuditRequestInfo requestInfo;

    private Instant timestamp;
    private Instant expiresAt;
}