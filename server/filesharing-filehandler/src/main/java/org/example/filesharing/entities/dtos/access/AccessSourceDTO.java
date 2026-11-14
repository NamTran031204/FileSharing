package org.example.filesharing.entities.dtos.access;

import com.file.service.filesharing.core.enums.access.AccessRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.utils.access.AccessContext;

/** Nguon cua vai tro: OWNER, PROJECT, FOLDER (grant thuong) hoac LINK; folderId null voi OWNER/PROJECT. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccessSourceDTO {
    private AccessContext.SourceType type;
    private AccessRole role;
    private String folderId;
}
