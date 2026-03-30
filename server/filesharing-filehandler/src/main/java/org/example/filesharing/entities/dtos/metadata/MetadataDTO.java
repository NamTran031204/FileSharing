package org.example.filesharing.entities.dtos.metadata;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MetadataDTO {
    private String fileName;
    private String objectName;
    private String mimeType;
    private Double fileSize;
    private String compressionAlgo;
    private Integer timeToLive;
}
