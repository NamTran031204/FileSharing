package com.file.service.filesharing.core.entity.models.processing;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

// So lieu tai nguyen cua lan thu cuoi cung, ghi trong lenh finalize co fencing. Cac lan thu truoc chi con trong log.
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobResourceUsage {
    // Lan thu ma so lieu nay thuoc ve. Job bi reaper thu hoi giu so cua lan thu truoc: loc attemptId == job.attemptId
    private String attemptId;
    // Ten tien trinh con duoc do (P1-03.c), vi du "ffmpeg", "exiftool"
    private String tool;
    private Double peakCpuPercent;
    private Double avgCpuPercent;
    private Long peakRssBytes;
    // Dung luong thu muc tam dinh diem
    private Long peakTempBytes;
    // So lan lay mau
    private Integer samples;
    private Double wallSeconds;
    // Thoi luong tung chang, giay. Khoa: fetch, probe, process, upload
    private Map<String, Double> stages;
    private Long bytesIn;
    private Long bytesOut;
    // Video: thoi luong noi dung (giay). Anh: so pixel. Lay o PROBE
    private Double mediaSeconds;
    private Long pixels;
    private List<ToolRun> toolRuns;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ToolRun {
        private String tool;
        private Integer exitCode;
        private Long wallMs;
        private Long cpuMs;
    }
}
