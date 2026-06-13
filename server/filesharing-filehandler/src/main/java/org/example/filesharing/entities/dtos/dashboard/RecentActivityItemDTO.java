package org.example.filesharing.entities.dtos.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.file.service.filesharing.core.enums.AuditAction;
import com.file.service.filesharing.core.enums.AuditTargetType;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentActivityItemDTO {
    private String logId;
    private String actorId;
    private String actorEmail;
    private AuditAction action;
    private AuditTargetType targetType;
    private String targetId;
    private String targetName;
    private String assetId;
    private String projectId;
    private Instant timestamp;
}
