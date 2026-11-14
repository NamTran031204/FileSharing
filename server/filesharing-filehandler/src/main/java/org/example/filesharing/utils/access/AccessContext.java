package org.example.filesharing.utils.access;

import com.file.service.filesharing.core.entity.models.FolderEntity;
import com.file.service.filesharing.core.enums.ProjectStatus;
import com.file.service.filesharing.core.enums.access.AccessRole;

import java.util.List;

/**
 * Ket qua tinh quyen cua 1 user tai 1 tai nguyen. Vai tro null nghia la khong co (NONE).
 * own: owner, thanh vien project, grant thuong tren chain; link: vai tro qua grant viaLink con hieu luc;
 * role = max(own, link); linkNode: folder cho vai tro link cao nhat.
 */
public record AccessContext(
        AccessRole own,
        AccessRole link,
        AccessRole role,
        FolderEntity linkNode,
        boolean viewersCanDownload,
        ProjectStatus projectStatus,
        boolean trashed,
        List<Source> sources
) {

    public enum SourceType { OWNER, PROJECT, FOLDER, LINK }

    // folderId null voi nguon OWNER/PROJECT
    public record Source(SourceType type, AccessRole role, String folderId) {
    }
}
