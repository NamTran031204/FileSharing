package org.example.filesharing.entities.dtos.upload;

import lombok.Data;

import java.util.List;

@Data
public class CompleteUploadSessionRequestDto {
    private List<CompletedPartDto> parts;
}
