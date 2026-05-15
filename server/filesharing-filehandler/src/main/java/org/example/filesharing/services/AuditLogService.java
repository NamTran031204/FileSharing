package org.example.filesharing.services;

import org.example.filesharing.entities.dtos.auditlog.AuditLogCreateDTO;
import org.example.filesharing.entities.models.AuditLogEntity;

public interface AuditLogService {
    AuditLogEntity createAuditLog(AuditLogCreateDTO dto);
}
