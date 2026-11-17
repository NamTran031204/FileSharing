package org.example.filesharing.entities.dtos.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

// whitelist metadata ky thuat cua job: khong objectName/metadataId/assetId va khong lien ket nguoi dung
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminNodeRunningJobDto {
    private String jobId;
    private String jobType;
    private Integer percent;
    private String currentStep;
    private Instant startedAt;
}
