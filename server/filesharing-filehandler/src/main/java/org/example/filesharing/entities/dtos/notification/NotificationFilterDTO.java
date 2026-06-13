package org.example.filesharing.entities.dtos.notification;

import lombok.Data;
import com.file.service.filesharing.core.enums.DeliveryStatus;
import com.file.service.filesharing.core.enums.NotificationType;

import java.time.Instant;

@Data
public class NotificationFilterDTO {
    private String userId;
    private NotificationType type;
    private Boolean isRead;
    private String keyword;
    private String assetId;
    private String actorId;
    private DeliveryStatus inAppStatus;
    private DeliveryStatus emailStatus;
    private Instant fromCreatedAt;
    private Instant toCreatedAt;
}
