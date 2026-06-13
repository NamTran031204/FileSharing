package org.example.filesharing.entities.dtos.metadata;

import lombok.Data;
import com.file.service.filesharing.core.entity.models.metadata.UserFilePermission;
import com.file.service.filesharing.core.enums.objectPermission.ObjectPermission;
import com.file.service.filesharing.core.enums.objectPermission.ObjectVisibility;

import java.util.List;

@Data
public class MetadataUpdateRequestDto {
    private String fileName;

    private Integer timeToLive;
    private Boolean isTrash;

    private ObjectPermission publicPermission;
    private ObjectVisibility visibility;

    private List<UserFilePermission> userFilePermissions;
}
