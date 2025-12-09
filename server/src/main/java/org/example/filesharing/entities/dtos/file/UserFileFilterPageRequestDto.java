package org.example.filesharing.entities.dtos.file;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserFileFilterPageRequestDto {
    private String ownerId;

    private String mimeType;
    private LocalDateTime creationTimestampStartDate;
    private LocalDateTime creationTimestampEndDate;
}
