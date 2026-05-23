package org.example.filesharing.repositories;

import org.example.filesharing.entities.models.MediaRenditionEntity;
import org.example.filesharing.enums.RenditionType;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MediaRenditionRepo extends MongoRepository<MediaRenditionEntity, String> {
    Optional<MediaRenditionEntity> findFirstByMetadataIdAndRenditionType(String metadataId, RenditionType renditionType);

    List<MediaRenditionEntity> findByMetadataId(String metadataId);

    long countByMetadataId(String metadataId);
}
