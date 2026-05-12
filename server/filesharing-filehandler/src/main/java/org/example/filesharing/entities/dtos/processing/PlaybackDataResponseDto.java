package org.example.filesharing.entities.dtos.processing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.example.filesharing.enums.ProcessingStatus;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaybackDataResponseDto {
    private Integer versionNumber;
    private String assetId;
    private ProcessingStatus processingStatus;

    private String manifestKey;
    private String posterKey;
    private String spriteKey;
    private String spriteMetadataKey;

    private String imageUrl;
}
