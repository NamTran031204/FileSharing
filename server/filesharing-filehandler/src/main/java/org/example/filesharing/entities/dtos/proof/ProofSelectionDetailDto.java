package org.example.filesharing.entities.dtos.proof;

import com.file.service.filesharing.core.enums.ProofSelectionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProofSelectionDetailDto {
    private String selectionId;
    private String guestName;
    private ProofSelectionStatus status;
    private String note;
    private Instant submittedAt;
    private List<ProofSelectionItemDto> items;
}
