package org.example.filesharing.entities.dtos.file;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import com.file.service.filesharing.core.enums.objectPermission.ObjectPermission;

import java.util.List;

@Data
public class EmailSenderRequestDto {
    @JsonIgnore
    private String fromUser;

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

    @JsonIgnore
    private String shareToken;

}
