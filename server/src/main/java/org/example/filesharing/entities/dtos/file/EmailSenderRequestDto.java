package org.example.filesharing.entities.dtos.file;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.example.filesharing.enums.objectPermission.ObjectPermission;

import java.util.List;

@Data
public class EmailSenderRequestDto {
    @NotNull
    @NotBlank
    @Email
    private String toEmail;

    private List<ObjectPermission> objectPermission;

    @NotNull
    @NotBlank
    private String uploadLink;

    @NotNull
    @NotBlank
    private String objectName;
}
