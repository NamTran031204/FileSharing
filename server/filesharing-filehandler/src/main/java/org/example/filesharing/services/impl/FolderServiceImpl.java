package org.example.filesharing.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.auditlog.AuditLogCreateDTO;
import org.example.filesharing.entities.dtos.folder.FolderCreateRequestDTO;
import org.example.filesharing.entities.dtos.folder.FolderFilterRequestDTO;
import org.example.filesharing.entities.dtos.folder.FolderTreeCreateRequestDTO;
import org.example.filesharing.entities.dtos.folder.FolderTreeCreateResponseDTO;
import org.example.filesharing.entities.dtos.folder.FolderTreeMappingDTO;
import org.example.filesharing.entities.dtos.folder.FolderTreeNodeDTO;
import org.example.filesharing.entities.dtos.folder.FolderUpdateRequestDTO;
import org.example.filesharing.entities.models.auditlog.AuditChanges;
import org.example.filesharing.entities.models.folder.FolderPermission;
import org.example.filesharing.entities.models.folder.FolderStats;
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

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

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

        String folderPath = buildFolderPath(parentFolder, folderName);
        int level = parentFolder != null ? safeLevel(parentFolder.getLevel()) + 1 : 1;

        FolderEntity folder = FolderEntity.builder()
                .projectId(projectId)
                .parentFolderId(parentFolderId)
                .folderName(folderName)
                .description(trimToNull(request.getDescription()))
                .folderPath(folderPath)
                .level(level)
                .visibility(request.getVisibility() != null ? request.getVisibility() : FolderVisibility.INHERIT)
                .stats(defaultFolderStats())
                .build();

        buildAudit(folder, true);
        FolderEntity savedFolder = folderRepo.save(folder);

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

        String baseFolderPath = normalizeBaseFolderPath(parentFolder, request.getBaseFolderPath());
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
                .thenComparing(node -> composeFolderPath(baseFolderPath, node.getRelativeFolderPath())));

        Map<String, String> relativeToFolderId = new HashMap<>();
        List<FolderTreeMappingDTO> folderMappings = new ArrayList<>();
        List<FolderTreeMappingDTO> createdFolders = new ArrayList<>();
        List<FolderTreeMappingDTO> existingFolders = new ArrayList<>();
        int createdCount = 0;

        for (FolderTreeNodeDTO node : sortedNodes) {
            String parentRelativePath = trimToNull(node.getParentRelativeFolderPath());
            String parentId = parentRelativePath != null
                    ? relativeToFolderId.get(parentRelativePath)
                    : parentFolderId;

            if (parentRelativePath != null && parentId == null) {
                throw new FileBusinessException(ErrorCode.FOLDER_PARENT_NOT_FOUND);
            }

            String folderPath = composeFolderPath(baseFolderPath, node.getRelativeFolderPath());
            FolderEntity existingFolder = folderRepo.findByProjectIdAndFolderPath(projectId, folderPath)
                    .orElse(null);

            if (existingFolder != null) {
                ensureFolderPermission(existingFolder, project, GrantedProjectPermission.CREATE_FOLDER_ASSET);

                String folderId = existingFolder.getFolderId();
                relativeToFolderId.put(node.getRelativeFolderPath(), folderId);

                FolderTreeMappingDTO mapping = buildFolderTreeMapping(node, folderPath, folderId,
                        existingFolder.getParentFolderId(), "EXISTING");
                folderMappings.add(mapping);
                existingFolders.add(mapping);
                continue;
            }

            FolderEntity folder = FolderEntity.builder()
                    .projectId(projectId)
                    .parentFolderId(parentId)
                    .folderName(node.getFolderName())
                    .folderPath(folderPath)
                    .level(node.getLevel())
                    .visibility(FolderVisibility.INHERIT)
                    .stats(defaultFolderStats())
                    .build();

            buildAudit(folder, true);
            FolderEntity saved = folderRepo.save(folder);

            relativeToFolderId.put(node.getRelativeFolderPath(), saved.getFolderId());

            FolderTreeMappingDTO mapping = buildFolderTreeMapping(node, folderPath, saved.getFolderId(),
                    parentId, "CREATED");
            folderMappings.add(mapping);
            createdFolders.add(mapping);
            createdCount++;

            if (parentId != null) {
                folderRepo.findById(parentId)
                        .ifPresent(parent -> incrementParentSubfolderCount(parent, 1));
            }

            writeFolderAuditLog(saved, AuditAction.CREATE, null);
        }

        if (createdCount != 0) {
            incrementProjectFolderCount(project, createdCount);
        }

        String rootFolderId = relativeToFolderId.get(rootFolderName);
        String folderUploadSessionId = generateFolderUploadSessionId(baseFolderPath, rootFolderName);

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
        ensureFolderPermission(folder, project, GrantedProjectPermission.CREATE_FOLDER_ASSET);

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

                    String existingPath = folder.getFolderPath();
                    String oldPath = StringUtils.isNullOrBlank(existingPath) || "/".equals(existingPath)
                        ? folder.getFolderName()
                        : existingPath;
                String newPath = buildFolderPath(targetParent, updatedName);
            int oldLevel = safeLevel(folder.getLevel());
            int newLevel = targetParent != null ? safeLevel(targetParent.getLevel()) + 1 : 1;
            int levelDelta = newLevel - oldLevel;

            if (StringUtils.isNotNullOrBlank(oldPath) && !Objects.equals(oldPath, newPath)) {
                List<FolderEntity> descendants = folderRepo.findByFolderPathStartingWith(oldPath + "/");
                for (FolderEntity child : descendants) {
                    String updatedPath = newPath + child.getFolderPath().substring(oldPath.length());
                    child.setFolderPath(updatedPath);
                    if (levelDelta != 0) {
                        child.setLevel(safeLevel(child.getLevel()) + levelDelta);
                    }
                }
                folderRepo.saveAll(descendants);
            }

            folder.setFolderName(updatedName);
            folder.setParentFolderId(updatedParentId);
            folder.setFolderPath(newPath);
            folder.setLevel(newLevel);

            if (parentChanged) {
                adjustParentSubfolderCounts(oldParentId, updatedParentId);
            }
        }

        if (request.getDescription() != null) {
            folder.setDescription(trimToNull(request.getDescription()));
        }

        AuditChanges permissionChanges = null;
        if (request.getPermissions() != null) {
            ensureFolderPermission(folder, project, GrantedProjectPermission.ADD_USER);
            validateFolderPermissions(project, request.getPermissions());
            Map<String, Object> before = new HashMap<>();
            Map<String, Object> after = new HashMap<>();
            before.put("permissions", folder.getPermissions());
            after.put("permissions", request.getPermissions());
            permissionChanges = AuditChanges.builder()
                    .before(before)
                    .after(after)
                    .build();
            folder.setPermissions(request.getPermissions());
        }

        buildAudit(folder, false);
        FolderEntity savedFolder = folderRepo.save(folder);

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
        }

        if (StringUtils.isNotNullOrBlank(filter.getFolderName())) {
            query.addCriteria(Criteria.where("folderName").regex(filter.getFolderName().trim(), "i"));
        }

        if (filter.getIsActive() != null) {
            query.addCriteria(Criteria.where("isActive").is(filter.getIsActive()));
        } else {
            query.addCriteria(Criteria.where("isActive").is(true));
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

        FolderEntity folder = getActiveFolderOrThrow(folderId.trim());
        ProjectEntity project = getProjectOrThrow(folder.getProjectId());
        ensureProjectWritable(project);
        ensureFolderPermission(folder, project, GrantedProjectPermission.DELETE);

        String currentPath = folder.getFolderPath();
        String pathWithSelf = StringUtils.isNullOrBlank(currentPath) || "/".equals(currentPath)
            ? folder.getFolderName() + "/"
            : currentPath + "/";
        List<FolderEntity> descendants = folderRepo.findByFolderPathStartingWith(pathWithSelf);

        List<FolderEntity> toDeactivate = new ArrayList<>(descendants.size() + 1);
        toDeactivate.add(folder);
        toDeactivate.addAll(descendants);

        List<String> folderIds = toDeactivate.stream()
                .map(FolderEntity::getFolderId)
                .filter(StringUtils::isNotNullOrBlank)
                .toList();

        List<AssetEntity> assetsToDeactivate = assetRepo.findByFolderIdInAndIsActiveTrue(folderIds);
        for (AssetEntity asset : assetsToDeactivate) {
            asset.setIsActive(false);
            applyUpdateAudit(asset);
        }
        if (!assetsToDeactivate.isEmpty()) {
            assetRepo.saveAll(assetsToDeactivate);
        }

        for (FolderEntity item : toDeactivate) {
            item.setIsActive(false);
            applyUpdateAudit(item);
        }
        folderRepo.saveAll(toDeactivate);

        incrementProjectFolderCount(project, -toDeactivate.size());
        incrementProjectAssetCount(project, -assetsToDeactivate.size());

        if (StringUtils.isNotNullOrBlank(folder.getParentFolderId())) {
            FolderEntity parent = folderRepo.findById(folder.getParentFolderId())
                    .orElse(null);
            if (parent != null) {
                incrementParentSubfolderCount(parent, -1);
            }
        }

        writeFolderAuditLog(folder, AuditAction.DELETE, null);
    }

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

    private String requireNormalized(String value, String message) {
        String normalized = trimToNull(value);
        if (normalized == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, message);
        }
        return normalized;
    }

    private String trimToNull(String input) {
        if (input == null) {
            return null;
        }
        String trimmed = input.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeBaseFolderPath(FolderEntity parentFolder, String baseFolderPath) {
        String normalizedBase = trimToNull(baseFolderPath);
        if (parentFolder == null) {
            if (normalizedBase != null) {
                throw new UserBusinessException(ErrorCode.BAD_REQUEST,
                        "baseFolderPath must be empty when parentFolderId is null");
            }
            return null;
        }

        String parentPath = normalizeParentFolderPath(parentFolder);
        if (normalizedBase != null && !Objects.equals(normalizedBase, parentPath)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "baseFolderPath does not match parent folder");
        }
        return parentPath;
    }

    private String normalizeParentFolderPath(FolderEntity parentFolder) {
        String parentPath = parentFolder.getFolderPath();
        if (StringUtils.isNullOrBlank(parentPath) || "/".equals(parentPath)) {
            return parentFolder.getFolderName();
        }
        if (parentPath.endsWith("/")) {
            parentPath = parentPath.substring(0, parentPath.length() - 1);
        }
        return parentPath;
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

    private String composeFolderPath(String baseFolderPath, String relativePath) {
        if (StringUtils.isNullOrBlank(baseFolderPath)) {
            return relativePath;
        }
        String normalizedBase = baseFolderPath;
        if (normalizedBase.endsWith("/")) {
            normalizedBase = normalizedBase.substring(0, normalizedBase.length() - 1);
        }
        return normalizedBase + "/" + relativePath;
    }

    private FolderTreeMappingDTO buildFolderTreeMapping(FolderTreeNodeDTO node, String folderPath,
                                                        String folderId, String parentFolderId, String status) {
        return FolderTreeMappingDTO.builder()
                .clientFolderKey(node.getClientFolderKey())
                .relativeFolderPath(node.getRelativeFolderPath())
                .folderPath(folderPath)
                .folderId(folderId)
                .parentFolderId(parentFolderId)
                .status(status)
                .build();
    }

    private String generateFolderUploadSessionId(String baseFolderPath, String rootFolderName) {
        String prefix = StringUtils.isNullOrBlank(baseFolderPath)
                ? rootFolderName
                : baseFolderPath + "/" + rootFolderName;
        return prefix + "-" + UUID.randomUUID();
    }

    private String buildFolderPath(FolderEntity parent, String folderName) {
        if (parent == null) {
            return folderName;
        }
        String parentPath = parent.getFolderPath();
        if (StringUtils.isNullOrBlank(parentPath)) {
            return folderName;
        }
        if ("/".equals(parentPath)) {
            parentPath = parent.getFolderName();
        }
        if (parentPath.endsWith("/")) {
            parentPath = parentPath.substring(0, parentPath.length() - 1);
        }
        return parentPath + "/" + folderName;
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
        if (Boolean.FALSE.equals(folder.getIsActive())) {
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

        List<GrantedProjectPermission> effectivePermissions = ProjectPermissionResolver.resolveEffectiveFolderPermissions(
                project,
                folder,
                currentUser,
                isAdmin(currentUser),
                folderRepo
        );
        if (!ProjectPermissionResolver.hasPermission(effectivePermissions, required)) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }
    }

    private void validateFolderPermissions(ProjectEntity project, List<FolderPermission> permissions) {
        if (project == null || permissions == null) {
            return;
        }

        for (FolderPermission entry : permissions) {
            if (entry == null) {
                throw new UserBusinessException(ErrorCode.BAD_REQUEST, "permissions contains empty item");
            }

            String userId = trimToNull(entry.getUserId());
            if (userId == null) {
                throw new UserBusinessException(ErrorCode.BAD_REQUEST, "permissions.userId is required");
            }

            List<GrantedProjectPermission> projectPermissions =
                    ProjectPermissionResolver.resolveProjectPermissions(project, userId);
            if (projectPermissions.isEmpty()) {
                throw new UserBusinessException(ErrorCode.BAD_REQUEST, "permissions.userId not in project");
            }

            List<GrantedProjectPermission> folderPermissions = entry.getPermissions();
            if (folderPermissions == null) {
                continue;
            }

            for (GrantedProjectPermission permission : folderPermissions) {
                if (!GrantedProjectPermission.isFolderPermission(permission)) {
                    throw new UserBusinessException(ErrorCode.BAD_REQUEST, "invalid folder permission: " + permission);
                }
                if (!projectPermissions.contains(permission)) {
                    throw new UserBusinessException(ErrorCode.BAD_REQUEST, "folder permission exceeds project scope: " + permission);
                }
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
        if (candidateParent.getFolderPath() == null || targetFolder.getFolderPath() == null) {
            return false;
        }

        String parentPath = candidateParent.getFolderPath();
        String targetPath = targetFolder.getFolderPath();
        return parentPath.startsWith(targetPath + "/");
    }
}
