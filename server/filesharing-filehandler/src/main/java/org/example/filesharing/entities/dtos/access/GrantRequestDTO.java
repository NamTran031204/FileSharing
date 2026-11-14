package org.example.filesharing.entities.dtos.access;

import lombok.Data;

@Data
public class GrantRequestDTO {
    private String email;
    // chuoi, parse o service: project VIEWER..MANAGER, folder VIEWER..EDITOR
    private String role;
}
