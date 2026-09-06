package org.example.filesharing.services;

import com.file.service.filesharing.core.entity.models.UploadSessionEntity;
import org.example.filesharing.entities.dtos.upload.AbortUploadSessionResponseDto;
import org.example.filesharing.entities.dtos.upload.CompletedPartDto;
import org.example.filesharing.entities.dtos.upload.PartUrlBatchResponseDto;
import org.example.filesharing.entities.dtos.upload.UploadResourceResponseDto;
import org.example.filesharing.entities.dtos.upload.UploadSessionInitResponseDto;
import org.example.filesharing.entities.dtos.upload.UploadSessionStatusResponseDto;

import java.util.List;

public interface UploadSessionService {

    UploadSessionEntity create(String ownerId, String assetId, String metadataId, String objectName,
                                long declaredSize, String uploadId);

    UploadSessionEntity get(String sessionId, String currentUserId);

    UploadSessionEntity touch(UploadSessionEntity session);

    UploadSessionEntity markCompleted(UploadSessionEntity session, String resultEtag);

    UploadSessionEntity markAborted(UploadSessionEntity session);

    /**
     * Builds the E1 response (first batch of presigned part urls) for a freshly created session.
     */
    UploadSessionInitResponseDto buildInitResponse(UploadSessionEntity session);

    /**
     * E2 — issue/refresh presigned urls for the given part numbers.
     */
    PartUrlBatchResponseDto issuePartUrls(String sessionId, List<Integer> partNumbers);

    /**
     * E3 — session status / resume.
     */
    UploadSessionStatusResponseDto getStatus(String sessionId);

    /**
     * E4 — verify + commit. Idempotent on an already COMPLETED session.
     */
    UploadResourceResponseDto complete(String sessionId, List<CompletedPartDto> parts);

    /**
     * E5 — abort. Idempotent on an already ABORTED session.
     */
    AbortUploadSessionResponseDto abort(String sessionId);
}
