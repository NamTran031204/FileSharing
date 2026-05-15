package org.example.filesharing.entities.models.annotation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.enums.Shape;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnnotationRegion {
    private Shape shape;
    private List<AnnotationPoint> points;
    private String strokeColor;
    private Integer strokeWidth;
    private String fillColor;
}