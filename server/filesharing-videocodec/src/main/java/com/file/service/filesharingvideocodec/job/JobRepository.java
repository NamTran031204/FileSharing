package com.file.service.filesharingvideocodec.job;

import com.file.service.filesharing.core.enums.ProcessingJobStatus;
import com.file.service.filesharing.core.entity.models.ProcessingJobEntity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobRepository extends MongoRepository<ProcessingJobEntity, String> {

    List<ProcessingJobEntity> findAllByStatus(ProcessingJobStatus status);
}
