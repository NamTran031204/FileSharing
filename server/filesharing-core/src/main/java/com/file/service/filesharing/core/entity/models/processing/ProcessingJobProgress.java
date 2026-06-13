package com.file.service.filesharing.core.entity.models.processing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessingJobProgress {
    private Integer percent;
    private String currentStep;
    private Long estimatedTimeRemainingMs;
}