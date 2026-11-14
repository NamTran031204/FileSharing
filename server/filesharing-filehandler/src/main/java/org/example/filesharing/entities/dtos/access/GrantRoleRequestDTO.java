package org.example.filesharing.entities.dtos.access;

import lombok.Data;

@Data
public class GrantRoleRequestDTO {
    // chuoi, parse o service: project VIEWER..MANAGER, folder VIEWER..EDITOR
    private String role;
}
