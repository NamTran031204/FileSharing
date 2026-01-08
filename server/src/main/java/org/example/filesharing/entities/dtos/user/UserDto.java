package org.example.filesharing.entities.dtos.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.enums.auth.AuthProvider;
import org.example.filesharing.enums.auth.UserRole;

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
    private List<UserRole> roles;
    private boolean enabled;
    private boolean emailVerified;
    private List<AuthProvider> providers;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant lastLoginAt;
}
