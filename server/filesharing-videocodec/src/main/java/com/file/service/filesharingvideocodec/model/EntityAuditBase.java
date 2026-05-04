package com.file.service.filesharingvideocodec.model;

import lombok.Data;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.Instant;

@Data
public class EntityAuditBase {
    private String createdBy;
    private String createdByEmail;
    private String updateBy;
    private String updateByEmail;
    private Boolean isActive;

    @CreatedDate
    private Instant createdAt;

    @LastModifiedDate
    private Instant updatedAt;
}
