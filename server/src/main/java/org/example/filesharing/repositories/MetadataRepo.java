package org.example.filesharing.repositories;

import org.example.filesharing.entities.models.MetadataEntity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MetadataRepo extends MongoRepository<MetadataEntity, String> {
    Optional<MetadataEntity> findByFileNameAndUploadId(String fileName, String uploadId);

    Optional<MetadataEntity> findByObjectNameAndUploadId(String objectName, String uploadId);

    Optional<MetadataEntity> findByObjectName(String objectName);

    boolean existsByObjectName(String objectName);
}
