package org.example.filesharing.entities.dtos.admin;

import com.file.service.filesharing.core.enums.auth.AuthProvider;
import com.file.service.filesharing.core.enums.auth.UserGrantedRole;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserFilterDto {
    private String searchText;
    private UserGrantedRole role;
    private Boolean enabled;
    private AuthProvider provider;
    private Boolean adminSide;
    private String adminRoleId;
}
