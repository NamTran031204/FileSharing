package org.example.filesharing.controllers;

import com.file.service.filesharing.core.entity.CommonResponse;
import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.dtos.proof.ProofLinkCreateRequestDto;
import org.example.filesharing.entities.dtos.proof.ProofLinkResponseDto;
import org.example.filesharing.entities.dtos.proof.ProofSelectionDetailDto;
import org.example.filesharing.entities.dtos.proof.ProofSelectionSummaryDto;
import org.example.filesharing.services.ProofOwnerService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("api")
@RequiredArgsConstructor
public class ProofController {

    private final ProofOwnerService proofOwnerService;

    @PostMapping("/folder/{folderId}/proof-link")
    public CommonResponse<ProofLinkResponseDto> createOrRefreshLink(
            @PathVariable("folderId") String folderId,
            @RequestBody(required = false) ProofLinkCreateRequestDto request) {
        return CommonResponse.success(proofOwnerService.createOrRefreshLink(folderId, request));
    }

    @DeleteMapping("/folder/{folderId}/proof-link")
    public CommonResponse<ProofLinkResponseDto> revokeLink(@PathVariable("folderId") String folderId) {
        return CommonResponse.success(proofOwnerService.revokeLink(folderId));
    }

    @GetMapping("/folder/{folderId}/proof-selections")
    public CommonResponse<List<ProofSelectionSummaryDto>> getSelections(@PathVariable("folderId") String folderId) {
        return CommonResponse.success(proofOwnerService.getSelections(folderId));
    }

    @GetMapping("/proof-selection/{selectionId}")
    public CommonResponse<ProofSelectionDetailDto> getSelectionDetail(@PathVariable("selectionId") String selectionId) {
        return CommonResponse.success(proofOwnerService.getSelectionDetail(selectionId));
    }
}
