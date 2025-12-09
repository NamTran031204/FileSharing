package org.example.filesharing.entities.models;

import lombok.*;
import org.example.filesharing.enums.auth.AuthProvider;
import org.example.filesharing.enums.auth.UserRole;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Document(collection = "user")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class UserEntity {
    @Id
    private String id;

    @Field("email")
    private String email; // unique enforced by index

    /**
     * password có thể null nếu user chỉ đăng ký bằng Google OAuth (no local password).
     */
    private String password;

    // ten de hien thi ra man hinh, khong dung de dang nhap
    private String userName;

    private List<UserRole> roles = new ArrayList<>();

    private boolean enabled = true;

    /**
     * Nếu xác minh email (emailVerified=true) tức là email đã verify.
     */
    private boolean emailVerified = false;

    /**
     * Danh sách provider đã liên kết (LOCAL, GOOGLE,...)
     */
    private List<AuthProviderInfo> providers = new ArrayList<>();

    /**
     * Optional metadata (avatar, locale, device info...), có thể lưu JSON
     */
    private Map<String, Object> metadata = new HashMap<>();

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;

    /**
     * Last successful login time (useful for audits)
     */
    private Instant lastLoginAt;

    public void addRole(UserRole role) {
        if (this.roles == null) this.roles = new ArrayList<>();
        if (!this.roles.contains(role)) this.roles.add(role);
    }

    public void addProvider(AuthProvider provider, String providerId) {
        if (this.providers == null) this.providers = new ArrayList<>();
        this.providers.add(AuthProviderInfo.builder()
                .provider(provider)
                .providerId(providerId)
                .linkedAt(Instant.now())
                .build());
    }

    public boolean hasProvider(AuthProvider provider) {
        if (this.providers == null) return false;
        return this.providers.stream().anyMatch(p -> p.getProvider() == provider);
    }
}
