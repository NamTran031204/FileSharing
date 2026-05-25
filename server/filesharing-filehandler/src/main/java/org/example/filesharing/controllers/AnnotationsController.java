package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.CommonResponse;
import org.example.filesharing.entities.dtos.annotations.*;
import org.example.filesharing.entities.models.AnnotationsEntity;
import org.example.filesharing.enums.AnnotationStatus;
import org.example.filesharing.services.AnnotationsService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequiredArgsConstructor
@RequestMapping("api/annotation")
@RestController
public class AnnotationsController {

    private final AnnotationsService annotationsService;

    @PostMapping("/create")
    public CommonResponse<AnnotationsEntity> createAnnotation(@RequestBody AnnotationCreateDTO dto) {
        return CommonResponse.success(annotationsService.createAnnotation(dto));
    }

    @PostMapping("/edit")
    public CommonResponse<AnnotationsEntity> editAnnotation(@RequestBody AnnotationEditDTO dto) {
        return CommonResponse.success(annotationsService.editAnnotation(dto));
    }

    @PostMapping("/resolve")
    public CommonResponse<AnnotationsEntity> resolveAnnotation(@RequestBody AnnotationIdDTO dto) {
        return CommonResponse.success(annotationsService.resolveAnnotation(dto));
    }

    @PostMapping("/reopen")
    public CommonResponse<AnnotationsEntity> reopenAnnotation(@RequestBody AnnotationIdDTO dto) {
        return CommonResponse.success(annotationsService.reopenAnnotation(dto));
    }

    @PostMapping("/delete")
    public CommonResponse<String> deleteAnnotation(@RequestBody AnnotationIdDTO dto) {
        return CommonResponse.success(annotationsService.deleteAnnotation(dto));
    }

    @GetMapping("/list-root-comment-by-asset")
    public CommonResponse<List<AnnotationsEntity>> listByAsset(
            @RequestParam("assetId") String assetId,
            @RequestParam("versionNumber") Integer versionNumber,
            @RequestParam(value = "status", required = false) AnnotationStatus status) {
        return CommonResponse.success(annotationsService.listByAsset(assetId, versionNumber, status));
    }

    @GetMapping("/list-replies")
    public CommonResponse<List<AnnotationsEntity>> listReplies(
            @RequestParam("threadRootId") String threadRootId) {
        return CommonResponse.success(annotationsService.listReplies(threadRootId));
    }

    @GetMapping("/get-by-id")
    public CommonResponse<AnnotationsEntity> getById(
            @RequestParam("annotationId") String annotationId) {
        return CommonResponse.success(annotationsService.getById(annotationId));
    }

    @GetMapping("/summary")
    public CommonResponse<AnnotationSummaryResponse> getSummary(
            @RequestParam("assetId") String assetId,
            @RequestParam(value = "versionNumber", required = false) Integer versionNumber) {
        return CommonResponse.success(annotationsService.getSummary(assetId, versionNumber));
    }
}
