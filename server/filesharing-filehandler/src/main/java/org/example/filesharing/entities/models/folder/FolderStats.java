package org.example.filesharing.entities.models.folder;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FolderStats {
    private Integer assetCount;
    private Integer subfoldersCount;
    private Integer pendingReviewsCount;
}