package org.example.filesharing.entities.dtos.project;

import lombok.Data;
import org.example.filesharing.enums.ShareTokenTime;

import java.time.LocalDateTime;

@Data
public class ShareTokenCreateDTO {
    private ShareTokenTime rangeTime;

    private LocalDateTime expireDate;

    private String projectId;
}
