package org.example.filesharing.entities.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MetadataDTO {
    private String fileId;
    private String fileName;
    private String mimeType;
    private Double fileSize;
    private String compressionAlgo;
    private int ownerId;
    private LocalDateTime creationTimestamp;
    private int timeToLive;
    private List<ChunkRequest> chunkList;
}
