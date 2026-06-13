package org.example.filesharing.entities.dtos.project;

import lombok.Builder;
import lombok.Data;
import com.file.service.filesharing.core.enums.permission.GrantedVisibility;

import java.time.Instant;

@Data
@Builder
public class ShareTokenInfoDTO {
    private String shareToken;
    private Instant shareExpiry;
    private String projectId;
    private String projectName;
    private GrantedVisibility visibility;
}
