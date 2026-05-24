package org.example.filesharing.entities.dtos.annotations;

import lombok.Data;
import org.example.filesharing.entities.models.annotation.ShapeInfo;
import org.example.filesharing.entities.models.annotation.AnnotationTimeCode;
import org.example.filesharing.enums.AnnotationStatus;
import org.example.filesharing.enums.AnnotationType;

@Data
public class AnnotationsCreateUpdateDTO {
    private String annotationId;
    private String assetId;
    private Integer versionNumber;
    private AnnotationType annotationType;

    // video
    private AnnotationTimeCode timeCode;
    private Integer frameNumber;
    // image
    private ShapeInfo region;

    private AnnotationStatus status;
    private String threadId;
}
