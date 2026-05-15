package org.example.filesharing.enums.permission;

import java.util.List;

public enum GrantedProjectRole {
    OWNER,
    REVIEWER,
    PRODUCER,
    GUEST,
    VIEWER;

    private static final List<GrantedProjectPermission> basePermissions = List.of(
            GrantedProjectPermission.READ,
            GrantedProjectPermission.DOWNLOAD,
            GrantedProjectPermission.COMMENT,
            GrantedProjectPermission.MULTIPLE_CHOOSE,
            GrantedProjectPermission.CREATE_CHILD,
            GrantedProjectPermission.UPDATE,
            GrantedProjectPermission.MODIFY,
            GrantedProjectPermission.ARCHIVE,
            GrantedProjectPermission.DELETE,
            GrantedProjectPermission.ADD_USER,
            GrantedProjectPermission.AUDIT_LOG
    );

    public static List<GrantedProjectPermission> projectPermissionsFromRole(final GrantedProjectRole role) {
        switch (role) {
            case OWNER -> {
                return List.of(
                        GrantedProjectPermission.READ,
                        GrantedProjectPermission.MULTIPLE_CHOOSE,
                        GrantedProjectPermission.DOWNLOAD,
                        GrantedProjectPermission.COMMENT,
                        GrantedProjectPermission.CREATE_CHILD,
                        GrantedProjectPermission.UPDATE,
                        GrantedProjectPermission.ARCHIVE,
                        GrantedProjectPermission.DELETE,
                        GrantedProjectPermission.ADD_USER,
                        GrantedProjectPermission.AUDIT_LOG
                );
            }
            case REVIEWER -> {
                return List.of(
                        GrantedProjectPermission.READ,
                        GrantedProjectPermission.MULTIPLE_CHOOSE,
                        GrantedProjectPermission.DOWNLOAD,
                        GrantedProjectPermission.COMMENT
                );
            }
            case PRODUCER -> {
                return List.of(
                        GrantedProjectPermission.READ,
                        GrantedProjectPermission.DOWNLOAD,
                        GrantedProjectPermission.MULTIPLE_CHOOSE,
                        GrantedProjectPermission.COMMENT,
                        GrantedProjectPermission.CREATE_CHILD,
                        GrantedProjectPermission.ADD_USER
                );
            }
            case GUEST -> {
                return List.of(
                        GrantedProjectPermission.READ,
                        GrantedProjectPermission.MULTIPLE_CHOOSE
                );
            }
            default -> {
                // case VIEWER
                return List.of(
                        GrantedProjectPermission.READ
                );
            }
        }
    }

    // todo: cap phat quyen
    public static List<GrantedProjectPermission> folderPermissionsFromRole(final GrantedProjectRole role) {
        switch (role) {
            case OWNER -> {
                return List.of(
                        GrantedProjectPermission.READ,
                        GrantedProjectPermission.DOWNLOAD,
                        GrantedProjectPermission.COMMENT,
                        GrantedProjectPermission.MULTIPLE_CHOOSE,
                        GrantedProjectPermission.CREATE_CHILD,
                        GrantedProjectPermission.UPDATE,
                        GrantedProjectPermission.MODIFY,
                        GrantedProjectPermission.ARCHIVE,
                        GrantedProjectPermission.DELETE,
                        GrantedProjectPermission.ADD_USER,
                        GrantedProjectPermission.AUDIT_LOG
                );
            }
            case REVIEWER -> {
                return List.of(
                        GrantedProjectPermission.READ,
                        GrantedProjectPermission.MULTIPLE_CHOOSE,
                        GrantedProjectPermission.DOWNLOAD,
                        GrantedProjectPermission.COMMENT
                );
            }
            case PRODUCER -> {
                return List.of(
                        GrantedProjectPermission.READ,
                        GrantedProjectPermission.DOWNLOAD,
                        GrantedProjectPermission.MULTIPLE_CHOOSE,
                        GrantedProjectPermission.COMMENT,
                        GrantedProjectPermission.CREATE_CHILD,
                        GrantedProjectPermission.ADD_USER
                );
            }
            case GUEST -> {
                return List.of(
                        GrantedProjectPermission.READ,
                        GrantedProjectPermission.MULTIPLE_CHOOSE
                );
            }
            default -> {
                // case VIEWER
                return List.of(
                        GrantedProjectPermission.READ
                );
            }
        }
    }
}
