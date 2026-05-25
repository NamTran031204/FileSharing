package org.example.filesharing.entities.dtos.review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.enums.ReviewSessionStatus;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewSessionDecisionDTO {
    private ReviewSessionStatus decision;
    private String note;
}
