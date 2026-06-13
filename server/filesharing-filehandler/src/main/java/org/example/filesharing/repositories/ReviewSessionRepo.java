package org.example.filesharing.repositories;

import com.file.service.filesharing.core.entity.models.ReviewSessionEntity;
import com.file.service.filesharing.core.enums.ReviewSessionStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewSessionRepo extends MongoRepository<ReviewSessionEntity, String> {
    boolean existsByAssetIdAndVersionNumberAndStatusAndIsActiveTrue(
            String assetId,
            Integer versionNumber,
            ReviewSessionStatus status
    );

    List<ReviewSessionEntity> findByAssetIdAndIsActiveTrueOrderByCreatedAtDesc(String assetId);

    List<ReviewSessionEntity> findByAssetIdAndVersionNumberAndIsActiveTrueOrderByCreatedAtDesc(
            String assetId,
            Integer versionNumber
    );

    Optional<ReviewSessionEntity> findByReviewSessionIdAndIsActiveTrue(String reviewSessionId);
}
