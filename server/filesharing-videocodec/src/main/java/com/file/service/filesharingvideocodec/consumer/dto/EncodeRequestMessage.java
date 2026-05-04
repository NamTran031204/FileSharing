package com.file.service.filesharingvideocodec.consumer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EncodeRequestMessage {
    private String jobId;
    private String inputKey;
    private String callbackUrl;
    private Instant submittedAt;
}
