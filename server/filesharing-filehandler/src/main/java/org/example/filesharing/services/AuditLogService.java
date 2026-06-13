package org.example.filesharing.services;

import com.file.service.filesharing.core.entity.PageResult;
import org.example.filesharing.entities.dtos.auditlog.AuditLogCreateDTO;
import org.example.filesharing.entities.dtos.auditlog.AuditLogItemDTO;
import com.file.service.filesharing.core.entity.models.AuditLogEntity;

public interface AuditLogService {
    AuditLogEntity createAuditLog(AuditLogCreateDTO dto);

    PageResult<AuditLogItemDTO> getAssetAuditLog(String assetId, Integer versionNumber, Integer page, Integer size);
}
