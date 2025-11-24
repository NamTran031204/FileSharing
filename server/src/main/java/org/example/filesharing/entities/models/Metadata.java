package org.example.filesharing.entities.models;

import lombok.*;
import org.example.filesharing.enums.UploadStatus;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Document(collection = "metadata")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class Metadata {
    @Id
    private String fileId;
    private String fileName;
    private String mimeType;
    private Double fileSize;
    private String compressionAlgo;
    private int ownerId;
    private String uploadId;
    private UploadStatus status;
    private LocalDateTime creationTimestamp;
    private int timeToLive;
    private List<Chunk> chunkList;
}
