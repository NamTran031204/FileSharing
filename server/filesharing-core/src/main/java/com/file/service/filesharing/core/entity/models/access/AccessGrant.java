package com.file.service.filesharing.core.entity.models.access;

import com.file.service.filesharing.core.enums.access.AccessRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/** Grant truc tiep tren folder, khong bao gio chep quyen ke thua. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccessGrant {
    private String userId;
    // VIEWER..EDITOR; null khi viaLink
    private AccessRole role;
    // true: sinh ra do mo link, vai tro lay theo link hien tai
    private Boolean viaLink;
    private String grantedBy;
    private Instant grantedAt;
}
