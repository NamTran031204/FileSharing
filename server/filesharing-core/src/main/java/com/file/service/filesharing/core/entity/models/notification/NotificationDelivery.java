package com.file.service.filesharing.core.entity.models.notification;

import com.file.service.filesharing.core.enums.DeliveryStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDelivery {
    private DeliveryStatus inApp;
    private DeliveryStatus email;
}