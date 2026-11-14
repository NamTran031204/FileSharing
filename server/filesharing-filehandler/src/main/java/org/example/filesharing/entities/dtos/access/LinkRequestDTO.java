package org.example.filesharing.entities.dtos.access;

import com.file.service.filesharing.core.enums.ShareTokenTime;
import lombok.Data;

/** Cau hinh day du cua link folder (PUT thay toan bo), tru expiry: null = giu han hien tai. */
@Data
public class LinkRequestDTO {
    // false hoac null = tat link
    private Boolean enabled;
    // VIEWER, COMMENTER hoac null (chi dung cho proof)
    private String role;
    private Boolean allowDownload;
    private Boolean allowProofSelection;
    private ShareTokenTime expiry;
    // true = doi token, nguoi da vao qua link cu mat quyen
    private Boolean regenerate;
}
