package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.CommonResponse;
import org.example.filesharing.entities.dtos.processing.ProcessingStatusResponseDto;
import org.example.filesharing.services.ProcessingService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/processing")
@RequiredArgsConstructor
public class ProcessingController {

    private final ProcessingService processingService;

    @GetMapping("/version/{versionId}")
    public CommonResponse<ProcessingStatusResponseDto> getProcessingStatus(@PathVariable("versionId") String versionId) {
        return CommonResponse.success(processingService.getProcessingStatus(versionId));
    }
}
