package com.file.service.filesharing.core.job;

import java.util.List;

// attemptScope = null neu output dung khoa tat dinh theo objectName
public record JobExecution(List<OutputObject> outputs, String manifestKey, String thumbnailUrl,
                           AttemptScope attemptScope) {
    public static JobExecution empty() {
        return new JobExecution(List.of(), null, null, null);
    }
}
