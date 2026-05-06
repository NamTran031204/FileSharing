package com.file.service.filesharingimagecodec.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessingJobConfig {
    private List<String> profiles;
    private Integer intervalSeconds;
    private Integer maxThumbnails;
    private String scanEngine;
}