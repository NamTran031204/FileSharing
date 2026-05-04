package com.file.service.filesharingvideocodec.job;

import com.file.service.filesharingvideocodec.enums.ProcessingJobStatus;
import com.file.service.filesharingvideocodec.model.ProcessingJobEntity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobRepository extends MongoRepository<ProcessingJobEntity, String> {

    List<ProcessingJobEntity> findAllByStatus(ProcessingJobStatus status);
}
