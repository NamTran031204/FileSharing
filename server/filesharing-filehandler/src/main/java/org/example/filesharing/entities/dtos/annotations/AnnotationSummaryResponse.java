package org.example.filesharing.entities.dtos.annotations;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnnotationSummaryResponse {
    private String assetId;
    private Integer versionNumber;
    private long totalThreads;
    private long open;
    private long resolved;
    private long archived;
    private long totalReplies;
    private List<String> participants;
}
