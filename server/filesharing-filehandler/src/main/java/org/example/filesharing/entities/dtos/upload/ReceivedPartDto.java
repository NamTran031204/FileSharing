package org.example.filesharing.entities.dtos.upload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReceivedPartDto {
    private int partNumber;
    private long size;
    private String etag;
}
