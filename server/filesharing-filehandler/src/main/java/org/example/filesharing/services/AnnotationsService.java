package org.example.filesharing.services;

import org.example.filesharing.entities.dtos.annotations.*;
import com.file.service.filesharing.core.entity.models.AnnotationsEntity;
import com.file.service.filesharing.core.enums.AnnotationStatus;

import java.util.List;

public interface AnnotationsService {

    AnnotationsEntity createAnnotation(AnnotationCreateDTO dto);

    AnnotationsEntity editAnnotation(AnnotationEditDTO dto);

    AnnotationsEntity resolveAnnotation(AnnotationIdDTO dto);

    AnnotationsEntity reopenAnnotation(AnnotationIdDTO dto);

    String archiveAnnotation(AnnotationIdDTO dto);

    String deleteAnnotation(AnnotationIdDTO dto);

    List<AnnotationsEntity> listByAsset(String assetId, Integer versionNumber, AnnotationStatus status);

    List<AnnotationsEntity> listReplies(String threadRootId);

    AnnotationsEntity getById(String annotationId);

    AnnotationSummaryResponse getSummary(String assetId, Integer versionNumber);

    AnnotationCountsDTO getCounts(String assetId, Integer versionNumber);
}
