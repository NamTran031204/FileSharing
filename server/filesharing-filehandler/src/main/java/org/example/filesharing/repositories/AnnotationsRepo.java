package org.example.filesharing.repositories;

import com.file.service.filesharing.core.entity.models.AnnotationsEntity;
import com.file.service.filesharing.core.enums.AnnotationStatus;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AnnotationsRepo extends MongoRepository<AnnotationsEntity, String> {

    Optional<AnnotationsEntity> findByAnnotationIdAndIsActiveTrue(String annotationId);

    // root comments cua asset/version
    List<AnnotationsEntity> findByAssetIdAndVersionNumberAndParentCommentIdIsNullAndIsActiveTrue(
            String assetId, Integer versionNumber, Sort sort);

    // root comments cua asset/version voi status
    List<AnnotationsEntity> findByAssetIdAndVersionNumberAndParentCommentIdIsNullAndIsActiveTrueAndStatus(
            String assetId, Integer versionNumber, AnnotationStatus status, Sort sort);

    // replies theo threadRootId
    List<AnnotationsEntity> findByThreadRootIdAndParentCommentIdIsNotNullAndIsActiveTrue(
            String threadRootId, Sort sort);

    // tat ca replies cung threadRootId (cho bulk update/delete)
    List<AnnotationsEntity> findByThreadRootIdAndParentCommentIdIsNotNullAndIsActiveTrue(String threadRootId);

    // root comments cua asset (khong loc version)
    List<AnnotationsEntity> findByAssetIdAndParentCommentIdIsNullAndIsActiveTrue(String assetId);

    // tat ca annotation cua asset/version (ca root va reply)
    List<AnnotationsEntity> findByAssetIdAndVersionNumberAndIsActiveTrue(String assetId, Integer versionNumber);

    // tat ca annotation cua asset (khong loc version)
    List<AnnotationsEntity> findByAssetIdAndIsActiveTrue(String assetId);

    // dem root comments theo status (khong load documents vao memory)
    long countByAssetIdAndVersionNumberAndParentCommentIdIsNullAndIsActiveTrueAndStatus(
            String assetId, Integer versionNumber, AnnotationStatus status);
}
