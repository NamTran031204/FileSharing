package com.file.service.filesharingvideocodec.kafka.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EncodeResultMessage {
    private String jobId;
    private String status;
    private String playlistKey;
    private List<String> outputKeys;
    private String errorMessage;
    private Instant startedAt;
    private Instant completedAt;
}
