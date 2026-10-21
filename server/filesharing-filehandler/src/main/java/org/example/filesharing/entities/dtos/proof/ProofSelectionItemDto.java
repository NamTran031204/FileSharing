package org.example.filesharing.entities.dtos.proof;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProofSelectionItemDto {
    private String assetId;
    private String assetName;
    private String thumbnailUrl;
    // false khi asset da bi xoa/trash/chuyen folder
    private boolean available;
}
