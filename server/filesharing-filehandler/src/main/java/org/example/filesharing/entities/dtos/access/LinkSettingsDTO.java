package org.example.filesharing.entities.dtos.access;

import com.file.service.filesharing.core.enums.access.AccessRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** Duong duy nhat tra token link, chi cho nguoi co MANAGE_ACCESS. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LinkSettingsDTO {
    private boolean enabled;
    private String token;
    private AccessRole role;
    private Boolean allowDownload;
    private Boolean allowProofSelection;
    private Instant expiresAt;
}
