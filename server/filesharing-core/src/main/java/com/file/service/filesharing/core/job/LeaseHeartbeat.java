package com.file.service.filesharing.core.job;

import com.file.service.filesharing.core.entity.models.ProcessingJobEntity;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Gia han lease moi lease/3. Fence tra 0 ban ghi hoac >= 3 lan loi lien tiep: danh dau mat lease
 * va destroyForcibly moi tien trinh con da dang ky.
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
    private volatile Integer percent;
    private volatile String step;
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
                if (!store.heartbeat(job.getJobId(), job.getAttemptId(), percent, step)) {
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
        processes.forEach(Process::destroyForcibly);
    }

    public void register(Process p) {
        processes.add(p);
        if (lost) p.destroyForcibly();
    }

    public void progress(int percent, String step) {
        this.percent = percent;
        this.step = step;
    }

    public boolean isLost() {
        return lost;
    }

    public void stop() {
        stopped = true;
        if (thread != null) thread.interrupt();
    }
}
