package org.example.filesharing.entities.dtos.processing;

import lombok.Builder;
import lombok.Data;
import com.file.service.filesharing.core.enums.ProcessingJobStatus;
import com.file.service.filesharing.core.enums.ProcessingJobType;

import java.time.Instant;

@Data
@Builder
public class ProcessingJobCreateDTO {
    private String metadataId;
    private Integer versionNumber;
    private String assetId;

    private String objectName;

    private ProcessingJobType jobType;

    private ProcessingJobStatus status;
    private Integer priority;

}
