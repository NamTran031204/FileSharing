package org.example.filesharing.repositories;

import com.file.service.filesharing.core.entity.models.AuditLogEntity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AuditLogRepo extends MongoRepository<AuditLogEntity, String> {
    Optional<AuditLogEntity> findByLogIdAndIsActiveTrue(String logId);
}
