package org.example.filesharing.entities.dtos.admin;

import com.file.service.filesharing.core.enums.auth.AuthProvider;
import com.file.service.filesharing.core.enums.auth.UserGrantedRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

// whitelist: khong co providerId, hash mat khau, metadata
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserRowDto {
    private String userId;
    private String email;
    private String publicUserName;
    private List<UserGrantedRole> roles;
    private boolean enabled;
    private boolean emailVerified;
    private List<AuthProvider> providers;
    private Instant createdAt;
    private Instant lastLoginAt;
    private List<AdminRoleRef> adminRoles;
    // phia quan tri = khong co ROLE_USER
    private boolean adminSide;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminRoleRef {
        private String id;
        private String code;
        private String name;
    }
}
