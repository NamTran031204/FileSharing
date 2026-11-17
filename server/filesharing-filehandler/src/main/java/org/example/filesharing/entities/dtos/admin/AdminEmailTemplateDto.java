package org.example.filesharing.entities.dtos.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

// mau email hieu luc (override trong DB hoac mac dinh trong code); variables la cac bien {{x}} cho phep
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminEmailTemplateDto {
    private String code;
    private String locale;
    private String subject;
    private String body;
    private boolean overridden;
    private List<String> variables;
    private Instant updatedAt;
    private String updatedBy;
}
