package org.example.filesharing.entities.models;

import lombok.*;
import org.example.filesharing.enums.UploadStatus;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class ChunkEntity {
    private String fingerPrint;
    private UploadStatus status;
    private String minIoLink;
    private Long part;
    private LocalDateTime updateAt;
}
