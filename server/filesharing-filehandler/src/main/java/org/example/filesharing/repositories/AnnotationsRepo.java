package org.example.filesharing.repositories;

import org.example.filesharing.entities.models.core.AnnotationsEntity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AnnotationsRepo extends MongoRepository<AnnotationsEntity, String> {
    Optional<AnnotationsEntity> findByAnnotationIdAndIsActiveTrue(String annotationId);
}
