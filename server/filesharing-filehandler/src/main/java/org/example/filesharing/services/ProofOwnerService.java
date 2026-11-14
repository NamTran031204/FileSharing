package org.example.filesharing.services;

import org.example.filesharing.entities.dtos.proof.ProofSelectionDetailDto;
import org.example.filesharing.entities.dtos.proof.ProofSelectionSummaryDto;

import java.util.List;

public interface ProofOwnerService {

    List<ProofSelectionSummaryDto> getSelections(String folderId);

    ProofSelectionDetailDto getSelectionDetail(String selectionId);
}
