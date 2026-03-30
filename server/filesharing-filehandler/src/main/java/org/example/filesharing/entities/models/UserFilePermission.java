package org.example.filesharing.entities.models;

import lombok.Builder;
import lombok.Data;
import org.example.filesharing.enums.objectPermission.ObjectPermission;

import java.util.List;

@Data
@Builder
public class UserFilePermission {
    private String email;
    private List<ObjectPermission> permissionList;
}
