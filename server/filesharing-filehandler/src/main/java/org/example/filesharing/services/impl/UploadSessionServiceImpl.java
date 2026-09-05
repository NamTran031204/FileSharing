package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.UploadSessionEntity;
import com.file.service.filesharing.core.enums.UploadSessionStatus;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import lombok.RequiredArgsConstructor;
import org.example.filesharing.repositories.UploadSessionRepo;
import org.example.filesharing.services.UploadSessionService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.convert.DurationStyle;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UploadSessionServiceImpl implements UploadSessionService {

    private static final long SMALL_FILE_THRESHOLD = 8_388_608L; // 8 MiB
    private static final long[] PART_SIZE_STEPS = {8_388_608L, 16_777_216L, 33_554_432L, 67_108_864L}; // 8/16/32/64 MiB
    private static final int S3_MAX_PARTS = 10_000;
    private static final Duration HARD_EXPIRY = Duration.ofDays(7);

    private final UploadSessionRepo uploadSessionRepo;

    @Value("${upload.max-file-size}")
    private long maxFileSize;

    private Duration sessionIdleTtl;

    @Value("${upload.session-idle-ttl}")
    public void setSessionIdleTtl(String rawSessionIdleTtl) {
        this.sessionIdleTtl = DurationStyle.detectAndParse(rawSessionIdleTtl);
    }

    @Override
    public UploadSessionEntity create(String ownerId, String assetId, String metadataId, String objectName,
                                       long declaredSize, String uploadId) {
        if (declaredSize <= 0) {
            throw new FileBusinessException(ErrorCode.BAD_REQUEST, "fileSize is required");
        }
        if (declaredSize > maxFileSize) {
            throw new FileBusinessException(ErrorCode.BAD_REQUEST, "fileSize exceeds limit: " + maxFileSize + " bytes");
        }

        long partSize = computePartSize(declaredSize);
        int partCount = (int) Math.ceil(declaredSize / (double) partSize);

        Instant now = Instant.now();
        Instant hardExpiresAt = now.plus(HARD_EXPIRY);

        UploadSessionEntity session = UploadSessionEntity.builder()
                .sessionId(UUID.randomUUID().toString())
                .ownerId(ownerId)
                .assetId(assetId)
                .metadataId(metadataId)
                .objectName(objectName)
                .uploadId(uploadId)
                .declaredSize(declaredSize)
                .partSize(partSize)
                .partCount(partCount)
                .status(UploadSessionStatus.INITIATED)
                .createdAt(now)
                .expiresAt(slideExpiry(now, hardExpiresAt))
                .hardExpiresAt(hardExpiresAt)
                .build();

        return uploadSessionRepo.save(session);
    }

    private long computePartSize(long declaredSize) {
        if (declaredSize <= SMALL_FILE_THRESHOLD) {
            return declaredSize;
        }
        long minPartSize = (long) Math.ceil(declaredSize / (double) S3_MAX_PARTS);
        long target = Math.max(SMALL_FILE_THRESHOLD, minPartSize);
        for (long step : PART_SIZE_STEPS) {
            if (target <= step) {
                return step;
            }
        }
        return PART_SIZE_STEPS[PART_SIZE_STEPS.length - 1];
    }

    private Instant slideExpiry(Instant now, Instant hardExpiresAt) {
        Instant slidingExpiry = now.plus(sessionIdleTtl);
        return slidingExpiry.isAfter(hardExpiresAt) ? hardExpiresAt : slidingExpiry;
    }

    @Override
    public UploadSessionEntity get(String sessionId, String currentUserId) {
        UploadSessionEntity session = uploadSessionRepo.findById(sessionId)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.SESSION_NOT_FOUND,
                        "Upload session not found: " + sessionId));

        if (session.getStatus() == UploadSessionStatus.EXPIRED || session.getExpiresAt().isBefore(Instant.now())) {
            throw new FileBusinessException(ErrorCode.SESSION_NOT_FOUND, "Upload session not found: " + sessionId);
        }
        if (!session.getOwnerId().equals(currentUserId)) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }
        return session;
    }

    @Override
    public UploadSessionEntity touch(UploadSessionEntity session) {
        if (session.getStatus() == UploadSessionStatus.COMPLETED || session.getStatus() == UploadSessionStatus.ABORTED) {
            return session;
        }
        session.setExpiresAt(slideExpiry(Instant.now(), session.getHardExpiresAt()));
        if (session.getStatus() == UploadSessionStatus.INITIATED) {
            session.setStatus(UploadSessionStatus.UPLOADING);
        }
        return uploadSessionRepo.save(session);
    }

    @Override
    public UploadSessionEntity markCompleted(UploadSessionEntity session, String resultEtag) {
        session.setStatus(UploadSessionStatus.COMPLETED);
        session.setCompletedAt(Instant.now());
        session.setResultEtag(resultEtag);
        return uploadSessionRepo.save(session);
    }

    @Override
    public UploadSessionEntity markAborted(UploadSessionEntity session) {
        session.setStatus(UploadSessionStatus.ABORTED);
        session.setCompletedAt(Instant.now());
        return uploadSessionRepo.save(session);
    }
}
