package org.example.filesharing.entities.dtos.review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewSessionCreateDTO {
    private String projectId;
    private String assetId;
    private Integer versionNumber;
    private String title;
    private String description;
    private Instant dueDate;
    private List<String> reviewerIds;
}
