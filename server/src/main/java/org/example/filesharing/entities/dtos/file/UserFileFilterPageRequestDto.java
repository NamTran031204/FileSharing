package org.example.filesharing.entities.dtos.file;

import lombok.Data;

import java.time.Instant;


@Data
public class UserFileFilterPageRequestDto {
    private String ownerId;

    private String mimeType;
    private Instant creationTimestampStartDate;
    private Instant creationTimestampEndDate;
}
