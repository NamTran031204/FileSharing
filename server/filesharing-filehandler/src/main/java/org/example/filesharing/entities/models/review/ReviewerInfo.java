package org.example.filesharing.entities.models.review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.enums.ReviewerRole;

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