package org.example.filesharing.services;

import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.notification.NotificationCreateUpdateDTO;
import org.example.filesharing.entities.dtos.notification.NotificationFilterDTO;
import org.example.filesharing.entities.models.NotificationEntity;

public interface NotificationService {
    NotificationEntity createNewNotification(NotificationCreateUpdateDTO dto);

    NotificationEntity updateNotificationDetail(NotificationCreateUpdateDTO dto);

    PageResult<NotificationEntity> getNotificationPage(PageRequestDto<NotificationFilterDTO> dto);

    NotificationEntity getNotificationById(String notificationId);

    String deleteNotification(String notificationId);
}
