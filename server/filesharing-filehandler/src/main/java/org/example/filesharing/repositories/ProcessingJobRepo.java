package org.example.filesharing.repositories;

import org.example.filesharing.entities.models.core.ProcessingJobEntity;
import org.example.filesharing.enums.ProcessingJobStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProcessingJobRepo extends MongoRepository<ProcessingJobEntity, String> {
    List<ProcessingJobEntity> findAllByStatus(ProcessingJobStatus status);
}
