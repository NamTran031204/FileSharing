package org.example.filesharing.services.impl;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.PageRequestDto;
import org.example.filesharing.entities.PageResult;
import org.example.filesharing.entities.dtos.asset.*;
import org.example.filesharing.entities.dtos.auditlog.AuditLogCreateDTO;
import org.example.filesharing.entities.dtos.metadata.InitiateUploadResponseDto;
import org.example.filesharing.entities.models.*;
import org.example.filesharing.entities.models.folder.FolderPermission;
import org.example.filesharing.entities.models.folder.FolderStats;
import org.example.filesharing.entities.models.project.ProjectStats;
import org.example.filesharing.entities.models.base.EntityAuditBase;
import org.example.filesharing.enums.*;
import org.example.filesharing.enums.auth.UserGrantedRole;
import org.example.filesharing.enums.permission.GrantedProjectPermission;
import org.example.filesharing.exceptions.ErrorCode;
import org.example.filesharing.exceptions.specException.FileBusinessException;
import org.example.filesharing.exceptions.specException.UserBusinessException;
import org.example.filesharing.repositories.AssetRepo;
import org.example.filesharing.repositories.FolderRepo;
import org.example.filesharing.repositories.MetadataRepo;
import org.example.filesharing.repositories.ProjectRepo;
import org.example.filesharing.services.AssetService;
import org.example.filesharing.services.AuditLogService;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.services.MinIoService;
import org.example.filesharing.services.baseService.BaseAuditService;
import org.example.filesharing.utils.ProjectPermissionResolver;
import org.example.filesharing.utils.StringUtils;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

import static org.example.filesharing.utils.StringUtils.requireNormalized;
import static org.example.filesharing.utils.StringUtils.trimToNull;

@Service
@RequiredArgsConstructor
public class AssetServiceImpl extends BaseAuditService<AssetEntity> implements AssetService {

    private final AssetRepo assetRepo;
    private final MetadataRepo metadataRepo;
    private final ProjectRepo projectRepo;
    private final FolderRepo folderRepo;
    private final MongoTemplate mongoTemplate;
    private final AuditService auditService;
    private final AuditLogService auditLogService;
    private final MinIoService minIoService;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public AssetCreateResponseDto createAsset(AssetCreateRequestDto request) {
        validateCreateAssetRequest(request);

        String projectId = request.getProjectId().trim();
        ProjectEntity project = getProjectOrThrow(projectId);
        ensureProjectWritable(project);

        FolderEntity folder = null;
        String folderId = trimToNull(request.getFolderId());
        if (folderId != null) {
            folder = getActiveFolderOrThrow(folderId);
            ensureFolderInProject(folder, project);
            ensureFolderPermission(folder, GrantedProjectPermission.CREATE_FOLDER_ASSET);
        } else {
            ensureProjectModify(project, auditService.getCurrentUser());
        }

        String fileName = requireNormalized(request.getFileName(), "fileName is required");
        Optional<AssetEntity> asset;

        if (folderId != null) {
            asset = assetRepo.findByAssetNameAndFolderIdAndProjectIdAndIsActiveTrue(fileName, folderId, projectId);
        } else {
            Query query = new Query();
            query.addCriteria(Criteria.where("fileName").is(fileName));
            query.addCriteria(Criteria.where("projectId").is(projectId));
            query.addCriteria(Criteria.where("isActive").is(true));
            query.addCriteria(Criteria.where("folderId").is(null));
            asset = Optional.ofNullable(mongoTemplate.findOne(query, AssetEntity.class));
        }
        if (asset.isPresent()) {
            return createNewVersion(request, asset.get());
        }

        // tao asset moi neu chua co, asset moi version 1
        String currentUserId = auditService.getCurrentUserId();
        String currentUserEmail = auditService.getCurrentUserEmail();

        AssetEntity newAsset = AssetEntity.builder()
                .assetName(fileName)
                .description(trimToNull(request.getDescription()))
                .projectId(projectId)
                .folderId(folderId)
                .ownerId(currentUserId)
                .ownerEmail(currentUserEmail)
                .versionCount(1)
                .mediaType(MediaType.fromMime(request.getMimeType()))
                .assetStatus(AssetStatus.DRAFT)
                .build();

        buildAudit(newAsset, true);
        AssetEntity savedAsset = assetRepo.save(newAsset);

        String objectName = generateObjectName(fileName);
        InitiateUploadResponseDto upload = minIoService.initiateMultipartUpload(objectName, request.getFileSize());

        MetadataEntity version = buildMetadataVersion(request, savedAsset.getAssetId(), 1, objectName, upload.getUploadId());
        metadataRepo.save(version);

        incrementProjectAssetCount(project, 1);
        incrementProjectTotalVersions(project, 1);
        if (folder != null) {
            incrementFolderAssetCount(folder, 1);
        }

        writeAssetAuditLog(savedAsset, AuditAction.CREATE);
        writeVersionAuditLog(savedAsset.getAssetId(), 1, AuditAction.UPLOAD_NEW_VERSION);

        return AssetCreateResponseDto.builder()
                .asset(savedAsset)
                .version(version)
                .upload(upload)
                .build();
    }

    @Override
    public AssetDetailResponseDto getAssetById(String assetId) {
        AssetEntity asset = getAssetOrThrow(assetId);
        ensureAssetPermission(asset, GrantedProjectPermission.READ);

        MetadataEntity latestVersion = findLatestCompletedVersion(asset.getAssetId());

        return AssetDetailResponseDto.builder()
                .asset(asset)
                .latestVersion(latestVersion)
                .build();
    }

    @Override
    public PageResult<AssetSummaryDto> getAssetPage(PageRequestDto<AssetFilterRequestDto> dto) {
        PageRequestDto<AssetFilterRequestDto> pageRequest = dto != null ? dto : new PageRequestDto<>();
        AssetFilterRequestDto filter = pageRequest.getFilter();

        if (filter == null || StringUtils.isNullOrBlank(filter.getProjectId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }

        ProjectEntity project = getProjectOrThrow(filter.getProjectId().trim());
        ensureProjectRead(project, auditService.getCurrentUser());

        Query query = new Query();
        query.addCriteria(Criteria.where("projectId").is(project.getProjectId()));

        if (StringUtils.isNotNullOrBlank(filter.getFolderId())) {
            query.addCriteria(Criteria.where("folderId").is(filter.getFolderId().trim()));
        } else {
            query.addCriteria(new Criteria().orOperator(
                    Criteria.where("folderId").is(null),
                    Criteria.where("folderId").exists(false)
            ));
        }

        if (filter.getMediaType() != null) {
            List<String> assetIds = findAssetIdsByMediaType(project.getProjectId(), filter.getMediaType());
            if (assetIds.isEmpty()) {
                return PageResult.<AssetSummaryDto>builder()
                        .totalCount(0)
                        .data(Collections.emptyList())
                        .build();
            }
            query.addCriteria(Criteria.where("assetId").in(assetIds));
        }

        if (filter.getAssetStatus() != null) {
            query.addCriteria(Criteria.where("assetStatus").is(filter.getAssetStatus()));
        }

        if (StringUtils.isNotNullOrBlank(filter.getOwnerId())) {
            query.addCriteria(Criteria.where("ownerId").is(filter.getOwnerId().trim()));
        }

        if (StringUtils.isNotNullOrBlank(filter.getKeyword())) {
            query.addCriteria(Criteria.where("assetName").regex(filter.getKeyword().trim(), "i"));
        }

        if (filter.getIsActive() != null) {
            query.addCriteria(Criteria.where("isActive").is(filter.getIsActive()));
        } else {
            query.addCriteria(Criteria.where("isActive").is(true));
        }

        long totalCount = mongoTemplate.count(query, AssetEntity.class);
        query.with(pageRequest.getPageRequest());
        List<AssetEntity> assets = mongoTemplate.find(query, AssetEntity.class);

        List<AssetSummaryDto> data = new ArrayList<>();
        for (AssetEntity asset : assets) {
            MetadataEntity latestVersion = findLatestCompletedVersion(asset.getAssetId());
            data.add(AssetSummaryDto.builder()
                    .asset(asset)
                    .latestVersion(latestVersion)
                    .build());
        }

        return PageResult.<AssetSummaryDto>builder()
                .totalCount(totalCount)
                .data(data)
                .build();
    }

    @Override
    @Transactional
    public AssetEntity updateAsset(AssetUpdateRequestDto request) {
        validateUpdateAssetRequest(request);

        AssetEntity asset = getAssetOrThrow(request.getAssetId().trim());
        ensureAssetPermission(asset, GrantedProjectPermission.CREATE_FOLDER_ASSET);

        if (StringUtils.isNotNullOrBlank(request.getAssetName())) {
            asset.setAssetName(request.getAssetName().trim());
        }

        if (request.getDescription() != null) {
            asset.setDescription(trimToNull(request.getDescription()));
        }

        if (request.getShareExpiry() != null) {
            asset.setShareExpiry(request.getShareExpiry());
        }

        if (Boolean.TRUE.equals(request.getRegenerateShareToken())) {
            asset.setShareToken(passwordEncoder.encode(UUID.randomUUID().toString()));
        }

        buildAudit(asset, false);
        AssetEntity saved = assetRepo.save(asset);
        writeAssetAuditLog(saved, AuditAction.UPDATE);
        return saved;
    }

    @Override
    @Transactional
    public AssetEntity moveAsset(AssetMoveRequestDto request) {
        validateMoveRequest(request);

        AssetEntity asset = getAssetOrThrow(request.getAssetId().trim());
        ProjectEntity project = getProjectOrThrow(asset.getProjectId());
        FolderEntity currentFolder = null;
        if (StringUtils.isNotNullOrBlank(asset.getFolderId())) {
            currentFolder = getActiveFolderOrThrow(asset.getFolderId());
            ensureFolderPermission(currentFolder, GrantedProjectPermission.CREATE_FOLDER_ASSET);
        } else {
            ensureProjectModify(project, auditService.getCurrentUser());
        }

        FolderEntity targetFolder = null;
        String targetFolderId = trimToNull(request.getTargetFolderId());
        if (targetFolderId != null) {
            targetFolder = getActiveFolderOrThrow(targetFolderId);
            ensureFolderInProject(targetFolder, project);
            ensureFolderPermission(targetFolder, GrantedProjectPermission.CREATE_FOLDER_ASSET);
        } else {
            ensureProjectModify(project, auditService.getCurrentUser());
        }

        asset.setFolderId(targetFolderId);
        buildAudit(asset, false);
        AssetEntity saved = assetRepo.save(asset);

        if (currentFolder != null) {
            incrementFolderAssetCount(currentFolder, -1);
        }
        if (targetFolder != null) {
            incrementFolderAssetCount(targetFolder, 1);
        }

        writeAssetAuditLog(saved, AuditAction.UPDATE);
        return saved;
    }

    @Override
    @Transactional
    public void deleteAsset(String assetId) {
        AssetEntity asset = getAssetOrThrow(assetId);
        ensureAssetPermission(asset, GrantedProjectPermission.DELETE);

        asset.setIsActive(false);
        buildAudit(asset, false);
        assetRepo.save(asset);

        List<MetadataEntity> versions = metadataRepo.findByAssetId(asset.getAssetId());
        Instant trashedAt = Instant.now();
        for (MetadataEntity version : versions) {
            version.setIsActive(false);
//            version.setTrashedAt(trashedAt);
        }
        if (!versions.isEmpty()) {
            metadataRepo.saveAll(versions);
        }

        ProjectEntity project = getProjectOrThrow(asset.getProjectId());
        incrementProjectAssetCount(project, -1);

        if (StringUtils.isNotNullOrBlank(asset.getFolderId())) {
            FolderEntity folder = getActiveFolderOrThrow(asset.getFolderId());
            incrementFolderAssetCount(folder, -1);
        }

        writeAssetAuditLog(asset, AuditAction.DELETE);
    }

    @Override
    @Transactional
    public AssetCreateResponseDto createVersion(AssetCreateRequestDto request) {
        validateCreateVersionRequest(request);

        AssetEntity asset = getAssetOrThrow(request.getAssetId().trim());
        ensureAssetPermission(asset, GrantedProjectPermission.CREATE_FOLDER_ASSET);
        return createNewVersion(request, asset);

    }

    AssetCreateResponseDto createNewVersion(AssetCreateRequestDto request, AssetEntity asset) {
        MediaType mediaType = request.getMediaType() != null ? request.getMediaType() : MediaType.fromMime(request.getMimeType());
        if (mediaType != asset.getMediaType()) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "mediaType must match original version");
        }

        int currentCount = asset.getVersionCount() != null ? asset.getVersionCount() : 0;
        int nextVersionNumber = currentCount + 1;

        String objectName = generateObjectName(requireNormalized(request.getFileName(), "fileName is required"));
        InitiateUploadResponseDto upload = minIoService.initiateMultipartUpload(objectName, request.getFileSize());

        // todo: su dung service metadata
        MetadataEntity version = buildMetadataVersion(request, asset.getAssetId(), nextVersionNumber, objectName, upload.getUploadId());
        metadataRepo.save(version);

        asset.setVersionCount(nextVersionNumber);
        if (request.getAssetStatus() != null) {
            ensureAssetStatusAllowed(request.getAssetStatus());
            asset.setAssetStatus(request.getAssetStatus());
        }
        buildAudit(asset, false);
        assetRepo.save(asset);

        ProjectEntity project = getProjectOrThrow(asset.getProjectId());
        incrementProjectTotalVersions(project, 1);

        writeVersionAuditLog(asset.getAssetId(), nextVersionNumber, AuditAction.UPLOAD_NEW_VERSION);

        // todo: gui email thong bao cho cac user da update phien ban moi (kafka)

        return AssetCreateResponseDto.builder()
                .version(version)
                .asset(asset)
                .upload(upload)
                .build();
    }

    @Override
    @Transactional
    public MetadataEntity updateVersion(VersionUpdateRequestDto request) {
        if (request == null || request.getVersionNumber() == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "versionNumber is required");
        }

        MetadataEntity fileVersion = metadataRepo.findByAssetIdAndVersionNumber(request.getAssetId(), request.getVersionNumber())
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FILE_NOT_FOUND));

        AssetEntity asset = getAssetOrThrow(fileVersion.getAssetId());
        ensureAssetPermission(asset, GrantedProjectPermission.CREATE_FOLDER_ASSET);

        if (StringUtils.isNotNullOrBlank(request.getDownloadFileName())) {
            fileVersion.setDownloadFileName(request.getDownloadFileName().trim());
        }

        if (request.getProcessingStatus() != null) {
            fileVersion.setProcessingStatus(request.getProcessingStatus());
        }

        if (request.getProcessingError() != null) {
            fileVersion.setProcessingError(request.getProcessingError());
        }

        if (request.getMediaInfo() != null) {
            fileVersion.setMediaInfo(mapMediaInfo(request.getMediaInfo()));
        }

        MetadataEntity saved = metadataRepo.save(fileVersion);
        writeVersionAuditLog(asset.getAssetId(), saved.getVersionNumber(), AuditAction.UPDATE);
        return saved;
    }

    @Override
    public PageResult<MetadataEntity> getVersionPage(PageRequestDto<VersionFilterRequestDto> dto) {
        PageRequestDto<VersionFilterRequestDto> pageRequest = dto != null ? dto : new PageRequestDto<>();
        VersionFilterRequestDto filter = pageRequest.getFilter();

        if (filter == null || StringUtils.isNullOrBlank(filter.getAssetId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "assetId is required");
        }

        AssetEntity asset = getAssetOrThrow(filter.getAssetId().trim());
        ensureAssetPermission(asset, GrantedProjectPermission.READ);

        Query query = new Query();
        query.addCriteria(Criteria.where("assetId").is(asset.getAssetId()));

        if (filter.getIncludeTrash() == null || !filter.getIncludeTrash()) {
            query.addCriteria(Criteria.where("isTrash").ne(true));
        }

        if (filter.getStatus() != null) {
            query.addCriteria(Criteria.where("status").is(filter.getStatus()));
        }

        if (filter.getProcessingStatus() != null) {
            query.addCriteria(Criteria.where("processingStatus").is(filter.getProcessingStatus()));
        }

        long totalCount = mongoTemplate.count(query, MetadataEntity.class);

        PageRequest paging = pageRequest.getPageRequest();
        if (StringUtils.isNullOrBlank(pageRequest.getSorting())) {
            paging = PageRequest.of(paging.getPageNumber(), paging.getPageSize(), Sort.by(Sort.Direction.DESC, "versionNumber"));
        }
        query.with(paging);

        List<MetadataEntity> versions = mongoTemplate.find(query, MetadataEntity.class);

        return PageResult.<MetadataEntity>builder()
                .totalCount(totalCount)
                .data(versions)
                .build();
    }

    @Override
    public MetadataEntity getVersion(String assetId, Integer versionNumber) {
        if (StringUtils.isNullOrBlank(assetId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "assetId is required");
        }
        if (versionNumber == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "versionNumber is required");
        }

        MetadataEntity version = metadataRepo.findByAssetIdAndVersionNumber(assetId.trim(), versionNumber)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FILE_NOT_FOUND));

        AssetEntity asset = getAssetOrThrow(version.getAssetId());
        ensureAssetPermission(asset, GrantedProjectPermission.READ);
        return version;
    }

    @Override
    public MetadataEntity getLatestVersion(String assetId) {
        if (StringUtils.isNullOrBlank(assetId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "assetId is required");
        }

        AssetEntity asset = getAssetOrThrow(assetId.trim());
        ensureAssetPermission(asset, GrantedProjectPermission.READ);

        return findLatestCompletedVersion(asset.getAssetId());
    }

    @Override
    @Transactional
    public void deleteVersion(String assetId, Integer versionNumber) {
        if (StringUtils.isNullOrBlank(assetId)) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "assetId is required");
        }
        if (versionNumber == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "versionNumber is required");
        }

        MetadataEntity version = metadataRepo.findByAssetIdAndVersionNumber(assetId.trim(), versionNumber)
                .orElseThrow(() -> new FileBusinessException(ErrorCode.FILE_NOT_FOUND));

        AssetEntity asset = getAssetOrThrow(version.getAssetId());
        ensureAssetPermission(asset, GrantedProjectPermission.DELETE);

        long activeCount = metadataRepo.countByAssetIdAndIsTrashFalse(asset.getAssetId());
        if (activeCount <= 1) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "cannot delete the only version of an asset");
        }

        version.setIsTrash(true);
        version.setTrashedAt(Instant.now());
        metadataRepo.save(version);

        writeVersionAuditLog(asset.getAssetId(), version.getVersionNumber(), AuditAction.DELETE);
    }

    private void validateCreateAssetRequest(AssetCreateRequestDto request) {
        if (request == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Request body is required");
        }

        if (StringUtils.isNullOrBlank(request.getProjectId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "projectId is required");
        }

        requireNormalized(request.getFileName(), "fileName is required");

        if (request.getFileSize() == null || request.getFileSize() <= 0) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "fileSize is required");
        }

        if (request.getMediaType() == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "mediaType is required");
        }
    }

    private void validateUpdateAssetRequest(AssetUpdateRequestDto request) {
        if (request == null || StringUtils.isNullOrBlank(request.getAssetId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "assetId is required");
        }
    }

    private void validateMoveRequest(AssetMoveRequestDto request) {
        if (request == null || StringUtils.isNullOrBlank(request.getAssetId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "assetId is required");
        }
    }

    private void validateCreateVersionRequest(AssetCreateRequestDto request) {
        if (request == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Request body is required");
        }

        if (StringUtils.isNullOrBlank(request.getAssetId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "assetId is required");
        }

        requireNormalized(request.getFileName(), "fileName is required");

        if (request.getFileSize() == null || request.getFileSize() <= 0) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "fileSize is required");
        }

        if (request.getMediaType() == null) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "mediaType is required");
        }
    }

    private String generateObjectName(String fileName) {
        String normalizedFileName = requireNormalized(fileName, "fileName is required");
        String objectName;
        do {
            objectName = UUID.randomUUID() + "_" + normalizedFileName;
        } while (metadataRepo.existsByObjectName(objectName));
        return objectName;
    }

    private MetadataEntity buildMetadataVersion(AssetCreateRequestDto request, String assetId, int versionNumber, String objectName, String uploadId) {
        String currentUserId = auditService.getCurrentUserId();
        String currentUserEmail = auditService.getCurrentUserEmail();

        MetadataEntity metadata = MetadataEntity.builder()
                .fileName(request.getFileName())
                .downloadFileName(request.getFileName() + "v" + versionNumber)
                .objectName(objectName)
                .mimeType(request.getMimeType())
                .fileSize(request.getFileSize())
                .compressionAlgo(request.getCompressionAlgo())
                .ownerId(currentUserId)
                .ownerEmail(currentUserEmail)
                .uploadId(uploadId)
                .status(UploadStatus.UPLOADING)
                .processingStatus(defaultProcessingStatus(request.getMediaType()))
                .assetId(assetId)
                .versionNumber(versionNumber)
                .mediaType(request.getMediaType())
                .isActive(true)
                .isTrash(false)
                .build();

        if (request.getTimeToLive() == null) {
            metadata.setTimeToLive(Integer.MAX_VALUE);
        } else {
            metadata.setTimeToLive(request.getTimeToLive());
        }

        metadata.setShareToken(passwordEncoder.encode(UUID.randomUUID().toString()));
        return metadata;
    }

    private ProcessingStatus defaultProcessingStatus(MediaType mediaType) {
        if (mediaType == MediaType.VIDEO) {
            return ProcessingStatus.PENDING;
        }
        return ProcessingStatus.READY;
    }

    private void ensureAssetStatusAllowed(AssetStatus status) {
        if (status == AssetStatus.APPROVED || status == AssetStatus.REQUEST_CHANGES) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "assetStatus should be managed by review workflow");
        }
    }

    private MetadataEntity findLatestCompletedVersion(String assetId) {
        Query query = new Query();
        query.addCriteria(Criteria.where("assetId").is(assetId));
        query.addCriteria(Criteria.where("status").is(UploadStatus.COMPLETED));
        query.addCriteria(Criteria.where("isTrash").ne(true));
        query.with(Sort.by(Sort.Direction.DESC, "versionNumber"));
        return mongoTemplate.findOne(query, MetadataEntity.class);
    }

    private List<String> findAssetIdsByMediaType(String projectId, MediaType mediaType) {
        Query query = new Query();
        query.addCriteria(Criteria.where("assetId").exists(true));
        query.addCriteria(Criteria.where("mediaType").is(mediaType));
        query.addCriteria(Criteria.where("isTrash").ne(true));
        query.addCriteria(Criteria.where("isActive").is(true));
        query.with(Sort.by(Sort.Direction.DESC, "versionNumber"));

        List<MetadataEntity> versions = mongoTemplate.find(query, MetadataEntity.class);
        Set<String> assetIds = new HashSet<>();
        for (MetadataEntity version : versions) {
            if (StringUtils.isNotNullOrBlank(version.getAssetId())) {
                assetIds.add(version.getAssetId());
            }
        }
        return new ArrayList<>(assetIds);
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

    private AssetEntity getAssetOrThrow(String assetId) {
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

    private void ensureAssetPermission(AssetEntity asset, GrantedProjectPermission required) {
        ProjectEntity project = getProjectOrThrow(asset.getProjectId());
        if (StringUtils.isNotNullOrBlank(asset.getFolderId())) {
            FolderEntity folder = getActiveFolderOrThrow(asset.getFolderId());
            ensureFolderInProject(folder, project);
            ensureFolderPermission(folder, required);
        } else {
            ensureProjectPermission(project, auditService.getCurrentUser(), required);
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

    private void ensureFolderPermission(FolderEntity folder, GrantedProjectPermission required) {
        UserEntity currentUser = auditService.getCurrentUser();
        if (isAdmin(currentUser)) {
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

    private void incrementProjectAssetCount(ProjectEntity project, int delta) {
        ProjectStats stats = ensureProjectStats(project);
        int current = stats.getAssetCount() != null ? stats.getAssetCount() : 0;
        stats.setAssetCount(Math.max(0, current + delta));
        project.setStats(stats);
        projectRepo.save(project);
    }

    private void incrementProjectTotalVersions(ProjectEntity project, int delta) {
        ProjectStats stats = ensureProjectStats(project);
        int current = stats.getTotalVersions() != null ? stats.getTotalVersions() : 0;
        stats.setTotalVersions(Math.max(0, current + delta));
        project.setStats(stats);
        projectRepo.save(project);
    }

    private void incrementFolderAssetCount(FolderEntity folder, int delta) {
        FolderStats stats = ensureFolderStats(folder);
        int current = stats.getAssetCount() != null ? stats.getAssetCount() : 0;
        stats.setAssetCount(Math.max(0, current + delta));
        folder.setStats(stats);
        applyUpdateAudit(folder);
        folderRepo.save(folder);
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
            folder.setStats(FolderStats.builder()
                    .assetCount(0)
                    .subfoldersCount(0)
                    .pendingReviewsCount(0)
                    .build());
        }
        return folder.getStats();
    }

    private void applyUpdateAudit(EntityAuditBase entity) {
        entity.setUpdateBy(auditService.getCurrentUserId());
        entity.setUpdateByEmail(auditService.getCurrentUserEmail());
    }

    private void writeAssetAuditLog(AssetEntity asset, AuditAction action) {
        if (asset == null || StringUtils.isNullOrBlank(asset.getAssetId())) {
            return;
        }

        AuditLogCreateDTO dto = new AuditLogCreateDTO();
        dto.setAction(action);
        dto.setTargetType(AuditTargetType.ASSET);
        dto.setTargetId(asset.getAssetId());
        dto.setTargetName(asset.getAssetName());
        dto.setAssetId(asset.getAssetId());
        auditLogService.createAuditLog(dto);
    }

    private void writeVersionAuditLog(String assetId, Integer versionNumber, AuditAction action) {
        if (versionNumber == null) {
            return;
        }

        AuditLogCreateDTO dto = new AuditLogCreateDTO();
        dto.setAction(action);
        dto.setTargetType(AuditTargetType.FILE);
        dto.setTargetId(assetId);
        dto.setAssetId(assetId);
        dto.setVersionNumber(versionNumber);
        auditLogService.createAuditLog(dto);
    }

    private MetadataEntity.MediaInfo mapMediaInfo(MediaInfoDto input) {
        MetadataEntity.MediaInfo info = new MetadataEntity.MediaInfo();
        info.setDurationMs(input.getDurationMs());
        info.setWidth(input.getWidth());
        info.setHeight(input.getHeight());
        info.setFrameRate(input.getFrameRate());
        info.setCodec(input.getCodec());
        info.setColorSpace(input.getColorSpace());
        info.setHasAlpha(input.getHasAlpha());
        return info;
    }
}
