package org.example.filesharing.repositories;

import com.file.service.filesharing.core.entity.models.NotificationEntity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NotificationRepo extends MongoRepository<NotificationEntity, String> {
    Optional<NotificationEntity> findByNotificationIdAndIsActiveTrue(String notificationId);
}
