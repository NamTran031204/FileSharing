package org.example.filesharing.entities.dtos.annotations;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnotationCountsDTO {
    private long openCount;
    private long resolvedCount;
}
