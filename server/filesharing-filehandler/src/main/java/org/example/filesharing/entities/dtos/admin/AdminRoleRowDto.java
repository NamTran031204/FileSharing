package org.example.filesharing.entities.dtos.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminRoleRowDto {
    private String id;
    private String code;
    private String name;
    private String description;
    // so user dang gan nhom nay
    private long userCount;
}
