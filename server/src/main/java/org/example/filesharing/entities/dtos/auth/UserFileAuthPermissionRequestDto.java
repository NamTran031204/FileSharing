package org.example.filesharing.entities.dtos.auth;

import lombok.Data;

@Data
public class UserFileAuthPermissionRequestDto {
    String email;
    String shareToken;
}
