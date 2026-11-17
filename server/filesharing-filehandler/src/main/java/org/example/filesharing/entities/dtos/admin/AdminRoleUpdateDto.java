package org.example.filesharing.entities.dtos.admin;

import com.file.service.filesharing.core.enums.auth.UserGrantedRole;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminRoleUpdateDto {
    @NotNull
    private List<UserGrantedRole> roles;
}
