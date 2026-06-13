package org.example.filesharing.entities.dtos.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.file.service.filesharing.core.enums.auth.AuthProvider;
import com.file.service.filesharing.core.enums.auth.UserGrantedRole;

import java.time.Instant;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserDto {
    private String userId;
    private String email;
    private String publicUserName;
    private List<UserGrantedRole> roles;
    private boolean enabled;
    private boolean emailVerified;
    private List<AuthProvider> providers;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant lastLoginAt;
}
