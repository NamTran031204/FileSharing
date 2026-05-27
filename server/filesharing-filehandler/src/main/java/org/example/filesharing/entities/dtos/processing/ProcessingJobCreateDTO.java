package org.example.filesharing.entities.dtos.processing;

import lombok.Builder;
import lombok.Data;
import org.example.filesharing.enums.ProcessingJobStatus;
import org.example.filesharing.enums.ProcessingJobType;

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
