package org.example.filesharing.entities.dtos.upload;

import lombok.Data;

import java.util.List;

@Data
public class PartUrlBatchRequestDto {
    private List<Integer> partNumbers;
}
