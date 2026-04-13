package org.example.filesharing.entities.models;

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
    private String versionId;
    private String annotationId;
    private String commentId;
    private String reviewSessionId;
    private String actorId;
    private String actorName;
}