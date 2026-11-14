package org.example.filesharing.entities.dtos.access;

import lombok.Data;

@Data
public class AccessSettingsRequestDTO {
    // folder: null = theo cha; project: bat buoc co gia tri
    private Boolean viewersCanDownload;
}
