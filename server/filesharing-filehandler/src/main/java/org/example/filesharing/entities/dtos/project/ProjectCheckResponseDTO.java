package org.example.filesharing.entities.dtos.project;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ProjectCheckResponseDTO {
    private Boolean isSuccess;
    private String message;
}
