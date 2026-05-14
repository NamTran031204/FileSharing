package org.example.filesharing.entities.dtos.project;

import lombok.Data;
import org.example.filesharing.enums.permission.GrantedPermission;

@Data
public class ProjectCollaboratorDTO {
    private String email;
    private String userId; // cho phép nhập email để add, hoặc chọn từ user đã có thông qua get combo user, hiện tại vẫn là add qua email như github
    private GrantedPermission permission;
}
