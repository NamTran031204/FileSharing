package org.example.filesharing.entities.dtos.proof;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProofSubmitResponseDto {
    private String selectionId;
    private int count;
    private Instant submittedAt;
}
