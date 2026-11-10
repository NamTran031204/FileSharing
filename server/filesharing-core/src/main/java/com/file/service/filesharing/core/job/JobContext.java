package com.file.service.filesharing.core.job;

import com.file.service.filesharing.core.entity.models.ProcessingJobEntity;
import com.file.service.filesharing.core.job.exception.TransientJobException;
import com.file.service.filesharing.core.job.tool.ToolCommand;
import com.file.service.filesharing.core.job.tool.ToolResult;
import com.file.service.filesharing.core.job.tool.ToolRunner;

import java.io.IOException;
import java.nio.file.Path;
import java.time.Duration;

public final class JobContext {
    // % toi da truoc finalize. Chi finalizeSucceeded ghi 100
    static final int MAX_PERCENT = 99;

    private final ProcessingJobEntity job;
    private final Path workspace;
    private final String inputUrl;
    private final Path inputFile;
    private final LeaseHeartbeat hb;
    private final AttemptMetrics metrics;
    private int stageFrom = 0;
    private int stageTo = MAX_PERCENT;
    private int lastPercent = 0;

    JobContext(ProcessingJobEntity job, Path workspace, String inputUrl, Path inputFile,
               LeaseHeartbeat hb, AttemptMetrics metrics) {
        this.job = job;
        this.workspace = workspace;
        this.inputUrl = inputUrl;
        this.inputFile = inputFile;
        this.hb = hb;
        this.metrics = metrics;
    }

    public ProcessingJobEntity job() {
        return job;
    }

    public String attemptId() {
        return job.getAttemptId();
    }

    // Thu muc rieng cua lan thu, runtime xoa sau khi xong
    public Path workspace() {
        return workspace;
    }

    // Chi co khi inputMode = STREAM. KHONG duoc log gia tri nay; truyen vao ToolCommand.secrets
    public String inputUrl() {
        return inputUrl;
    }

    // Chi co khi inputMode = DOWNLOAD. Ten file luon la source.<ext>, khong mang ten nguoi dung dat
    public Path inputFile() {
        return inputFile;
    }

    public AttemptMetrics metrics() {
        return metrics;
    }

    // % tuyet doi; van theo quy tac khong giam, tran 99
    public void reportProgress(int percent, String step) {
        publish(percent, step);
    }

    /**
     * Vao chang moi: chang chiem khoang [fromPct, toPct] cua tien do tong, ETA bi xoa.
     * Dong (try-with-resources) thi cong giay cua chang vao metrics.stages[name].
     */
    public Stage stage(String name, int fromPct, int toPct) {
        synchronized (this) {
            stageFrom = fromPct;
            stageTo = Math.min(toPct, MAX_PERCENT);
        }
        hb.eta(null);
        publish(fromPct, name.toUpperCase());
        return new Stage(name);
    }

    // fraction trong [0, 1] cua chang hien tai. % tong = from + (to - from) * fraction, lam tron xuong
    public void progress(double fraction, String step) {
        double f = Math.max(0, Math.min(1, fraction));
        int p;
        synchronized (this) {
            p = stageFrom + (int) Math.floor((stageTo - stageFrom) * f);
        }
        publish(p, step);
    }

    // ETA cua chang hien tai, di theo heartbeat ke tiep
    public void eta(Duration d) {
        hb.eta(d == null ? null : d.toMillis());
    }

    synchronized int percent() {
        return lastPercent;
    }

    private void publish(int percent, String step) {
        int p;
        synchronized (this) {
            p = Math.min(MAX_PERCENT, Math.max(lastPercent, percent));
            lastPercent = p;
        }
        hb.progress(p, step);
    }

    // Dang ky tien trinh con de runtime huy khi mat lease
    public void onProcessStarted(Process p) {
        hb.register(p);
    }

    public boolean leaseLost() {
        return hb.isLost();
    }

    /**
     * Chay cong cu trong workspace, tien trinh duoc dang ky fencing, ket qua vao metrics.toolRuns.
     * Khong phan loai exit code: executor tu quyet dinh tu ToolResult. start() loi hoac bi ngat thi nem transient.
     */
    public ToolResult exec(ToolCommand c) throws TransientJobException {
        try {
            ToolResult r = ToolRunner.run(c, workspace, hb::register, job.getJobId(), job.getAttemptId());
            metrics.add(r);
            return r;
        } catch (IOException e) {
            throw new TransientJobException(c.tool() + " khong chay duoc: " + e.getMessage(), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new TransientJobException(c.tool() + " bi ngat giua chung");
        }
    }

    public final class Stage implements AutoCloseable {
        private final String name;
        private final long start = System.nanoTime();

        private Stage(String name) {
            this.name = name;
        }

        @Override
        public void close() {
            metrics.stage(name, (System.nanoTime() - start) / 1e9);
        }
    }
}
