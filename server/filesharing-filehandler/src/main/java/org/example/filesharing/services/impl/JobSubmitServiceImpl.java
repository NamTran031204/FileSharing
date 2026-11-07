package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.MetadataEntity;
import com.file.service.filesharing.core.entity.models.ProcessingJobEntity;
import com.file.service.filesharing.core.enums.MediaType;
import com.file.service.filesharing.core.enums.ProcessingJobStatus;
import com.file.service.filesharing.core.enums.ProcessingJobType;
import lombok.extern.slf4j.Slf4j;
import org.bson.types.ObjectId;
import org.example.filesharing.services.JobSubmitService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Locale;
import java.util.Set;

@Service
@Slf4j
public class JobSubmitServiceImpl implements JobSubmitService {

    private static final Set<String> RAW_EXTENSIONS = Set.of("cr2", "nef", "arw");

    private final MongoTemplate mongoTemplate;
    private final int maxRetries;

    public JobSubmitServiceImpl(MongoTemplate mongoTemplate,
                                @Value("${job-submit.max-retries:3}") int maxRetries) {
        this.mongoTemplate = mongoTemplate;
        this.maxRetries = maxRetries;
    }

    @Override
    public String submit(MetadataEntity metadata) {
        ProcessingJobType type = resolveType(metadata);
        Instant now = Instant.now();

        Query filter = Query.query(Criteria.where("metadataId").is(metadata.getFileId()).and("jobType").is(type));
        Update upsert = new Update()
                .setOnInsert("_id", new ObjectId())
                .setOnInsert("status", ProcessingJobStatus.PENDING)
                .setOnInsert("dueAt", now)
                .setOnInsert("createdAt", now)
                .setOnInsert("scheduledAt", now)
                .setOnInsert("retryCount", 0)
                .setOnInsert("maxRetries", maxRetries)
                .setOnInsert("priority", 1)
                .setOnInsert("objectName", metadata.getObjectName())
                .setOnInsert("assetId", metadata.getAssetId())
                .setOnInsert("versionNumber", metadata.getVersionNumber());

        ProcessingJobEntity job = mongoTemplate.findAndModify(filter, upsert,
                FindAndModifyOptions.options().upsert(true).returnNew(true), ProcessingJobEntity.class);
        String jobId = job.getJobId();

        mongoTemplate.updateFirst(Query.query(Criteria.where("_id").is(metadata.getFileId())),
                new Update().set("currentJobId", jobId), MetadataEntity.class);
        log.info("submit job={} type={} metadataId={}", jobId, type, metadata.getFileId());
        return jobId;
    }

    private ProcessingJobType resolveType(MetadataEntity m) {
        if (m.getMediaType() == MediaType.VIDEO) {
            return ProcessingJobType.TRANSCODE_HLS;
        }
        String name = m.getObjectName() == null ? "" : m.getObjectName();
        int dot = name.lastIndexOf('.');
        String ext = dot >= 0 ? name.substring(dot + 1).toLowerCase(Locale.ROOT) : "";
        return RAW_EXTENSIONS.contains(ext) ? ProcessingJobType.TRANSCODE_RAW_IMAGE : ProcessingJobType.TRANSCODE_IMAGE;
    }
}
