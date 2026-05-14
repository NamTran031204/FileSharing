package org.example.filesharing.entities.dtos.project;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ShareTokenCreateResponseDTO {
    private String shareToken;
    private String message;
}
