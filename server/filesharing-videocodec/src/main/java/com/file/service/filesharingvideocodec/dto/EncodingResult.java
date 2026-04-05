package com.file.service.filesharingvideocodec.dto;

import com.file.service.filesharingvideocodec.model.EncodingProfile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EncodingResult {
    private String jobId;
    private String presignedUrl;
    private Map<EncodingProfile, ProfileResult> profiles;
    private String status;
    private String errorMessage;
    private LocalDateTime timestamp;
    private Long totalDurationMs;
}
