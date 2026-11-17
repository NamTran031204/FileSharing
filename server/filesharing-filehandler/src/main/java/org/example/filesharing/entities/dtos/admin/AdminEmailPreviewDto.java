package org.example.filesharing.entities.dtos.admin;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminEmailPreviewDto {
    private String subject;
    private String body;
}
