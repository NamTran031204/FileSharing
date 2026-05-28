package com.file.service.filesharingcore.entity.models.metadata;

import com.file.service.filesharingcore.enums.objectPermission.ObjectPermission;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class UserFilePermission {
    private String userId;
    private String email;
    private List<ObjectPermission> permissionList;
}
