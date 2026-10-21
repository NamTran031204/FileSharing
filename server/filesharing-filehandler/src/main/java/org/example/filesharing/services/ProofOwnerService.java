package org.example.filesharing.services;

import org.example.filesharing.entities.dtos.proof.ProofLinkCreateRequestDto;
import org.example.filesharing.entities.dtos.proof.ProofLinkResponseDto;
import org.example.filesharing.entities.dtos.proof.ProofSelectionDetailDto;
import org.example.filesharing.entities.dtos.proof.ProofSelectionSummaryDto;

import java.util.List;

public interface ProofOwnerService {

    ProofLinkResponseDto createOrRefreshLink(String folderId, ProofLinkCreateRequestDto request);

    ProofLinkResponseDto revokeLink(String folderId);

    List<ProofSelectionSummaryDto> getSelections(String folderId);

    ProofSelectionDetailDto getSelectionDetail(String selectionId);
}
