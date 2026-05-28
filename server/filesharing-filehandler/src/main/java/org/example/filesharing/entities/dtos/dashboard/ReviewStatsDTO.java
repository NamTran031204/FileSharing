package org.example.filesharing.entities.dtos.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewStatsDTO {
    private long pendingCount;
    private long approvedCount;
    private long changesRequestedCount;
    private long noReviewSessionCount;
    private List<ReviewByProjectDTO> byProject;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReviewByProjectDTO {
        private String projectId;
        private String projectName;
        private long pendingCount;
        private long approvedCount;
        private long changesRequestedCount;
    }
}
