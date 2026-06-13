package org.example.filesharing.services;

import com.file.service.filesharing.core.entity.PageRequestDto;
import com.file.service.filesharing.core.entity.PageResult;
import org.example.filesharing.entities.dtos.notification.NotificationCreateUpdateDTO;
import org.example.filesharing.entities.dtos.notification.NotificationFilterDTO;
import com.file.service.filesharing.core.entity.models.NotificationEntity;

public interface NotificationService {
    NotificationEntity createNewNotification(NotificationCreateUpdateDTO dto);

    NotificationEntity updateNotificationDetail(NotificationCreateUpdateDTO dto);

    PageResult<NotificationEntity> getNotificationPage(PageRequestDto<NotificationFilterDTO> dto);

    NotificationEntity getNotificationById(String notificationId);

    String deleteNotification(String notificationId);
}
