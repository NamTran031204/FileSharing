package org.example.filesharing.services.impl;

import lombok.RequiredArgsConstructor;
import com.file.service.filesharing.core.entity.PageRequestDto;
import com.file.service.filesharing.core.entity.PageResult;
import org.example.filesharing.entities.dtos.access.MyAccessDTO;
import org.example.filesharing.entities.dtos.auditlog.AuditLogCreateDTO;
import org.example.filesharing.entities.dtos.folder.FolderArchiveResponseDTO;
import org.example.filesharing.entities.dtos.folder.FolderCreateRequestDTO;
import org.example.filesharing.entities.dtos.folder.FolderDetailDTO;
import org.example.filesharing.entities.dtos.folder.FolderFilterRequestDTO;
import org.example.filesharing.entities.dtos.folder.FolderListItemDTO;
import org.example.filesharing.entities.dtos.folder.FolderTreeCreateRequestDTO;
import org.example.filesharing.entities.dtos.folder.FolderTreeCreateResponseDTO;
import org.example.filesharing.entities.dtos.folder.FolderTreeItemDTO;
import org.example.filesharing.entities.dtos.folder.FolderTreeMappingDTO;
import org.example.filesharing.entities.dtos.folder.FolderTreeNodeDTO;
import org.example.filesharing.entities.dtos.folder.FolderTreeResponseDTO;
import org.example.filesharing.entities.dtos.folder.FolderUpdateRequestDTO;
import com.file.service.filesharing.core.entity.models.auditlog.AuditChanges;
import com.file.service.filesharing.core.entity.models.folder.FolderStats;
import com.file.service.filesharing.core.entity.models.project.ProjectStats;
import com.file.service.filesharing.core.entity.models.AssetEntity;
import com.file.service.filesharing.core.entity.models.FolderEntity;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
import com.file.service.filesharing.core.entity.models.base.EntityAuditBase;
import com.file.service.filesharing.core.enums.AuditAction;
import com.file.service.filesharing.core.enums.AuditTargetType;
import com.file.service.filesharing.core.enums.access.AccessRole;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import com.file.service.filesharing.core.exceptions.specException.UserBusinessException;
import org.example.filesharing.repositories.AssetRepo;
import org.example.filesharing.repositories.FolderRepo;
import org.example.filesharing.repositories.ProjectRepo;
import org.example.filesharing.services.AccessService;
import org.example.filesharing.services.AuditLogService;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.services.FolderService;
import org.example.filesharing.services.baseService.BaseAuditService;
import org.example.filesharing.utils.access.AccessContext;
import org.example.filesharing.utils.access.AccessResolver;
import org.example.filesharing.utils.access.Action;
import org.example.filesharing.utils.access.ResourceRef;
import com.file.service.filesharing.core.utils.StringUtils;
import org.springframework.data.domain.PageRequest;
import org.bson.Document;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.AggregationExpression;
import org.springframework.data.mongodb.core.aggregation.AggregationUpdate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import static com.file.service.filesharing.core.utils.StringUtils.requireNormalized;
import static com.file.service.filesharing.core.utils.StringUtils.trimToNull;

@Service
@RequiredArgsConstructor
public class FolderServiceImpl extends BaseAuditService<FolderEntity> implements FolderService {

    private final FolderRepo folderRepo;
    private final ProjectRepo projectRepo;
    private final AssetRepo assetRepo;
    private final MongoTemplate mongoTemplate;
    private final AuditService auditService;
    private final AuditLogService auditLogService;
    private final AccessService accessService;

    @Override
    @Transactional
    public FolderEntity createNewFolder(FolderCreateRequestDTO request) {
        validateCreatePayload(request);

        String projectId = request.getProjectId().trim();
        ProjectEntity project = getProjectOrThrow(projectId);

        String folderName = requireNormalized(request.getFolderName(), "folderName is required");
        String parentFolderId = trimToNull(request.getParentFolderId());

        FolderEntity parentFolder = null;
        if (parentFolderId != null) {
            parentFolder = getActiveFolderOrThrow(parentFolderId);
            ensureFolderInProject(parentFolder, project);
        }
        requireUpload(projectId, parentFolderId);

        ensureFolderNameUnique(projectId, parentFolderId, folderName, null);

        List<String> ancestorIds = buildAncestorIds(parentFolder);
        int level = parentFolder != null ? safeLevel(parentFolder.getLevel()) + 1 : 1;

        FolderEntity savedFolder = persistNewFolder(
                projectId, parentFolderId, folderName,
                trimToNull(request.getDescription()), ancestorIds, level);

        incrementProjectFolderCount(project, 1);
        if (parentFolder != null) {
            incrementParentSubfolderCount(parentFolder, 1);
        }

        writeFolderAuditLog(savedFolder, AuditAction.CREATE, null);
        return savedFolder;
    }

    @Override
    @Transactional
    public FolderTreeCreateResponseDTO createFolderTree(FolderTreeCreateRequestDTO request) {
        validateCreateTreePayload(request);

        String projectId = requireNormalized(request.getProjectId(), "projectId is required");
        ProjectEntity project = getProjectOrThrow(projectId);

        String parentFolderId = trimToNull(request.getParentFolderId());
        FolderEntity parentFolder = null;
        if (parentFolderId != null) {
            parentFolder = getActiveFolderOrThrow(parentFolderId);
            ensureFolderInProject(parentFolder, project);
        }
        // folder da co trong cay deu nam duoi cha nen UPLOAD tai cha la du (ke thua chi cong)
        requireUpload(projectId, parentFolderId);

        String rootFolderName = normalizeRelativeFolderPath(request.getRootFolderName(), "rootFolderName is required");

        List<FolderTreeNodeDTO> nodes = request.getFolders();
        Map<String, FolderTreeNodeDTO> normalizedNodes = new HashMap<>();

        for (FolderTreeNodeDTO node : nodes) {
            if (node == null) {
                throw new UserBusinessException(ErrorCode.BAD_REQUEST, "folders contains empty item");
            }

            String clientFolderKey = requireNormalized(node.getClientFolderKey(), "clientFolderKey is required");
            String folderName = requireNormalized(node.getFolderName(), "folderName is required");
            String relativePath = normalizeRelativeFolderPath(node.getRelativeFolderPath());
            String parentRelativePath = trimToNull(node.getParentRelativeFolderPath());
            if (parentRelativePath != null) {
                parentRelativePath = normalizeRelativeFolderPath(parentRelativePath, "parentRelativeFolderPath is required");
            }

            Integer level = node.getLevel();
            int pathLevel = countPathSegments(relativePath);
            if (level == null || level != pathLevel) {
                throw new UserBusinessException(ErrorCode.BAD_REQUEST, "level does not match relativeFolderPath");
            }

            String lastSegment = getLastPathSegment(relativePath);
            if (!Objects.equals(lastSegment, folderName)) {
                throw new UserBusinessException(ErrorCode.BAD_REQUEST, "folderName does not match relativeFolderPath");
            }

            if (normalizedNodes.containsKey(relativePath)) {
                throw new UserBusinessException(ErrorCode.BAD_REQUEST, "duplicate relativeFolderPath");
            }

            FolderTreeNodeDTO normalized = FolderTreeNodeDTO.builder()
                    .clientFolderKey(clientFolderKey)
                    .folderName(folderName)
                    .relativeFolderPath(relativePath)
                    .parentRelativeFolderPath(parentRelativePath)
                    .level(level)
                    .build();
            normalizedNodes.put(relativePath, normalized);
        }

        for (FolderTreeNodeDTO node : normalizedNodes.values()) {
            String parentRelativePath = trimToNull(node.getParentRelativeFolderPath());
            if (parentRelativePath != null && !normalizedNodes.containsKey(parentRelativePath)) {
                throw new FileBusinessException(ErrorCode.FOLDER_PARENT_NOT_FOUND);
            }
        }

        if (!normalizedNodes.containsKey(rootFolderName)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "rootFolderName not found in folders");
        }

        List<FolderTreeNodeDTO> sortedNodes = new ArrayList<>(normalizedNodes.values());
        sortedNodes.sort(Comparator.comparing(FolderTreeNodeDTO::getLevel)
                .thenComparing(FolderTreeNodeDTO::getRelativeFolderPath));

        // Track folderId and ancestorIds per relative path for building child chains
        Map<String, String> relativeToFolderId = new HashMap<>();
        Map<String, List<String>> relativeToAncestorIds = new HashMap<>();

        List<FolderTreeMappingDTO> folderMappings = new ArrayList<>();
        List<FolderTreeMappingDTO> createdFolders = new ArrayList<>();
        List<FolderTreeMappingDTO> existingFolders = new ArrayList<>();
        int createdCount = 0;

        // Precompute base ancestorIds from the external parent folder (if any)
        List<String> baseAncestorIds = buildAncestorIds(parentFolder);

        for (FolderTreeNodeDTO node : sortedNodes) {
            String parentRelativePath = trimToNull(node.getParentRelativeFolderPath());

            String effectiveParentId;
            List<String> parentAncestorIds;
            if (parentRelativePath != null) {
                effectiveParentId = relativeToFolderId.get(parentRelativePath);
                parentAncestorIds = relativeToAncestorIds.get(parentRelativePath);
            } else {
                effectiveParentId = parentFolderId;
                parentAncestorIds = baseAncestorIds;
            }

            if (parentRelativePath != null && effectiveParentId == null) {
                throw new FileBusinessException(ErrorCode.FOLDER_PARENT_NOT_FOUND);
            }

            FolderEntity existingFolder = folderRepo
                    .findByProjectIdAndParentFolderIdAndFolderName(projectId, effectiveParentId, node.getFolderName())
                    .orElse(null);

            if (existingFolder != null) {
                String folderId = existingFolder.getFolderId();
                relativeToFolderId.put(node.getRelativeFolderPath(), folderId);
                relativeToAncestorIds.put(node.getRelativeFolderPath(), existingFolder.getAncestorIds());

                FolderTreeMappingDTO mapping = buildFolderTreeMapping(node, folderId, existingFolder.getParentFolderId(), "EXISTING");
                folderMappings.add(mapping);
                existingFolders.add(mapping);
                continue;
            }

            List<String> nodeAncestorIds = buildAncestorIdsForNode(effectiveParentId, parentAncestorIds);

            FolderEntity saved = persistNewFolder(
                    projectId, effectiveParentId, node.getFolderName(),
                    null, nodeAncestorIds, node.getLevel());

            relativeToFolderId.put(node.getRelativeFolderPath(), saved.getFolderId());
            relativeToAncestorIds.put(node.getRelativeFolderPath(), nodeAncestorIds);

            FolderTreeMappingDTO mapping = buildFolderTreeMapping(node, saved.getFolderId(), effectiveParentId, "CREATED");
            folderMappings.add(mapping);
            createdFolders.add(mapping);
            createdCount++;

            if (effectiveParentId != null) {
                folderRepo.findById(effectiveParentId)
                        .ifPresent(parent -> incrementParentSubfolderCount(parent, 1));
            }

            writeFolderAuditLog(saved, AuditAction.CREATE, null);
        }

        if (createdCount != 0) {
            incrementProjectFolderCount(project, createdCount);
        }

        String rootFolderId = relativeToFolderId.get(rootFolderName);
        String folderUploadSessionId = generateFolderUploadSessionId(parentFolder, rootFolderName);

        return FolderTreeCreateResponseDTO.builder()
                .folderUploadSessionId(folderUploadSessionId)
                .projectId(projectId)
                .rootFolderId(rootFolderId)
                .createdFolders(createdFolders)
                .existingFolders(existingFolders)
                .folderMappings(folderMappings)
                .build();
    }

    @Override
    @Transactional
    public FolderEntity updateFolderDetail(FolderUpdateRequestDTO request) {
        validateUpdatePayload(request);

        FolderEntity folder = getActiveFolderOrThrow(request.getFolderId().trim());
        ProjectEntity project = getProjectOrThrow(folder.getProjectId());
        accessService.require(ResourceRef.folder(folder.getFolderId()), Action.EDIT);

        String updatedName = folder.getFolderName();
        if (request.getFolderName() != null) {
            updatedName = requireNormalized(request.getFolderName(), "folderName cannot be blank");
        }

        String updatedParentId = folder.getParentFolderId();
        if (request.getParentFolderId() != null) {
            updatedParentId = trimToNull(request.getParentFolderId());
        }

        String oldParentId = folder.getParentFolderId();
        boolean nameChanged = !Objects.equals(updatedName, folder.getFolderName());
        boolean parentChanged = !Objects.equals(updatedParentId, folder.getParentFolderId());

        FolderEntity targetParent = null;
        if (updatedParentId != null) {
            targetParent = getActiveFolderOrThrow(updatedParentId);
            ensureFolderInProject(targetParent, project);

            if (targetParent.getFolderId().equals(folder.getFolderId())) {
                throw new FileBusinessException(ErrorCode.FOLDER_CIRCULAR_REFERENCE);
            }

            if (isDescendantFolder(targetParent, folder)) {
                throw new FileBusinessException(ErrorCode.FOLDER_CIRCULAR_REFERENCE);
            }
        }
        if (parentChanged) {
            requireUpload(project.getProjectId(), updatedParentId);
        }

        if (nameChanged || parentChanged) {
            ensureFolderNameUnique(project.getProjectId(), updatedParentId, updatedName, folder.getFolderId());

            if (parentChanged) {
                // MOVE: rebuild ancestor chain for folder and all descendants
                List<String> newAncestorIds = buildAncestorIds(targetParent);
                int oldLevel = safeLevel(folder.getLevel());
                int newLevel = targetParent != null ? safeLevel(targetParent.getLevel()) + 1 : 1;
                int levelDelta = newLevel - oldLevel;

                // new prefix = [new ancestors of folder] + [folder itself]
                List<String> newPrefix = new ArrayList<>(newAncestorIds);
                newPrefix.add(folder.getFolderId());

                // con chau truoc, folder sau (giong thu tu cu)
                moveDescendants(folder.getFolderId(), newPrefix, levelDelta);

                folder.setParentFolderId(updatedParentId);
                folder.setAncestorIds(newAncestorIds);
                folder.setLevel(newLevel);

                adjustParentSubfolderCounts(oldParentId, updatedParentId);
            }

            if (nameChanged) {
                // RENAME: zero cascade — IDs don't change, only folderName on this document
                folder.setFolderName(updatedName);
            }
        }

        if (request.getDescription() != null) {
            folder.setDescription(trimToNull(request.getDescription()));
        }

        // $set dung cac truong endpoint nay doi, khong save() ca document de khong ghi de grants/link
        Update update = new Update().set("folderName", folder.getFolderName());
        setOrUnset(update, "ancestorIds", folder.getAncestorIds());
        setOrUnset(update, "level", folder.getLevel());
        setOrUnset(update, "parentFolderId", folder.getParentFolderId());
        setOrUnset(update, "description", folder.getDescription());
        updateFolder(folder, update);

        if (nameChanged || parentChanged || request.getDescription() != null) {
            writeFolderAuditLog(folder, AuditAction.UPDATE, null);
        }

        return folder;
    }

    @Override
    public FolderDetailDTO getFolderById(String folderId) {
        if (StringUtils.isNullOrBlank(folderId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "folderId is required");
        }

        // folder trong thung rac: AccessResolver chi tinh vai tro project >= EDITOR (= TRASH), bo qua grant folder/link
        AccessContext ctx = accessService.require(ResourceRef.folder(folderId.trim()), Action.VIEW);

        FolderEntity folder = folderRepo.findById(folderId.trim())
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FOLDER_NOT_FOUND));
        return FolderDetailDTO.of(folder, MyAccessDTO.from(ctx));
    }

    @Override
    public PageResult<FolderListItemDTO> getFolderPage(PageRequestDto<FolderFilterRequestDTO> dto) {
        PageRequestDto<FolderFilterRequestDTO> pageRequest = dto != null ? dto : new PageRequestDto<>();
        FolderFilterRequestDTO filter = pageRequest.getFilter();

        if (filter == null || StringUtils.isNullOrBlank(filter.getProjectId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }

        ProjectEntity project = getProjectOrThrow(filter.getProjectId().trim());

        String parentFolderId = trimToNull(filter.getParentFolderId());
        AccessRole parentRole = null;
        if (parentFolderId != null) {
            FolderEntity parent = getActiveFolderOrThrow(parentFolderId);
            ensureFolderInProject(parent, project);
            // con ke thua quyen cha (chi cong) nen chi kiem cha
            parentRole = accessService.require(ResourceRef.folder(parentFolderId), Action.VIEW).role();
        }

        Query query = new Query();
        query.addCriteria(Criteria.where("projectId").is(project.getProjectId()));

        if (parentFolderId != null) {
            query.addCriteria(Criteria.where("parentFolderId").is(parentFolderId));
        } else {
            query.addCriteria(Criteria.where("parentFolderId").is(null));
        }

        if (StringUtils.isNotNullOrBlank(filter.getFolderName())) {
            query.addCriteria(Criteria.where("folderName").regex(filter.getFolderName().trim(), "i"));
        }

        if (filter.getIsActive() != null) {
            query.addCriteria(Criteria.where("isActive").is(filter.getIsActive()));
        } else {
            query.addCriteria(Criteria.where("isActive").is(true));
        }

        if (filter.getIsTrash() != null) {
            query.addCriteria(Criteria.where("isTrash").is(filter.getIsActive()));
        } else {
            query.addCriteria(Criteria.where("isTrash").is(false));
        }

        long total;
        List<FolderEntity> data;
        if (parentFolderId == null) {
            // goc project: thanh vien thay het, nguoi khac chi thay goc truy cap; loc truoc roi moi phan trang
            PageRequest paging = pageRequest.getPageRequest();
            query.with(paging.getSort());
            List<FolderEntity> visible = accessService.filterVisible(project, mongoTemplate.find(query, FolderEntity.class));
            int from = (int) Math.min(paging.getOffset(), visible.size());
            int to = Math.min(from + paging.getPageSize(), visible.size());
            total = visible.size();
            data = new ArrayList<>(visible.subList(from, to));
        } else {
            total = mongoTemplate.count(query, FolderEntity.class);
            query.with(pageRequest.getPageRequest());
            data = mongoTemplate.find(query, FolderEntity.class);
        }

        String me = auditService.getCurrentUserId();
        Instant now = Instant.now();
        AccessRole inherited = parentRole;
        return PageResult.<FolderListItemDTO>builder()
                .totalCount(total)
                .data(data.stream()
                        .map(f -> FolderListItemDTO.of(f, maxRole(inherited, directRole(project, f, me, now))))
                        .toList())
                .build();
    }

    // vai tro tu project va grant/link tai chinh folder (khong tinh to tien), 0 query
    private static AccessRole directRole(ProjectEntity project, FolderEntity folder, String userId, Instant now) {
        return AccessResolver.resolve(project, List.of(folder), userId, now).role();
    }

    private static AccessRole maxRole(AccessRole a, AccessRole b) {
        return a == null ? b : a.atLeast(b) ? a : b;
    }

    @Override
    @Transactional
    public void deleteFolder(String folderId) {
        if (StringUtils.isNullOrBlank(folderId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "folderId is required");
        }

        FolderEntity folder = getTrashedFolderOrThrow(folderId.trim());
        accessService.require(ResourceRef.folder(folder.getFolderId()), Action.DELETE_PERMANENT);

        List<FolderEntity> descendants = folderRepo.findByAncestorIdsContaining(folder.getFolderId())
                .stream()
                .filter(f -> Boolean.TRUE.equals(f.getIsActive()))
                .toList();

        List<FolderEntity> toDelete = new ArrayList<>(descendants.size() + 1);
        toDelete.add(folder);
        toDelete.addAll(descendants);

        List<String> folderIds = toDelete.stream()
                .map(FolderEntity::getFolderId)
                .filter(StringUtils::isNotNullOrBlank)
                .toList();

        List<AssetEntity> assetsToDelete = assetRepo.findByFolderIdInAndIsActiveTrue(folderIds);
        for (AssetEntity asset : assetsToDelete) {
            asset.setIsActive(false);
            applyUpdateAudit(asset);
        }
        if (!assetsToDelete.isEmpty()) {
            assetRepo.saveAll(assetsToDelete);
        }

        mongoTemplate.updateMulti(Query.query(Criteria.where("_id").in(folderIds)),
                auditUpdate().set("isActive", false), FolderEntity.class);

        writeFolderAuditLog(folder, AuditAction.DELETE, null);
    }

    @Override
    public FolderTreeResponseDTO getFolderTree(String projectId) {
        if (StringUtils.isNullOrBlank(projectId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }

        ProjectEntity project = getProjectOrThrow(projectId.trim());

        List<FolderEntity> allFolders = folderRepo.findByProjectId(projectId.trim())
                .stream()
                .filter(f -> Boolean.TRUE.equals(f.getIsActive()) && !Boolean.TRUE.equals(f.getIsTrash()))
                .toList();
        List<FolderEntity> visible = accessService.filterVisible(project, allFolders);
        if (visible.isEmpty()) {
            // khong thay folder nao: thanh vien nhan cay rong, nguoi khong lien quan nhan ACCESS_DENIED
            accessService.require(ResourceRef.project(project.getProjectId()), Action.VIEW);
        }

        // folder co cha khong thay duoc la goc truy cap, dua len lam goc cay
        Set<String> visibleIds = visible.stream().map(FolderEntity::getFolderId).collect(Collectors.toSet());
        Map<String, List<FolderEntity>> childrenMap = visible.stream()
                .collect(Collectors.groupingBy(f -> visibleIds.contains(f.getParentFolderId())
                        ? f.getParentFolderId() : "__root__"));

        List<FolderEntity> roots = childrenMap.getOrDefault("__root__", List.of());
        String me = auditService.getCurrentUserId();
        Instant now = Instant.now();
        Function<FolderEntity, AccessRole> directRole = f -> directRole(project, f, me, now);
        // goc truy cap: to tien khong thay duoc nen khong cho them vai tro
        List<FolderTreeItemDTO> tree = roots.stream()
                .sorted(Comparator.comparing(FolderEntity::getFolderName))
                .map(root -> buildTreeNode(root, childrenMap, null, directRole))
                .toList();

        return FolderTreeResponseDTO.builder()
                .projectId(projectId.trim())
                .tree(tree)
                .build();
    }

    @Override
    @Transactional
    public FolderArchiveResponseDTO archiveFolder(String folderId) {
        if (StringUtils.isNullOrBlank(folderId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "folderId is required");
        }

        FolderEntity folder = getActiveFolderOrThrow(folderId.trim());
        ProjectEntity project = getProjectOrThrow(folder.getProjectId());
        accessService.require(ResourceRef.folder(folder.getFolderId()), Action.TRASH);

        List<FolderEntity> descendants = folderRepo.findByAncestorIdsContaining(folder.getFolderId())
                .stream()
                .filter(f -> Boolean.TRUE.equals(f.getIsActive()) && !Boolean.TRUE.equals(f.getIsTrash()))
                .toList();

        List<FolderEntity> toArchive = new ArrayList<>(descendants.size() + 1);
        toArchive.add(folder);
        toArchive.addAll(descendants);

        List<String> folderIds = toArchive.stream()
                .map(FolderEntity::getFolderId)
                .filter(StringUtils::isNotNullOrBlank)
                .toList();

        Instant now = Instant.now();
        mongoTemplate.updateMulti(Query.query(Criteria.where("_id").in(folderIds)),
                auditUpdate().set("isTrash", true).set("trashedAt", now), FolderEntity.class);

        List<AssetEntity> assetsToArchive = assetRepo.findByFolderIdInAndIsActiveTrue(folderIds)
                .stream()
                .filter(a -> !Boolean.TRUE.equals(a.getIsTrash()))
                .toList();
        for (AssetEntity asset : assetsToArchive) {
            applyTrashAudit(asset, now);
        }
        if (!assetsToArchive.isEmpty()) {
            assetRepo.saveAll(assetsToArchive);
        }

        incrementProjectFolderCount(project, -toArchive.size());
        incrementProjectAssetCount(project, -assetsToArchive.size());
        if (StringUtils.isNotNullOrBlank(folder.getParentFolderId())) {
            folderRepo.findById(folder.getParentFolderId())
                    .ifPresent(parent -> incrementParentSubfolderCount(parent, -1));
        }

        writeFolderAuditLog(folder, AuditAction.TRASH, null);

        List<String> archivedAssetIds = assetsToArchive.stream()
                .map(AssetEntity::getAssetId)
                .filter(StringUtils::isNotNullOrBlank)
                .toList();

        return FolderArchiveResponseDTO.builder()
                .archivedFolderIds(folderIds)
                .archivedAssetIds(archivedAssetIds)
                .build();
    }

    @Override
    @Transactional
    public FolderEntity restoreFolder(String folderId) {
        if (StringUtils.isNullOrBlank(folderId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "folderId is required");
        }

        FolderEntity folder = getTrashedFolderOrThrow(folderId.trim());
        ProjectEntity project = getProjectOrThrow(folder.getProjectId());
        accessService.require(ResourceRef.folder(folder.getFolderId()), Action.TRASH);
        ensureNoAncestorInTrash(folder);

        List<FolderEntity> descendants = folderRepo.findByAncestorIdsContaining(folder.getFolderId())
                .stream()
                .filter(f -> Boolean.TRUE.equals(f.getIsActive()) && Boolean.TRUE.equals(f.getIsTrash()))
                .toList();

        List<FolderEntity> toRestore = new ArrayList<>(descendants.size() + 1);
        toRestore.add(folder);
        toRestore.addAll(descendants);

        // chi cap nhat ban trong bo nho de tra ve, DB ghi bang updateMulti
        for (FolderEntity f : toRestore) {
            applyRestoreAudit(f);
        }

        List<String> folderIds = toRestore.stream()
                .map(FolderEntity::getFolderId)
                .filter(StringUtils::isNotNullOrBlank)
                .toList();
        mongoTemplate.updateMulti(Query.query(Criteria.where("_id").in(folderIds)),
                auditUpdate().set("isTrash", false).unset("trashedAt"), FolderEntity.class);

        List<AssetEntity> assetsToRestore = assetRepo.findByFolderIdInAndIsActiveTrue(folderIds)
                .stream()
                .filter(a -> Boolean.TRUE.equals(a.getIsTrash()))
                .toList();
        for (AssetEntity asset : assetsToRestore) {
            applyRestoreAudit(asset);
        }
        if (!assetsToRestore.isEmpty()) {
            assetRepo.saveAll(assetsToRestore);
        }

        incrementProjectFolderCount(project, toRestore.size());
        incrementProjectAssetCount(project, assetsToRestore.size());
        if (StringUtils.isNotNullOrBlank(folder.getParentFolderId())) {
            folderRepo.findById(folder.getParentFolderId())
                    .ifPresent(parent -> incrementParentSubfolderCount(parent, 1));
        }

        writeFolderAuditLog(folder, AuditAction.UPDATE, null);
        return folder;
    }

    @Override
    public PageResult<FolderListItemDTO> getFolderTrash(PageRequestDto<FolderFilterRequestDTO> dto) {
        PageRequestDto<FolderFilterRequestDTO> pageRequest = dto != null ? dto : new PageRequestDto<>();
        FolderFilterRequestDTO filter = pageRequest.getFilter();

        if (filter == null || StringUtils.isNullOrBlank(filter.getProjectId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }

        ProjectEntity project = getProjectOrThrow(filter.getProjectId().trim());
        // trong thung rac chi vai tro project co tac dung
        AccessRole myRole = accessService.require(ResourceRef.project(project.getProjectId()), Action.TRASH).role();

        Query query = new Query();
        query.addCriteria(Criteria.where("projectId").is(project.getProjectId()));
        query.addCriteria(Criteria.where("isActive").is(true));
        query.addCriteria(Criteria.where("isTrash").is(true));

        if (StringUtils.isNotNullOrBlank(filter.getFolderName())) {
            query.addCriteria(Criteria.where("folderName").regex(filter.getFolderName().trim(), "i"));
        }

        long total = mongoTemplate.count(query, FolderEntity.class);
        query.with(pageRequest.getPageRequest());
        List<FolderEntity> data = mongoTemplate.find(query, FolderEntity.class);

        return PageResult.<FolderListItemDTO>builder()
                .totalCount(total)
                .data(data.stream().map(f -> FolderListItemDTO.of(f, myRole)).toList())
                .build();
    }

    // -------------------------------------------------------------------------
    // Ancestor ID helpers
    // -------------------------------------------------------------------------

    private List<String> buildAncestorIds(FolderEntity parent) {
        if (parent == null) {
            return new ArrayList<>();
        }
        List<String> result = new ArrayList<>(parent.getAncestorIds() != null ? parent.getAncestorIds() : List.of());
        result.add(parent.getFolderId());
        return result;
    }

    private List<String> buildAncestorIdsForNode(String parentId, List<String> parentAncestorIds) {
        List<String> result = new ArrayList<>(parentAncestorIds != null ? parentAncestorIds : List.of());
        if (parentId != null) {
            result.add(parentId);
        }
        return result;
    }

    /**
     * Pipeline update cho moi con chau cua folder: ancestorIds = newPrefix + phan duoi sau folderId,
     * level += levelDelta. Mot lenh updateMulti, khong ghi de grants/link dang bi sua dong thoi.
     */
    private void moveDescendants(String folderId, List<String> newPrefix, int levelDelta) {
        Document tail = new Document("$slice", List.of("$ancestorIds",
                new Document("$add", List.of(new Document("$indexOfArray", List.of("$ancestorIds", folderId)), 1)),
                new Document("$size", "$ancestorIds")));
        AggregationExpression ancestorIds = context -> new Document("$concatArrays", List.of(newPrefix, tail));
        AggregationExpression level = context -> new Document("$add",
                List.of(new Document("$ifNull", List.of("$level", 0)), levelDelta));
        AggregationUpdate update = AggregationUpdate.update()
                .set("ancestorIds").toValue(ancestorIds)
                .set("level").toValue(level);
        mongoTemplate.updateMulti(Query.query(Criteria.where("ancestorIds").is(folderId)), update, FolderEntity.class);
    }

    // UPLOAD tren folder cha, hoac tren project khi tao/chuyen ra goc
    private void requireUpload(String projectId, String parentFolderId) {
        accessService.require(parentFolderId != null ? ResourceRef.folder(parentFolderId) : ResourceRef.project(projectId),
                Action.UPLOAD);
    }

    // cha hoac to tien con trong thung rac thi phai khoi phuc cha truoc
    private void ensureNoAncestorInTrash(FolderEntity folder) {
        List<String> ids = new ArrayList<>(folder.getAncestorIds() != null ? folder.getAncestorIds() : List.of());
        if (folder.getParentFolderId() != null) {
            ids.add(folder.getParentFolderId());
        }
        if (!ids.isEmpty() && mongoTemplate.exists(
                Query.query(Criteria.where("_id").in(ids).and("isTrash").is(true)), FolderEntity.class)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Parent folder is in trash, restore it first");
        }
    }

    private Update auditUpdate() {
        return new Update()
                .set("updateBy", auditService.getCurrentUserId())
                .set("updateByEmail", auditService.getCurrentUserEmail());
    }

    // $set truong doi + audit tren 1 folder
    private void updateFolder(FolderEntity folder, Update update) {
        Instant now = Instant.now();
        update.set("updateBy", auditService.getCurrentUserId())
                .set("updateByEmail", auditService.getCurrentUserEmail())
                .set("updatedAt", now);
        folder.setUpdateBy(auditService.getCurrentUserId());
        folder.setUpdateByEmail(auditService.getCurrentUserEmail());
        folder.setUpdatedAt(now);
        mongoTemplate.updateFirst(Query.query(Criteria.where("_id").is(folder.getFolderId())), update, FolderEntity.class);
    }

    private static void setOrUnset(Update update, String field, Object value) {
        if (value != null) {
            update.set(field, value);
        } else {
            update.unset(field);
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private void validateCreatePayload(FolderCreateRequestDTO request) {
        if (request == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Request body is required");
        }

        if (StringUtils.isNullOrBlank(request.getProjectId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }

        requireNormalized(request.getFolderName(), "folderName is required");
    }

    private void validateCreateTreePayload(FolderTreeCreateRequestDTO request) {
        if (request == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Request body is required");
        }

        if (StringUtils.isNullOrBlank(request.getProjectId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }

        if (StringUtils.isNullOrBlank(request.getRootFolderName())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "rootFolderName is required");
        }

        if (request.getFolders() == null || request.getFolders().isEmpty()) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "folders is required");
        }
    }

    private void validateUpdatePayload(FolderUpdateRequestDTO request) {
        if (request == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Request body is required");
        }

        if (StringUtils.isNullOrBlank(request.getFolderId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "folderId is required");
        }
    }


    private FolderEntity persistNewFolder(String projectId, String parentFolderId,
            String folderName, String description, List<String> ancestorIds, int level) {
        FolderEntity folder = FolderEntity.builder()
                .projectId(projectId)
                .parentFolderId(parentFolderId)
                .folderName(folderName)
                .description(description)
                .ancestorIds(ancestorIds)
                .level(level)
                .stats(defaultFolderStats())
                .build();
        buildAudit(folder, true);
        return folderRepo.save(folder);
    }

    private String normalizeRelativeFolderPath(String relativePath) {
        return normalizeRelativeFolderPath(relativePath, "relativeFolderPath is required");
    }

    private String normalizeRelativeFolderPath(String relativePath, String message) {
        String normalized = requireNormalized(relativePath, message);
        if (normalized.startsWith("/") || normalized.endsWith("/")) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST,
                    "relativeFolderPath must not start or end with '/'");
        }
        if (normalized.contains("\\")) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST,
                    "relativeFolderPath contains invalid separator");
        }
        String[] segments = normalized.split("/");
        for (String segment : segments) {
            if (segment.isEmpty()) {
                throw new UserBusinessException(ErrorCode.BAD_REQUEST,
                        "relativeFolderPath contains empty segment");
            }
            if (".".equals(segment) || "..".equals(segment)) {
                throw new UserBusinessException(ErrorCode.BAD_REQUEST,
                        "relativeFolderPath contains traversal segment");
            }
        }
        return normalized;
    }

    private int countPathSegments(String relativePath) {
        return relativePath.split("/").length;
    }

    private String getLastPathSegment(String relativePath) {
        int index = relativePath.lastIndexOf('/');
        return index >= 0 ? relativePath.substring(index + 1) : relativePath;
    }

    private FolderTreeMappingDTO buildFolderTreeMapping(FolderTreeNodeDTO node, String folderId,
                                                        String parentFolderId, String status) {
        return FolderTreeMappingDTO.builder()
                .clientFolderKey(node.getClientFolderKey())
                .relativeFolderPath(node.getRelativeFolderPath())
                .folderId(folderId)
                .parentFolderId(parentFolderId)
                .status(status)
                .build();
    }

    private String generateFolderUploadSessionId(FolderEntity parentFolder, String rootFolderName) {
        String prefix = parentFolder != null
                ? parentFolder.getFolderId() + "/" + rootFolderName
                : rootFolderName;
        return prefix + "-" + UUID.randomUUID();
    }

    private int safeLevel(Integer level) {
        return level != null ? level : 0;
    }

    private void ensureFolderNameUnique(String projectId, String parentFolderId, String folderName, String excludeFolderId) {
        folderRepo.findByProjectIdAndParentFolderIdAndFolderName(projectId, parentFolderId, folderName)
                .ifPresent(existing -> {
                    if (excludeFolderId == null || !excludeFolderId.equals(existing.getFolderId())) {
                        throw new FileBusinessException(ErrorCode.FOLDER_ALREADY_EXISTS);
                    }
                });
    }

    private ProjectEntity getProjectOrThrow(String projectId) {
        ProjectEntity project = projectRepo.findById(projectId)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.PROJECT_NOT_FOUND));
        if (Boolean.FALSE.equals(project.getIsActive())) {
            throw new FileBusinessException(ErrorCode.PROJECT_NOT_FOUND);
        }
        return project;
    }

    private FolderEntity getActiveFolderOrThrow(String folderId) {
        FolderEntity folder = folderRepo.findById(folderId)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FOLDER_NOT_FOUND));
        if (Boolean.FALSE.equals(folder.getIsActive()) || Boolean.TRUE.equals(folder.getIsTrash())) {
            throw new FileBusinessException(ErrorCode.FOLDER_NOT_FOUND);
        }
        return folder;
    }

    private FolderEntity getTrashedFolderOrThrow(String folderId) {
        FolderEntity folder = folderRepo.findById(folderId)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FOLDER_NOT_FOUND));
        if (!Boolean.TRUE.equals(folder.getIsActive()) || !Boolean.TRUE.equals(folder.getIsTrash())) {
            throw new FileBusinessException(ErrorCode.FOLDER_NOT_FOUND);
        }
        return folder;
    }

    private void ensureFolderInProject(FolderEntity folder, ProjectEntity project) {
        if (!Objects.equals(folder.getProjectId(), project.getProjectId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Folder does not belong to project");
        }
    }

    private void adjustParentSubfolderCounts(String oldParentId, String newParentId) {
        if (Objects.equals(oldParentId, newParentId)) {
            return;
        }

        if (StringUtils.isNotNullOrBlank(oldParentId)) {
            folderRepo.findById(oldParentId)
                    .ifPresent(parent -> incrementParentSubfolderCount(parent, -1));
        }

        if (StringUtils.isNotNullOrBlank(newParentId)) {
            folderRepo.findById(newParentId)
                    .ifPresent(parent -> incrementParentSubfolderCount(parent, 1));
        }
    }

    // counter dung $inc de khong ghi de cac field khac (grants, link) khi chay dong thoi
    private void incrementParentSubfolderCount(FolderEntity parent, int delta) {
        if (parent.getStats() == null) {
            // stats null thi $inc loi, khoi tao truoc
            parent.setStats(defaultFolderStats());
            mongoTemplate.updateFirst(
                    Query.query(Criteria.where("_id").is(parent.getFolderId()).and("stats").is(null)),
                    new Update().set("stats", parent.getStats()), FolderEntity.class);
        }
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(parent.getFolderId())),
                new Update().inc("stats.subfoldersCount", delta)
                        .set("updateBy", auditService.getCurrentUserId())
                        .set("updateByEmail", auditService.getCurrentUserEmail()),
                FolderEntity.class);
    }

    private void incrementProjectFolderCount(ProjectEntity project, int delta) {
        incrementProjectStat(project, "stats.folderCount", delta);
    }

    private void incrementProjectAssetCount(ProjectEntity project, int delta) {
        incrementProjectStat(project, "stats.assetCount", delta);
    }

    private void incrementProjectStat(ProjectEntity project, String field, int delta) {
        if (project.getStats() == null) {
            ensureProjectStats(project);
            mongoTemplate.updateFirst(
                    Query.query(Criteria.where("_id").is(project.getProjectId()).and("stats").is(null)),
                    new Update().set("stats", project.getStats()), ProjectEntity.class);
        }
        mongoTemplate.updateFirst(
                Query.query(Criteria.where("_id").is(project.getProjectId())),
                new Update().inc(field, delta), ProjectEntity.class);
    }

    private FolderStats defaultFolderStats() {
        return FolderStats.builder()
                .assetCount(0)
                .subfoldersCount(0)
                .pendingReviewsCount(0)
                .build();
    }

    private ProjectStats ensureProjectStats(ProjectEntity project) {
        if (project.getStats() == null) {
            project.setStats(ProjectStats.builder()
                    .folderCount(0)
                    .assetCount(0)
                    .totalVersions(0)
                    .pendingReviews(0)
                    .build());
        }
        return project.getStats();
    }

    private void applyUpdateAudit(EntityAuditBase entity) {
        entity.setUpdateBy(auditService.getCurrentUserId());
        entity.setUpdateByEmail(auditService.getCurrentUserEmail());
    }

    private void applyTrashAudit(EntityAuditBase entity, Instant trashedAt) {
        entity.setIsTrash(true);
        entity.setTrashedAt(trashedAt);
        entity.setUpdateBy(auditService.getCurrentUserId());
        entity.setUpdateByEmail(auditService.getCurrentUserEmail());
    }

    private void applyRestoreAudit(EntityAuditBase entity) {
        entity.setIsTrash(false);
        entity.setTrashedAt(null);
        entity.setUpdateBy(auditService.getCurrentUserId());
        entity.setUpdateByEmail(auditService.getCurrentUserEmail());
    }

    // vai tro node = max(vai tro cha, vai tro tai chinh node), tinh tu goc xuong, 0 query
    private FolderTreeItemDTO buildTreeNode(FolderEntity folder, Map<String, List<FolderEntity>> childrenMap,
                                            AccessRole parentRole, Function<FolderEntity, AccessRole> directRole) {
        AccessRole myRole = maxRole(parentRole, directRole.apply(folder));
        List<FolderEntity> children = childrenMap.getOrDefault(folder.getFolderId(), List.of());
        List<FolderTreeItemDTO> childNodes = children.stream()
                .sorted(Comparator.comparing(FolderEntity::getFolderName))
                .map(child -> buildTreeNode(child, childrenMap, myRole, directRole))
                .toList();

        return FolderTreeItemDTO.builder()
                .folderId(folder.getFolderId())
                .projectId(folder.getProjectId())
                .parentFolderId(folder.getParentFolderId())
                .folderName(folder.getFolderName())
                .ancestorIds(folder.getAncestorIds())
                .level(folder.getLevel())
                .stats(folder.getStats())
                .children(childNodes)
                .myRole(myRole)
                .hasLink(FolderListItemDTO.hasLink(folder))
                .hasDirectGrants(FolderListItemDTO.hasDirectGrants(folder))
                .build();
    }

    private void writeFolderAuditLog(FolderEntity folder, AuditAction action, AuditChanges changes) {
        if (folder == null || StringUtils.isNullOrBlank(folder.getFolderId())) {
            return;
        }

        AuditLogCreateDTO dto = new AuditLogCreateDTO();
        dto.setAction(action);
        dto.setTargetType(AuditTargetType.FOLDER);
        dto.setTargetId(folder.getFolderId());
        dto.setTargetName(folder.getFolderName());
        if (changes != null) {
            dto.setChanges(changes);
        }

        auditLogService.createAuditLog(dto);
    }

    private boolean isDescendantFolder(FolderEntity candidateParent, FolderEntity targetFolder) {
        List<String> ancestors = candidateParent.getAncestorIds();
        return ancestors != null && ancestors.contains(targetFolder.getFolderId());
    }
}
