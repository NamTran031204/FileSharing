package org.example.filesharing.entities.dtos.proof;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProofLinkResponseDto {
    // null khi link da bi thu hoi
    private String shareToken;
    private Instant shareExpiry;
}
