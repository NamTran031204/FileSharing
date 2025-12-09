package org.example.filesharing.entities.dtos.metadata;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class InitiateUploadResponseDto {
    private String uploadId;
    private Map<Integer, String> partUrl;
}
