package com.file.service.filesharingcore.entity.models;

import com.file.service.filesharingcore.entity.models.base.EntityAuditBase;
import com.file.service.filesharingcore.entity.models.review.ReviewMetrics;
import com.file.service.filesharingcore.entity.models.review.ReviewStatusHistory;
import com.file.service.filesharingcore.entity.models.review.ReviewerInfo;
import com.file.service.filesharingcore.enums.ReviewSessionStatus;
import lombok.*;
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
    private Integer versionNumber;

    private String title;
    private String description;
    private Instant dueDate;

    private ReviewSessionStatus status;
    private List<ReviewStatusHistory> statusHistory;
    private List<ReviewerInfo> reviewers;
    private ReviewMetrics metrics;

    private Instant completedAt;
}