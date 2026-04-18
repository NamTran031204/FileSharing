package org.example.filesharing.entities.dtos.annotations;

import lombok.Data;
import org.example.filesharing.enums.AnnotationStatus;
import org.example.filesharing.enums.AnnotationType;

import java.time.Instant;

@Data
public class AnnotationsFilterDTO {
    private String assetId;
    private String versionId;
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
