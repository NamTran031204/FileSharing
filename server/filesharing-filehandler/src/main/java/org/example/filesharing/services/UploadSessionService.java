package org.example.filesharing.services;

import com.file.service.filesharing.core.entity.models.UploadSessionEntity;
import org.example.filesharing.entities.dtos.upload.AbortUploadSessionResponseDto;
import org.example.filesharing.entities.dtos.upload.CompletedPartDto;
import org.example.filesharing.entities.dtos.upload.PartUrlBatchResponseDto;
import org.example.filesharing.entities.dtos.upload.UploadResourceResponseDto;
import org.example.filesharing.entities.dtos.upload.UploadSessionInitResponseDto;
import org.example.filesharing.entities.dtos.upload.UploadSessionStatusResponseDto;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface UploadSessionService {

    /**
     * SEC-08 — chan som khi user vuot tran session dang mo. Goi TRUOC khi tao multipart
     * tren storage de lan bi 429 khong sinh rac.
     */
    void ensureSessionQuota(String ownerId);

    UploadSessionEntity create(String ownerId, String assetId, String metadataId, String objectName,
                                long declaredSize, String uploadId);

    UploadSessionEntity get(String sessionId, String currentUserId);

    UploadSessionEntity touch(UploadSessionEntity session);

    UploadSessionEntity markCompleted(UploadSessionEntity session, String resultEtag);

    UploadSessionEntity markAborted(UploadSessionEntity session);

    /**
     * WP6 — terminal transition owned by the GC job (INITIATED / UPLOADING → EXPIRED).
     * Kept here rather than in the job so every session state change goes through this service.
     */
    UploadSessionEntity markExpired(UploadSessionEntity session);

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

    // -------------------------------------------------------------------------
    // WP6 — read-only queries for the GC / reconcile jobs (no side effects here)
    // -------------------------------------------------------------------------

    /**
     * Live sessions (INITIATED / UPLOADING) whose expiry has already passed.
     */
    List<UploadSessionEntity> findExpiredLiveSessions(Instant now);

    /**
     * Resolves a storage multipart uploadId back to its session; empty means the upload is orphaned.
     */
    Optional<UploadSessionEntity> findByUploadId(String uploadId);

    /**
     * All sessions currently marked COMPLETED (bounded set — the TTL index removes old documents).
     */
    List<UploadSessionEntity> findCompletedSessions();
}
