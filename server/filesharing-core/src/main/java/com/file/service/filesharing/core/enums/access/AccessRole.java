package com.file.service.filesharing.core.enums.access;

/** Thang vai tro tuyen tinh, thu tu khai bao la thu tu so sanh. OWNER = project.ownerId, khong cap qua grant. */
public enum AccessRole {
    VIEWER,
    COMMENTER,
    EDITOR,
    MANAGER,
    OWNER;

    // other null nghia la khong yeu cau vai tro nao
    public boolean atLeast(AccessRole other) {
        return other == null || compareTo(other) >= 0;
    }
}
