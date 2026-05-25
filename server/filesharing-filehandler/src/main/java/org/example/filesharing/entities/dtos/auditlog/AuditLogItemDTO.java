package org.example.filesharing.entities.dtos.auditlog;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogItemDTO {
    private String iconType;
    private String action;
    private String detail;
    private String timeAgo;
    private String actorName;
}
