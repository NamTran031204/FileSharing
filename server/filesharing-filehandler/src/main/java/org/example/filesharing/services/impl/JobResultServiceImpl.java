package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.AssetEntity;
import com.file.service.filesharing.core.entity.models.MediaRenditionEntity;
import com.file.service.filesharing.core.entity.models.MetadataEntity;
import com.file.service.filesharing.core.enums.ProcessingJobType;
import com.file.service.filesharing.core.enums.ProcessingStatus;
import com.file.service.filesharing.core.enums.RenditionStatus;
import com.file.service.filesharing.core.enums.RenditionType;
import com.file.service.filesharing.core.job.relay.JobResultMessage;
import com.file.service.filesharing.core.job.relay.JobResultStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.repositories.AssetRepo;
import org.example.filesharing.repositories.MediaRenditionRepo;
import org.example.filesharing.services.JobResultService;
import org.example.filesharing.services.SseService;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobResultServiceImpl implements JobResultService {

    private final MongoTemplate mongoTemplate;
    private final MediaRenditionRepo mediaRenditionRepo;
    private final AssetRepo assetRepo;
    private final SseService sseService;

    @Override
    public boolean apply(JobResultMessage msg) {
        if (msg.getMetadataId() == null || msg.getMetadataId().isBlank()
                || msg.getJobId() == null || msg.getAttemptId() == null) {
            log.warn("ket qua thieu metadataId/jobId/attemptId, bo qua: job={}", msg.getJobId());
            return false;
        }
        boolean ok = msg.getStatus() == JobResultStatus.SUCCEEDED;
        boolean isImage = msg.getJobType() == ProcessingJobType.TRANSCODE_IMAGE
                || msg.getJobType() == ProcessingJobType.TRANSCODE_RAW_IMAGE;
        Instant finished = msg.getFinishedAt() != null ? msg.getFinishedAt() : Instant.now();

        // Chi ap khi: job la job hien tai (hoac metadata chua ghi currentJobId) va attemptId moi hon ket qua da ap
        Query filter = Query.query(Criteria.where("_id").is(msg.getMetadataId())
                .and("currentJobId").in(null, msg.getJobId())
                .andOperator(new Criteria().orOperator(
                        Criteria.where("processingAttemptId").is(null),
                        Criteria.where("processingAttemptId").lt(msg.getAttemptId()))));

        Update update = new Update()
                .set("currentJobId", msg.getJobId())
                .set("processingAttemptId", msg.getAttemptId())
                .set("processingCompleteAt", finished)
                .set("processingStatus", ok ? ProcessingStatus.READY : ProcessingStatus.FAILED)
                .set("processingError", ok ? null : msg.getErrorMessage());
        if (ok && isImage && msg.getThumbnailUrl() != null) {
            update.set("thumbnailUrl", msg.getThumbnailUrl());
        }
        // Kich thuoc goc do worker do (sau xoay EXIF). Chi set 2 field theo dot-path, khong ghi de ca mediaInfo
        if (ok && isImage && msg.getWidth() != null && msg.getHeight() != null) {
            update.set("mediaInfo.width", msg.getWidth()).set("mediaInfo.height", msg.getHeight());
        }

        long matched = mongoTemplate.updateFirst(filter, update, MetadataEntity.class).getMatchedCount();
        if (matched == 0) {
            log.info("bo qua ket qua trung/cu: job={} attempt={} metadata={}", msg.getJobId(), msg.getAttemptId(), msg.getMetadataId());
            return false;
        }

        if (ok && msg.getJobType() == ProcessingJobType.TRANSCODE_HLS) {
            upsertHlsRendition(msg);
        }
        pushSse(msg, ok);
        log.info("da ap ket qua job={} attempt={} status={}", msg.getJobId(), msg.getAttemptId(), msg.getStatus());
        return true;
    }

    private void upsertHlsRendition(JobResultMessage msg) {
        String manifestKey = msg.getManifestKey();
        if (manifestKey == null || manifestKey.isBlank()) {
            return;
        }
        MediaRenditionEntity rendition = mediaRenditionRepo
                .findFirstByMetadataIdAndRenditionType(msg.getMetadataId(), RenditionType.HLS)
                .orElseGet(MediaRenditionEntity::new);
        rendition.setMetadataId(msg.getMetadataId());
        rendition.setAssetId(msg.getAssetId());
        rendition.setRenditionType(RenditionType.HLS);
        rendition.setProfile("ORIGINAL");
        rendition.setManifestKey(manifestKey);
        int idx = manifestKey.lastIndexOf('/');
        rendition.setSegmentPathPrefix(idx < 0 ? null : manifestKey.substring(0, idx + 1));
        rendition.setStatus(RenditionStatus.READY);
        mediaRenditionRepo.save(rendition);

        long count = mediaRenditionRepo.countByMetadataId(msg.getMetadataId());
        mongoTemplate.updateFirst(Query.query(Criteria.where("_id").is(msg.getMetadataId())),
                new Update().set("renditionCount", (int) count), MetadataEntity.class);
    }

    private void pushSse(JobResultMessage msg, boolean ok) {
        MetadataEntity m = mongoTemplate.findById(msg.getMetadataId(), MetadataEntity.class);
        if (m == null || m.getAssetId() == null) return;
        AssetEntity asset = assetRepo.findById(m.getAssetId()).orElse(null);
        if (asset == null || asset.getFolderId() == null) return;

        Map<String, Object> event = new HashMap<>();
        event.put("assetId", m.getAssetId());
        event.put("newStatus", ok ? ProcessingStatus.READY : ProcessingStatus.FAILED);
        event.put("thumbnailUrl", m.getThumbnailUrl());
        sseService.sendAssetStatusUpdate(asset.getFolderId(), event);
    }
}
