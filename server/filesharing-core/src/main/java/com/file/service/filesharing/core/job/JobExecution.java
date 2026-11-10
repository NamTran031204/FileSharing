package com.file.service.filesharing.core.job;

import java.util.List;

// attemptScope = null neu output dung khoa tat dinh theo objectName.
// width/height: kich thuoc output chinh (anh/RAW), null neu khong co
public record JobExecution(List<OutputObject> outputs, String manifestKey, String thumbnailUrl,
                           AttemptScope attemptScope, Integer width, Integer height) {
    public JobExecution(List<OutputObject> outputs, String manifestKey, String thumbnailUrl, AttemptScope attemptScope) {
        this(outputs, manifestKey, thumbnailUrl, attemptScope, null, null);
    }

    public static JobExecution empty() {
        return new JobExecution(List.of(), null, null, null);
    }
}
