package org.example.filesharing.entities.dtos.processing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.entities.models.processing.ProcessingJobProgress;
import org.example.filesharing.enums.ProcessingJobStatus;
import org.example.filesharing.enums.ProcessingStatus;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessingStatusResponseDto {
    private Integer versionNumber;
    private ProcessingStatus processingStatus;
    private ProcessingJobStatus jobStatus;
    private ProcessingJobProgress progress;
    private String errorMessage;
}
