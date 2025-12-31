package org.example.filesharing.entities.dtos.auth;

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
public class UserRegisterResponseDto {
    private String userId;
    private String email;
    private String userName;
    private Instant createdAt;
    private List<AuthProvider> providers;
    private List<UserRole> roles;
    private Boolean enabled;
}
