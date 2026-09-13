package org.example.filesharing.jobs.scheduled;

import com.file.service.filesharing.core.entity.models.UploadSessionEntity;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.services.MetadataService;
import org.example.filesharing.services.StorageService;
import org.example.filesharing.services.UploadSessionService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.List;

/**
 * Tang 2 cua co che GC 3 tang (xem docs 03_detailed_design muc WP6).
 * <p>
 * Moi chu ky job lay cac session con song (INITIATED / UPLOADING) nhung da qua han,
 * abort multipart tuong ung tren storage, danh dau session EXPIRED va metadata FAILED.
 * <p>
 * Pham vi dam bao: job chi doc collection upload_sessions. Cac document metadata tao truoc
 * thoi ky session (co uploadId nhung khong co session) khong bao gio bi quet, khong bi danh
 * FAILED oan; rac tren storage cua chung do co che stale upload cua MinIO don.
 */
@Component
@Slf4j
public class UploadSessionGcJob {

    private final UploadSessionService uploadSessionService;
    private final StorageService storageService;
    private final MetadataService metadataService;

    public UploadSessionGcJob(UploadSessionService uploadSessionService,
                              StorageService storageService,
                              MetadataService metadataService) {
        this.uploadSessionService = uploadSessionService;
        this.storageService = storageService;
        this.metadataService = metadataService;
    }

    @Scheduled(fixedDelayString = "${upload.gc-interval}")
    public void collectExpiredSessions() {
        List<UploadSessionEntity> expired = uploadSessionService.findExpiredLiveSessions(Instant.now());
        if (expired.isEmpty()) {
            return;
        }

        int succeeded = 0;
        int failed = 0;
        for (UploadSessionEntity session : expired) {
            try {
                expireSession(session);
                succeeded++;
            } catch (Exception e) {
                // mot session loi khong duoc lam dung ca vong quet
                failed++;
                log.error("GC failed for session {} (object {}): {}",
                        session.getSessionId(), session.getObjectName(), e.getMessage(), e);
            }
        }
        log.info("Upload session GC finished: {} expired, {} cleaned, {} failed", expired.size(), succeeded, failed);
    }

    private void expireSession(UploadSessionEntity session) {
        // nhanh SINGLE khong co multipart de abort
        if (session.getUploadId() != null) {
            storageService.abortMultipartUpload(session.getObjectName(), session.getUploadId());
        }

        uploadSessionService.markExpired(session);

        if (session.getMetadataId() != null) {
            metadataService.markUploadFailed(session.getMetadataId());
        }

        log.info("Expired upload session {} (object {})", session.getSessionId(), session.getObjectName());
    }
}
