package org.example.filesharing.entities.models;

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