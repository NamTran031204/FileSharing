package org.example.filesharing.controllers;

import lombok.RequiredArgsConstructor;
import org.example.filesharing.entities.CommonResponse;
import org.example.filesharing.entities.dtos.dashboard.DashboardOverviewDTO;
import org.example.filesharing.entities.dtos.dashboard.RecentActivityItemDTO;
import org.example.filesharing.entities.dtos.dashboard.ReviewStatsDTO;
import org.example.filesharing.entities.dtos.dashboard.StorageStatsDTO;
import org.example.filesharing.services.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/overview")
    public CommonResponse<DashboardOverviewDTO> getOverview() {
        return CommonResponse.success(dashboardService.getOverview());
    }

    @GetMapping("/recent-activities")
    public CommonResponse<List<RecentActivityItemDTO>> getRecentActivities(
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        return CommonResponse.success(dashboardService.getRecentActivities(limit));
    }

    @GetMapping("/storage-stats")
    public CommonResponse<StorageStatsDTO> getStorageStats() {
        return CommonResponse.success(dashboardService.getStorageStats());
    }

    @GetMapping("/review-stats")
    public CommonResponse<ReviewStatsDTO> getReviewStats() {
        return CommonResponse.success(dashboardService.getReviewStats());
    }
}
