package org.example.filesharing.entities.dtos.annotations;

import lombok.Data;
import org.example.filesharing.entities.models.annotation.AnnotationBody;
import org.example.filesharing.entities.models.annotation.ShapeInfo;

import java.util.List;

@Data
public class AnnotationEditDTO {
    private String annotationId;
    private AnnotationBody commentBody;
    private List<ShapeInfo> region;
}
