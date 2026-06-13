package org.example.filesharing.entities.dtos.annotations;

import lombok.Data;
import com.file.service.filesharing.core.enums.AnnotationStatus;
import com.file.service.filesharing.core.enums.AnnotationType;

import java.time.Instant;

@Data
public class AnnotationsFilterDTO {
    private String assetId;
    private Integer versionNumber;
    private String threadId;
    private AnnotationType annotationType;
    private AnnotationStatus status;
    private String createdBy;
    private String createdByEmail;
    private Integer frameNumber;
    private Long fromStartMs;
    private Long toStartMs;
    private Instant fromCreatedAt;
    private Instant toCreatedAt;
}
