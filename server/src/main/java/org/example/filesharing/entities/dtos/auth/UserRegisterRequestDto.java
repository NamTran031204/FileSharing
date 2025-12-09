package org.example.filesharing.entities.dtos.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserRegisterRequestDto {

    @NotNull
    @NotBlank
    @Email
    private String email;

    @NotNull
    @NotBlank
    @Size(min = 8)
    private String password;

    @NotNull
    @NotBlank
    @Size(min = 8)
    private String confirmPassword;

    private String userName;
}
