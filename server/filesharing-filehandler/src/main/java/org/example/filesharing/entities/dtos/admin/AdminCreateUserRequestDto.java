package org.example.filesharing.entities.dtos.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminCreateUserRequestDto {
    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String publicUserName;

    // bcrypt chi doc toi da 72 byte
    @NotBlank
    @Size(min = 8, max = 72)
    @ToString.Exclude
    private String password;

    // chi nguoi co ROLE_SA moi duoc gui sa=true
    private boolean sa;

    private List<String> adminRoleIds;
}
