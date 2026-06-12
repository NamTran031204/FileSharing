package com.file.service.filesharingcore.entity.models;

import com.file.service.filesharingcore.entity.models.base.EntityAuditBase;
import com.file.service.filesharingcore.entity.models.notification.NotificationContext;
import com.file.service.filesharingcore.entity.models.notification.NotificationDelivery;
import com.file.service.filesharingcore.enums.NotificationType;
import lombok.*;
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