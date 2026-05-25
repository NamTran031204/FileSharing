package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.CommonResponse;
import org.example.filesharing.entities.dtos.review.ReviewSessionCreateDTO;
import org.example.filesharing.entities.dtos.review.ReviewSessionDecisionDTO;
import org.example.filesharing.entities.models.ReviewSessionEntity;
import org.example.filesharing.services.ReviewSessionService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api/review-session")
@RequiredArgsConstructor
public class ReviewSessionController {

    private final ReviewSessionService reviewSessionService;

    @PostMapping("/create")
    public CommonResponse<ReviewSessionEntity> createReviewSession(@RequestBody ReviewSessionCreateDTO dto) {
        return CommonResponse.success(reviewSessionService.createReviewSession(dto));
    }

    @PostMapping("/{reviewSessionId}/decision")
    public CommonResponse<ReviewSessionEntity> submitDecision(
            @PathVariable("reviewSessionId") String reviewSessionId,
            @RequestBody ReviewSessionDecisionDTO dto) {
        return CommonResponse.success(reviewSessionService.submitDecision(reviewSessionId, dto));
    }

    @GetMapping("/asset/{assetId}")
    public CommonResponse<List<ReviewSessionEntity>> getReviewSessionsByAsset(
            @PathVariable("assetId") String assetId,
            @RequestParam(value = "versionNumber", required = false) Integer versionNumber) {
        return CommonResponse.success(reviewSessionService.getReviewSessionsByAsset(assetId, versionNumber));
    }
}
