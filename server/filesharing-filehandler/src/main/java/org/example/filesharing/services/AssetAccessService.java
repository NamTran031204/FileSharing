package org.example.filesharing.services;

import com.file.service.filesharing.core.entity.models.AssetEntity;
import com.file.service.filesharing.core.entity.models.FolderEntity;
import com.file.service.filesharing.core.entity.models.MetadataEntity;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
import org.example.filesharing.utils.access.Action;

public interface AssetAccessService {

    // version cua asset, kiem VIEW tren asset
    MetadataEntity getVersion(String assetId, Integer versionNumber);

    void ensureAssetPermission(AssetEntity asset, Action action);

    void ensureProjectPermission(ProjectEntity project, Action action);

    void ensureFolderAccess(FolderEntity folder, Action action);

    void ensureFolderInProject(FolderEntity folder, ProjectEntity project);

    void ensureAssetPermissionById(String assetId, Action action);

    // false khi thieu quyen, loi khac (khong tim thay asset...) van nem ra
    boolean hasAssetPermissionById(String assetId, Action action);

    void ensureFolderAccessById(String folderId, Action action);
}
