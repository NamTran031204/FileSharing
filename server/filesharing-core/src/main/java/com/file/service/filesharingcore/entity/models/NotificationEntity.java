package com.file.service.filesharingcore.entity.models;

import lombok.*;
import org.example.filesharing.entities.models.base.EntityAuditBase;
import org.example.filesharing.entities.models.notification.NotificationContext;
import org.example.filesharing.entities.models.notification.NotificationDelivery;
import org.example.filesharing.enums.NotificationType;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document(collection = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class NotificationEntity extends EntityAuditBase {
    @Id
    private String notificationId;

    private String userId;
    private NotificationType type;

    private String title;
    private String message;
    private String link;

    private NotificationContext context;

    private Boolean isRead;
    private Instant readAt;
    private NotificationDelivery deliveryStatus;

    private Instant expiresAt;
}