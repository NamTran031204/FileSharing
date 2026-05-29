package org.example.filesharing.entities.dtos.annotations;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.entities.models.AnnotationsEntity;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnotationSseEventDTO {

    /** CREATED | UPDATED | RESOLVED | REOPENED | DELETED */
    private String eventType;

    /** assetId the annotation belongs to */
    private String assetId;

    /** annotationId affected by the event */
    private String annotationId;

    /** userId who performed the action (frontend can skip own events to avoid flicker) */
    private String actorId;

    /** Full annotation — null when eventType = DELETED */
    private AnnotationsEntity annotation;
}
