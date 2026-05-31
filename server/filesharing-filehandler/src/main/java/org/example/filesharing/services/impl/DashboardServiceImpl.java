package org.example.filesharing.services.impl;

import lombok.RequiredArgsConstructor;
import org.bson.Document;
import org.example.filesharing.entities.dtos.dashboard.DashboardOverviewDTO;
import org.example.filesharing.entities.dtos.dashboard.RecentActivityItemDTO;
import org.example.filesharing.entities.dtos.dashboard.ReviewStatsDTO;
import org.example.filesharing.entities.dtos.dashboard.StorageStatsDTO;
import org.example.filesharing.entities.models.AssetEntity;
import org.example.filesharing.entities.models.AuditLogEntity;
import org.example.filesharing.entities.models.FolderEntity;
import org.example.filesharing.entities.models.MetadataEntity;
import org.example.filesharing.entities.models.ProjectEntity;
import org.example.filesharing.enums.ReviewSessionStatus;
import org.example.filesharing.repositories.AssetRepo;
import org.example.filesharing.repositories.MetadataRepo;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.services.DashboardService;
import org.example.filesharing.utils.StringUtils;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import org.springframework.data.mongodb.core.aggregation.AggregationResults;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private static final int DEFAULT_LIMIT = 10;
    private static final int MAX_LIMIT = 50;
    private static final String COLLECTION_REVIEW_SESSIONS = "review_sessions";

    private final MongoTemplate mongoTemplate;
    private final AuditService auditService;
    private final AssetRepo assetRepo;
    private final MetadataRepo metadataRepo;

    @Override
    public DashboardOverviewDTO getOverview() {
        String userId = auditService.getCurrentUserId();
        List<ProjectEntity> projects = getAccessibleProjects(userId);
        List<String> projectIds = extractProjectIds(projects);

        if (projectIds.isEmpty()) {
            return DashboardOverviewDTO.builder()
                    .totalProjects(0)
                    .totalAssets(0)
                    .totalFolders(0)
                    .totalStorageBytes(0)
                    .build();
        }

        long totalProjects = projectIds.size();
        long totalAssets = countActiveAssets(projectIds);
        long totalFolders = countActiveFolders(projectIds);
        double totalStorageBytes = aggregateTotalStorage(projectIds);

        return DashboardOverviewDTO.builder()
                .totalProjects(totalProjects)
                .totalAssets(totalAssets)
                .totalFolders(totalFolders)
                .totalStorageBytes(totalStorageBytes)
                .build();
    }

    @Override
    public List<RecentActivityItemDTO> getRecentActivities(int limit) {
        String userId = auditService.getCurrentUserId();
        List<ProjectEntity> projects = getAccessibleProjects(userId);
        List<String> projectIds = extractProjectIds(projects);

        if (projectIds.isEmpty()) {
            return Collections.emptyList();
        }

        int resolvedLimit = resolveLimit(limit);
        Query query = new Query();
        query.addCriteria(Criteria.where("projectId").in(projectIds));
        query.addCriteria(Criteria.where("isActive").is(true));
        query.with(Sort.by(Sort.Direction.DESC, "timestamp"));
        query.limit(resolvedLimit);

        List<AuditLogEntity> logs = mongoTemplate.find(query, AuditLogEntity.class);
        List<RecentActivityItemDTO> items = new ArrayList<>();
        for (AuditLogEntity log : logs) {
            items.add(RecentActivityItemDTO.builder()
                    .logId(log.getLogId())
                    .actorId(log.getActorId())
                    .actorEmail(log.getActorEmail())
                    .action(log.getAction())
                    .targetType(log.getTargetType())
                    .targetId(log.getTargetId())
                    .targetName(log.getTargetName())
                    .assetId(log.getAssetId())
                    .projectId(log.getProjectId())
                    .timestamp(log.getTimestamp())
                    .build());
        }
        return items;
    }

    @Override
    public StorageStatsDTO getStorageStats() {
        String userId = auditService.getCurrentUserId();
        List<ProjectEntity> projects = getAccessibleProjects(userId);
        List<String> projectIds = extractProjectIds(projects);

        if (projectIds.isEmpty()) {
            return StorageStatsDTO.builder()
                    .totalStorageBytes(0)
                    .byMediaType(Collections.emptyList())
                    .byProject(Collections.emptyList())
                    .build();
        }

        Map<String, String> projectNameMap = mapProjectNames(projects);
        double totalStorageBytes = aggregateTotalStorage(projectIds);
        List<StorageStatsDTO.StorageByMediaTypeDTO> byMediaType = aggregateStorageByMediaType(projectIds);
        List<StorageStatsDTO.StorageByProjectDTO> byProject = aggregateStorageByProject(projectIds, projectNameMap);

        return StorageStatsDTO.builder()
                .totalStorageBytes(totalStorageBytes)
                .byMediaType(byMediaType)
                .byProject(byProject)
                .build();
    }

    @Override
    public ReviewStatsDTO getReviewStats() {
        String userId = auditService.getCurrentUserId();
        List<ProjectEntity> projects = getAccessibleProjects(userId);
        List<String> projectIds = extractProjectIds(projects);

        if (projectIds.isEmpty()) {
            return ReviewStatsDTO.builder()
                    .pendingCount(0)
                    .approvedCount(0)
                    .changesRequestedCount(0)
                    .noReviewSessionCount(0)
                    .byProject(Collections.emptyList())
                    .build();
        }

        Map<String, String> projectNameMap = mapProjectNames(projects);
        Map<String, ReviewCounter> byProjectCounts = aggregateReviewCounts(projectIds);
        long pendingCount = 0;
        long approvedCount = 0;
        long changesRequestedCount = 0;
        for (ReviewCounter counter : byProjectCounts.values()) {
            pendingCount += counter.pending;
            approvedCount += counter.approved;
            changesRequestedCount += counter.changesRequested;
        }

        long noReviewSessionCount = countAssetsWithoutReview(projectIds);
        List<ReviewStatsDTO.ReviewByProjectDTO> byProject = buildReviewByProject(projectIds, projectNameMap, byProjectCounts);

        return ReviewStatsDTO.builder()
                .pendingCount(pendingCount)
                .approvedCount(approvedCount)
                .changesRequestedCount(changesRequestedCount)
                .noReviewSessionCount(noReviewSessionCount)
                .byProject(byProject)
                .build();
    }

    private int resolveLimit(int limit) {
        if (limit <= 0) {
            return DEFAULT_LIMIT;
        }
        return Math.min(limit, MAX_LIMIT);
    }

    private List<ProjectEntity> getAccessibleProjects(String userId) {
        if (StringUtils.isNullOrBlank(userId)) {
            return Collections.emptyList();
        }

        Criteria accessCriteria = new Criteria().orOperator(
                Criteria.where("ownerId").is(userId),
                Criteria.where("collaborators.userId").is(userId)
        );

        Query query = new Query(accessCriteria);
        query.addCriteria(Criteria.where("isActive").is(true));
        query.addCriteria(Criteria.where("isTrash").ne(true));
        return mongoTemplate.find(query, ProjectEntity.class);
    }

    private List<String> extractProjectIds(List<ProjectEntity> projects) {
        if (projects == null || projects.isEmpty()) {
            return Collections.emptyList();
        }
        return projects.stream()
                .map(ProjectEntity::getProjectId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
    }

    private Map<String, String> mapProjectNames(List<ProjectEntity> projects) {
        Map<String, String> map = new HashMap<>();
        if (projects == null) {
            return map;
        }
        for (ProjectEntity project : projects) {
            if (project != null && project.getProjectId() != null) {
                map.put(project.getProjectId(), project.getProjectName());
            }
        }
        return map;
    }

    private long countActiveAssets(List<String> projectIds) {
        Query query = new Query();
        query.addCriteria(Criteria.where("projectId").in(projectIds));
        query.addCriteria(Criteria.where("isActive").is(true));
        query.addCriteria(Criteria.where("isTrash").ne(true));
        return mongoTemplate.count(query, AssetEntity.class);
    }

    private long countActiveFolders(List<String> projectIds) {
        Query query = new Query();
        query.addCriteria(Criteria.where("projectId").in(projectIds));
        query.addCriteria(Criteria.where("isActive").is(true));
        query.addCriteria(Criteria.where("isTrash").ne(true));
        return mongoTemplate.count(query, FolderEntity.class);
    }

    private double aggregateTotalStorage(List<String> projectIds) {
        List<AssetEntity> assets = fetchActiveAssets(projectIds);
        if (assets.isEmpty()) {
            return 0;
        }
        List<MetadataEntity> allMetadata = fetchMetadataForAssets(assets);
        return allMetadata.stream()
                .mapToDouble(m -> m.getFileSize() != null ? m.getFileSize() : 0)
                .sum();
    }

    private List<StorageStatsDTO.StorageByMediaTypeDTO> aggregateStorageByMediaType(List<String> projectIds) {
        List<AssetEntity> assets = fetchActiveAssets(projectIds);
        if (assets.isEmpty()) {
            return Collections.emptyList();
        }
        List<MetadataEntity> allMetadata = fetchMetadataForAssets(assets);

        Map<String, List<MetadataEntity>> byMediaType = new HashMap<>();
        for (MetadataEntity m : allMetadata) {
            String mediaType = m.getMediaType() != null ? m.getMediaType().name() : "UNKNOWN";
            byMediaType.computeIfAbsent(mediaType, k -> new ArrayList<>()).add(m);
        }

        List<StorageStatsDTO.StorageByMediaTypeDTO> response = new ArrayList<>();
        for (Map.Entry<String, List<MetadataEntity>> entry : byMediaType.entrySet()) {
            double storageBytes = entry.getValue().stream()
                    .mapToDouble(m -> m.getFileSize() != null ? m.getFileSize() : 0)
                    .sum();
            response.add(StorageStatsDTO.StorageByMediaTypeDTO.builder()
                    .mediaType(entry.getKey())
                    .fileCount((long) entry.getValue().size())
                    .storageBytes(storageBytes)
                    .build());
        }
        return response;
    }

    private List<StorageStatsDTO.StorageByProjectDTO> aggregateStorageByProject(List<String> projectIds, Map<String, String> projectNameMap) {
        List<AssetEntity> assets = fetchActiveAssets(projectIds);
        if (assets.isEmpty()) {
            return Collections.emptyList();
        }

        Map<String, String> assetToProject = new HashMap<>();
        for (AssetEntity asset : assets) {
            assetToProject.put(asset.getAssetId(), asset.getProjectId());
        }

        List<MetadataEntity> allMetadata = fetchMetadataForAssets(assets);

        Map<String, List<MetadataEntity>> metadataByProject = new HashMap<>();
        for (MetadataEntity m : allMetadata) {
            String projectId = assetToProject.get(m.getAssetId());
            if (projectId != null) {
                metadataByProject.computeIfAbsent(projectId, k -> new ArrayList<>()).add(m);
            }
        }

        List<StorageStatsDTO.StorageByProjectDTO> response = new ArrayList<>();
        for (String projectId : projectIds) {
            List<MetadataEntity> projectMetadata = metadataByProject.getOrDefault(projectId, Collections.emptyList());
            if (projectMetadata.isEmpty()) {
                continue;
            }
            double storageBytes = projectMetadata.stream()
                    .mapToDouble(m -> m.getFileSize() != null ? m.getFileSize() : 0)
                    .sum();
            response.add(StorageStatsDTO.StorageByProjectDTO.builder()
                    .projectId(projectId)
                    .projectName(projectNameMap.get(projectId))
                    .fileCount((long) projectMetadata.size())
                    .storageBytes(storageBytes)
                    .build());
        }
        return response;
    }

    private List<AssetEntity> fetchActiveAssets(List<String> projectIds) {
        Query query = new Query();
        query.addCriteria(Criteria.where("projectId").in(projectIds));
        query.addCriteria(Criteria.where("isActive").is(true));
        query.addCriteria(Criteria.where("isTrash").ne(true));
        return mongoTemplate.find(query, AssetEntity.class);
    }

    private List<MetadataEntity> fetchMetadataForAssets(List<AssetEntity> assets) {
        List<String> assetIds = assets.stream()
                .map(AssetEntity::getAssetId)
                .filter(Objects::nonNull)
                .toList();
        if (assetIds.isEmpty()) {
            return Collections.emptyList();
        }
        return metadataRepo.findByAssetIdIn(assetIds);
    }

    private Map<String, ReviewCounter> aggregateReviewCounts(List<String> projectIds) {
        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("projectId").in(projectIds)
                        .and("isActive").is(true)
                        .and("isTrash").ne(true)),
                Aggregation.group("projectId", "status")
                        .count().as("count"),
                Aggregation.project("count")
                        .and("_id.projectId").as("projectId")
                        .and("_id.status").as("status")
        );

        AggregationResults<Document> results = mongoTemplate.aggregate(aggregation, COLLECTION_REVIEW_SESSIONS, Document.class);
        Map<String, ReviewCounter> counters = new HashMap<>();
        for (Document doc : results.getMappedResults()) {
            String projectId = valueAsString(doc.get("projectId"));
            String statusValue = valueAsString(doc.get("status"));
            if (projectId == null || statusValue == null) {
                continue;
            }

            ReviewSessionStatus status;
            try {
                status = ReviewSessionStatus.valueOf(statusValue);
            } catch (IllegalArgumentException ex) {
                continue;
            }

            ReviewCounter counter = counters.computeIfAbsent(projectId, key -> new ReviewCounter());
            long count = toLong(doc.get("count"));
            switch (status) {
                case DRAFT, IN_REVIEW -> counter.pending += count;
                case APPROVED -> counter.approved += count;
                case REQUEST_CHANGES -> counter.changesRequested += count;
                default -> {
                }
            }
        }
        return counters;
    }

    private long countAssetsWithoutReview(List<String> projectIds) {
        Query query = new Query();
        query.addCriteria(Criteria.where("projectId").in(projectIds));
        query.addCriteria(Criteria.where("isActive").is(true));
        query.addCriteria(Criteria.where("isTrash").ne(true));
        query.addCriteria(new Criteria().orOperator(
                Criteria.where("latestReviewSessionId").is(null),
                Criteria.where("latestReviewSessionId").exists(false)
        ));
        return mongoTemplate.count(query, AssetEntity.class);
    }

    private List<ReviewStatsDTO.ReviewByProjectDTO> buildReviewByProject(
            List<String> projectIds,
            Map<String, String> projectNameMap,
            Map<String, ReviewCounter> counters) {
        List<ReviewStatsDTO.ReviewByProjectDTO> response = new ArrayList<>();
        for (String projectId : projectIds) {
            ReviewCounter counter = counters.get(projectId);
            if (counter == null) {
                continue;
            }
            response.add(ReviewStatsDTO.ReviewByProjectDTO.builder()
                    .projectId(projectId)
                    .projectName(projectNameMap.get(projectId))
                    .pendingCount(counter.pending)
                    .approvedCount(counter.approved)
                    .changesRequestedCount(counter.changesRequested)
                    .build());
        }
        return response;
    }

    private long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        return 0;
    }

    private String valueAsString(Object value) {
        if (value == null) {
            return null;
        }
        return value.toString();
    }

    private static class ReviewCounter {
        private long pending;
        private long approved;
        private long changesRequested;
    }
}
