package org.example.filesharing.repositories;

import com.file.service.filesharing.core.entity.models.MetadataEntity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface MetadataRepo extends MongoRepository<MetadataEntity, String> {
    Optional<MetadataEntity> findByFileNameAndUploadId(String fileName, String uploadId);

    Optional<MetadataEntity> findByObjectNameAndUploadId(String objectName, String uploadId);

    Optional<MetadataEntity> findByObjectName(String objectName);

    boolean existsByObjectName(String objectName);

    Optional<MetadataEntity> findByShareToken(String shareToken);

    List<MetadataEntity> findByAssetId(String assetId);

    List<MetadataEntity> findByAssetIdIn(List<String> assetIds);

    Optional<MetadataEntity> findFirstByAssetIdOrderByVersionNumberAsc(String assetId);

    long countByAssetIdAndIsTrashFalse(String assetId);

    Optional<MetadataEntity> findByAssetIdAndVersionNumber(String assetId, Integer versionNumber);
}
