package org.example.filesharing.entities.models.base;

import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.Instant;

@Data
public class EntityAuditBase {
    private Boolean isTrash;
    private Instant trashedAt;

    private String createdBy;
    private String createdByEmail;
    private String updateBy;
    private String updateByEmail;
    private Boolean isActive;

    private Instant createdAt;

    private Instant updatedAt;
}
