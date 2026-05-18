package org.example.filesharing.configurations;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.IndexOperations;

import java.time.Duration;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class MongoIndexBootstrapConfig {

    private static final Duration PROCESSING_JOBS_TTL = Duration.ofDays(30);

    private final MongoTemplate mongoTemplate;

    @Bean
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

            log.info("Mongo indexes bootstrap completed.");
        };
    }

    private void applyUsersIndexes() {
        IndexOperations ops = mongoTemplate.indexOps("users");
        ops.createIndex(new Index().on("email", Sort.Direction.ASC));
        ops.createIndex(new Index()
                .on("providers.provider", Sort.Direction.ASC)
                .on("providers.providerId", Sort.Direction.ASC));
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
        ops.createIndex(new Index().on("permissions.userId", Sort.Direction.ASC));
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
        ops.createIndex(new Index().on("metadataId", Sort.Direction.ASC));
        ops.createIndex(new Index()
                .on("workerId", Sort.Direction.ASC)
                .on("status", Sort.Direction.ASC));
        ops.createIndex(new Index().on("workerHeartbeat", Sort.Direction.ASC));
        ops.createIndex(new Index().on("createdAt", Sort.Direction.ASC).expire(PROCESSING_JOBS_TTL));
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
}