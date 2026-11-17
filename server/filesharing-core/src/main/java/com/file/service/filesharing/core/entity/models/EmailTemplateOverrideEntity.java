package com.file.service.filesharing.core.entity.models;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Chi chua override: khong co document thi dung mau mac dinh trong code. Reset = xoa document.
 */
@Document(collection = "email_templates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmailTemplateOverrideEntity {
    /** "<CODE>:<locale>", vi du FILE_SENDER:vi */
    @Id
    private String id;

    private String subject;
    private String body;
    private Instant updatedAt;
    private String updatedBy;
}
