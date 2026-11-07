package com.file.service.filesharing.core.job.relay;

import com.file.service.filesharing.core.enums.ProcessingJobType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

/** Ket qua cuoi cua 1 job, gui len job_result_topic. Khong mang presigned URL hay credential. */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobResultMessage {
    private String jobId;
    private String attemptId;
    private ProcessingJobType jobType;
    private String metadataId;
    private String assetId;
    private JobResultStatus status;
    private List<String> outputKeys;
    private String manifestKey;
    private String thumbnailUrl;
    private String errorMessage;
    private Instant finishedAt;
}
