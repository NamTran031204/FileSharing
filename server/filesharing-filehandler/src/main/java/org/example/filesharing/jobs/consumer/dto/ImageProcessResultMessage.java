package org.example.filesharing.jobs.consumer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImageProcessResultMessage {
    private String jobId;
    private String assetId;
    private String metadataId;
    private String objectName;
    private String status;        // READY | FAILED
    private String thumbnailUrl;
    private String errorMessage;
    private Instant completedAt;
}
