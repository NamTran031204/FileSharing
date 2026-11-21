package org.example.filesharing.entities.dtos.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminRoleDetailDto {
    private String id;
    private String code;
    private String name;
    private String description;
    private long userCount;
    private List<String> permissions;
}
