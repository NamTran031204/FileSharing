package org.example.filesharing.configurations;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import com.file.service.filesharing.core.setting.RuntimeSettings;
import com.file.service.filesharing.core.setting.SettingKey;
import org.bson.Document;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.data.mongodb.core.index.PartialIndexFilter;

import java.time.Duration;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class MongoIndexBootstrapConfig {

    private final MongoTemplate mongoTemplate;
    private final RuntimeSettings runtimeSettings;

    // order 0 de AdminSeedRunner (order 10) luon chay sau khi index user da co
    @Bean
    @Order(0)
    public ApplicationRunner mongoIndexBootstrapRunner() {
        return args -> {
            applyUsersIndexes();
            applyMetadataIndexes();
            applyAssetIndexes();
            applyProjectsIndexes();
            applyFolderIndexes();
            applyMediaRenditionsIndexes();
            applyAnnotationsIndexes();
            applyCommentThreadsIndexes();
            applyReviewSessionsIndexes();
            applyProcessingJobsIndexes();
            applyAuditLogsIndexes();
            applyNotificationsIndexes();
            applyUploadSessionsIndexes();
            applyProofSelectionIndexes();
            applyWorkerNodesIndexes();
            applyAdminRolesIndexes();

            log.info("Mongo indexes bootstrap completed.");
        };
    }

    private void applyUsersIndexes() {
        IndexOperations ops = mongoTemplate.indexOps("user");
        ops.createIndex(new Index().on("email", Sort.Direction.ASC).unique());
        ops.createIndex(new Index()
                .on("providers.provider", Sort.Direction.ASC)
                .on("providers.providerId", Sort.Direction.ASC));
        // dem/liet ke user theo nhom quyen quan tri
        ops.createIndex(new Index().on("adminRoleIds", Sort.Direction.ASC));
    }

    private void applyAdminRolesIndexes() {
        IndexOperations ops = mongoTemplate.indexOps("admin_roles");
        ops.createIndex(new Index().on("code", Sort.Direction.ASC).unique());
    }

    private void applyMetadataIndexes() {
        IndexOperations ops = mongoTemplate.indexOps("metadata");
        ops.createIndex(new Index()
                .on("ownerId", Sort.Direction.ASC)
                .on("isTrash", Sort.Direction.ASC)
                .on("createdAt", Sort.Direction.DESC));
        ops.createIndex(new Index().on("objectName", Sort.Direction.ASC));
        ops.createIndex(new Index().on("shareToken", Sort.Direction.ASC));
        ops.createIndex(new Index()
                .on("visibility", Sort.Direction.ASC)
                .on("publicPermission", Sort.Direction.ASC));
        ops.createIndex(new Index().on("userPermissions.userId", Sort.Direction.ASC));
        ops.createIndex(new Index().on("latestReviewStatus", Sort.Direction.ASC));
        ops.createIndex(new Index()
                .on("assetId", Sort.Direction.ASC)
                .on("versionNumber", Sort.Direction.ASC));
    }

    private void applyAssetIndexes() {
        IndexOperations ops = mongoTemplate.indexOps("asset");
        ops.createIndex(new Index().on("assetId", Sort.Direction.ASC));
        ops.createIndex(new Index()
                .on("folderId", Sort.Direction.ASC)
                .on("assetId", Sort.Direction.ASC));
        ops.createIndex(new Index()
                .on("projectId", Sort.Direction.ASC)
                .on("folderId", Sort.Direction.ASC));
        ops.createIndex(new Index()
                .on("projectId", Sort.Direction.ASC)
                .on("assetId", Sort.Direction.ASC));
    }

    private void applyProjectsIndexes() {
        IndexOperations ops = mongoTemplate.indexOps("projects");
        ops.createIndex(new Index()
                .on("ownerId", Sort.Direction.ASC)
                .on("createdAt", Sort.Direction.DESC));
        ops.createIndex(new Index().on("projectCode", Sort.Direction.ASC));
        ops.createIndex(new Index()
                .on("status", Sort.Direction.ASC)
                .on("updatedAt", Sort.Direction.DESC));
        ops.createIndex(new Index().on("collaborators.userId", Sort.Direction.ASC));
        ops.createIndex(new Index().on("category", Sort.Direction.ASC));
    }

    private void applyFolderIndexes() {
        IndexOperations ops = mongoTemplate.indexOps("folder");
        ops.createIndex(new Index()
                .on("projectId", Sort.Direction.ASC)
                .on("parentFolderId", Sort.Direction.ASC));
        ops.createIndex(new Index()
                .on("projectId", Sort.Direction.ASC)
                .on("ancestorIds", Sort.Direction.ASC));
        ops.createIndex(new Index().on("folderId", Sort.Direction.ASC));
        ops.createIndex(new Index().on("parentFolderId", Sort.Direction.ASC));
        ops.createIndex(new Index().on("ancestorIds", Sort.Direction.ASC));
        // shared-with-me tim theo grants.userId; link tim theo token, unique chi tren token kieu string
        // (sparse van index gia tri null ghi tuong minh nen dung partial)
        ops.createIndex(new Index().on("grants.userId", Sort.Direction.ASC));
        ops.createIndex(new Index().on("link.token", Sort.Direction.ASC).unique()
                .partial(PartialIndexFilter.of(new Document("link.token", new Document("$type", "string")))));
    }

    // heartbeat 5s, TTL 60s: node chet bien mat sau khoang 60-120s (TTL monitor quet moi 60s)
    private void applyWorkerNodesIndexes() {
        IndexOperations ops = mongoTemplate.indexOps("worker_nodes");
        ops.createIndex(new Index().on("lastSeenAt", Sort.Direction.ASC).expire(Duration.ofSeconds(60)));
        ops.createIndex(new Index().on("service", Sort.Direction.ASC));
    }

    private void applyProofSelectionIndexes() {
        IndexOperations ops = mongoTemplate.indexOps("proof_selection");
        ops.createIndex(new Index().on("guestKeyHash", Sort.Direction.ASC).unique());
        ops.createIndex(new Index()
                .on("folderId", Sort.Direction.ASC)
                .on("status", Sort.Direction.ASC)
                .on("submittedAt", Sort.Direction.DESC));
    }

    private void applyMediaRenditionsIndexes() {
        IndexOperations ops = mongoTemplate.indexOps("media_renditions");
        ops.createIndex(new Index()
                .on("metadataId", Sort.Direction.ASC)
                .on("renditionType", Sort.Direction.ASC));
        ops.createIndex(new Index().on("assetId", Sort.Direction.ASC));
        ops.createIndex(new Index().on("status", Sort.Direction.ASC));
    }

    private void applyAnnotationsIndexes() {
        IndexOperations ops = mongoTemplate.indexOps("annotations");
        ops.createIndex(new Index()
                .on("versionId", Sort.Direction.ASC)
                .on("createdAt", Sort.Direction.DESC));
        ops.createIndex(new Index()
                .on("assetId", Sort.Direction.ASC)
                .on("versionId", Sort.Direction.ASC));
        ops.createIndex(new Index()
                .on("versionId", Sort.Direction.ASC)
                .on("status", Sort.Direction.ASC));
        ops.createIndex(new Index()
                .on("versionId", Sort.Direction.ASC)
                .on("timecode.startMs", Sort.Direction.ASC));
        ops.createIndex(new Index().on("threadId", Sort.Direction.ASC));
        ops.createIndex(new Index().on("createdBy", Sort.Direction.ASC));
    }

    private void applyCommentThreadsIndexes() {
        IndexOperations ops = mongoTemplate.indexOps("comment_threads");
        ops.createIndex(new Index()
                .on("versionId", Sort.Direction.ASC)
                .on("lastActivityAt", Sort.Direction.DESC));
        ops.createIndex(new Index()
                .on("assetId", Sort.Direction.ASC)
                .on("versionId", Sort.Direction.ASC));
        ops.createIndex(new Index().on("annotations", Sort.Direction.ASC));
        ops.createIndex(new Index().on("participants", Sort.Direction.ASC));
        ops.createIndex(new Index().on("status", Sort.Direction.ASC));
        ops.createIndex(new Index().on("rootComment.mentions", Sort.Direction.ASC));
    }

    private void applyReviewSessionsIndexes() {
        IndexOperations ops = mongoTemplate.indexOps("review_sessions");
        ops.createIndex(new Index()
                .on("assetId", Sort.Direction.ASC)
                .on("createdAt", Sort.Direction.DESC));
        ops.createIndex(new Index()
                .on("status", Sort.Direction.ASC)
                .on("dueDate", Sort.Direction.ASC));
        ops.createIndex(new Index()
                .on("reviewers.userId", Sort.Direction.ASC)
                .on("status", Sort.Direction.ASC));
        ops.createIndex(new Index().on("dueDate", Sort.Direction.ASC));
        ops.createIndex(new Index()
                .on("createdBy", Sort.Direction.ASC)
                .on("status", Sort.Direction.ASC));
        ops.createIndex(new Index().on("versionId", Sort.Direction.ASC));
    }

    private void applyProcessingJobsIndexes() {
        IndexOperations ops = mongoTemplate.indexOps("processing_jobs");
        ops.createIndex(new Index()
                .on("status", Sort.Direction.ASC)
                .on("priority", Sort.Direction.ASC)
                .on("scheduledAt", Sort.Direction.ASC));
        // JobClaimer.claimOne - thieu index nay thi findAndModify quet toan collection
        ops.createIndex(new Index()
                .on("status", Sort.Direction.ASC)
                .on("jobType", Sort.Direction.ASC)
                .on("dueAt", Sort.Direction.ASC));
        // LeaseReaper.reap
        ops.createIndex(new Index()
                .on("status", Sort.Direction.ASC)
                .on("leaseUntil", Sort.Direction.ASC));
        ops.createIndex(new Index().on("metadataId", Sort.Direction.ASC));
        // Moi {metadataId, jobType} toi da 1 job: nen tang cua JobSubmitService.submit (upsert idempotent)
        ops.createIndex(new Index()
                .on("metadataId", Sort.Direction.ASC)
                .on("jobType", Sort.Direction.ASC)
                .unique()
                .partial(org.springframework.data.mongodb.core.index.PartialIndexFilter.of(
                        org.springframework.data.mongodb.core.query.Criteria.where("metadataId").type(org.bson.BsonType.STRING.getValue()))));
        // JobStore.claimOne: sort priority DESC, dueAt ASC
        ops.createIndex(new Index()
                .on("status", Sort.Direction.ASC)
                .on("jobType", Sort.Direction.ASC)
                .on("priority", Sort.Direction.DESC)
                .on("dueAt", Sort.Direction.ASC));
        // JobResultRelay.claimUnpublishedResult
        ops.createIndex(new Index()
                .on("status", Sort.Direction.ASC)
                .on("jobType", Sort.Direction.ASC)
                .on("resultPublishedAt", Sort.Direction.ASC));
        ops.createIndex(new Index()
                .on("workerId", Sort.Direction.ASC)
                .on("status", Sort.Direction.ASC));
        ops.createIndex(new Index().on("workerHeartbeat", Sort.Direction.ASC));
        applyTtlIndex("processing_jobs", ops,
                new Index().on("createdAt", Sort.Direction.ASC).named("createdAt_1"),
                "createdAt_1", runtimeSettings.duration(SettingKey.RETENTION_PROCESSING_JOBS));
    }

    // index TTL da co thi doi expireAfterSeconds bang collMod (createIndex lai se loi IndexOptionsConflict)
    private void applyTtlIndex(String collection, IndexOperations ops, Index index, String name, Duration ttl) {
        boolean exists = ops.getIndexInfo().stream().anyMatch(i -> name.equals(i.getName()));
        if (!exists) {
            ops.createIndex(index.expire(ttl));
            return;
        }
        long seconds = ttl.toSeconds();
        boolean same = ops.getIndexInfo().stream()
                .filter(i -> name.equals(i.getName()))
                .anyMatch(i -> i.getExpireAfter().map(d -> d.toSeconds() == seconds).orElse(false));
        if (!same) {
            mongoTemplate.getDb().runCommand(new Document("collMod", collection)
                    .append("index", new Document("name", name).append("expireAfterSeconds", seconds)));
            log.info("Doi TTL index {}.{} thanh {}s", collection, name, seconds);
        }
    }

    private void applyAuditLogsIndexes() {
        IndexOperations ops = mongoTemplate.indexOps("audit_logs");
        ops.createIndex(new Index()
                .on("actorId", Sort.Direction.ASC)
                .on("timestamp", Sort.Direction.DESC));
        ops.createIndex(new Index()
                .on("targetType", Sort.Direction.ASC)
                .on("targetId", Sort.Direction.ASC)
                .on("timestamp", Sort.Direction.DESC));
        ops.createIndex(new Index()
                .on("assetId", Sort.Direction.ASC)
                .on("timestamp", Sort.Direction.DESC));
        ops.createIndex(new Index()
                .on("action", Sort.Direction.ASC)
                .on("timestamp", Sort.Direction.DESC));
        ops.createIndex(new Index().on("timestamp", Sort.Direction.DESC));
        ops.createIndex(new Index().on("expiresAt", Sort.Direction.ASC).expire(Duration.ZERO));
    }

    private void applyNotificationsIndexes() {
        IndexOperations ops = mongoTemplate.indexOps("notifications");
        ops.createIndex(new Index()
                .on("userId", Sort.Direction.ASC)
                .on("isRead", Sort.Direction.ASC)
                .on("createdAt", Sort.Direction.DESC));
        ops.createIndex(new Index()
                .on("userId", Sort.Direction.ASC)
                .on("createdAt", Sort.Direction.DESC));
        ops.createIndex(new Index().on("expiresAt", Sort.Direction.ASC).expire(Duration.ZERO));
        ops.createIndex(new Index().on("deliveryStatus.email", Sort.Direction.ASC));
    }

    private void applyUploadSessionsIndexes() {
        IndexOperations ops = mongoTemplate.indexOps("upload_sessions");
        applyTtlIndex("upload_sessions", ops,
                new Index().on("expiresAt", Sort.Direction.ASC).named("idx_upload_sessions_ttl"),
                "idx_upload_sessions_ttl", runtimeSettings.duration(SettingKey.RETENTION_UPLOAD_SESSIONS));
        ops.createIndex(new Index()
                .on("ownerId", Sort.Direction.ASC)
                .on("status", Sort.Direction.ASC)
                .named("idx_upload_sessions_owner_status"));
        ops.createIndex(new Index()
                .on("status", Sort.Direction.ASC)
                .on("expiresAt", Sort.Direction.ASC)
                .named("idx_upload_sessions_status_expires"));
        ops.createIndex(new Index()
                .on("uploadId", Sort.Direction.ASC)
                .named("idx_upload_sessions_upload_id")
                .sparse());
    }
}