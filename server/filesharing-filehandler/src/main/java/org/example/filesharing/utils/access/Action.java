package org.example.filesharing.utils.access;

import com.file.service.filesharing.core.enums.access.AccessRole;

/**
 * Hanh dong tren tai nguyen theo ma tran design 3.3.
 * minRole: vai tro toi thieu; blockedByStatus: bi chan khi project ARCHIVED/COMPLETED;
 * ownOnly: chi tinh vai tro so huu (owner, thanh vien, grant thuong), khong tinh vai tro qua link.
 */
public enum Action {
    VIEW(AccessRole.VIEWER, false, false),
    VIEW_PEOPLE(AccessRole.VIEWER, false, true),
    // VIEWER/COMMENTER tai duoc khi viewersCanDownload, xem AccessResolver.can
    DOWNLOAD(AccessRole.EDITOR, false, false),
    COMMENT(AccessRole.COMMENTER, true, false),
    // service kiem them nguoi goi co trong session.reviewers
    REVIEW_DECIDE(AccessRole.COMMENTER, true, false),
    UPLOAD(AccessRole.EDITOR, true, false),
    EDIT(AccessRole.EDITOR, true, false),
    TRASH(AccessRole.EDITOR, true, false),
    DELETE_PERMANENT(AccessRole.MANAGER, true, false),
    CREATE_REVIEW(AccessRole.EDITOR, true, false),
    VIEW_PROOF_SELECTIONS(AccessRole.EDITOR, false, false),
    INVITE(AccessRole.EDITOR, true, true),
    MANAGE_ACCESS(AccessRole.MANAGER, true, true),
    MANAGE_SETTINGS(AccessRole.MANAGER, true, true),
    VIEW_AUDIT_LOG(AccessRole.MANAGER, false, true),
    MANAGE_PROJECT(AccessRole.MANAGER, false, true),
    ARCHIVE_PROJECT(AccessRole.OWNER, false, true);

    private final AccessRole minRole;
    private final boolean blockedByStatus;
    private final boolean ownOnly;

    Action(AccessRole minRole, boolean blockedByStatus, boolean ownOnly) {
        this.minRole = minRole;
        this.blockedByStatus = blockedByStatus;
        this.ownOnly = ownOnly;
    }

    public AccessRole minRole() {
        return minRole;
    }

    public boolean blockedByStatus() {
        return blockedByStatus;
    }

    public boolean ownOnly() {
        return ownOnly;
    }
}
