package org.example.filesharing.entities.models.annotation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnnotationTimeCode {
    private Double startMs;
    private Double endMs;
}