package org.example.filesharing.controllers;

import com.file.service.filesharing.core.entity.CommonResponse;
import com.file.service.filesharing.core.entity.PageResult;
import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.dtos.proof.ProofAssetItemDto;
import org.example.filesharing.entities.dtos.proof.ProofLandingResponseDto;
import org.example.filesharing.entities.dtos.proof.ProofSessionCreateRequestDto;
import org.example.filesharing.entities.dtos.proof.ProofSessionResponseDto;
import org.example.filesharing.entities.dtos.proof.ProofSubmitRequestDto;
import org.example.filesharing.entities.dtos.proof.ProofSubmitResponseDto;
import org.example.filesharing.services.ProofPublicService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("api/public/proof")
@RequiredArgsConstructor
public class ProofPublicController {

    private static final String GUEST_KEY_HEADER = "X-Guest-Key";

    private final ProofPublicService proofPublicService;

    @GetMapping("/{shareToken}")
    public CommonResponse<ProofLandingResponseDto> getLanding(@PathVariable("shareToken") String shareToken) {
        return CommonResponse.success(proofPublicService.getLanding(shareToken));
    }

    @PostMapping("/{shareToken}/sessions")
    public CommonResponse<ProofSessionResponseDto> createSession(
            @PathVariable("shareToken") String shareToken,
            @RequestBody ProofSessionCreateRequestDto request) {
        return CommonResponse.success(proofPublicService.createSession(shareToken, request));
    }

    // header thieu/rong duoc service xu ly thanh PROOF_SESSION_INVALID
    @GetMapping("/{shareToken}/assets")
    public CommonResponse<PageResult<ProofAssetItemDto>> getAssets(
            @PathVariable("shareToken") String shareToken,
            @RequestHeader(value = GUEST_KEY_HEADER, required = false) String guestKey,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "50") int size) {
        return CommonResponse.success(proofPublicService.getAssets(shareToken, guestKey, page, size));
    }

    @PostMapping("/{shareToken}/submit")
    public CommonResponse<ProofSubmitResponseDto> submit(
            @PathVariable("shareToken") String shareToken,
            @RequestHeader(value = GUEST_KEY_HEADER, required = false) String guestKey,
            @RequestBody ProofSubmitRequestDto request) {
        return CommonResponse.success(proofPublicService.submit(shareToken, guestKey, request));
    }
}
