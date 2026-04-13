package org.example.filesharing.entities.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.enums.ReviewSessionStatus;

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