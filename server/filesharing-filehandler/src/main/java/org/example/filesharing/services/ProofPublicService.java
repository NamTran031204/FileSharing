package org.example.filesharing.services;

import com.file.service.filesharing.core.entity.PageResult;
import org.example.filesharing.entities.dtos.proof.ProofAssetItemDto;
import org.example.filesharing.entities.dtos.proof.ProofLandingResponseDto;
import org.example.filesharing.entities.dtos.proof.ProofSessionCreateRequestDto;
import org.example.filesharing.entities.dtos.proof.ProofSessionResponseDto;
import org.example.filesharing.entities.dtos.proof.ProofSubmitRequestDto;
import org.example.filesharing.entities.dtos.proof.ProofSubmitResponseDto;

public interface ProofPublicService {

    ProofLandingResponseDto getLanding(String shareToken);

    ProofSessionResponseDto createSession(String shareToken, ProofSessionCreateRequestDto request);

    PageResult<ProofAssetItemDto> getAssets(String shareToken, String guestKey, int page, int size);

    ProofSubmitResponseDto submit(String shareToken, String guestKey, ProofSubmitRequestDto request);
}
