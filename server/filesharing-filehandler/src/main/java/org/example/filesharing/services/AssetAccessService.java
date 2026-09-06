package org.example.filesharing.services;

import com.file.service.filesharing.core.entity.models.AssetEntity;
import com.file.service.filesharing.core.entity.models.FolderEntity;
import com.file.service.filesharing.core.entity.models.MetadataEntity;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
import com.file.service.filesharing.core.enums.permission.GrantedProjectPermission;
import org.example.filesharing.entities.models.UserEntity;

public interface AssetAccessService {

    MetadataEntity getVersion(String assetId, Integer versionNumber);

    void ensureAssetPermission(AssetEntity asset, GrantedProjectPermission required);

    void ensureProjectPermission(ProjectEntity project, UserEntity user, GrantedProjectPermission required);

    void ensureFolderPermission(FolderEntity folder, GrantedProjectPermission required);

    void ensureFolderInProject(FolderEntity folder, ProjectEntity project);

    boolean isAdmin(UserEntity user);
}
