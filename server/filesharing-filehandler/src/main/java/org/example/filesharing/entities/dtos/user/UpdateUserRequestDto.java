package org.example.filesharing.entities.dtos.user;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.enums.auth.UserRole;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateUserRequestDto {

    private String publicUserName;

    @Size(min = 8, message = "Password phải có ít nhất 8 ký tự")
    private String password;

    private List<UserRole> roles;

    private Boolean enabled;

    private Boolean emailVerified;
}
