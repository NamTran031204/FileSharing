package org.example.filesharing.enums.permission;

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
}
