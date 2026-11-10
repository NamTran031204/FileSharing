package com.file.service.filesharing.core.job;

import com.file.service.filesharing.core.entity.models.ProcessingJobEntity;
import com.file.service.filesharing.core.entity.models.processing.JobResourceUsage;
import com.file.service.filesharing.core.job.tool.ToolResult;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.stream.Collectors;

/** So do cua 1 lan thu: giay tung chang, byte vao/ra, kich thuoc noi dung, cac lan chay cong cu. */
public final class AttemptMetrics {
    private final long startNanos = System.nanoTime();
    private final Map<String, Double> stages = new LinkedHashMap<>();
    private final List<ToolResult> tools = new CopyOnWriteArrayList<>();
    private volatile Long bytesIn;
    private volatile Long bytesOut;
    private volatile Double mediaSeconds;
    private volatile Long pixels;

    synchronized void stage(String name, double seconds) {
        stages.merge(name, seconds, Double::sum);
    }

    public void add(ToolResult r) {
        tools.add(r);
    }

    public void bytesIn(long n) {
        bytesIn = n;
    }

    public void bytesOut(long n) {
        bytesOut = n;
    }

    public void mediaSeconds(double s) {
        mediaSeconds = s;
    }

    public void pixels(long n) {
        pixels = n;
    }

    public List<ToolResult> toolRuns() {
        return List.copyOf(tools);
    }

    synchronized JobResourceUsage toUsage(String attemptId) {
        return JobResourceUsage.builder()
                .attemptId(attemptId)
                .wallSeconds(round((System.nanoTime() - startNanos) / 1e9))
                .stages(new LinkedHashMap<>(stages))
                .bytesIn(bytesIn).bytesOut(bytesOut).mediaSeconds(mediaSeconds).pixels(pixels)
                .toolRuns(tools.stream().map(t -> JobResourceUsage.ToolRun.builder()
                        .tool(t.tool()).exitCode(t.exitCode()).wallMs(t.wallMs()).cpuMs(t.cpuMs()).build()).toList())
                .build();
    }

    synchronized String logLine(ProcessingJobEntity job, String outcome) {
        return "job-metrics job=" + job.getJobId() + " attempt=" + job.getAttemptId() + " type=" + job.getJobType()
                + " outcome=" + outcome
                + " fetchMs=" + ms("fetch") + " probeMs=" + ms("probe") + " processMs=" + ms("process") + " uploadMs=" + ms("upload")
                + " bytesIn=" + bytesIn + " bytesOut=" + bytesOut + " mediaSeconds=" + mediaSeconds + " pixels=" + pixels
                + " tools=" + tools.stream().map(t -> t.tool() + ":" + t.exitCode() + ":" + t.wallMs() + "ms")
                .collect(Collectors.joining(","));
    }

    private String ms(String stage) {
        Double s = stages.get(stage);
        return s == null ? "-" : String.valueOf(Math.round(s * 1000));
    }

    private static double round(double s) {
        return Math.round(s * 1000) / 1000.0;
    }
}
