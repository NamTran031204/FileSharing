package org.example.filesharing.entities.dtos.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StorageStatsDTO {
    private double totalStorageBytes;
    private List<StorageByMediaTypeDTO> byMediaType;
    private List<StorageByProjectDTO> byProject;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StorageByMediaTypeDTO {
        private String mediaType;
        private long fileCount;
        private double storageBytes;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StorageByProjectDTO {
        private String projectId;
        private String projectName;
        private long fileCount;
        private double storageBytes;
    }
}
