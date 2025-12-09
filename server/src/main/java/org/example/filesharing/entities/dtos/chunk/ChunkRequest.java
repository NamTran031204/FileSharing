package org.example.filesharing.entities.dtos.chunk;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChunkRequest {
    private String fingerPrint;
    private String chunkName;
    private String uploadId;
    private Integer part;
    private Boolean status;
}
