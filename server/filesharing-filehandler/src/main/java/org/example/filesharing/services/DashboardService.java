package org.example.filesharing.services;

import org.example.filesharing.entities.dtos.dashboard.DashboardOverviewDTO;
import org.example.filesharing.entities.dtos.dashboard.RecentActivityItemDTO;
import org.example.filesharing.entities.dtos.dashboard.ReviewStatsDTO;
import org.example.filesharing.entities.dtos.dashboard.StorageStatsDTO;

import java.util.List;

public interface DashboardService {
    DashboardOverviewDTO getOverview();

    List<RecentActivityItemDTO> getRecentActivities(int limit);

    StorageStatsDTO getStorageStats();

    ReviewStatsDTO getReviewStats();
}
