package org.example.filesharing.entities.dtos.annotations;

import lombok.Data;
import com.file.service.filesharing.core.entity.models.annotation.ShapeInfo;
import com.file.service.filesharing.core.entity.models.annotation.AnnotationTimeCode;
import com.file.service.filesharing.core.enums.AnnotationStatus;
import com.file.service.filesharing.core.enums.AnnotationType;

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
