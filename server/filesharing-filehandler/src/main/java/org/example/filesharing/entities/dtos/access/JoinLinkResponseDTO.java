package org.example.filesharing.entities.dtos.access;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JoinLinkResponseDTO {
    private String projectId;
    private String folderId;
}
