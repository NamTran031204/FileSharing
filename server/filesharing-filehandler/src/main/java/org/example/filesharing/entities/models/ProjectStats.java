package org.example.filesharing.entities.models;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectStats {
    private Integer folderCount;
    private Integer assetCount;
    private Integer totalVersions;
    private Integer pendingReviews;
}