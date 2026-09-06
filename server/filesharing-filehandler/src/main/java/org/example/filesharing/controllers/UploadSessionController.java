package org.example.filesharing.controllers;

import com.file.service.filesharing.core.entity.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.dtos.upload.AbortUploadSessionResponseDto;
import org.example.filesharing.entities.dtos.upload.CompleteUploadSessionRequestDto;
import org.example.filesharing.entities.dtos.upload.PartUrlBatchRequestDto;
import org.example.filesharing.entities.dtos.upload.PartUrlBatchResponseDto;
import org.example.filesharing.entities.dtos.upload.UploadResourceResponseDto;
import org.example.filesharing.entities.dtos.upload.UploadSessionStatusResponseDto;
import org.example.filesharing.services.UploadSessionService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/uploads")
@RequiredArgsConstructor
public class UploadSessionController {

    private final UploadSessionService uploadSessionService;

    @PostMapping("/{sessionId}/part-urls")
    public CommonResponse<PartUrlBatchResponseDto> issuePartUrls(@PathVariable("sessionId") String sessionId,
                                                                   @RequestBody PartUrlBatchRequestDto request) {
        return CommonResponse.success(uploadSessionService.issuePartUrls(sessionId, request.getPartNumbers()));
    }

    @GetMapping("/{sessionId}")
    public CommonResponse<UploadSessionStatusResponseDto> getStatus(@PathVariable("sessionId") String sessionId) {
        return CommonResponse.success(uploadSessionService.getStatus(sessionId));
    }

    @PostMapping("/{sessionId}/complete")
    public CommonResponse<UploadResourceResponseDto> complete(@PathVariable("sessionId") String sessionId,
                                                                @RequestBody CompleteUploadSessionRequestDto request) {
        return CommonResponse.success(uploadSessionService.complete(sessionId, request.getParts()));
    }

    @DeleteMapping("/{sessionId}")
    public CommonResponse<AbortUploadSessionResponseDto> abort(@PathVariable("sessionId") String sessionId) {
        return CommonResponse.success(uploadSessionService.abort(sessionId));
    }
}
