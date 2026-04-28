package org.example.filesharing.entities.models.core;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.example.filesharing.entities.models.NotificationContext;
import org.example.filesharing.entities.models.NotificationDelivery;
import org.example.filesharing.enums.NotificationType;
import org.springframework.data.annotation.CreatedDate;
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
public class NotificationEntity {
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
    private Boolean isActive;

    @CreatedDate
    private Instant createdAt;

    private Instant expiresAt;
}