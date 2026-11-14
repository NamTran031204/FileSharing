package com.file.service.filesharing.core.entity.models.access;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.file.service.filesharing.core.enums.access.AccessRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** Link truy cap chung cua folder, toi da 1 link moi folder. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LinkAccess {
    // chi tra qua api quan ly link
    @JsonIgnore
    private String token;
    // VIEWER, COMMENTER hoac null (chi dung cho proof)
    private AccessRole role;
    private Boolean allowDownload;
    private Boolean allowProofSelection;
    // null = khong het han
    private Instant expiresAt;
    private String createdBy;
    private Instant createdAt;
}
