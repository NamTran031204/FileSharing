package org.example.filesharing.entities.dtos.notification;

import lombok.Data;
import org.example.filesharing.entities.models.NotificationContext;
import org.example.filesharing.entities.models.NotificationDelivery;
import org.example.filesharing.enums.NotificationType;

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
