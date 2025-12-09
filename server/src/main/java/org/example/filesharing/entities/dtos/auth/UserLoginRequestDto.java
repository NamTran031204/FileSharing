package org.example.filesharing.entities.dtos.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UserLoginRequestDto {
    @NotNull
    @NotBlank
    @Email
    private String email;

    @NotBlank
    @NotNull
    private String password;
}
