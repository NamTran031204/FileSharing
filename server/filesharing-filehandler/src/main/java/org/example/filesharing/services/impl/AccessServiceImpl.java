package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.AssetEntity;
import com.file.service.filesharing.core.entity.models.FolderEntity;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
import com.file.service.filesharing.core.enums.ProjectStatus;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import com.file.service.filesharing.core.exceptions.specException.UserBusinessException;
import com.file.service.filesharing.core.utils.StringUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.example.filesharing.entities.dtos.access.MyAccessDTO;
import org.example.filesharing.repositories.AssetRepo;
import org.example.filesharing.repositories.FolderRepo;
import org.example.filesharing.repositories.ProjectRepo;
import org.example.filesharing.services.AccessService;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.utils.access.AccessContext;
import org.example.filesharing.utils.access.AccessResolver;
import org.example.filesharing.utils.access.Action;
import org.example.filesharing.utils.access.ResourceRef;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

/**
 * Tai project/chain folder roi uy quyen cho AccessResolver. Chi phu thuoc repository, MongoTemplate,
 * AuditService (giong AssetAccessServiceImpl) de khong tao vong bean. Khong cache, khong admin bypass.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AccessServiceImpl implements AccessService {

    private static final String ROLE_REQUIRED_KEY = "error.access.roleRequired";
    private static final String PROJECT_LOCKED_KEY = "error.access.projectLocked";
    private static final String[] CHAIN_FIELDS =
            {"parentFolderId", "projectId", "folderName", "grants", "link", "settings", "isActive", "isTrash"};

    private final ProjectRepo projectRepo;
    private final FolderRepo folderRepo;
    private final AssetRepo assetRepo;
    private final MongoTemplate mongoTemplate;
    private final AuditService auditService;

    @Override
    public AccessContext resolve(ResourceRef ref) {
        return resolve(ref, auditService.getCurrentUserId());
    }

    @Override
    public AccessContext resolve(ResourceRef ref, String userId) {
        Instant now = Instant.now();
        return switch (ref.type()) {
            case PROJECT -> AccessResolver.resolve(getProject(ref.id()), List.of(), userId, now);
            case FOLDER -> {
                FolderEntity folder = getFolder(ref.id());
                yield AccessResolver.resolve(getProject(folder.getProjectId()), loadChain(folder), userId, now);
            }
            case ASSET -> {
                AssetEntity asset = getAsset(ref.id());
                ProjectEntity project = getProject(asset.getProjectId());
                List<FolderEntity> chain = List.of();
                if (StringUtils.isNotNullOrBlank(asset.getFolderId())) {
                    FolderEntity folder = getFolder(asset.getFolderId());
                    if (!Objects.equals(folder.getProjectId(), project.getProjectId())) {
                        throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Folder does not belong to project");
                    }
                    chain = loadChain(folder);
                }
                yield AccessResolver.resolve(project, chain, userId, now, Boolean.TRUE.equals(asset.getIsTrash()));
            }
        };
    }

    @Override
    public boolean can(ResourceRef ref, Action action) {
        return AccessResolver.can(resolve(ref), action);
    }

    @Override
    public AccessContext require(ResourceRef ref, Action action) {
        String userId = auditService.getCurrentUserId();
        AccessContext ctx = resolve(ref, userId);
        if (ctx.role() == null) {
            log.debug("[access] tu choi user={} {} {} action={} role=NONE", userId, ref.type(), ref.id(), action);
            throw new FileBusinessException(ErrorCode.ACCESS_DENIED);
        }
        if (!AccessResolver.can(ctx, action)) {
            log.debug("[access] tu choi user={} {} {} action={} role={} own={}",
                    userId, ref.type(), ref.id(), action, ctx.role(), ctx.own());
            ProjectStatus status = ctx.projectStatus();
            if (action.blockedByStatus() && (status == ProjectStatus.ARCHIVED || status == ProjectStatus.COMPLETED)) {
                // bi chan boi trang thai project, khong phai do thieu vai tro
                throw new FileBusinessException(ErrorCode.ACTION_NOT_ALLOWED, PROJECT_LOCKED_KEY, status.name());
            }
            throw new FileBusinessException(ErrorCode.ACTION_NOT_ALLOWED, ROLE_REQUIRED_KEY, action.minRole().name());
        }
        return ctx;
    }

    @Override
    public List<FolderEntity> filterVisible(ProjectEntity project, List<FolderEntity> folders) {
        return AccessResolver.visibleFolders(project, folders, auditService.getCurrentUserId(), Instant.now());
    }

    @Override
    public List<FolderEntity> chain(String folderId) {
        return loadChain(getFolder(folderId));
    }

    @Override
    public MyAccessDTO myAccess(ResourceRef ref) {
        return MyAccessDTO.from(resolve(ref));
    }

    // 1 query _id $in (ancestorIds + folderId); lech thi di lai theo parentFolderId
    private List<FolderEntity> loadChain(FolderEntity target) {
        List<String> ids = new ArrayList<>();
        if (target.getAncestorIds() != null) {
            ids.addAll(target.getAncestorIds());
        }
        ids.add(target.getFolderId());
        Query query = Query.query(Criteria.where("_id").in(ids));
        query.fields().include(CHAIN_FIELDS);
        List<FolderEntity> loaded = mongoTemplate.find(query, FolderEntity.class);

        List<FolderEntity> chain = AccessResolver.validateChain(target.getProjectId(), target, loaded)
                .orElseGet(() -> {
                    log.warn("[access] chain lech, di lai theo parentFolderId, folderId={}", target.getFolderId());
                    return walkParents(target, loaded);
                });
        if (chain.stream().anyMatch(f -> Boolean.FALSE.equals(f.getIsActive()))) {
            throw new FileBusinessException(ErrorCode.FOLDER_NOT_FOUND);
        }
        return chain;
    }

    // dung khi thieu cha hoac cha khac project: chain ngan hon chi lam mat quyen, khong cap thua
    private List<FolderEntity> walkParents(FolderEntity target, List<FolderEntity> loaded) {
        Map<String, FolderEntity> byId = new HashMap<>();
        loaded.forEach(f -> byId.put(f.getFolderId(), f));
        Deque<FolderEntity> path = new ArrayDeque<>();
        Set<String> seen = new HashSet<>();
        FolderEntity node = byId.getOrDefault(target.getFolderId(), target);
        while (node != null && seen.add(node.getFolderId())
                && Objects.equals(node.getProjectId(), target.getProjectId())) {
            path.addFirst(node);
            String parentId = node.getParentFolderId();
            node = parentId == null ? null : byId.containsKey(parentId) ? byId.get(parentId) : findChainNode(parentId);
        }
        return List.copyOf(path);
    }

    private FolderEntity findChainNode(String folderId) {
        Query query = Query.query(Criteria.where("_id").is(folderId));
        query.fields().include(CHAIN_FIELDS);
        return mongoTemplate.findOne(query, FolderEntity.class);
    }

    private ProjectEntity getProject(String projectId) {
        if (StringUtils.isNullOrBlank(projectId)) {
            throw new FileBusinessException(ErrorCode.PROJECT_NOT_FOUND);
        }
        ProjectEntity project = projectRepo.findById(projectId)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.PROJECT_NOT_FOUND));
        if (Boolean.FALSE.equals(project.getIsActive())) {
            throw new FileBusinessException(ErrorCode.PROJECT_NOT_FOUND);
        }
        return project;
    }

    private FolderEntity getFolder(String folderId) {
        if (StringUtils.isNullOrBlank(folderId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "folderId is required");
        }
        FolderEntity folder = folderRepo.findById(folderId.trim())
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FOLDER_NOT_FOUND));
        if (Boolean.FALSE.equals(folder.getIsActive())) {
            throw new FileBusinessException(ErrorCode.FOLDER_NOT_FOUND);
        }
        return folder;
    }

    private AssetEntity getAsset(String assetId) {
        if (StringUtils.isNullOrBlank(assetId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "assetId is required");
        }
        AssetEntity asset = assetRepo.findById(assetId.trim())
                .orElseThrow(() -> new FileBusinessException(ErrorCode.NOT_FOUND));
        if (Boolean.FALSE.equals(asset.getIsActive())) {
            throw new FileBusinessException(ErrorCode.NOT_FOUND);
        }
        return asset;
    }
}
