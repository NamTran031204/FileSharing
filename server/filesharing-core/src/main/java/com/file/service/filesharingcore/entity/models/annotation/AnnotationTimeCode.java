package com.file.service.filesharingcore.entity.models.annotation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnnotationTimeCode {
    private Long startMs;
    private Long endMs;
}