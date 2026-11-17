package com.file.service.filesharing.core.entity.models;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Chi chua override: khong co document thi dung mac dinh trong SettingKey. Reset = xoa document.
 * Gia tri secret luon co tien to FSENC1:.
 */
@Document(collection = "system_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "value")
public class SystemSettingEntity {
    /** chinh la SettingKey.key() */
    @Id
    private String key;

    private String value;
    private Instant updatedAt;
    private String updatedBy;
}
