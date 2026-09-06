package org.example.filesharing.services.impl;

import com.file.service.filesharing.core.entity.models.AssetEntity;
import com.file.service.filesharing.core.entity.models.FolderEntity;
import com.file.service.filesharing.core.entity.models.MetadataEntity;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
import com.file.service.filesharing.core.entity.models.folder.FolderPermission;
import com.file.service.filesharing.core.enums.auth.UserGrantedRole;
import com.file.service.filesharing.core.enums.permission.GrantedProjectPermission;
import com.file.service.filesharing.core.exceptions.ErrorCode;
import com.file.service.filesharing.core.exceptions.specException.FileBusinessException;
import com.file.service.filesharing.core.exceptions.specException.UserBusinessException;
import com.file.service.filesharing.core.utils.StringUtils;
import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.repositories.AssetRepo;
import org.example.filesharing.repositories.FolderRepo;
import org.example.filesharing.repositories.MetadataRepo;
import org.example.filesharing.repositories.ProjectRepo;
import org.example.filesharing.services.AssetAccessService;
import org.example.filesharing.services.AuditService;
import org.example.filesharing.utils.ProjectPermissionResolver;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Objects;

/**
 * Seam service: lookup + permission checks for asset/folder/project, shared by
 * AssetService, MetadataService and ProcessingService. Depends only on repositories
 * and AuditService — never on those three services — so it cannot re-introduce the
 * circular bean dependency that used to exist between them.
 */
@Service
@RequiredArgsConstructor
public class AssetAccessServiceImpl implements AssetAccessService {

    private final AssetRepo assetRepo;
    private final MetadataRepo metadataRepo;
    private final ProjectRepo projectRepo;
    private final FolderRepo folderRepo;
    private final AuditService auditService;

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
    public void ensureAssetPermission(AssetEntity asset, GrantedProjectPermission required) {
        ProjectEntity project = getProjectOrThrow(asset.getProjectId());
        if (StringUtils.isNotNullOrBlank(asset.getFolderId())) {
            FolderEntity folder = getActiveFolderOrThrow(asset.getFolderId());
            ensureFolderInProject(folder, project);
            ensureFolderPermission(folder, required);
        } else {
            ensureProjectPermission(project, auditService.getCurrentUser(), required);
        }
    }

    @Override
    public void ensureProjectPermission(ProjectEntity project, UserEntity user, GrantedProjectPermission required) {
        List<GrantedProjectPermission> permissions = ProjectPermissionResolver.resolveProjectPermissions(
                project,
                user,
                isAdmin(user)
        );
        if (!ProjectPermissionResolver.hasPermission(permissions, required)) {
            throw new FileBusinessException(ErrorCode.FILE_PERMISSION_ERROR);
        }
    }

    @Override
    public void ensureFolderPermission(FolderEntity folder, GrantedProjectPermission required) {
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

    @Override
    public void ensureFolderInProject(FolderEntity folder, ProjectEntity project) {
        if (!Objects.equals(folder.getProjectId(), project.getProjectId())) {
            throw new UserBusinessException(ErrorCode.BAD_REQUEST, "Folder does not belong to project");
        }
    }

    @Override
    public boolean isAdmin(UserEntity user) {
        if (user == null || user.getUserGrantedRoles() == null) {
            return false;
        }
        return user.getUserGrantedRoles().contains(UserGrantedRole.ROLE_ADMIN)
                || user.getUserGrantedRoles().contains(UserGrantedRole.ROLE_SA);
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
}
