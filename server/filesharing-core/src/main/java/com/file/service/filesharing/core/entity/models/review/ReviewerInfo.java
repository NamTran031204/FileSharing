package com.file.service.filesharing.core.entity.models.review;

import com.file.service.filesharing.core.enums.ReviewerRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewerInfo {
    private String userId;
    private String email;
    private ReviewerRole role;
    private Instant invitedAt;
    private Instant lastViewedAt;
    private Boolean hasCommented;
}