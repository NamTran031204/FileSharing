package org.example.filesharing.services;

import com.file.service.filesharing.core.entity.models.FolderEntity;
import com.file.service.filesharing.core.entity.models.ProjectEntity;
import org.example.filesharing.entities.dtos.access.MyAccessDTO;
import org.example.filesharing.utils.access.AccessContext;
import org.example.filesharing.utils.access.Action;
import org.example.filesharing.utils.access.ResourceRef;

import java.util.List;

/**
 * Diem kiem quyen duy nhat cho project/folder/asset (design 5.4).
 * Tai nguyen khong ton tai hoac isActive=false nem loi not found; resolve/can khong nem loi quyen.
 */
public interface AccessService {

    /** Quyen cua nguoi dang dang nhap. */
    AccessContext resolve(ResourceRef ref);

    AccessContext resolve(ResourceRef ref, String userId);

    boolean can(ResourceRef ref, Action action);

    /** Nem ACCESS_DENIED khi khong co vai tro, ACTION_NOT_ALLOWED (kem vai tro toi thieu) khi thieu hanh dong. */
    AccessContext require(ResourceRef ref, Action action);

    /** Loc folder nguoi dang dang nhap thay duoc, khong query them. */
    List<FolderEntity> filterVisible(ProjectEntity project, List<FolderEntity> folders);

    /** Chain goc -> folder dich da kiem lech, cung cach resolve dung; khong kiem quyen. */
    List<FolderEntity> chain(String folderId);

    /** Quyen cua nguoi dang dang nhap de FE bat/tat nut; khong nem loi quyen. */
    MyAccessDTO myAccess(ResourceRef ref);
}
