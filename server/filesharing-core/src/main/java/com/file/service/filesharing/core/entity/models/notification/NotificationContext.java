package com.file.service.filesharing.core.entity.models.notification;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationContext {
    private String assetId;
    private String assetName;
    private Integer versionNumber;
    private String annotationId;
    private String commentId;
    private String reviewSessionId;
    private String actorId;
    private String actorName;
}