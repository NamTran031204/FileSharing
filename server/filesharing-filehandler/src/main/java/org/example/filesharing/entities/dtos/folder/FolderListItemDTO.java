package org.example.filesharing.entities.dtos.folder;

import com.file.service.filesharing.core.entity.models.FolderEntity;
import com.file.service.filesharing.core.entity.models.access.AccessSettings;
import com.file.service.filesharing.core.entity.models.base.EntityAuditBase;
import com.file.service.filesharing.core.entity.models.folder.FolderStats;
import com.file.service.filesharing.core.enums.access.AccessRole;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.beans.BeanUtils;

import java.util.List;

/**
 * Folder trong danh sach: truong cua FolderEntity + vai tro cua toi va badge.
 * Khong co grants/link/token, khong co snapshot quyen va visibility cua mo hinh cu.
 */
@Getter
@Setter
@NoArgsConstructor
public class FolderListItemDTO extends EntityAuditBase {
    private String folderId;
    private String projectId;
    private String parentFolderId;
    private String folderName;
    private String description;
    private List<String> ancestorIds;
    private Integer level;
    private FolderStats stats;
    private AccessSettings settings;

    private AccessRole myRole;
    // folder co link (badge globe)
    private boolean hasLink;
    // folder co grant thuong truc tiep (badge nguoi), khong tinh grant viaLink
    private boolean hasDirectGrants;

    public static FolderListItemDTO of(FolderEntity folder, AccessRole myRole) {
        return fill(new FolderListItemDTO(), folder, myRole);
    }

    protected static <T extends FolderListItemDTO> T fill(T dto, FolderEntity folder, AccessRole myRole) {
        BeanUtils.copyProperties(folder, dto);
        dto.setMyRole(myRole);
        dto.setHasLink(hasLink(folder));
        dto.setHasDirectGrants(hasDirectGrants(folder));
        return dto;
    }

    public static boolean hasLink(FolderEntity folder) {
        return folder.getLink() != null;
    }

    public static boolean hasDirectGrants(FolderEntity folder) {
        return folder.getGrants() != null
                && folder.getGrants().stream().anyMatch(g -> !Boolean.TRUE.equals(g.getViaLink()));
    }
}
