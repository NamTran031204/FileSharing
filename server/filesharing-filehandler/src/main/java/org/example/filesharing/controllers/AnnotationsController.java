package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.CommonResponse;
import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.annotations.AnnotationsCreateUpdateDTO;
import org.example.filesharing.entities.dtos.annotations.AnnotationsFilterDTO;
import org.example.filesharing.entities.models.AnnotationsEntity;
import org.example.filesharing.services.AnnotationsService;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RequestMapping("api/annotations")
@RestController
public class AnnotationsController {

    private final AnnotationsService annotationsService;

    @PostMapping("/create-new")
    public CommonResponse<AnnotationsEntity> createNewAnnotation(@RequestBody AnnotationsCreateUpdateDTO dto) {
        return CommonResponse.success(annotationsService.createNewAnnotation(dto));
    }

    @PostMapping("/update-detail")
    public CommonResponse<AnnotationsEntity> updateAnnotationDetail(@RequestBody AnnotationsCreateUpdateDTO dto) {
        return CommonResponse.success(annotationsService.updateAnnotationDetail(dto));
    }

    @PostMapping("/get-page")
    public CommonResponse<PageResult<AnnotationsEntity>> getAnnotationPage(
            @RequestBody PageRequestDto<AnnotationsFilterDTO> dto) {
        return CommonResponse.success(annotationsService.getAnnotationPage(dto));
    }

    @GetMapping("/get-by-id/{annotationId}")
    public CommonResponse<AnnotationsEntity> getAnnotationById(@PathVariable("annotationId") String annotationId) {
        return CommonResponse.success(annotationsService.getAnnotationById(annotationId));
    }

    @PostMapping("/delete/{annotationId}")
    public CommonResponse<String> deleteAnnotation(@PathVariable("annotationId") String annotationId) {
        return CommonResponse.success(annotationsService.deleteAnnotation(annotationId));
    }
}
