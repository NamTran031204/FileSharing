package com.file.service.filesharing.core.entity.models.review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewMetrics {
    private Integer totalAnnotations;
    private Integer openAnnotations;
    private Integer resolvedAnnotations;
    private Integer totalComments;
}