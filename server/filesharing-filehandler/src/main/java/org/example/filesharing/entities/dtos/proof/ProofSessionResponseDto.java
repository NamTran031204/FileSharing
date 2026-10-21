package org.example.filesharing.entities.dtos.proof;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProofSessionResponseDto {
    // chi tra mot lan luc tao phien, DB chi luu hash
    private String guestKey;
    private String guestName;
}
