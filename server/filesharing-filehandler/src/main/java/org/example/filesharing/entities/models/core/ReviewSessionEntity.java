package org.example.filesharing.entities.models.core;

import lombok.*;
import org.example.filesharing.entities.models.ReviewMetrics;
import org.example.filesharing.entities.models.ReviewStatusHistory;
import org.example.filesharing.entities.models.ReviewerInfo;
import org.example.filesharing.entities.models.core.base.EntityAuditBase;
import org.example.filesharing.enums.ReviewSessionStatus;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document(collection = "review_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class ReviewSessionEntity extends EntityAuditBase {
    @Id
    private String reviewSessionId;

    private String projectId;
    private String assetId;
    private String versionId;

    private String title;
    private String description;
    private Instant dueDate;

    private ReviewSessionStatus status;
    private List<ReviewStatusHistory> statusHistory;
    private List<ReviewerInfo> reviewers;
    private ReviewMetrics metrics;

    private Instant completedAt;
}