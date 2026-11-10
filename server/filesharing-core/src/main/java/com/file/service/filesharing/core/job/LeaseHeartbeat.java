package com.file.service.filesharing.core.job;

import com.file.service.filesharing.core.entity.models.ProcessingJobEntity;
import com.file.service.filesharing.core.job.tool.ToolRunner;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Gia han lease moi lease/3. Fence tra 0 ban ghi hoac >= 3 lan loi lien tiep: danh dau mat lease
 * va huy ca cay moi tien trinh con da dang ky (con song).
 */
@Slf4j
public class LeaseHeartbeat {
    private static final int MAX_FAILURES = 3;

    private final JobStore store;
    private final ProcessingJobEntity job;
    private final String workerId;
    private final long intervalMs;
    private final List<Process> processes = new CopyOnWriteArrayList<>();
    private volatile boolean lost;
    private volatile boolean stopped;
    // percent/step/eta doc cung luc trong 1 heartbeat, nen gom vao 1 record
    private record Progress(Integer percent, String step, Long etaMs) {
    }

    private volatile Progress progress = new Progress(null, null, null);
    private Thread thread;

    public LeaseHeartbeat(JobStore store, ProcessingJobEntity job, String workerId, long leaseMs) {
        this.store = store;
        this.job = job;
        this.workerId = workerId;
        this.intervalMs = Math.max(100, leaseMs / 3);
    }

    public LeaseHeartbeat start() {
        thread = Thread.ofVirtual().name("lease-hb-" + job.getJobId()).start(this::loop);
        return this;
    }

    private void loop() {
        int failures = 0;
        while (!stopped) {
            try {
                Thread.sleep(intervalMs);
                if (stopped) return;
                Progress pr = progress;
                if (!store.heartbeat(job.getJobId(), job.getAttemptId(), pr.percent(), pr.step(), pr.etaMs())) {
                    log.warn("fencing reject: job={} attempt={} worker={} da bi thu hoi", job.getJobId(), job.getAttemptId(), workerId);
                    markLost();
                    return;
                }
                failures = 0;
            } catch (InterruptedException e) {
                return;
            } catch (Exception e) {
                failures++;
                log.warn("heartbeat loi lan {} job={} attempt={}: {}", failures, job.getJobId(), job.getAttemptId(), e.getMessage());
                if (failures >= MAX_FAILURES) {
                    markLost();
                    return;
                }
            }
        }
    }

    private void markLost() {
        lost = true;
        processes.forEach(LeaseHeartbeat::kill);
    }

    public void register(Process p) {
        processes.add(p);
        // tien trinh da thoat thi bo khoi danh sach, tranh huy nham PID da bi tai su dung
        p.onExit().thenRun(() -> processes.remove(p));
        if (lost) kill(p);
    }

    private static void kill(Process p) {
        if (p.isAlive()) ToolRunner.killTree(p.toHandle());
    }

    public synchronized void progress(int percent, String step) {
        progress = new Progress(percent, step, progress.etaMs());
    }

    public synchronized void eta(Long etaMs) {
        progress = new Progress(progress.percent(), progress.step(), etaMs);
    }

    public boolean isLost() {
        return lost;
    }

    public void stop() {
        stopped = true;
        if (thread != null) thread.interrupt();
    }
}
