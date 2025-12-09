package org.example.filesharing.entities.dtos.metadata;

import lombok.Data;

@Data
public class DownloadFileRequestDto {
    private String objectName;
    private String downloadFileName;
    private int expireTime; // second
}
