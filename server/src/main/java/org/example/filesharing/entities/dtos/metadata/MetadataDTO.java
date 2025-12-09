package org.example.filesharing.entities.dtos.metadata;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.example.filesharing.entities.dtos.chunk.ChunkRequest;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MetadataDTO {
    private String fileId;
    private String fileName;
    private String objectName;
    private String mimeType;
    private Double fileSize;
    private String compressionAlgo;
    private String ownerId;
    private LocalDateTime creationTimestamp;
    private int timeToLive;
    private List<ChunkRequest> chunkList;
}
