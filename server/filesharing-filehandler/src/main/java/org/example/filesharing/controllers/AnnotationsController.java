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

    // 3.1. Tao comment / reply
    @PostMapping("/create")
    public CommonResponse<AnnotationsEntity> createAnnotation(@RequestBody AnnotationCreateDTO dto) {
        return CommonResponse.success(annotationsService.createAnnotation(dto));
    }

    // 3.2. Sua noi dung comment
    @PostMapping("/edit")
    public CommonResponse<AnnotationsEntity> editAnnotation(@RequestBody AnnotationEditDTO dto) {
        return CommonResponse.success(annotationsService.editAnnotation(dto));
    }

    // 3.3. Resolve comment
    @PostMapping("/resolve")
    public CommonResponse<AnnotationsEntity> resolveAnnotation(@RequestBody AnnotationIdDTO dto) {
        return CommonResponse.success(annotationsService.resolveAnnotation(dto));
    }

    // 3.4. Reopen comment
    @PostMapping("/reopen")
    public CommonResponse<AnnotationsEntity> reopenAnnotation(@RequestBody AnnotationIdDTO dto) {
        return CommonResponse.success(annotationsService.reopenAnnotation(dto));
    }

    // 3.5. Archive comment
    @PostMapping("/archive")
    public CommonResponse<String> archiveAnnotation(@RequestBody AnnotationIdDTO dto) {
        return CommonResponse.success(annotationsService.archiveAnnotation(dto));
    }

    // 3.6. Xoa comment
    @PostMapping("/delete")
    public CommonResponse<String> deleteAnnotation(@RequestBody AnnotationIdDTO dto) {
        return CommonResponse.success(annotationsService.deleteAnnotation(dto));
    }

    // 3.7. Lay danh sach root comments cua asset/version
    @GetMapping("/list-by-asset")
    public CommonResponse<List<AnnotationsEntity>> listByAsset(
            @RequestParam("assetId") String assetId,
            @RequestParam("versionNumber") Integer versionNumber,
            @RequestParam(value = "status", required = false) AnnotationStatus status) {
        return CommonResponse.success(annotationsService.listByAsset(assetId, versionNumber, status));
    }

    // 3.8. Lay replies cua mot root comment
    @GetMapping("/list-replies")
    public CommonResponse<List<AnnotationsEntity>> listReplies(
            @RequestParam("threadRootId") String threadRootId) {
        return CommonResponse.success(annotationsService.listReplies(threadRootId));
    }

    // 3.9. Lay chi tiet mot annotation
    @GetMapping("/get-by-id")
    public CommonResponse<AnnotationsEntity> getById(
            @RequestParam("annotationId") String annotationId) {
        return CommonResponse.success(annotationsService.getById(annotationId));
    }

    // 3.10. Dashboard tong hop
    @GetMapping("/summary")
    public CommonResponse<AnnotationSummaryResponse> getSummary(
            @RequestParam("assetId") String assetId,
            @RequestParam(value = "versionNumber", required = false) Integer versionNumber) {
        return CommonResponse.success(annotationsService.getSummary(assetId, versionNumber));
    }
}
