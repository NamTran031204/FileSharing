package org.example.filesharing.entities.dtos.project;

import lombok.Data;
import com.file.service.filesharing.core.enums.permission.GrantedProjectRole;

@Data
public class ProjectCollaboratorDTO {
    private String projectId;
    private String email;
    private String userId; // cho phép nhập email để add, hoặc chọn từ user đã có thông qua get combo user, hiện tại vẫn là add qua email như github
    private GrantedProjectRole projectRole;
}
