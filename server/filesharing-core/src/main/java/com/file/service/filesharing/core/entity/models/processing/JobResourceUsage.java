package com.file.service.filesharing.core.entity.models.processing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

// Vo so lieu tai nguyen cua 1 lan chay job. P1-03.c moi do du lieu vao;
// o P1-01.a day chi la cho dat san de schema khong phai doi lan hai.
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobResourceUsage {
    // Ten tien trinh con duoc do, vi du "ffmpeg", "exiftool"
    private String tool;
    private Double peakCpuPercent;
    private Double avgCpuPercent;
    private Long peakRssBytes;
    // Dung luong thu muc tam dinh diem
    private Long peakTempBytes;
    // So lan lay mau
    private Integer samples;
    private Double wallSeconds;
    // Thoi luong tung chang, giay. Vi du { download: 8.1, process: 121.7, upload: 13.4 }
    private Map<String, Double> stages;
}
