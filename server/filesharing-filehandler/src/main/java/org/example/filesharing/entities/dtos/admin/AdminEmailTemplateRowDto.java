package org.example.filesharing.entities.dtos.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

// mot dong bang quan tri = mot ma template, kem trang thai tung ngon ngu
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminEmailTemplateRowDto {
    private String code;
    private String name;
    private String description;
    private List<String> variables;
    private List<LocaleState> locales;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LocaleState {
        private String locale;
        private boolean overridden;
        private Instant updatedAt;
        private String updatedBy;
    }
}
