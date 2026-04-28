package org.example.filesharing.entities.models.core;

import lombok.*;
import org.example.filesharing.entities.models.AnnotationRegion;
import org.example.filesharing.entities.models.AnnotationTimeCode;
import org.example.filesharing.enums.AnnotationStatus;
import org.example.filesharing.enums.AnnotationType;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;


@Document(collection = "annotations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class AnnotationsEntity {

    @Id
    private String annotationId;

    private String assetId;

    private String versionId;

    private AnnotationType annotationType;

    private AnnotationTimeCode timeCode;

    private AnnotationRegion region;

    private Integer frameNumber;

    private AnnotationStatus status;

    private Instant resolvedAt;

    private String resolvedBy;

    private String threadId;

    private String createdBy;
    private String createdByEmail;
    private Boolean isActive;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

}
