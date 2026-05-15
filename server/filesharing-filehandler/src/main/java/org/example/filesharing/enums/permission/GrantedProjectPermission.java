package org.example.filesharing.enums.permission;

public enum GrantedProjectPermission {
    READ,
    MULTIPLE_CHOOSE,
    DOWNLOAD,
    COMMENT,
    CREATE_CHILD, // neu permission tai project thi la duoc phep create asset/folder, tuong tu voi folder, tai asset thi bo quyen create di
    UPDATE,
    MODIFY,
    ARCHIVE,
    DELETE,
    ADD_USER,
    AUDIT_LOG
}
