package org.example.filesharing.entities.dtos.proof;

import com.file.service.filesharing.core.enums.ProofSelectionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProofSelectionSummaryDto {
    private String selectionId;
    private String guestName;
    private ProofSelectionStatus status;
    private int count;
    private Instant submittedAt;
    private Instant createdAt;
}
