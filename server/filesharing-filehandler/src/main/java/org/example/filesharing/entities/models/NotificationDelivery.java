package org.example.filesharing.entities.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.enums.DeliveryStatus;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDelivery {
    private DeliveryStatus inApp;
    private DeliveryStatus email;
}