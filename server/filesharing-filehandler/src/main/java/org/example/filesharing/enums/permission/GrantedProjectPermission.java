package org.example.filesharing.enums.permission;

import java.util.List;

public enum GrantedProjectPermission {
    READ,
    SELECT_AND_SUBMIT, // danh cho guest
    DOWNLOAD,
    COMMENT,
    CREATE_FOLDER_ASSET, // neu permission tai project thi la duoc phep create asset/folder, tuong tu voi folder, tai asset thi bo quyen create di
    UPDATE,
    ARCHIVE,
    DELETE,
    ADD_USER,
    PROJECT_APPROVE, // todo: thiet ke nghiep vu cho nguoi approve, thiet ke xong thi apply vao GrantedProjectRole
    AUDIT_LOG

    ;

    private static final List<GrantedProjectPermission> FOLDER_PERMISSIONS = List.of(
            READ,
            DOWNLOAD,
            COMMENT,
            SELECT_AND_SUBMIT,
            CREATE_FOLDER_ASSET,
            DELETE,
            ADD_USER
    );

    private static final List<GrantedProjectPermission> PROJECT_ONLY_PERMISSIONS = List.of(
            UPDATE,
            ARCHIVE,
            AUDIT_LOG
    );

    public static List<GrantedProjectPermission> folderPermissions() {
        return FOLDER_PERMISSIONS;
    }

    public static List<GrantedProjectPermission> projectOnlyPermissions() {
        return PROJECT_ONLY_PERMISSIONS;
    }

    public static boolean isFolderPermission(GrantedProjectPermission permission) {
        return FOLDER_PERMISSIONS.contains(permission);
    }
}
