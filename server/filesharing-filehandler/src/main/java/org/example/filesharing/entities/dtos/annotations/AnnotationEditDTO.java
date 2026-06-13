package org.example.filesharing.entities.dtos.annotations;

import lombok.Data;
import com.file.service.filesharing.core.entity.models.annotation.AnnotationBody;
import com.file.service.filesharing.core.entity.models.annotation.ShapeInfo;

import java.util.List;

@Data
public class AnnotationEditDTO {
    private String annotationId;
    private AnnotationBody commentBody;
    private List<ShapeInfo> region;
}
