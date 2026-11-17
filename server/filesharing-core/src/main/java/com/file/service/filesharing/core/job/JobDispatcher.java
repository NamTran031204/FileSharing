package com.file.service.filesharing.core.job;

import com.file.service.filesharing.core.entity.models.ProcessingJobEntity;
import com.file.service.filesharing.core.node.NodeControl;
import io.github.resilience4j.bulkhead.Bulkhead;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.locks.ReentrantLock;

/** Poll + chuong cua deu goi tick(). Moi slot bulkhead duoc tra trong finally cua virtual thread. */
@Slf4j
public class JobDispatcher {
    private final Bulkhead bulkhead;
    private final JobStore store;
    private final JobRuntime runtime;
    private final JobRuntimeProperties props;
    private final String workerId;
    // null khi service khong bat node heartbeat
    private final NodeControl nodeControl;
    private final ReentrantLock lock = new ReentrantLock();
    private final AtomicBoolean rerun = new AtomicBoolean();
    private final AtomicBoolean wakePending = new AtomicBoolean();
    private final ScheduledExecutorService coalescer = Executors.newSingleThreadScheduledExecutor(r -> {
        Thread t = new Thread(r, "job-wakeup");
        t.setDaemon(true);
        return t;
    });

    public JobDispatcher(Bulkhead bulkhead, JobStore store, JobRuntime runtime,
                         JobRuntimeProperties props, WorkerIdentity identity) {
        this(bulkhead, store, runtime, props, identity, null);
    }

    public JobDispatcher(Bulkhead bulkhead, JobStore store, JobRuntime runtime,
                         JobRuntimeProperties props, WorkerIdentity identity, NodeControl nodeControl) {
        this.nodeControl = nodeControl;
        this.bulkhead = bulkhead;
        this.store = store;
        this.runtime = runtime;
        this.props = props;
        this.workerId = identity.workerId();
    }

    @Scheduled(fixedDelayString = "${job-runtime.poll-interval:1s}")
    public void scheduledTick() throws InterruptedException {
        // lech ngau nhien 0-20% chu ky de nhieu instance khong poll cung luc
        Thread.sleep(JobStore.jitterOf(props.getPollInterval(), 0.2).toMillis());
        tick();
    }

    // Gom nhieu tin hieu trong 50ms thanh 1 lan tick
    public void wakeUp() {
        if (wakePending.compareAndSet(false, true)) {
            coalescer.schedule(() -> {
                wakePending.set(false);
                tick();
            }, 50, TimeUnit.MILLISECONDS);
        }
    }

    public void tick() {
        if (!lock.tryLock()) {
            rerun.set(true);
            return;
        }
        try {
            do {
                rerun.set(false);
                drain();
            } while (rerun.get());
        } catch (Exception e) {
            log.error("tick loi: {}", e.getMessage(), e);
        } finally {
            lock.unlock();
        }
    }

    // package-private cho test. Drain: khong claim job moi (job moi giu PENDING), job dang chay chay tiep
    void drain() {
        if (nodeControl != null && nodeControl.isDraining()) return;
        while (bulkhead.tryAcquirePermission()) {
            ProcessingJobEntity job;
            try {
                job = store.claimOne(props.getJobTypes(), workerId);
            } catch (RuntimeException e) {
                bulkhead.releasePermission();
                throw e;
            }
            if (job == null) {
                bulkhead.releasePermission();
                return;
            }
            log.info("claim job={} attempt={} worker={}", job.getJobId(), job.getAttemptId(), workerId);
            try {
                Thread.ofVirtual().name("job-" + job.getJobId()).start(() -> {
                    try {
                        runtime.run(job);
                    } catch (Throwable t) {
                        log.error("job={} loi khong bat duoc: {}", job.getJobId(), t.getMessage(), t);
                    } finally {
                        bulkhead.releasePermission();
                        log.debug("slot trong: {}", bulkhead.getMetrics().getAvailableConcurrentCalls());
                    }
                });
            } catch (Throwable t) {
                bulkhead.releasePermission();
                throw t;
            }
        }
    }
}
