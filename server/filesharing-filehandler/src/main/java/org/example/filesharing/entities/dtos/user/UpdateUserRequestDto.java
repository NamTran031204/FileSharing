package org.example.filesharing.entities.dtos.user;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class UpdateUserRequestDto {

    private String publicUserName;

    @Size(min = 8, message = "{validation.password.min}")
    private String password;
}
