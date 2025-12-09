package org.example.filesharing.entities.dtos.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.entities.models.AuthProviderInfo;
import org.example.filesharing.enums.auth.UserRole;

import java.time.Instant;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class UserRegisterResponseDto {
    private String email;
    private String userName;
    private Instant createdAt;
    private List<AuthProviderInfo> providers;
    private List<UserRole> roles;
    private boolean enabled;
}
