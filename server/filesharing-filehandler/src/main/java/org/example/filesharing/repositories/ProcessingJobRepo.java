package org.example.filesharing.repositories;

import com.file.service.filesharing.core.entity.models.ProcessingJobEntity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProcessingJobRepo extends MongoRepository<ProcessingJobEntity, String> {
    // jobId la ObjectId nen sort giam dan = job moi nhat
    Optional<ProcessingJobEntity> findFirstByMetadataIdOrderByJobIdDesc(String metadataId);
}
