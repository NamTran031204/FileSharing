package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.MetadataEntity;
import com.file.service.filesharing.core.entity.models.UploadSessionEntity;
import com.file.service.filesharing.core.enums.UploadMode;
import com.file.service.filesharing.core.enums.UploadSessionStatus;
import com.file.service.filesharing.core.enums.UploadStatus;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.entities.dtos.upload.AbortUploadSessionResponseDto;
import org.example.filesharing.entities.dtos.upload.CompletedPartDto;
import org.example.filesharing.entities.dtos.upload.PartUrlBatchResponseDto;
import org.example.filesharing.entities.dtos.upload.ReceivedPartDto;
import org.example.filesharing.entities.dtos.upload.UploadResourceResponseDto;
import org.example.filesharing.entities.dtos.upload.UploadSessionInitResponseDto;
import org.example.filesharing.entities.dtos.upload.UploadSessionStatusResponseDto;
import org.example.filesharing.repositories.MetadataRepo;
import org.example.filesharing.repositories.UploadSessionRepo;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.services.MetadataService;
import org.example.filesharing.services.MinIoService;
import org.example.filesharing.services.StorageService;
import org.example.filesharing.services.UploadSessionService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.convert.DurationStyle;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UploadSessionServiceImpl implements UploadSessionService {

    private static final long SMALL_FILE_THRESHOLD = 8_388_608L; // 8 MiB
    private static final long[] PART_SIZE_STEPS = {8_388_608L, 16_777_216L, 33_554_432L, 67_108_864L}; // 8/16/32/64 MiB
    private static final int S3_MAX_PARTS = 10_000;
    private static final Duration HARD_EXPIRY = Duration.ofDays(7);
    private static final int INITIAL_URL_BATCH_SIZE = 20;
    private static final int MAX_URL_BATCH_SIZE = 50;

    private final UploadSessionRepo uploadSessionRepo;
    private final MetadataRepo metadataRepo;
    private final MongoTemplate mongoTemplate;
    private final AuditService auditService;
    private final StorageService storageService;
    private final MetadataService metadataService;
    private final MinIoService minIoService;

    @Value("${upload.max-file-size}")
    private long maxFileSize;

    @Value("${upload.verify-etag-md5}")
    private boolean verifyEtagMd5;

    private Duration sessionIdleTtl;

    @Value("${upload.session-idle-ttl}")
    public void setSessionIdleTtl(String rawSessionIdleTtl) {
        this.sessionIdleTtl = DurationStyle.detectAndParse(rawSessionIdleTtl);
    }

    private Duration partUrlTtl;

    @Value("${upload.part-url-ttl}")
    public void setPartUrlTtl(String rawPartUrlTtl) {
        this.partUrlTtl = DurationStyle.detectAndParse(rawPartUrlTtl);
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

    private UploadMode resolveUploadMode(UploadSessionEntity session) {
        return session.getUploadId() == null ? UploadMode.SINGLE : UploadMode.MULTIPART;
    }

    @Override
    public UploadSessionInitResponseDto buildInitResponse(UploadSessionEntity session) {
        int batchSize = Math.min(session.getPartCount(), INITIAL_URL_BATCH_SIZE);
        Map<Integer, String> urls = presignParts(session, rangeClosed(1, batchSize));

        return UploadSessionInitResponseDto.builder()
                .sessionId(session.getSessionId())
                .uploadMode(resolveUploadMode(session))
                .partSize(session.getPartSize())
                .partCount(session.getPartCount())
                .declaredSize(session.getDeclaredSize())
                .urls(urls)
                .urlExpiresAt(Instant.now().plus(partUrlTtl))
                .expiresAt(session.getExpiresAt())
                .hardExpiresAt(session.getHardExpiresAt())
                .build();
    }

    private List<Integer> rangeClosed(int from, int to) {
        List<Integer> result = new ArrayList<>();
        for (int i = from; i <= to; i++) {
            result.add(i);
        }
        return result;
    }

    private Map<Integer, String> presignParts(UploadSessionEntity session, List<Integer> partNumbers) {
        Map<Integer, String> urls = new LinkedHashMap<>();
        for (Integer partNumber : partNumbers) {
            urls.put(partNumber, storageService.presignUploadPart(session.getObjectName(), session.getUploadId(), partNumber));
        }
        return urls;
    }

    // -------------------------------------------------------------------------
    // E2 — part-urls
    // -------------------------------------------------------------------------

    @Override
    public PartUrlBatchResponseDto issuePartUrls(String sessionId, List<Integer> partNumbers) {
        String currentUserId = auditService.getCurrentUserId();
        UploadSessionEntity session = get(sessionId, currentUserId);

        if (session.getStatus() == UploadSessionStatus.COMPLETED || session.getStatus() == UploadSessionStatus.ABORTED) {
            throw new FileBusinessException(ErrorCode.SESSION_INVALID_STATE,
                    "Session is " + session.getStatus() + ", cannot issue part urls");
        }

        validatePartNumbers(session, partNumbers);

        Map<Integer, String> urls = presignParts(session, partNumbers);
        UploadSessionEntity touched = touch(session);

        return PartUrlBatchResponseDto.builder()
                .sessionId(touched.getSessionId())
                .urls(urls)
                .urlExpiresAt(Instant.now().plus(partUrlTtl))
                .expiresAt(touched.getExpiresAt())
                .build();
    }

    private void validatePartNumbers(UploadSessionEntity session, List<Integer> partNumbers) {
        if (partNumbers == null || partNumbers.isEmpty()) {
            throw new FileBusinessException(ErrorCode.BAD_REQUEST, "partNumbers is required");
        }
        if (partNumbers.size() > MAX_URL_BATCH_SIZE) {
            throw new FileBusinessException(ErrorCode.BAD_REQUEST, "partNumbers batch exceeds 50");
        }

        boolean single = session.getUploadId() == null;
        if (single) {
            if (partNumbers.size() != 1 || !Integer.valueOf(1).equals(partNumbers.get(0))) {
                throw new FileBusinessException(ErrorCode.BAD_REQUEST, "uploadMode SINGLE only accepts partNumbers: [1]");
            }
            return;
        }

        java.util.Set<Integer> seen = new java.util.HashSet<>();
        for (Integer n : partNumbers) {
            if (n == null || n < 1 || n > session.getPartCount()) {
                throw new FileBusinessException(ErrorCode.BAD_REQUEST,
                        "partNumber " + n + " out of range [1.." + session.getPartCount() + "]");
            }
            if (!seen.add(n)) {
                throw new FileBusinessException(ErrorCode.BAD_REQUEST, "duplicate partNumber " + n);
            }
        }
    }

    // -------------------------------------------------------------------------
    // E3 — status / resume
    // -------------------------------------------------------------------------

    @Override
    public UploadSessionStatusResponseDto getStatus(String sessionId) {
        String currentUserId = auditService.getCurrentUserId();
        UploadSessionEntity session = get(sessionId, currentUserId);

        if (session.getStatus() == UploadSessionStatus.COMPLETED) {
            return UploadSessionStatusResponseDto.builder()
                    .sessionId(session.getSessionId())
                    .status(session.getStatus())
                    .uploadMode(resolveUploadMode(session))
                    .partSize(session.getPartSize())
                    .partCount(session.getPartCount())
                    .declaredSize(session.getDeclaredSize())
                    .receivedParts(List.of())
                    .uploadedBytes(session.getDeclaredSize())
                    .expiresAt(session.getExpiresAt())
                    .hardExpiresAt(session.getHardExpiresAt())
                    .resource(buildResourceResponse(session))
                    .build();
        }

        if (session.getStatus() == UploadSessionStatus.ABORTED) {
            return UploadSessionStatusResponseDto.builder()
                    .sessionId(session.getSessionId())
                    .status(session.getStatus())
                    .uploadMode(resolveUploadMode(session))
                    .partSize(session.getPartSize())
                    .partCount(session.getPartCount())
                    .declaredSize(session.getDeclaredSize())
                    .receivedParts(List.of())
                    .uploadedBytes(0L)
                    .expiresAt(session.getExpiresAt())
                    .hardExpiresAt(session.getHardExpiresAt())
                    .resource(null)
                    .build();
        }

        boolean single = session.getUploadId() == null;
        List<ReceivedPartDto> receivedParts = single
                ? headObjectAsReceivedPart(session)
                : storageService.listParts(session.getObjectName(), session.getUploadId()).stream()
                        .map(p -> ReceivedPartDto.builder().partNumber(p.partNumber()).size(p.size()).etag(p.etag()).build())
                        .toList();

        long uploadedBytes = receivedParts.stream().mapToLong(ReceivedPartDto::getSize).sum();
        UploadSessionEntity touched = touch(session);

        return UploadSessionStatusResponseDto.builder()
                .sessionId(touched.getSessionId())
                .status(touched.getStatus())
                .uploadMode(resolveUploadMode(touched))
                .partSize(touched.getPartSize())
                .partCount(touched.getPartCount())
                .declaredSize(touched.getDeclaredSize())
                .receivedParts(receivedParts)
                .uploadedBytes(uploadedBytes)
                .expiresAt(touched.getExpiresAt())
                .hardExpiresAt(touched.getHardExpiresAt())
                .resource(null)
                .build();
    }

    private List<ReceivedPartDto> headObjectAsReceivedPart(UploadSessionEntity session) {
        try {
            StorageService.HeadObjectResult head = storageService.headObject(session.getObjectName());
            return List.of(ReceivedPartDto.builder()
                    .partNumber(1)
                    .size(head.contentLength())
                    .etag(head.etag())
                    .build());
        } catch (FileBusinessException e) {
            return List.of();
        }
    }

    private UploadResourceResponseDto buildResourceResponse(UploadSessionEntity session) {
        MetadataEntity metadata = metadataRepo.findById(session.getMetadataId())
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FILE_NOT_FOUND));

        return UploadResourceResponseDto.builder()
                .sessionId(session.getSessionId())
                .assetId(session.getAssetId())
                .fileId(metadata.getFileId())
                .versionNumber(metadata.getVersionNumber() != null ? metadata.getVersionNumber() : 0)
                .objectName(session.getObjectName())
                .fileName(metadata.getFileName())
                .fileSize(metadata.getFileSize() != null ? metadata.getFileSize().longValue() : session.getDeclaredSize())
                .etag(session.getResultEtag())
                .mimeType(metadata.getMimeType())
                .mediaType(metadata.getMediaType())
                .uploadStatus(UploadStatus.COMPLETED)
                .processingStatus(metadata.getProcessingStatus())
                .completedAt(session.getCompletedAt())
                .build();
    }

    // -------------------------------------------------------------------------
    // E4 — complete (verify + commit, idempotent)
    // -------------------------------------------------------------------------

    @Override
    public UploadResourceResponseDto complete(String sessionId, List<CompletedPartDto> parts) {
        String currentUserId = auditService.getCurrentUserId();
        UploadSessionEntity session = get(sessionId, currentUserId);

        if (session.getStatus() == UploadSessionStatus.COMPLETED) {
            return buildResourceResponse(session);
        }
        if (session.getStatus() == UploadSessionStatus.ABORTED || session.getStatus() == UploadSessionStatus.EXPIRED) {
            throw new FileBusinessException(ErrorCode.SESSION_INVALID_STATE,
                    "Session is " + session.getStatus() + ", please start a new upload");
        }
        if (parts == null || parts.isEmpty()) {
            throw new FileBusinessException(ErrorCode.BAD_REQUEST, "parts list is required");
        }

        Map<Integer, String> partMd5 = new LinkedHashMap<>();
        for (CompletedPartDto p : parts) {
            partMd5.put(p.getPartNumber(), p.getMd5());
        }
        session.setPartMd5(partMd5);
        uploadSessionRepo.save(session);

        boolean single = session.getUploadId() == null;
        long actualSize;
        String resultEtag;

        if (single) {
            StorageService.HeadObjectResult head = storageService.headObject(session.getObjectName());
            if (head.contentLength() != session.getDeclaredSize()) {
                throw new FileBusinessException(ErrorCode.SIZE_MISMATCH,
                        "Expected " + session.getDeclaredSize() + " bytes, got " + head.contentLength());
            }
            if (verifyEtagMd5) {
                String md5 = partMd5.get(1);
                if (md5 == null) {
                    throw new FileBusinessException(ErrorCode.CHECKSUM_MISMATCH, "Missing md5 for part 1");
                }
                if (!md5.equalsIgnoreCase(stripQuotes(head.etag()))) {
                    throw new FileBusinessException(ErrorCode.CHECKSUM_MISMATCH, "Checksum mismatch at parts: [1]");
                }
            }
            resultEtag = head.etag();
            actualSize = head.contentLength();
        } else {
            List<StorageService.PartSummary> listParts = storageService.listParts(session.getObjectName(), session.getUploadId());
            Map<Integer, StorageService.PartSummary> byNumber = new LinkedHashMap<>();
            for (StorageService.PartSummary ps : listParts) {
                byNumber.put(ps.partNumber(), ps);
            }

            List<Integer> missing = new ArrayList<>();
            for (int n = 1; n <= session.getPartCount(); n++) {
                if (!byNumber.containsKey(n)) {
                    missing.add(n);
                }
            }
            if (!missing.isEmpty()) {
                throw new FileBusinessException(ErrorCode.UPLOAD_INCOMPLETE, "Missing parts: " + missing);
            }

            long totalSize = 0L;
            for (StorageService.PartSummary ps : listParts) {
                totalSize += ps.size();
            }
            if (totalSize != session.getDeclaredSize()) {
                throw new FileBusinessException(ErrorCode.SIZE_MISMATCH,
                        "Expected " + session.getDeclaredSize() + " bytes, got " + totalSize);
            }

            List<Integer> missingMd5 = new ArrayList<>();
            for (StorageService.PartSummary ps : listParts) {
                if (!partMd5.containsKey(ps.partNumber())) {
                    missingMd5.add(ps.partNumber());
                }
            }
            if (!missingMd5.isEmpty()) {
                throw new FileBusinessException(ErrorCode.CHECKSUM_MISMATCH, "Missing md5 for part " + missingMd5.get(0));
            }

            if (verifyEtagMd5) {
                List<Integer> mismatched = new ArrayList<>();
                for (StorageService.PartSummary ps : listParts) {
                    String expected = partMd5.get(ps.partNumber());
                    if (expected == null || !ps.etag().equalsIgnoreCase(expected)) {
                        mismatched.add(ps.partNumber());
                    }
                }
                if (!mismatched.isEmpty()) {
                    throw new FileBusinessException(ErrorCode.CHECKSUM_MISMATCH, "Checksum mismatch at parts: " + mismatched);
                }
            }

            List<StorageService.CompletedPartSpec> specs = listParts.stream()
                    .map(ps -> new StorageService.CompletedPartSpec(ps.partNumber(), ps.etag()))
                    .toList();
            resultEtag = storageService.completeMultipartUpload(session.getObjectName(), session.getUploadId(), specs);
            actualSize = storageService.headObject(session.getObjectName()).contentLength();
        }

        MetadataEntity updatedMetadata = metadataService.markUploadCompleted(session.getMetadataId(), actualSize);

        UploadSessionEntity claimed = claimCompletion(session, resultEtag);
        if (claimed != null) {
            metadataService.publishProcessingJob(updatedMetadata);
            return buildResourceResponse(claimed);
        }

        UploadSessionEntity latest = uploadSessionRepo.findById(sessionId)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.SESSION_NOT_FOUND, "Upload session not found: " + sessionId));
        return buildResourceResponse(latest);
    }

    private String stripQuotes(String s) {
        return s == null ? null : s.replace("\"", "");
    }

    /**
     * Atomic conditional transition INITIATED/UPLOADING -> COMPLETED (E4.4 mục 2).
     * Returns the updated session if this call won the race, null if another concurrent
     * complete() already flipped the status first.
     */
    private UploadSessionEntity claimCompletion(UploadSessionEntity session, String resultEtag) {
        Query query = new Query(Criteria.where("_id").is(session.getSessionId())
                .and("status").in(UploadSessionStatus.INITIATED, UploadSessionStatus.UPLOADING));
        Update update = new Update()
                .set("status", UploadSessionStatus.COMPLETED)
                .set("completedAt", Instant.now())
                .set("resultEtag", resultEtag);
        return mongoTemplate.findAndModify(query, update,
                FindAndModifyOptions.options().returnNew(true), UploadSessionEntity.class);
    }

    // -------------------------------------------------------------------------
    // E5 — abort
    // -------------------------------------------------------------------------

    @Override
    public AbortUploadSessionResponseDto abort(String sessionId) {
        String currentUserId = auditService.getCurrentUserId();
        UploadSessionEntity session = get(sessionId, currentUserId);

        if (session.getStatus() == UploadSessionStatus.ABORTED) {
            return AbortUploadSessionResponseDto.builder()
                    .sessionId(session.getSessionId())
                    .status(UploadSessionStatus.ABORTED)
                    .abortedAt(session.getCompletedAt())
                    .build();
        }
        if (session.getStatus() == UploadSessionStatus.COMPLETED) {
            throw new FileBusinessException(ErrorCode.SESSION_INVALID_STATE, "Session is COMPLETED, cannot abort");
        }

        boolean single = session.getUploadId() == null;
        if (!single) {
            storageService.abortMultipartUpload(session.getObjectName(), session.getUploadId());
        } else if (objectExists(session)) {
            minIoService.deleteFile(session.getObjectName());
        }

        UploadSessionEntity aborted = markAborted(session);
        metadataService.markUploadFailed(session.getMetadataId());

        return AbortUploadSessionResponseDto.builder()
                .sessionId(aborted.getSessionId())
                .status(aborted.getStatus())
                .abortedAt(aborted.getCompletedAt())
                .build();
    }

    private boolean objectExists(UploadSessionEntity session) {
        try {
            storageService.headObject(session.getObjectName());
            return true;
        } catch (FileBusinessException e) {
            return false;
        }
    }
}
