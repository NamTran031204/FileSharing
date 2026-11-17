package org.example.filesharing.entities.dtos.admin;

import com.file.service.filesharing.core.enums.auth.AuthProvider;
import com.file.service.filesharing.core.enums.auth.UserGrantedRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

// chi so tong hop (dem), khong co ten project hay file
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserDetailDto {
    private String userId;
    private String email;
    private String publicUserName;
    private List<UserGrantedRole> roles;
    private boolean enabled;
    private boolean emailVerified;
    private List<AuthProvider> providers;
    private Instant createdAt;
    private Instant lastLoginAt;
    private long ownedProjectCount;
    private long fileCount;
    private long storageBytes;
    private Instant sessionsValidAfter;
}
