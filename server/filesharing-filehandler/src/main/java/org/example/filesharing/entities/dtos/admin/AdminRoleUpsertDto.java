package org.example.filesharing.entities.dtos.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminRoleUpsertDto {
    // khi update bi bo qua (code bat bien)
    @NotBlank
    @Pattern(regexp = "^[A-Za-z0-9_.-]{1,100}$")
    private String code;
    @Size(max = 200)
    private String name;
    @Size(max = 500)
    private String description;
    @NotNull
    private List<String> permissions;
}
