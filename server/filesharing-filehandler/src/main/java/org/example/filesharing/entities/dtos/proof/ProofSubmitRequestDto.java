package org.example.filesharing.entities.dtos.proof;

import lombok.Data;

import java.util.List;

@Data
public class ProofSubmitRequestDto {
    private List<String> assetIds;
    // tuy chon, toi da 1000 ky tu
    private String note;
}
