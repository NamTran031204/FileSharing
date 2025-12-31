package org.example.filesharing.entities.dtos.file;

import lombok.Builder;
import lombok.Data;
import org.example.filesharing.enums.UploadStatus;

import java.time.Instant;


@Data
public class UserFileFilterPageRequestDto {
    private String mimeType;

    private UploadStatus status;

    private Boolean isActive; // phu thuoc vao time to live

    private Boolean isIncludeSharedFile;

    private Instant creationTimestampStartDate;
    private Instant creationTimestampEndDate;
}
