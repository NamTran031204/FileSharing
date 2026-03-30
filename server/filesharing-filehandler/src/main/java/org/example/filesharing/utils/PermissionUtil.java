package org.example.filesharing.utils;

import org.example.filesharing.entities.models.UserFilePermission;
import org.example.filesharing.enums.objectPermission.FileAppPermission;
import org.example.filesharing.enums.objectPermission.ObjectPermission;
import org.example.filesharing.enums.objectPermission.ObjectVisibility;

import java.util.List;

public class PermissionUtil {
    public static FileAppPermission calculatePermission(ObjectPermission permission, String email, Boolean isOwner) {
        if (isOwner) return FileAppPermission.OWNER;
        return switch (permission) {
            case READ -> FileAppPermission.READ;
            case COMMENT -> FileAppPermission.COMMENT;
            case MODIFY -> FileAppPermission.MODIFY;
            default -> FileAppPermission.PUBLIC;
        };
    }
}
