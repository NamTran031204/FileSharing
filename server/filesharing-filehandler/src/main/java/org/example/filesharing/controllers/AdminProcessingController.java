package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.CommonResponse;
import org.example.filesharing.entities.models.ProcessingJobEntity;
import org.example.filesharing.services.ProcessingService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/admin/processing")
@RequiredArgsConstructor
public class AdminProcessingController {

    private final ProcessingService processingService;

    @GetMapping("/job/{jobId}")
    public CommonResponse<ProcessingJobEntity> getJob(@PathVariable("jobId") String jobId) {
        return CommonResponse.success(processingService.getJob(jobId));
    }

    @PostMapping("/job/cancel/{jobId}")
    public CommonResponse<ProcessingJobEntity> cancelJob(@PathVariable("jobId") String jobId) {
        return CommonResponse.success(processingService.cancelJob(jobId));
    }
}
