package org.example.filesharing.entities.dtos.processing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.file.service.filesharing.core.entity.models.processing.ProcessingJobProgress;
import com.file.service.filesharing.core.enums.ProcessingJobStatus;
import com.file.service.filesharing.core.enums.ProcessingStatus;

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
