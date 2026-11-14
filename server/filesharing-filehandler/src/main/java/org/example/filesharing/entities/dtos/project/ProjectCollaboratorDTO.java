package org.example.filesharing.entities.dtos.project;

import lombok.Data;

@Data
public class ProjectCollaboratorDTO {
    private String projectId;
    private String email;
    private String userId; // cho phép nhập email để add, hoặc chọn từ user đã có thông qua get combo user, hiện tại vẫn là add qua email như github
    // VIEWER..MANAGER, parse o service nhu /api/access
    private String role;
}
