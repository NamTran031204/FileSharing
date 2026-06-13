package org.example.filesharing.entities.models.user;

import com.file.service.filesharing.core.enums.auth.AuthProvider;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthProviderInfo {
    private AuthProvider provider;
    private String providerId;
    private Instant linkedAt;
}
