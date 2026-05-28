package com.file.service.filesharingcore.entity.models.processing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessingJobResult {
    private Boolean success;
    private List<String> outputKeys;
    private String errorMessage;
    private Map<String, Object> errorDetails;
}