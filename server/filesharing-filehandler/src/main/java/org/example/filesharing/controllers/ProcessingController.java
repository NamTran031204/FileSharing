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

    @GetMapping("/{assetId}/{versionNumber}")
    public CommonResponse<ProcessingStatusResponseDto> getProcessingStatus(@PathVariable("assetId") String assetId,
                                                                           @PathVariable("versionNumber") Integer versionNumber) {
        return CommonResponse.success(processingService.getProcessingStatus(assetId, versionNumber));
    }
}
