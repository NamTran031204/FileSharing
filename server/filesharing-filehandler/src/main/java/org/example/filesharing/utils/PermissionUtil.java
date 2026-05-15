package org.example.filesharing.utils;

import org.example.filesharing.enums.permission.GrantedProjectPermission;
import org.example.filesharing.enums.permission.GrantedProjectRole;

import java.util.List;

public class PermissionUtil {

    private PermissionUtil() {
    }

    public static List<GrantedProjectPermission> permissionsFromRole(GrantedProjectRole role) {
        if (role == null) {
            return List.of();
        }
        return GrantedProjectRole.projectPermissionsFromRole(role);
    }

    public static boolean hasPermission(List<GrantedProjectPermission> permissions, GrantedProjectPermission required) {
        return ProjectPermissionResolver.hasPermission(permissions, required);
    }
}
