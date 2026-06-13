package org.example.filesharing.repositories;

import com.file.service.filesharing.core.entity.models.ProcessingJobEntity;
import com.file.service.filesharing.core.enums.ProcessingJobStatus;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProcessingJobRepo extends MongoRepository<ProcessingJobEntity, String> {
    List<ProcessingJobEntity> findAllByStatus(ProcessingJobStatus status);
}
