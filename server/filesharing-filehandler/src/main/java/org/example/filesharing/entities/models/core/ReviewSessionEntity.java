package org.example.filesharing.entities.models.core;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.example.filesharing.entities.models.ReviewMetrics;
import org.example.filesharing.entities.models.ReviewStatusHistory;
import org.example.filesharing.entities.models.ReviewerInfo;
import org.example.filesharing.enums.ReviewSessionStatus;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
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
public class ReviewSessionEntity {
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

    private String createdBy;
    private String createdByEmail;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    private Instant completedAt;
}