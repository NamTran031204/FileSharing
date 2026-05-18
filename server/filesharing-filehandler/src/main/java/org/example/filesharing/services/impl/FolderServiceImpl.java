package org.example.filesharing.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.auditlog.AuditLogCreateDTO;
import org.example.filesharing.entities.dtos.folder.FolderArchiveResponseDTO;
import org.example.filesharing.entities.dtos.folder.FolderBreadcrumbItemDTO;
import org.example.filesharing.entities.dtos.folder.FolderChangeVisibilityRequestDTO;
import org.example.filesharing.entities.dtos.folder.FolderCreateRequestDTO;
import org.example.filesharing.entities.dtos.folder.FolderFilterRequestDTO;
import org.example.filesharing.entities.dtos.folder.FolderTreeCreateRequestDTO;
import org.example.filesharing.entities.dtos.folder.FolderTreeCreateResponseDTO;
import org.example.filesharing.entities.dtos.folder.FolderTreeItemDTO;
import org.example.filesharing.entities.dtos.folder.FolderTreeMappingDTO;
import org.example.filesharing.entities.dtos.folder.FolderTreeNodeDTO;
import org.example.filesharing.entities.dtos.folder.FolderTreeResponseDTO;
import org.example.filesharing.entities.dtos.folder.FolderUpdateRequestDTO;
import org.example.filesharing.entities.models.auditlog.AuditChanges;
import org.example.filesharing.entities.models.folder.FolderPermission;
import org.example.filesharing.entities.models.folder.FolderStats;
import org.example.filesharing.entities.models.project.ProjectCollaborator;
import org.example.filesharing.entities.models.project.ProjectStats;
import org.example.filesharing.entities.models.AssetEntity;
import org.example.filesharing.entities.models.FolderEntity;
import org.example.filesharing.entities.models.ProjectEntity;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.entities.models.base.EntityAuditBase;
import org.example.filesharing.enums.AuditAction;
import org.example.filesharing.enums.AuditTargetType;
import org.example.filesharing.enums.FolderVisibility;
import org.example.filesharing.enums.ProjectStatus;
import org.example.filesharing.enums.auth.UserGrantedRole;
import org.example.filesharing.enums.permission.GrantedProjectPermission;
import org.example.filesharing.enums.permission.GrantedProjectRole;
import org.example.filesharing.exceptions.ErrorCode;
import org.example.filesharing.exceptions.specException.FileBusinessException;
import org.example.filesharing.exceptions.specException.UserBusinessException;
import org.example.filesharing.repositories.AssetRepo;
import org.example.filesharing.repositories.FolderRepo;
import org.example.filesharing.repositories.ProjectRepo;
import org.example.filesharing.services.AuditLogService;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.services.FolderService;
import org.example.filesharing.services.baseService.BaseAuditService;
import org.example.filesharing.utils.ProjectPermissionResolver;
import org.example.filesharing.utils.StringUtils;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import static org.example.filesharing.utils.StringUtils.requireNormalized;
import static org.example.filesharing.utils.StringUtils.trimToNull;

@Service
@RequiredArgsConstructor
public class FolderServiceImpl extends BaseAuditService<FolderEntity> implements FolderService {

    private final FolderRepo folderRepo;
    private final ProjectRepo projectRepo;
    private final AssetRepo assetRepo;
    private final MongoTemplate mongoTemplate;
    private final AuditService auditService;
    private final AuditLogService auditLogService;

    @Override
    @Transactional
    public FolderEntity createNewFolder(FolderCreateRequestDTO request) {
        validateCreatePayload(request);

        String projectId = request.getProjectId().trim();
        ProjectEntity project = getProjectOrThrow(projectId);
        ensureProjectWritable(project);

        String folderName = requireNormalized(request.getFolderName(), "folderName is required");
        String parentFolderId = trimToNull(request.getParentFolderId());

        FolderEntity parentFolder = null;
        if (parentFolderId != null) {
            parentFolder = getActiveFolderOrThrow(parentFolderId);
            ensureFolderInProject(parentFolder, project);
            ensureFolderPermission(parentFolder, project, GrantedProjectPermission.CREATE_FOLDER_ASSET);
        } else {
            ensureProjectModify(project, auditService.getCurrentUser());
        }

        ensureFolderNameUnique(projectId, parentFolderId, folderName, null);

        List<String> ancestorIds = buildAncestorIds(parentFolder);
        int level = parentFolder != null ? safeLevel(parentFolder.getLevel()) + 1 : 1;

        List<FolderPermission> userPermissions = mapProjectCollaboratorList2FolderPermissionsList(project.getCollaborators());

        FolderEntity savedFolder = persistNewFolder(
                projectId, parentFolderId, folderName,
                trimToNull(request.getDescription()), ancestorIds, level, request.getVisibility(),
                userPermissions);

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
        ensureProjectWritable(project);

        UserEntity currentUser = auditService.getCurrentUser();
        ensureProjectModify(project, currentUser);

        String parentFolderId = trimToNull(request.getParentFolderId());
        FolderEntity parentFolder = null;
        if (parentFolderId != null) {
            parentFolder = getActiveFolderOrThrow(parentFolderId);
            ensureFolderInProject(parentFolder, project);
            ensureFolderPermission(parentFolder, project, GrantedProjectPermission.CREATE_FOLDER_ASSET);
        }

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

        // Track folderId, ancestorIds, and userPermissions per relative path for building child chains
        Map<String, String> relativeToFolderId = new HashMap<>();
        Map<String, List<String>> relativeToAncestorIds = new HashMap<>();
        Map<String, List<FolderPermission>> relativeToUserPermissions = new HashMap<>();

        List<FolderTreeMappingDTO> folderMappings = new ArrayList<>();
        List<FolderTreeMappingDTO> createdFolders = new ArrayList<>();
        List<FolderTreeMappingDTO> existingFolders = new ArrayList<>();
        int createdCount = 0;

        // Precompute base ancestorIds from the external parent folder (if any)
        List<String> baseAncestorIds = buildAncestorIds(parentFolder);
        List<FolderPermission> baseUserPermissions = parentFolder != null
                ? (parentFolder.getUserPermissions() == null || parentFolder.getUserPermissions().isEmpty() ? ProjectPermissionResolver.buildFolderUserPermissions(project, FolderVisibility.INHERIT, null, null) : parentFolder.getUserPermissions())
                : mapProjectCollaboratorList2FolderPermissionsList(project.getCollaborators());

        for (FolderTreeNodeDTO node : sortedNodes) {
            String parentRelativePath = trimToNull(node.getParentRelativeFolderPath());

            String effectiveParentId;
            List<String> parentAncestorIds;
            List<FolderPermission> parentUserPermissions;
            if (parentRelativePath != null) {
                effectiveParentId = relativeToFolderId.get(parentRelativePath);
                parentAncestorIds = relativeToAncestorIds.get(parentRelativePath);
                parentUserPermissions = relativeToUserPermissions.get(parentRelativePath);
            } else {
                effectiveParentId = parentFolderId;
                parentAncestorIds = baseAncestorIds;
                parentUserPermissions = baseUserPermissions;
            }

            if (parentRelativePath != null && effectiveParentId == null) {
                throw new FileBusinessException(ErrorCode.FOLDER_PARENT_NOT_FOUND);
            }

            FolderEntity existingFolder = folderRepo
                    .findByProjectIdAndParentFolderIdAndFolderName(projectId, effectiveParentId, node.getFolderName())
                    .orElse(null);

            if (existingFolder != null) {
                ensureFolderPermission(existingFolder, project, GrantedProjectPermission.CREATE_FOLDER_ASSET);

                String folderId = existingFolder.getFolderId();
                relativeToFolderId.put(node.getRelativeFolderPath(), folderId);
                relativeToAncestorIds.put(node.getRelativeFolderPath(), existingFolder.getAncestorIds());
                relativeToUserPermissions.put(node.getRelativeFolderPath(), existingFolder.getUserPermissions());

                FolderTreeMappingDTO mapping = buildFolderTreeMapping(node, folderId, existingFolder.getParentFolderId(), "EXISTING");
                folderMappings.add(mapping);
                existingFolders.add(mapping);
                continue;
            }

            List<String> nodeAncestorIds = buildAncestorIdsForNode(effectiveParentId, parentAncestorIds);
            List<FolderPermission> nodeUserPermissions = ProjectPermissionResolver.buildFolderUserPermissions(
                    project, FolderVisibility.INHERIT, parentUserPermissions, null);

            FolderEntity saved = persistNewFolder(
                    projectId, effectiveParentId, node.getFolderName(),
                    null, nodeAncestorIds, node.getLevel(), FolderVisibility.INHERIT, nodeUserPermissions);

            relativeToFolderId.put(node.getRelativeFolderPath(), saved.getFolderId());
            relativeToAncestorIds.put(node.getRelativeFolderPath(), nodeAncestorIds);
            relativeToUserPermissions.put(node.getRelativeFolderPath(), nodeUserPermissions);

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
        ensureProjectWritable(project);

        UserEntity currentUser = auditService.getCurrentUser();
        ensureFolderPermission(folder, project, GrantedProjectPermission.UPDATE);

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

            ensureFolderPermission(targetParent, project, GrantedProjectPermission.CREATE_FOLDER_ASSET);
        } else if (parentChanged) {
            ensureProjectModify(project, currentUser);
        }

        if (nameChanged || parentChanged) {
            ensureFolderNameUnique(project.getProjectId(), updatedParentId, updatedName, folder.getFolderId());

            if (parentChanged) {
                // MOVE: rebuild ancestor chain for folder and all descendants
                List<String> newAncestorIds = buildAncestorIds(targetParent);
                int oldLevel = safeLevel(folder.getLevel());
                int newLevel = targetParent != null ? safeLevel(targetParent.getLevel()) + 1 : 1;
                int levelDelta = newLevel - oldLevel;

                // old prefix = [ancestors of folder] + [folder itself]
                List<String> oldPrefix = new ArrayList<>(folder.getAncestorIds() != null ? folder.getAncestorIds() : List.of());
                oldPrefix.add(folder.getFolderId());

                // new prefix = [new ancestors of folder] + [folder itself]
                List<String> newPrefix = new ArrayList<>(newAncestorIds);
                newPrefix.add(folder.getFolderId());

                List<FolderEntity> descendants = folderRepo.findByAncestorIdsContaining(folder.getFolderId());
                for (FolderEntity child : descendants) {
                    child.setAncestorIds(replaceAncestorPrefix(child.getAncestorIds(), oldPrefix, newPrefix));
                    if (levelDelta != 0) {
                        child.setLevel(safeLevel(child.getLevel()) + levelDelta);
                    }
                }
                folderRepo.saveAll(descendants);

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

        AuditChanges permissionChanges = null;
        if (request.getRestrictedUserIds() != null) {
            ensureFolderPermission(folder, project, GrantedProjectPermission.ADD_USER);
            validateRestrictedUserIds(project, request.getRestrictedUserIds());

            List<FolderPermission> newPermissions = ProjectPermissionResolver.buildFolderUserPermissions(
                    project, folder.getVisibility(), null, request.getRestrictedUserIds());

            Map<String, Object> before = new HashMap<>();
            Map<String, Object> after = new HashMap<>();
            before.put("permissions", folder.getUserPermissions());
            after.put("permissions", newPermissions);
            permissionChanges = AuditChanges.builder()
                    .before(before)
                    .after(after)
                    .build();
            folder.setUserPermissions(newPermissions);
        }

        buildAudit(folder, false);
        FolderEntity savedFolder = folderRepo.save(folder);

        if (permissionChanges != null) {
            cascadeInheritPermissions(savedFolder.getFolderId(), savedFolder.getUserPermissions());
        }

        if (nameChanged || parentChanged || request.getDescription() != null) {
            writeFolderAuditLog(savedFolder, AuditAction.UPDATE, null);
        }

        if (permissionChanges != null) {
            writeFolderAuditLog(savedFolder, AuditAction.PERMISSION_CHANGE, permissionChanges);
        }

        return savedFolder;
    }

    @Override
    public FolderEntity getFolderById(String folderId) {
        if (StringUtils.isNullOrBlank(folderId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "folderId is required");
        }

        FolderEntity folder = folderRepo.findById(folderId.trim())
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FOLDER_NOT_FOUND));

        UserEntity currentUser = auditService.getCurrentUser();
        if (Boolean.FALSE.equals(folder.getIsActive()) && !isAdmin(currentUser)) {
            throw new FileBusinessException(ErrorCode.FOLDER_NOT_FOUND);
        }

        ProjectEntity project = getProjectOrThrow(folder.getProjectId());

        // danh cho truong hop xem man trash
        if (Boolean.TRUE.equals(folder.getIsTrash())) {
            ensureFolderPermission(folder, project, GrantedProjectPermission.DELETE);
            return folder;
        }

        ensureFolderPermission(folder, project, GrantedProjectPermission.READ);
        return folder;
    }

    @Override
    public PageResult<FolderEntity> getFolderPage(PageRequestDto<FolderFilterRequestDTO> dto) {
        PageRequestDto<FolderFilterRequestDTO> pageRequest = dto != null ? dto : new PageRequestDto<>();
        FolderFilterRequestDTO filter = pageRequest.getFilter();

        if (filter == null || StringUtils.isNullOrBlank(filter.getProjectId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }

        ProjectEntity project = getProjectOrThrow(filter.getProjectId().trim());
        ensureProjectRead(project, auditService.getCurrentUser());

        String parentFolderId = trimToNull(filter.getParentFolderId());
        if (parentFolderId != null) {
            FolderEntity parent = getActiveFolderOrThrow(parentFolderId);
            ensureFolderInProject(parent, project);
            ensureFolderPermission(parent, project, GrantedProjectPermission.READ);
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

        long total = mongoTemplate.count(query, FolderEntity.class);
        query.with(pageRequest.getPageRequest());
        List<FolderEntity> data = mongoTemplate.find(query, FolderEntity.class);

        return PageResult.<FolderEntity>builder()
                .totalCount(total)
                .data(data)
                .build();
    }

    @Override
    @Transactional
    public void deleteFolder(String folderId) {
        if (StringUtils.isNullOrBlank(folderId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "folderId is required");
        }

        FolderEntity folder = getTrashedFolderOrThrow(folderId.trim());
        ProjectEntity project = getProjectOrThrow(folder.getProjectId());
        ensureProjectWritable(project);
        ensureFolderPermission(folder, project, GrantedProjectPermission.DELETE);

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

        for (FolderEntity item : toDelete) {
            item.setIsActive(false);
            applyUpdateAudit(item);
        }
        folderRepo.saveAll(toDelete);

        // Stats were already decremented at archive time — no changes needed here
        writeFolderAuditLog(folder, AuditAction.DELETE, null);
    }

    @Override
    public FolderTreeResponseDTO getFolderTree(String projectId, String currentFolderId) {
        if (StringUtils.isNullOrBlank(projectId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }

        ProjectEntity project = getProjectOrThrow(projectId.trim());
        ensureProjectRead(project, auditService.getCurrentUser());

        List<FolderEntity> allFolders = folderRepo.findByProjectId(projectId.trim())
                .stream()
                .filter(f -> Boolean.TRUE.equals(f.getIsActive()) && !Boolean.TRUE.equals(f.getIsTrash()))
                .toList();

        Map<String, FolderEntity> folderMap = allFolders.stream()
                .collect(Collectors.toMap(FolderEntity::getFolderId, f -> f));

        Map<String, List<FolderEntity>> childrenMap = allFolders.stream()
                .collect(Collectors.groupingBy(f ->
                        f.getParentFolderId() != null ? f.getParentFolderId() : "__root__"));

        List<FolderEntity> roots = childrenMap.getOrDefault("__root__", List.of());
        List<FolderTreeItemDTO> tree = roots.stream()
                .sorted(Comparator.comparing(FolderEntity::getFolderName))
                .map(root -> buildTreeNode(root, childrenMap))
                .toList();

        List<FolderBreadcrumbItemDTO> breadcrumb = List.of();
        if (StringUtils.isNotNullOrBlank(currentFolderId)) {
            breadcrumb = buildBreadcrumb(currentFolderId.trim(), folderMap);
        }

        return FolderTreeResponseDTO.builder()
                .projectId(projectId.trim())
                .breadcrumb(breadcrumb)
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
        ensureProjectWritable(project);
        ensureFolderPermission(folder, project, GrantedProjectPermission.DELETE);

        List<FolderEntity> descendants = folderRepo.findByAncestorIdsContaining(folder.getFolderId())
                .stream()
                .filter(f -> Boolean.TRUE.equals(f.getIsActive()) && !Boolean.TRUE.equals(f.getIsTrash()))
                .toList();

        List<FolderEntity> toArchive = new ArrayList<>(descendants.size() + 1);
        toArchive.add(folder);
        toArchive.addAll(descendants);

        Instant now = Instant.now();
        for (FolderEntity f : toArchive) {
            applyTrashAudit(f, now);
        }
        folderRepo.saveAll(toArchive);

        List<String> folderIds = toArchive.stream()
                .map(FolderEntity::getFolderId)
                .filter(StringUtils::isNotNullOrBlank)
                .toList();

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
        ensureProjectWritable(project);
        ensureFolderPermission(folder, project, GrantedProjectPermission.DELETE);

        List<FolderEntity> descendants = folderRepo.findByAncestorIdsContaining(folder.getFolderId())
                .stream()
                .filter(f -> Boolean.TRUE.equals(f.getIsActive()) && Boolean.TRUE.equals(f.getIsTrash()))
                .toList();

        List<FolderEntity> toRestore = new ArrayList<>(descendants.size() + 1);
        toRestore.add(folder);
        toRestore.addAll(descendants);

        for (FolderEntity f : toRestore) {
            applyRestoreAudit(f);
        }
        folderRepo.saveAll(toRestore);

        List<String> folderIds = toRestore.stream()
                .map(FolderEntity::getFolderId)
                .filter(StringUtils::isNotNullOrBlank)
                .toList();

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
    public PageResult<FolderEntity> getFolderTrash(PageRequestDto<FolderFilterRequestDTO> dto) {
        PageRequestDto<FolderFilterRequestDTO> pageRequest = dto != null ? dto : new PageRequestDto<>();
        FolderFilterRequestDTO filter = pageRequest.getFilter();

        if (filter == null || StringUtils.isNullOrBlank(filter.getProjectId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }

        ProjectEntity project = getProjectOrThrow(filter.getProjectId().trim());
        ensureProjectPermission(project, auditService.getCurrentUser(), GrantedProjectPermission.DELETE);

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

        return PageResult.<FolderEntity>builder()
                .totalCount(total)
                .data(data)
                .build();
    }

    @Override
    @Transactional
    public FolderEntity changeFolderVisibility(FolderChangeVisibilityRequestDTO request) {
        if (request == null || StringUtils.isNullOrBlank(request.getFolderId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "folderId is required");
        }
        if (request.getVisibility() == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "visibility is required");
        }

        FolderEntity folder = getActiveFolderOrThrow(request.getFolderId().trim());
        ProjectEntity project = getProjectOrThrow(folder.getProjectId());
        ensureProjectWritable(project);
        ensureFolderPermission(folder, project, GrantedProjectPermission.UPDATE);

        FolderVisibility newVisibility = request.getVisibility();
        FolderVisibility oldVisibility = folder.getVisibility() != null ? folder.getVisibility() : FolderVisibility.INHERIT;

        if (oldVisibility == newVisibility) {
            return folder;
        }

        if (newVisibility == FolderVisibility.RESTRICTED && (request.getRestrictedUserIds() == null || request.getRestrictedUserIds().isEmpty())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "restrictedUserIds is required when visibility is RESTRICTED");
        }

        List<FolderPermission> newPermissions;

        if (newVisibility == FolderVisibility.INHERIT) {
            List<FolderPermission> parentPermissions = resolveParentPermissions(folder);
            if (oldVisibility == FolderVisibility.RESTRICTED) {
                // keep isPrivateCollaborator=true entries, merge with parent
                newPermissions = ProjectPermissionResolver.buildInheritMerge(folder.getUserPermissions(), parentPermissions);
            } else {
                // PUBLIC → INHERIT: just inherit from parent
                newPermissions = new ArrayList<>(parentPermissions != null ? parentPermissions : List.of());
            }
        } else if (newVisibility == FolderVisibility.RESTRICTED) {
            validateRestrictedUserIds(project, request.getRestrictedUserIds());
            newPermissions = ProjectPermissionResolver.buildFolderUserPermissions(
                    project, FolderVisibility.RESTRICTED, null, request.getRestrictedUserIds());
        } else {
            // PUBLIC
            newPermissions = ProjectPermissionResolver.buildFolderUserPermissions(
                    project, FolderVisibility.PUBLIC, null, null);
        }

        Map<String, Object> before = new HashMap<>();
        Map<String, Object> after = new HashMap<>();
        before.put("visibility", oldVisibility);
        before.put("permissions", folder.getUserPermissions());
        after.put("visibility", newVisibility);
        after.put("permissions", newPermissions);

        folder.setVisibility(newVisibility);
        folder.setUserPermissions(newPermissions);
        buildAudit(folder, false);
        FolderEntity savedFolder = folderRepo.save(folder);

        cascadeInheritPermissions(savedFolder.getFolderId(), newPermissions);

        AuditChanges changes = AuditChanges.builder().before(before).after(after).build();
        writeFolderAuditLog(savedFolder, AuditAction.PERMISSION_CHANGE, changes);

        return savedFolder;
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

    private List<FolderPermission> mapProjectCollaboratorList2FolderPermissionsList(List<ProjectCollaborator> projectCollaborators) {
        List<FolderPermission> result = new ArrayList<>();
        for (ProjectCollaborator projectCollaborator : projectCollaborators) {
            result.add(mapProjectCollaborator2FolderPermissions(projectCollaborator));
        }
        return result;
    }

    private FolderPermission mapProjectCollaborator2FolderPermissions(ProjectCollaborator projectCollaborator) {
        return FolderPermission.builder()
                .userId(projectCollaborator.getUserId())
                .permissions(projectCollaborator.getProjectPermissions() != null
                    ? projectCollaborator.getProjectPermissions()
                    : GrantedProjectRole.projectPermissionsFromRole(projectCollaborator.getProjectRole())
                )
                .grantedAt(projectCollaborator.getAddedAt())
                .build();
    }

    /**
     * Replace oldPrefix with newPrefix at the start of ancestorIds.
     * Used when moving a subtree: descendants share the moved folder's old ancestor prefix.
     */
    private List<String> replaceAncestorPrefix(List<String> ancestorIds, List<String> oldPrefix, List<String> newPrefix) {
        if (ancestorIds == null || ancestorIds.size() < oldPrefix.size()) {
            return new ArrayList<>(newPrefix);
        }
        List<String> tail = ancestorIds.subList(oldPrefix.size(), ancestorIds.size());
        List<String> result = new ArrayList<>(newPrefix);
        result.addAll(tail);
        return result;
    }

    // -------------------------------------------------------------------------
    // Permission cascade helpers
    // -------------------------------------------------------------------------

    /**
     * Cascades new permissions to all INHERIT descendants of the given folder,
     * stopping at sub-folders that have their own non-INHERIT visibility.
     */
    private void cascadeInheritPermissions(String folderId, List<FolderPermission> newPermissions) {
        List<FolderEntity> allDescendants = folderRepo.findByAncestorIdsContaining(folderId)
                .stream()
                .filter(f -> Boolean.TRUE.equals(f.getIsActive()) && !Boolean.TRUE.equals(f.getIsTrash()))
                .sorted(Comparator.comparingInt(f -> safeLevel(f.getLevel())))
                .toList();

        if (allDescendants.isEmpty()) {
            return;
        }

        // Track folder IDs that have their own visibility (shield their subtrees from cascade)
        Set<String> shielded = new HashSet<>();

        List<FolderEntity> toUpdate = new ArrayList<>();
        for (FolderEntity d : allDescendants) {
            boolean blocked = isShieldedByAncestor(d, folderId, shielded);

            if (blocked) {
                shielded.add(d.getFolderId());
                continue;
            }

            FolderVisibility dVisibility = d.getVisibility() != null ? d.getVisibility() : FolderVisibility.INHERIT;
            if (dVisibility != FolderVisibility.INHERIT) {
                shielded.add(d.getFolderId());
                continue;
            }

            d.setUserPermissions(new ArrayList<>(newPermissions));
            applyUpdateAudit(d);
            toUpdate.add(d);
        }

        if (!toUpdate.isEmpty()) {
            folderRepo.saveAll(toUpdate);
        }
    }

    private boolean isShieldedByAncestor(FolderEntity folder, String rootFolderId, Set<String> shielded) {
        List<String> ancestors = folder.getAncestorIds();
        if (ancestors == null) {
            return false;
        }
        int rootIdx = ancestors.indexOf(rootFolderId);
        // Check ancestors between rootFolder and this folder (exclusive of rootFolder itself)
        for (int i = rootIdx + 1; i < ancestors.size(); i++) {
            if (shielded.contains(ancestors.get(i))) {
                return true;
            }
        }
        return false;
    }

    private List<FolderPermission> resolveParentPermissions(FolderEntity folder) {
        String parentId = folder.getParentFolderId();
        if (parentId == null) {
            return new ArrayList<>();
        }
        return folderRepo.findById(parentId)
                .map(FolderEntity::getUserPermissions)
                .orElse(new ArrayList<>());
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
            String folderName, String description, List<String> ancestorIds, int level,
            FolderVisibility visibility, List<FolderPermission> userPermissions) {
        FolderEntity folder = FolderEntity.builder()
                .projectId(projectId)
                .parentFolderId(parentFolderId)
                .folderName(folderName)
                .description(description)
                .ancestorIds(ancestorIds)
                .level(level)
                .visibility(visibility != null ? visibility : FolderVisibility.INHERIT)
                .userPermissions(userPermissions)
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

    private void ensureProjectWritable(ProjectEntity project) {
        if (project.getStatus() == ProjectStatus.ARCHIVED || project.getStatus() == ProjectStatus.COMPLETED) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Project is not editable");
        }
    }

    private void ensureProjectRead(ProjectEntity project, UserEntity user) {
        ensureProjectPermission(project, user, GrantedProjectPermission.READ);
    }

    private void ensureProjectModify(ProjectEntity project, UserEntity user) {
        ensureProjectPermission(project, user, GrantedProjectPermission.CREATE_FOLDER_ASSET);
    }

    private void ensureProjectPermission(ProjectEntity project, UserEntity user, GrantedProjectPermission required) {
        List<GrantedProjectPermission> permissions = ProjectPermissionResolver.resolveProjectPermissions(
                project,
                user,
                isAdmin(user)
        );
        if (!ProjectPermissionResolver.hasPermission(permissions, required)) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }
    }

    private boolean isAdmin(UserEntity user) {
        if (user == null || user.getUserGrantedRoles() == null) {
            return false;
        }
        return user.getUserGrantedRoles().contains(UserGrantedRole.ROLE_ADMIN)
                || user.getUserGrantedRoles().contains(UserGrantedRole.ROLE_SA);
    }

    private void ensureFolderPermission(FolderEntity folder, ProjectEntity project, GrantedProjectPermission required) {
        UserEntity currentUser = auditService.getCurrentUser();
        if (isAdmin(currentUser) || Objects.equals(project.getOwnerId(), currentUser.getUserId())) {
            return;
        }

        List<FolderPermission> userPermissions = folder.getUserPermissions();
        if (userPermissions == null || userPermissions.isEmpty()) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }

        String currentUserId = currentUser.getUserId();
        for (FolderPermission fp : userPermissions) {
            if (Objects.equals(fp.getUserId(), currentUserId)) {
                if (ProjectPermissionResolver.hasPermission(fp.getPermissions(), required)) {
                    return;
                }
                throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
            }
        }
        throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
    }

    private void validateRestrictedUserIds(ProjectEntity project, List<String> userIds) {
        if (project == null || userIds == null) {
            return;
        }

        for (String userId : userIds) {
            if (StringUtils.isNullOrBlank(userId)) {
                throw new UserBusinessException(ErrorCode.BAD_REQUEST, "restrictedUserIds contains blank userId");
            }

            List<GrantedProjectPermission> projectPermissions =
                    ProjectPermissionResolver.resolveProjectPermissions(project, userId.trim());
            if (projectPermissions.isEmpty()) {
                throw new UserBusinessException(ErrorCode.BAD_REQUEST, "userId not in project: " + userId);
            }
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

    private void incrementParentSubfolderCount(FolderEntity parent, int delta) {
        FolderStats stats = ensureFolderStats(parent);
        int current = stats.getSubfoldersCount() != null ? stats.getSubfoldersCount() : 0;
        stats.setSubfoldersCount(Math.max(0, current + delta));
        parent.setStats(stats);
        applyUpdateAudit(parent);
        folderRepo.save(parent);
    }

    private void incrementProjectFolderCount(ProjectEntity project, int delta) {
        ProjectStats stats = ensureProjectStats(project);
        int current = stats.getFolderCount() != null ? stats.getFolderCount() : 0;
        stats.setFolderCount(Math.max(0, current + delta));
        project.setStats(stats);
        projectRepo.save(project);
    }

    private void incrementProjectAssetCount(ProjectEntity project, int delta) {
        ProjectStats stats = ensureProjectStats(project);
        int current = stats.getAssetCount() != null ? stats.getAssetCount() : 0;
        stats.setAssetCount(Math.max(0, current + delta));
        project.setStats(stats);
        projectRepo.save(project);
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

    private FolderStats ensureFolderStats(FolderEntity folder) {
        if (folder.getStats() == null) {
            folder.setStats(defaultFolderStats());
        }
        return folder.getStats();
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

    private FolderTreeItemDTO buildTreeNode(FolderEntity folder, Map<String, List<FolderEntity>> childrenMap) {
        List<FolderEntity> children = childrenMap.getOrDefault(folder.getFolderId(), List.of());
        List<FolderTreeItemDTO> childNodes = children.stream()
                .sorted(Comparator.comparing(FolderEntity::getFolderName))
                .map(child -> buildTreeNode(child, childrenMap))
                .toList();

        return FolderTreeItemDTO.builder()
                .folderId(folder.getFolderId())
                .projectId(folder.getProjectId())
                .parentFolderId(folder.getParentFolderId())
                .folderName(folder.getFolderName())
                .ancestorIds(folder.getAncestorIds())
                .level(folder.getLevel())
                .visibility(folder.getVisibility())
                .stats(folder.getStats())
                .children(childNodes)
                .build();
    }

    private List<FolderBreadcrumbItemDTO> buildBreadcrumb(String currentFolderId, Map<String, FolderEntity> folderMap) {
        FolderEntity current = folderMap.get(currentFolderId);
        if (current == null) {
            return List.of();
        }

        List<FolderBreadcrumbItemDTO> breadcrumb = new ArrayList<>();

        // ancestorIds are ordered from root → direct parent; read them directly (zero extra queries)
        if (current.getAncestorIds() != null) {
            for (String ancestorId : current.getAncestorIds()) {
                FolderEntity ancestor = folderMap.get(ancestorId);
                if (ancestor != null) {
                    breadcrumb.add(FolderBreadcrumbItemDTO.builder()
                            .folderId(ancestor.getFolderId())
                            .folderName(ancestor.getFolderName())
                            .level(ancestor.getLevel())
                            .build());
                }
            }
        }

        breadcrumb.add(FolderBreadcrumbItemDTO.builder()
                .folderId(current.getFolderId())
                .folderName(current.getFolderName())
                .level(current.getLevel())
                .build());

        return breadcrumb;
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
