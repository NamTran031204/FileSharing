package org.example.filesharing.utils;

import org.example.filesharing.entities.models.FolderEntity;
import org.example.filesharing.entities.models.ProjectEntity;
import org.example.filesharing.entities.models.UserEntity;
import org.example.filesharing.entities.models.folder.FolderPermission;
import org.example.filesharing.entities.models.project.ProjectCollaborator;
import org.example.filesharing.enums.FolderVisibility;
import org.example.filesharing.enums.permission.GrantedProjectPermission;
import org.example.filesharing.enums.permission.GrantedProjectRole;
import org.example.filesharing.enums.permission.GrantedVisibility;
import org.example.filesharing.repositories.FolderRepo;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

public final class ProjectPermissionResolver {
    private static final List<GrantedProjectPermission> PUBLIC_VIEWER_PERMISSIONS =
            List.of(GrantedProjectPermission.READ);

    private ProjectPermissionResolver() {
    }

    public static List<GrantedProjectPermission> resolveProjectPermissions(
            ProjectEntity project,
            UserEntity user,
            boolean isAdmin
    ) {
        if (project == null) {
            return Collections.emptyList();
        }

        if (isAdmin || isOwner(project, user)) {
            return GrantedProjectRole.projectPermissionsFromRole(GrantedProjectRole.OWNER);
        }

        GrantedProjectRole role = resolveProjectRole(project, user);
        if (role != null) {
            return GrantedProjectRole.projectPermissionsFromRole(role);
        }

        if (project.getVisibility() == GrantedVisibility.PUBLIC) {
            return PUBLIC_VIEWER_PERMISSIONS;
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

    public static List<GrantedProjectPermission> resolveEffectiveFolderPermissions(
            ProjectEntity project,
            FolderEntity folder,
            UserEntity user,
            boolean isAdmin,
            FolderRepo folderRepo
    ) {
        if (project == null || folder == null) {
            return Collections.emptyList();
        }

        List<GrantedProjectPermission> basePermissions = resolveProjectPermissions(project, user, isAdmin);
        boolean isMember = isAdmin || isProjectMember(project, user);

        List<FolderEntity> chain = resolveFolderChain(folder, folderRepo);
        List<GrantedProjectPermission> effective = null;

        for (FolderEntity current : chain) {
            FolderVisibility visibility = current.getVisibility() != null
                    ? current.getVisibility()
                    : FolderVisibility.INHERIT;

            if (visibility == FolderVisibility.INHERIT) {
                continue;
            }

            List<GrantedProjectPermission> levelPermissions = null;
            if (visibility == FolderVisibility.RESTRICTED) {
                if (!isMember) {
                    return Collections.emptyList();
                }
                FolderPermission folderPermission = findFolderPermission(current, user);
                if (folderPermission == null
                        || folderPermission.getPermissions() == null
                        || folderPermission.getPermissions().isEmpty()) {
                    return Collections.emptyList();
                }
                levelPermissions = folderPermission.getPermissions();
            } else if (visibility == FolderVisibility.PUBLIC) {
                levelPermissions = isMember ? basePermissions : PUBLIC_VIEWER_PERMISSIONS;
            }

            if (levelPermissions != null) {
                effective = effective == null
                        ? new ArrayList<>(levelPermissions)
                        : intersect(effective, levelPermissions);
            }
        }

        if (effective == null) {
            effective = basePermissions;
        }

        return effective != null ? effective : Collections.emptyList();
    }

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

    private static FolderPermission findFolderPermission(FolderEntity folder, UserEntity user) {
        if (folder == null || user == null) {
            return null;
        }

        if (folder.getPermissions() == null || folder.getPermissions().isEmpty()) {
            return null;
        }

        String currentUserId = user.getUserId();
        for (FolderPermission permission : folder.getPermissions()) {
            if (Objects.equals(permission.getUserId(), currentUserId)) {
                return permission;
            }
        }

        return null;
    }

    private static List<FolderEntity> resolveFolderChain(FolderEntity folder, FolderRepo folderRepo) {
        List<FolderEntity> chain = new ArrayList<>();
        Set<String> visited = new HashSet<>();

        FolderEntity current = folder;
        while (current != null) {
            String folderId = current.getFolderId();
            if (folderId != null && !visited.add(folderId)) {
                break;
            }

            chain.add(current);
            String parentId = current.getParentFolderId();
            if (parentId == null) {
                break;
            }

            current = folderRepo.findById(parentId).orElse(null);
        }

        Collections.reverse(chain);
        return chain;
    }

    private static List<GrantedProjectPermission> intersect(List<GrantedProjectPermission> left,
                                                            List<GrantedProjectPermission> right) {
        if (left == null || left.isEmpty() || right == null || right.isEmpty()) {
            return Collections.emptyList();
        }

        Set<GrantedProjectPermission> rightSet = new HashSet<>(right);
        List<GrantedProjectPermission> result = new ArrayList<>();
        for (GrantedProjectPermission permission : left) {
            if (rightSet.contains(permission)) {
                result.add(permission);
            }
        }
        return result;
    }
}
