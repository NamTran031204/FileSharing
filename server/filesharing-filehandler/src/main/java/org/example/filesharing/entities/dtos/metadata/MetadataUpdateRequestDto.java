package org.example.filesharing.entities.dtos.metadata;

import lombok.Data;
import org.example.filesharing.entities.models.UserFilePermission;
import org.example.filesharing.enums.UploadStatus;
import org.example.filesharing.enums.objectPermission.ObjectPermission;
import org.example.filesharing.enums.objectPermission.ObjectVisibility;

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
