package org.example.filesharing.repositories;

import com.file.service.filesharing.core.entity.models.UploadSessionEntity;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface UploadSessionRepo extends MongoRepository<UploadSessionEntity, String> {
}
