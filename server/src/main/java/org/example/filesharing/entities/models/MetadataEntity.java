package org.example.filesharing.entities.models;

import lombok.*;
import org.example.filesharing.enums.UploadStatus;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Document(collection = "metadata")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class MetadataEntity {
    @Id
    private String fileId;
    private String fileName;
    private String objectName;
    private String mimeType;
    private Double fileSize;
    private String compressionAlgo;
    private String ownerId;
    private String uploadId;
    private UploadStatus status;

    private List<ChunkEntity> chunkEntityList;

    private int timeToLive;
    private Boolean isActive; // qua time to live, isActive = false

    private Instant creationTimestamp;
    private Instant modificationTimestamp;
}
