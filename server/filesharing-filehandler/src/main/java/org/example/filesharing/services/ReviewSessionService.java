package org.example.filesharing.services;

import org.example.filesharing.entities.dtos.review.ReviewSessionCreateDTO;
import org.example.filesharing.entities.dtos.review.ReviewSessionDecisionDTO;
import org.example.filesharing.entities.models.ReviewSessionEntity;

import java.util.List;

public interface ReviewSessionService {
    ReviewSessionEntity createReviewSession(ReviewSessionCreateDTO dto);

    ReviewSessionEntity submitDecision(String reviewSessionId, ReviewSessionDecisionDTO dto);

    List<ReviewSessionEntity> getReviewSessionsByAsset(String assetId, Integer versionNumber);
}
