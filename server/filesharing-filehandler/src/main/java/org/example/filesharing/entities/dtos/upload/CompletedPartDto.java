package org.example.filesharing.entities.dtos.upload;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompletedPartDto {
    private int partNumber;
    private String etag;
    private String md5;
}
