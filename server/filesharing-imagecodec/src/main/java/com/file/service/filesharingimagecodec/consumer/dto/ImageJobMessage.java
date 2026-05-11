package com.file.service.filesharingimagecodec.consumer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImageJobMessage {
    private String jobId;
    private String inputKey;
    private String outputPrefix;
    private int thumbnailWidth;
    private int quality;
    private Instant submittedAt;
}
