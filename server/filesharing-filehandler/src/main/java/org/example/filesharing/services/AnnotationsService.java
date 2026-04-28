package org.example.filesharing.services;

import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.annotations.AnnotationsCreateUpdateDTO;
import org.example.filesharing.entities.dtos.annotations.AnnotationsFilterDTO;
import org.example.filesharing.entities.models.core.AnnotationsEntity;

public interface AnnotationsService {
    AnnotationsEntity createNewAnnotation(AnnotationsCreateUpdateDTO dto);

    AnnotationsEntity updateAnnotationDetail(AnnotationsCreateUpdateDTO dto);

    PageResult<AnnotationsEntity> getAnnotationPage(PageRequestDto<AnnotationsFilterDTO> dto);

    AnnotationsEntity getAnnotationById(String annotationId);

    String deleteAnnotation(String annotationId);
}
