package com.file.service.filesharing.core.job;

import com.file.service.filesharing.core.entity.models.ProcessingJobEntity;
import com.file.service.filesharing.core.entity.models.processing.JobErrorEntry;
import com.file.service.filesharing.core.enums.ProcessingJobType;
import com.file.service.filesharing.core.job.exception.PermanentJobException;
import com.file.service.filesharing.core.job.exception.TransientJobException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Stream;

/** Chay 1 lan thu cua 1 job da claim: workspace, input, process, upload, finalize co fence. */
@Slf4j
public class JobRuntime {
    private final JobStore store;
    private final JobStorage storage;
    private final JobRuntimeProperties props;
    private final WorkerIdentity identity;
    private final Map<ProcessingJobType, JobExecutor> executors = new EnumMap<>(ProcessingJobType.class);

    private static class LeaseLostException extends Exception {
    }

    public JobRuntime(JobStore store, JobStorage storage, JobRuntimeProperties props,
                      WorkerIdentity identity, List<JobExecutor> all) {
        this.store = store;
        this.storage = storage;
        this.props = props;
        this.identity = identity;
        for (ProcessingJobType t : props.getJobTypes()) {
            JobExecutor ex = all.stream().filter(e -> e.supportedTypes().contains(t)).findFirst()
                    .orElseThrow(() -> new IllegalStateException("job-runtime.job-types co " + t + " nhung khong co JobExecutor ho tro"));
            executors.put(t, ex);
        }
        if (executors.isEmpty()) {
            throw new IllegalStateException("job-runtime.job-types rong");
        }
    }

    public void run(ProcessingJobEntity job) {
        String attemptId = job.getAttemptId();
        String jobId = job.getJobId();
        // chup setting LIVE mot lan, ca job dung chung gia tri nay
        JobRuntimeProperties.Snapshot snap = props.snapshot();
        Path ws = Path.of(props.getWorkspaceDir()).resolve(attemptId);
        JobExecutor executor = executors.get(job.getJobType());
        LeaseHeartbeat hb = new LeaseHeartbeat(store, job, identity.workerId(),
                props.getLeaseDuration().toMillis()).start();
        AttemptScope scope = null;
        AttemptMetrics metrics = new AttemptMetrics();
        log.info("bat dau job={} attempt={} worker={} type={}", jobId, attemptId, identity.workerId(), job.getJobType());
        try {
            Files.createDirectories(ws);
            String bucket = props.getInputBucket();
            // Quy tac 1: input khong ton tai hoac 0 byte -> permanent, chung cho moi worker
            long size = storage.stat(bucket, job.getObjectName());
            if (size == 0) throw new PermanentJobException("file input 0 byte");
            boolean stream = executor.inputMode() == InputMode.STREAM;
            String url = stream ? storage.presignGet(bucket, job.getObjectName(), snap.presignTtl()) : null;
            Path file = stream ? null : ws.resolve("input").resolve(localInputName(job.getObjectName()));
            JobContext ctx = new JobContext(job, ws, url, file, hb, metrics);
            if (!stream) {
                try (JobContext.Stage st = ctx.stage("fetch", 0, 30)) {
                    long n = storage.download(bucket, job.getObjectName(), file, size,
                            b -> ctx.progress((double) b / size, "FETCH " + mb(b) + "/" + mb(size) + " MB"), hb::isLost);
                    metrics.bytesIn(n);
                }
            }
            JobExecution result = executor.process(ctx);
            checkLease(hb);
            scope = result.attemptScope();
            int total = result.outputs().size();
            try (JobContext.Stage st = ctx.stage("upload", ctx.percent(), JobContext.MAX_PERCENT)) {
                long out = storage.uploadAll(result.outputs(), snap.uploadBatchSize(), hb::isLost,
                        done -> ctx.progress((double) done / total, "UPLOAD " + done + "/" + total));
                metrics.bytesOut(out);
            }
            checkLease(hb);
            if (store.finalizeSucceeded(job, result, metrics.toUsage(attemptId))) {
                if (scope != null) storage.removeLosingAttempts(scope, attemptId);
                log.info("hoan tat job={} attempt={}", jobId, attemptId);
                log.info(metrics.logLine(job, "success"));
            } else {
                throw new LeaseLostException();
            }
        } catch (LeaseLostException e) {
            log.warn("fencing reject: job={} attempt={} mat lease, bo ket qua", jobId, attemptId);
            cleanupScope(scope, attemptId);
        } catch (PermanentJobException e) {
            if (hb.isLost()) lostLease(job, scope); else fail(job, JobErrorEntry.Kind.PERMANENT, e.getMessage(), e.getDetail(), true, scope, metrics, snap);
        } catch (TransientJobException e) {
            if (hb.isLost()) lostLease(job, scope); else fail(job, JobErrorEntry.Kind.TRANSIENT, e.getMessage(), e.getDetail(), false, scope, metrics, snap);
        } catch (Exception e) {
            if (hb.isLost()) {
                lostLease(job, scope);
            } else {
                log.error("job={} attempt={} loi khong du kien", jobId, attemptId, e);
                fail(job, JobErrorEntry.Kind.TRANSIENT, String.valueOf(e.getMessage()), null, false, scope, metrics, snap);
            }
        } finally {
            hb.stop();
            deleteRecursively(ws);
        }
    }

    // Ten file input trong workspace: source.<ext>. Ten nguoi dung dat (xuong dong, '[', '-if'...) khong bao gio
    // di vao dong lenh cong cu. ext chi nhan [a-z0-9]{1,8}, khong khop thi bo duoi.
    static String localInputName(String objectName) {
        String n = objectName == null ? "" : objectName;
        String base = n.substring(Math.max(n.lastIndexOf('/'), n.lastIndexOf('\\')) + 1);
        int dot = base.lastIndexOf('.');
        String ext = dot < 0 ? "" : base.substring(dot + 1).toLowerCase(Locale.ROOT);
        return ext.matches("[a-z0-9]{1,8}") ? "source." + ext : "source";
    }

    private void lostLease(ProcessingJobEntity job, AttemptScope scope) {
        log.warn("fencing reject: job={} attempt={} mat lease giua chung, bo ket qua", job.getJobId(), job.getAttemptId());
        cleanupScope(scope, job.getAttemptId());
    }

    private void checkLease(LeaseHeartbeat hb) throws LeaseLostException {
        if (hb.isLost()) throw new LeaseLostException();
    }

    private static long mb(long bytes) {
        return bytes / (1024 * 1024);
    }

    private void fail(ProcessingJobEntity job, JobErrorEntry.Kind kind, String message, String detail,
                      boolean permanent, AttemptScope scope, AttemptMetrics metrics,
                      JobRuntimeProperties.Snapshot snap) {
        cleanupScope(scope, job.getAttemptId());
        int rc = job.getRetryCount() == null ? 0 : job.getRetryCount();
        int max = job.getMaxRetries() == null ? snap.maxRetries() : job.getMaxRetries();
        JobErrorEntry err = JobErrorEntry.builder().attemptId(job.getAttemptId()).workerId(identity.workerId())
                .at(Instant.now()).kind(kind).message(JobStore.trim(message)).detail(detail).build();
        boolean ok;
        boolean dead = permanent || rc + 1 >= max;
        if (dead) {
            ok = store.finalizeDeadLetter(job, err, metrics.toUsage(job.getAttemptId()));
            log.error("DEAD_LETTER job={} attempt={} kind={} loi={}", job.getJobId(), job.getAttemptId(), kind, message);
        } else {
            ok = store.finalizeRetry(job, err, metrics.toUsage(job.getAttemptId()));
            log.warn("retry job={} attempt={} lan={} loi={}", job.getJobId(), job.getAttemptId(), rc + 1, message);
        }
        if (!ok) {
            log.warn("fencing reject khi finalize loi: job={} attempt={}", job.getJobId(), job.getAttemptId());
            return;
        }
        log.info(metrics.logLine(job, dead ? "dead_letter" : "retry"));
    }

    private void cleanupScope(AttemptScope scope, String attemptId) {
        if (scope != null) storage.removeAttempt(scope, attemptId);
    }

    private static void deleteRecursively(Path dir) {
        if (!Files.exists(dir)) return;
        try (Stream<Path> s = Files.walk(dir)) {
            s.sorted(Comparator.reverseOrder()).forEach(p -> p.toFile().delete());
        } catch (IOException e) {
            log.warn("xoa workspace {} that bai: {}", dir, e.getMessage());
        }
    }

    // Don workspace mo coi cu hon job.workspace-cleanup-age (JVM chet giua chung)
    @Scheduled(cron = "0 0 3 * * *")
    public void cleanupStaleWorkspaces() {
        Path root = Path.of(props.getWorkspaceDir());
        if (!Files.isDirectory(root)) return;
        Instant limit = Instant.now().minus(props.getWorkspaceCleanupAge());
        try (Stream<Path> s = Files.list(root)) {
            s.filter(p -> {
                try {
                    return Files.getLastModifiedTime(p).toInstant().isBefore(limit);
                } catch (IOException e) {
                    return false;
                }
            }).forEach(JobRuntime::deleteRecursively);
        } catch (IOException e) {
            log.warn("don workspace cu loi: {}", e.getMessage());
        }
    }
}
