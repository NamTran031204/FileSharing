package org.example.filesharing.entities.dtos.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.file.service.filesharing.core.enums.auth.UserGrantedRole;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CreateUserRequestDto {

    @NotNull(message = "{validation.email.required}")
    @NotBlank(message = "{validation.email.required}")
    @Email(message = "{validation.email.invalid}")
    private String email;

    @NotNull(message = "{validation.password.required}")
    @NotBlank(message = "{validation.password.required}")
    @Size(min = 8, message = "{validation.password.min}")
    private String password;

    private String publicUserName;

    private List<UserGrantedRole> roles;

    private boolean enabled = true;

    private boolean emailVerified = false;
}
