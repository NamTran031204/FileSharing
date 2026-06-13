package org.example.filesharing.utils;

import com.file.service.filesharing.core.entity.models.FolderEntity;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
import org.example.filesharing.entities.models.UserEntity;
import com.file.service.filesharing.core.entity.models.folder.FolderPermission;
import com.file.service.filesharing.core.entity.models.project.ProjectCollaborator;
import com.file.service.filesharing.core.enums.FolderVisibility;
import com.file.service.filesharing.core.enums.permission.GrantedProjectPermission;
import com.file.service.filesharing.core.enums.permission.GrantedProjectRole;
import com.file.service.filesharing.core.enums.permission.GrantedVisibility;
import org.example.filesharing.repositories.FolderRepo;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

public final class ProjectPermissionResolver {

    /**
     * GUEST (nhập tên, chưa đăng nhập): xem được public folder, và có thể SELECT_AND_SUBMIT.
     * Theo design doc Section 8.
     */
    private static final List<GrantedProjectPermission> GUEST_PUBLIC_FOLDER_PERMISSIONS =
            List.of(GrantedProjectPermission.READ, GrantedProjectPermission.SELECT_AND_SUBMIT);

    /**
     * VIEWER (ẩn danh, chưa đăng nhập): chỉ xem, không làm gì thêm.
     * Theo design doc Section 8.
     */
    private static final List<GrantedProjectPermission> VIEWER_PUBLIC_FOLDER_PERMISSIONS =
            List.of(GrantedProjectPermission.READ);

    private ProjectPermissionResolver() {
    }

    // -------------------------------------------------------------------------
    // Project-level permission resolution
    // -------------------------------------------------------------------------

    public static List<GrantedProjectPermission> resolveProjectPermissions(
            ProjectEntity project,
            UserEntity user,
            boolean isAdmin
    ) {
        if (project == null) {
            return Collections.emptyList();
        }

        // sau nay neu them role admin thi can tach ra
        if (isAdmin || isOwner(project, user)) {
            return GrantedProjectRole.projectPermissionsFromRole(GrantedProjectRole.OWNER);
        }

        GrantedProjectRole role = resolveProjectRole(project, user);
        if (role != null) {
            return GrantedProjectRole.projectPermissionsFromRole(role);
        }

        if (project.getVisibility() == GrantedVisibility.PUBLIC) {
            return VIEWER_PUBLIC_FOLDER_PERMISSIONS;
        }

        return Collections.emptyList();
    }

    public static List<GrantedProjectPermission> resolveProjectPermissions(ProjectEntity project, String userId) {
        if (project == null || userId == null) {
            return Collections.emptyList();
        }

        if (Objects.equals(project.getOwnerId(), userId)) {
            return GrantedProjectRole.projectPermissionsFromRole(GrantedProjectRole.OWNER);
        }

        if (project.getCollaborators() == null || project.getCollaborators().isEmpty()) {
            return Collections.emptyList();
        }

        for (ProjectCollaborator collaborator : project.getCollaborators()) {
            if (Objects.equals(collaborator.getUserId(), userId)) {
                GrantedProjectRole role = collaborator.getProjectRole();
                if (role != null) {
                    return GrantedProjectRole.projectPermissionsFromRole(role);
                }
                break;
            }
        }

        return Collections.emptyList();
    }

    // -------------------------------------------------------------------------
    // Folder userPermissions build (write-time materialization)
    // -------------------------------------------------------------------------

    /**
     * Builds the denormalized userPermissions list for a folder.
     *
     * @param project              the project entity
     * @param visibility           the target visibility of the folder
     * @param parentUserPermissions parent's current userPermissions (used for INHERIT)
     * @param restrictedUserIds    explicit userId list (only used for RESTRICTED; ignored otherwise)
     */
    public static List<FolderPermission> buildFolderUserPermissions(
            ProjectEntity project,
            FolderVisibility visibility,
            List<FolderPermission> parentUserPermissions,
            List<String> restrictedUserIds
    ) {
        if (project == null) {
            return new ArrayList<>();
        }

        FolderVisibility effective = visibility != null ? visibility : FolderVisibility.INHERIT;

        switch (effective) {
            case INHERIT -> {
                return parentUserPermissions != null ? new ArrayList<>(parentUserPermissions) : new ArrayList<>();
            }
            case RESTRICTED -> {
                return buildRestrictedPermissions(project, restrictedUserIds);
            }
            default -> {
                // PUBLIC: all project members
                return buildAllMemberPermissions(project);
            }
        }
    }

    /**
     * Merges permissions for a folder transitioning from RESTRICTED → INHERIT.
     * Keeps entries with isPrivateCollaborator=true, then merges parent permissions for remaining users.
     */
    public static List<FolderPermission> buildInheritMerge(
            List<FolderPermission> currentPermissions,
            List<FolderPermission> parentPermissions
    ) {
        List<FolderPermission> kept = new ArrayList<>();
        Set<String> keptUserIds = new HashSet<>();

        if (currentPermissions != null) {
            for (FolderPermission fp : currentPermissions) {
                if (Boolean.TRUE.equals(fp.getIsPrivateCollaborator())) {
                    kept.add(fp);
                    if (fp.getUserId() != null) {
                        keptUserIds.add(fp.getUserId());
                    }
                }
            }
        }

        if (parentPermissions != null) {
            for (FolderPermission fp : parentPermissions) {
                if (fp.getUserId() != null && !keptUserIds.contains(fp.getUserId())) {
                    kept.add(fp);
                }
            }
        }

        return kept;
    }

    /**
     * Builds a single FolderPermission entry from a user's project role.
     * Permissions are filtered to folder-applicable permissions only.
     */
    public static FolderPermission buildSingleEntry(String userId, GrantedProjectRole role, boolean isPrivateCollaborator) {
        List<GrantedProjectPermission> rolePermissions = GrantedProjectRole.projectPermissionsFromRole(role);
        List<GrantedProjectPermission> folderPerms = rolePermissions.stream()
                .filter(GrantedProjectPermission::isFolderPermission)
                .toList();

        return FolderPermission.builder()
                .userId(userId)
                .permissions(new ArrayList<>(folderPerms))
                .isPrivateCollaborator(isPrivateCollaborator ? Boolean.TRUE : null)
                .grantedAt(Instant.now())
                .build();
    }

    // -------------------------------------------------------------------------
    // Guest / Viewer permission resolution (unauthenticated access, visibility-chain walk)
    // -------------------------------------------------------------------------

    /**
     * Tính effective permission cho GUEST (người nhập tên, chưa đăng nhập) trên folder.
     * GUEST chỉ được phép vào folder PUBLIC và INHERIT dẫn đến PUBLIC.
     * RESTRICTED → bị từ chối hoàn toàn.
     */
    public static List<GrantedProjectPermission> resolveGuestFolderPermissions(
            ProjectEntity project,
            FolderEntity folder,
            FolderRepo folderRepo
    ) {
        if (project == null || folder == null) {
            return Collections.emptyList();
        }

        List<FolderEntity> chain = resolveFolderChain(folder, folderRepo);

        FolderVisibility effectiveVisibility = FolderVisibility.INHERIT;
        for (FolderEntity current : chain) {
            FolderVisibility visibility = current.getVisibility() != null
                    ? current.getVisibility()
                    : FolderVisibility.INHERIT;

            if (visibility == FolderVisibility.RESTRICTED) {
                return Collections.emptyList();
            }
            if (visibility == FolderVisibility.PUBLIC) {
                effectiveVisibility = FolderVisibility.PUBLIC;
            }
        }

        if (effectiveVisibility == FolderVisibility.PUBLIC) {
            return GUEST_PUBLIC_FOLDER_PERMISSIONS;
        }

        // INHERIT → kế thừa visibility của project
        if (project.getVisibility() == GrantedVisibility.PUBLIC) {
            return GUEST_PUBLIC_FOLDER_PERMISSIONS;
        }

        return Collections.emptyList();
    }

    /**
     * Tính effective permission cho VIEWER (hoàn toàn ẩn danh, chưa đăng nhập) trên folder.
     * Chỉ READ nếu folder hoặc project là PUBLIC. RESTRICTED → bị từ chối.
     */
    public static List<GrantedProjectPermission> resolveViewerFolderPermissions(
            ProjectEntity project,
            FolderEntity folder,
            FolderRepo folderRepo
    ) {
        if (project == null || folder == null) {
            return Collections.emptyList();
        }

        List<FolderEntity> chain = resolveFolderChain(folder, folderRepo);

        FolderVisibility effectiveVisibility = FolderVisibility.INHERIT;
        for (FolderEntity current : chain) {
            FolderVisibility visibility = current.getVisibility() != null
                    ? current.getVisibility()
                    : FolderVisibility.INHERIT;

            if (visibility == FolderVisibility.RESTRICTED) {
                return Collections.emptyList();
            }
            if (visibility == FolderVisibility.PUBLIC) {
                effectiveVisibility = FolderVisibility.PUBLIC;
            }
        }

        if (effectiveVisibility == FolderVisibility.PUBLIC) {
            return VIEWER_PUBLIC_FOLDER_PERMISSIONS;
        }

        if (project.getVisibility() == GrantedVisibility.PUBLIC) {
            return VIEWER_PUBLIC_FOLDER_PERMISSIONS;
        }

        return Collections.emptyList();
    }

    // -------------------------------------------------------------------------
    // Permission check helpers
    // -------------------------------------------------------------------------

    public static boolean hasPermission(List<GrantedProjectPermission> permissions, GrantedProjectPermission required) {
        if (permissions == null || permissions.isEmpty() || required == null) {
            return false;
        }
        return permissions.contains(required);
    }

    public static boolean hasAnyPermission(List<GrantedProjectPermission> permissions,
                                           List<GrantedProjectPermission> required) {
        if (permissions == null || permissions.isEmpty() || required == null || required.isEmpty()) {
            return false;
        }
        for (GrantedProjectPermission permission : required) {
            if (permissions.contains(permission)) {
                return true;
            }
        }
        return false;
    }

    // -------------------------------------------------------------------------
    // Membership helpers
    // -------------------------------------------------------------------------

    public static boolean isProjectMember(ProjectEntity project, UserEntity user) {
        if (project == null || user == null) {
            return false;
        }

        if (Objects.equals(project.getOwnerId(), user.getUserId())) {
            return true;
        }

        if (project.getCollaborators() == null || project.getCollaborators().isEmpty()) {
            return false;
        }

        String currentUserId = user.getUserId();
        for (ProjectCollaborator collaborator : project.getCollaborators()) {
            if (Objects.equals(collaborator.getUserId(), currentUserId)) {
                return true;
            }
        }

        return false;
    }

    // -------------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------------

    private static boolean isOwner(ProjectEntity project, UserEntity user) {
        return project != null
                && user != null
                && Objects.equals(project.getOwnerId(), user.getUserId());
    }

    private static GrantedProjectRole resolveProjectRole(ProjectEntity project, UserEntity user) {
        if (project == null || user == null) {
            return null;
        }

        if (project.getCollaborators() == null || project.getCollaborators().isEmpty()) {
            return null;
        }

        String currentUserId = user.getUserId();
        for (ProjectCollaborator collaborator : project.getCollaborators()) {
            if (Objects.equals(collaborator.getUserId(), currentUserId)) {
                return collaborator.getProjectRole();
            }
        }

        return null;
    }

    /**
     * Builds the member permissions for all project members (owner + collaborators).
     * Used for PUBLIC and INHERIT visibility.
     */
    private static List<FolderPermission> buildAllMemberPermissions(ProjectEntity project) {
        List<FolderPermission> result = new ArrayList<>();

        if (project.getOwnerId() != null) {
            result.add(buildSingleEntry(project.getOwnerId(), GrantedProjectRole.OWNER, false));
        }

        if (project.getCollaborators() != null) {
            for (ProjectCollaborator collaborator : project.getCollaborators()) {
                if (collaborator.getUserId() != null && collaborator.getProjectRole() != null) {
                    result.add(buildSingleEntry(collaborator.getUserId(), collaborator.getProjectRole(), false));
                }
            }
        }

        return result;
    }

    /**
     * Builds restricted permissions for an explicit userId list.
     * Each user's permissions are derived from their project role.
     */
    private static List<FolderPermission> buildRestrictedPermissions(ProjectEntity project, List<String> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return new ArrayList<>();
        }

        Map<String, GrantedProjectRole> roleMap = buildRoleMap(project);

        List<FolderPermission> result = new ArrayList<>();
        for (String userId : userIds) {
            GrantedProjectRole role = roleMap.get(userId);
            if (role != null) {
                result.add(buildSingleEntry(userId, role, true));
            }
        }
        return result;
    }

    /**
     * Builds a userId → projectRole map for all project members (owner + collaborators).
     */
    public static Map<String, GrantedProjectRole> buildRoleMap(ProjectEntity project) {
        Map<String, GrantedProjectRole> roleMap = new HashMap<>();

        if (project.getOwnerId() != null) {
            roleMap.put(project.getOwnerId(), GrantedProjectRole.OWNER);
        }

        if (project.getCollaborators() != null) {
            for (ProjectCollaborator collaborator : project.getCollaborators()) {
                if (collaborator.getUserId() != null && collaborator.getProjectRole() != null) {
                    roleMap.put(collaborator.getUserId(), collaborator.getProjectRole());
                }
            }
        }

        return roleMap;
    }

    /**
     * Resolves the full ancestor chain for a folder (root → folder) using ancestorIds batch load.
     * Used only for guest/viewer visibility chain-walk (not for authenticated permission lookups).
     */
    private static List<FolderEntity> resolveFolderChain(FolderEntity folder, FolderRepo folderRepo) {
        List<String> ancestorIds = folder.getAncestorIds();
        if (ancestorIds == null || ancestorIds.isEmpty()) {
            return new ArrayList<>(List.of(folder));
        }

        Map<String, Integer> orderMap = new HashMap<>();
        for (int i = 0; i < ancestorIds.size(); i++) {
            orderMap.put(ancestorIds.get(i), i);
        }

        List<FolderEntity> ancestors = new ArrayList<>();
        folderRepo.findAllById(ancestorIds).forEach(ancestors::add);
        ancestors.sort(Comparator.comparingInt(f -> orderMap.getOrDefault(f.getFolderId(), Integer.MAX_VALUE)));
        ancestors.add(folder);
        return ancestors;
    }
}
