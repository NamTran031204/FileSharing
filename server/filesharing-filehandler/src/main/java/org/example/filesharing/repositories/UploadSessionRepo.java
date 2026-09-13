package org.example.filesharing.repositories;

import com.file.service.filesharing.core.entity.models.UploadSessionEntity;
import com.file.service.filesharing.core.enums.UploadSessionStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UploadSessionRepo extends MongoRepository<UploadSessionEntity, String> {

    /**
     * GC job — live sessions whose logical expiry has passed.
     * Field order matches idx_upload_sessions_status_expires {status: 1, expiresAt: 1}.
     * <p>
     * The hard cap is covered by the same predicate: expiresAt is always
     * min(now + idleTtl, hardExpiresAt), so expiresAt &lt;= hardExpiresAt at all times.
     */
    List<UploadSessionEntity> findByStatusInAndExpiresAtBefore(Collection<UploadSessionStatus> statuses, Instant before);

    /**
     * SEC-08 — dem so session dang mo cua mot user (idx_upload_sessions_owner_status).
     */
    long countByOwnerIdAndStatusIn(String ownerId, Collection<UploadSessionStatus> statuses);

    /**
     * Reconcile job — resolves a multipart upload back to its session (idx_upload_sessions_upload_id, sparse).
     */
    Optional<UploadSessionEntity> findByUploadId(String uploadId);

    /**
     * Reconcile job — reverse direction: sessions marked COMPLETED whose object must exist in storage.
     * Uses the status prefix of idx_upload_sessions_status_expires.
     */
    List<UploadSessionEntity> findByStatus(UploadSessionStatus status);
}
