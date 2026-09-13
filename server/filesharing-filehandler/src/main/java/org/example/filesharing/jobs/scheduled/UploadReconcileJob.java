package org.example.filesharing.jobs.scheduled;

import com.file.service.filesharing.core.entity.models.UploadSessionEntity;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.services.MetadataService;
import org.example.filesharing.services.StorageService;
import org.example.filesharing.services.UploadSessionService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Tier 3 of the three-tier GC (see docs 03_detailed_design §WP6): a two-way reconciliation
 * between MongoDB and storage.
 * <p>
 * Storage → Mongo: a multipart upload with no matching session is an orphan. Only orphans older
 * than {@link #ORPHAN_MIN_AGE} are aborted, so multipart uploads still in flight through the
 * legacy (E7) endpoints are never killed mid-transfer.
 * <p>
 * Mongo → storage: a session marked COMPLETED whose object is gone means the commit was lost;
 * the metadata version is flagged FAILED and an alert is logged.
 * <p>
 * Metadata documents that predate the session era are never scanned or modified.
 */
@Component
@Slf4j
public class UploadReconcileJob {

    private static final Duration ORPHAN_MIN_AGE = Duration.ofHours(24);

    private final UploadSessionService uploadSessionService;
    private final StorageService storageService;
    private final MetadataService metadataService;

    public UploadReconcileJob(UploadSessionService uploadSessionService,
                              StorageService storageService,
                              MetadataService metadataService) {
        this.uploadSessionService = uploadSessionService;
        this.storageService = storageService;
        this.metadataService = metadataService;
    }

    @Scheduled(fixedDelayString = "${upload.reconcile-interval}")
    public void reconcile() {
        Instant now = Instant.now();
        int orphansAborted = abortOrphanMultipartUploads(now);
        int missingObjects = flagCompletedSessionsWithoutObject();
        log.info("Upload reconcile finished: {} orphan multipart uploads aborted, {} completed sessions missing their object",
                orphansAborted, missingObjects);
    }

    private int abortOrphanMultipartUploads(Instant now) {
        List<StorageService.MultipartUploadSummary> uploads;
        try {
            uploads = storageService.listMultipartUploads();
        } catch (Exception e) {
            log.error("Upload reconcile could not list multipart uploads: {}", e.getMessage(), e);
            return 0;
        }

        Instant cutoff = now.minus(ORPHAN_MIN_AGE);
        int aborted = 0;
        for (StorageService.MultipartUploadSummary upload : uploads) {
            if (uploadSessionService.findByUploadId(upload.uploadId()).isPresent()) {
                continue;
            }
            if (upload.initiated() == null || upload.initiated().isAfter(cutoff)) {
                // too young: could still be an in-flight legacy upload
                continue;
            }
            try {
                storageService.abortMultipartUpload(upload.objectName(), upload.uploadId());
                aborted++;
                log.warn("Aborted orphan multipart upload {} on object {} (initiated {})",
                        upload.uploadId(), upload.objectName(), upload.initiated());
            } catch (Exception e) {
                log.error("Failed to abort orphan multipart upload {} on object {}: {}",
                        upload.uploadId(), upload.objectName(), e.getMessage(), e);
            }
        }
        return aborted;
    }

    private int flagCompletedSessionsWithoutObject() {
        List<UploadSessionEntity> completed = uploadSessionService.findCompletedSessions();
        int missing = 0;
        for (UploadSessionEntity session : completed) {
            if (objectExists(session.getObjectName())) {
                continue;
            }
            missing++;
            log.error("ALERT — session {} is COMPLETED but object {} is missing from storage",
                    session.getSessionId(), session.getObjectName());
            if (session.getMetadataId() != null) {
                try {
                    metadataService.markUploadFailed(session.getMetadataId());
                } catch (Exception e) {
                    log.error("Failed to flag metadata {} as FAILED: {}", session.getMetadataId(), e.getMessage(), e);
                }
            }
        }
        return missing;
    }

    /**
     * headObject throws FileBusinessException when the key is absent, so a thrown
     * business exception is how "the object is gone" reaches us here.
     */
    private boolean objectExists(String objectName) {
        try {
            storageService.headObject(objectName);
            return true;
        } catch (FileBusinessException e) {
            return false;
        }
    }
}
