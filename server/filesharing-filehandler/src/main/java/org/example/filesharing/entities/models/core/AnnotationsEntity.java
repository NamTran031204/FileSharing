package org.example.filesharing.entities.models.core;

import lombok.*;
import org.example.filesharing.enums.AnnotationStatus;
import org.example.filesharing.enums.AnnotationType;
import org.example.filesharing.enums.Shape;
import org.springframework.data.annotation.Id;
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

    private TimeCode timeCode;

    private Region region;

    private Integer frameNumber;

    private AnnotationStatus status;

    private Instant resolveAt;

    private String resolveBy; // user

    private String threadId;

    private String createdBy;
    private String createdByEmail;

    private Instant createdAt;
    private String updatedAt;


    @Data
    static class TimeCode {
        private Integer startMs;
        private Integer endMs;
    }

    @Data
    static class Region {
        private Shape shape;
        private Point point;
        private String strokeColor;
        private String strokeWidth;
        private String fillColor;
    }

    @Data
    static class Point {
        private Double x;
        private Double y;
    }

}
