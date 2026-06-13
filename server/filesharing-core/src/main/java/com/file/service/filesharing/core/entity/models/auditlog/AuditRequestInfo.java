package com.file.service.filesharing.core.entity.models.auditlog;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditRequestInfo {
    private String ipAddress;
    private String userAgent;
    private String requestId;
}