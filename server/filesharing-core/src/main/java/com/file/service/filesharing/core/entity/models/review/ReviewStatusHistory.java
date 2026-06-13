package com.file.service.filesharing.core.entity.models.review;

import com.file.service.filesharing.core.enums.ReviewSessionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewStatusHistory {
    private ReviewSessionStatus status;
    private String changedBy;
    private String changedByEmail;
    private Instant changedAt;
    private String note;
}