package org.example.filesharing.entities.dtos.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

// secret: value va defaultValue luon null, chi lo maskedSet (da co gia tri hay chua)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminSettingItemDto {
    private String key;
    private String group;
    private String type;
    private String apply;
    private boolean secret;
    private String value;
    private boolean maskedSet;
    private String defaultValue;
    private boolean overridden;
    private Long min;
    private Long max;
    private List<String> options;
    private Instant updatedAt;
    private String updatedBy;
}
