package org.example.filesharing.entities.models.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.enums.auth.AuthProvider;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthProviderInfo {
    private AuthProvider provider;

    // local thi de null
    private String providerId;

    /**
     * Khi liên kết/đăng ký thông qua provider này
     */
    private Instant linkedAt;
}