package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import com.file.service.filesharing.core.entity.CommonResponse;
import com.file.service.filesharing.core.entity.PageRequestDto;
import com.file.service.filesharing.core.entity.PageResult;
import org.example.filesharing.entities.dtos.notification.NotificationCreateUpdateDTO;
import org.example.filesharing.entities.dtos.notification.NotificationFilterDTO;
import com.file.service.filesharing.core.entity.models.NotificationEntity;
import org.example.filesharing.services.NotificationService;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RequestMapping("api/notification")
@RestController
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/create-new")
    public CommonResponse<NotificationEntity> createNewNotification(@RequestBody NotificationCreateUpdateDTO dto) {
        return CommonResponse.success(notificationService.createNewNotification(dto));
    }

    @PostMapping("/update-detail")
    public CommonResponse<NotificationEntity> updateNotificationDetail(@RequestBody NotificationCreateUpdateDTO dto) {
        return CommonResponse.success(notificationService.updateNotificationDetail(dto));
    }

    @PostMapping("/get-page")
    public CommonResponse<PageResult<NotificationEntity>> getNotificationPage(
            @RequestBody PageRequestDto<NotificationFilterDTO> dto) {
        return CommonResponse.success(notificationService.getNotificationPage(dto));
    }

    @GetMapping("/get-by-id/{notificationId}")
    public CommonResponse<NotificationEntity> getNotificationById(@PathVariable("notificationId") String notificationId) {
        return CommonResponse.success(notificationService.getNotificationById(notificationId));
    }

    @PostMapping("/delete/{notificationId}")
    public CommonResponse<String> deleteNotification(@PathVariable("notificationId") String notificationId) {
        return CommonResponse.success(notificationService.deleteNotification(notificationId));
    }
}
