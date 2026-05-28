package com.file.service.filesharingcore.entity.models.notification;

import com.file.service.filesharingcore.enums.DeliveryStatus;
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