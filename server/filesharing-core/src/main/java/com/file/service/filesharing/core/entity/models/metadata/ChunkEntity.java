package com.file.service.filesharing.core.entity.models.metadata;

import com.file.service.filesharing.core.enums.UploadStatus;
import lombok.*;

import java.time.Instant;

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
    private Instant updateAt;
}
