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
            GrantedProjectPermission.SELECT_AND_SUBMIT,
            GrantedProjectPermission.CREATE_FOLDER_ASSET,
            GrantedProjectPermission.UPDATE,
            GrantedProjectPermission.ARCHIVE,
            GrantedProjectPermission.DELETE,
            GrantedProjectPermission.ADD_USER,
            GrantedProjectPermission.AUDIT_LOG
    );

    public static List<GrantedProjectPermission> projectPermissionsFromRole(GrantedProjectRole role) {
        switch (role) {
            case OWNER -> {
                return List.of(
                        GrantedProjectPermission.READ,
                        GrantedProjectPermission.SELECT_AND_SUBMIT,
                        GrantedProjectPermission.DOWNLOAD,
                        GrantedProjectPermission.COMMENT,
                        GrantedProjectPermission.CREATE_FOLDER_ASSET,
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
                        GrantedProjectPermission.SELECT_AND_SUBMIT,
                        GrantedProjectPermission.DOWNLOAD,
                        GrantedProjectPermission.COMMENT
                );
            }
            case PRODUCER -> {
                return List.of(
                        GrantedProjectPermission.READ,
                        GrantedProjectPermission.DOWNLOAD,
                        GrantedProjectPermission.SELECT_AND_SUBMIT,
                        GrantedProjectPermission.COMMENT,
                        GrantedProjectPermission.CREATE_FOLDER_ASSET,
                        GrantedProjectPermission.ADD_USER
                );
            }
            case GUEST -> {
                return List.of(
                        GrantedProjectPermission.READ,
                        GrantedProjectPermission.SELECT_AND_SUBMIT
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
    public static List<GrantedProjectPermission> folderPermissionsFromRole(GrantedProjectRole role) {
        switch (role) {
            case OWNER -> {
                return List.of(
                        GrantedProjectPermission.READ,
                        GrantedProjectPermission.DOWNLOAD,
                        GrantedProjectPermission.COMMENT,
                        GrantedProjectPermission.SELECT_AND_SUBMIT,
                        GrantedProjectPermission.CREATE_FOLDER_ASSET,
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
                        GrantedProjectPermission.SELECT_AND_SUBMIT,
                        GrantedProjectPermission.DOWNLOAD,
                        GrantedProjectPermission.COMMENT
                );
            }
            case PRODUCER -> {
                return List.of(
                        GrantedProjectPermission.READ,
                        GrantedProjectPermission.DOWNLOAD,
                        GrantedProjectPermission.SELECT_AND_SUBMIT,
                        GrantedProjectPermission.COMMENT,
                        GrantedProjectPermission.CREATE_FOLDER_ASSET,
                        GrantedProjectPermission.ADD_USER
                );
            }
            case GUEST -> {
                return List.of(
                        GrantedProjectPermission.READ,
                        GrantedProjectPermission.SELECT_AND_SUBMIT
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
