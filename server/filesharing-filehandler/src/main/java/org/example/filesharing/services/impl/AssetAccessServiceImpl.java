package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.AssetEntity;
import com.file.service.filesharing.core.entity.models.FolderEntity;
import com.file.service.filesharing.core.entity.models.MetadataEntity;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import com.file.service.filesharing.core.exceptions.specException.UserBusinessException;
import com.file.service.filesharing.core.utils.StringUtils;
import lombok.RequiredArgsConstructor;
import org.example.filesharing.repositories.MetadataRepo;
import org.example.filesharing.services.AccessService;
import org.example.filesharing.services.AssetAccessService;
import org.example.filesharing.utils.access.Action;
import org.example.filesharing.utils.access.ResourceRef;
import org.springframework.stereotype.Service;

import java.util.Objects;

/**
 * Seam dung chung cho AssetService, MetadataService, ProcessingService: tra version va uy quyen kiem
 * cho AccessService. Chi phu thuoc repository va AccessService de khong tao vong bean voi cac service tren.
 */
@Service
@RequiredArgsConstructor
public class AssetAccessServiceImpl implements AssetAccessService {

    private final MetadataRepo metadataRepo;
    private final AccessService accessService;

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

        // AccessService tu tai asset, khong tai lai o day de duong HLS segment chi them 1 query chain
        ensureAssetPermissionById(version.getAssetId(), Action.VIEW);
        return version;
    }

    @Override
    public void ensureAssetPermission(AssetEntity asset, Action action) {
        ensureAssetPermissionById(asset.getAssetId(), action);
    }

    @Override
    public void ensureProjectPermission(ProjectEntity project, Action action) {
        accessService.require(ResourceRef.project(project.getProjectId()), action);
    }

    @Override
    public void ensureFolderAccess(FolderEntity folder, Action action) {
        ensureFolderAccessById(folder.getFolderId(), action);
    }

    @Override
    public void ensureFolderInProject(FolderEntity folder, ProjectEntity project) {
        if (!Objects.equals(folder.getProjectId(), project.getProjectId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Folder does not belong to project");
        }
    }

    @Override
    public void ensureAssetPermissionById(String assetId, Action action) {
        accessService.require(ResourceRef.asset(assetId), action);
    }

    @Override
    public boolean hasAssetPermissionById(String assetId, Action action) {
        return accessService.can(ResourceRef.asset(assetId), action);
    }

    @Override
    public void ensureFolderAccessById(String folderId, Action action) {
        accessService.require(ResourceRef.folder(folderId), action);
    }
}
