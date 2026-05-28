package org.example.filesharing.entities.dtos.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardOverviewDTO {
    private long totalProjects;
    private long totalAssets;
    private long totalFolders;
    private double totalStorageBytes;
}
