package org.example.filesharing.entities.dtos.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleAuthRequestDto {

    @NotBlank
    private String credential;
}
