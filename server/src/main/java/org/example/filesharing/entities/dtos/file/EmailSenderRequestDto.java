package org.example.filesharing.entities.dtos.file;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class EmailSenderRequestDto {
    @NotNull
    @NotBlank
    @Email
    private String toEmail;

    @NotNull
    @NotBlank
    private String uploadLink;

    @NotNull
    @NotBlank
    private String objectName;
}
