package org.example.filesharing.entities.dtos.auditlog;

import lombok.Data;
import org.example.filesharing.enums.AuditAction;

import java.time.Instant;

@Data
public class AuditLogFilterDTO {
    private String actorId;
    private String actorEmail;
    private AuditAction action;
    private Instant fromTimestamp;
    private Instant toTimestamp;
}
