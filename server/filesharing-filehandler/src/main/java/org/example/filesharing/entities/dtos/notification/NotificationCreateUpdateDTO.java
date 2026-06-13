package org.example.filesharing.entities.dtos.notification;

import lombok.Data;
import com.file.service.filesharing.core.entity.models.notification.NotificationContext;
import com.file.service.filesharing.core.entity.models.notification.NotificationDelivery;
import com.file.service.filesharing.core.enums.NotificationType;

import java.time.Instant;

@Data
public class NotificationCreateUpdateDTO {
    private String notificationId;
    private String userId;
    private NotificationType type;
    private String title;
    private String message;
    private String link;
    private NotificationContext context;
    private Boolean isRead;
    private NotificationDelivery deliveryStatus;
    private Instant expiresAt;
}
