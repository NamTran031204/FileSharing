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
        Path ws = Path.of(props.getWorkspaceDir()).resolve(attemptId);
        JobExecutor executor = executors.get(job.getJobType());
        LeaseHeartbeat hb = new LeaseHeartbeat(store, job, identity.workerId(),
                props.getLeaseDuration().toMillis()).start();
        AttemptScope scope = null;
        log.info("bat dau job={} attempt={} worker={} type={}", jobId, attemptId, identity.workerId(), job.getJobType());
        try {
            Files.createDirectories(ws);
            String url = null;
            Path file = null;
            if (executor.inputMode() == InputMode.STREAM) {
                url = storage.presignGet(props.getInputBucket(), job.getObjectName(), props.getPresignTtl());
            } else {
                String name = Path.of(job.getObjectName().replace('\\', '/')).getFileName().toString();
                file = ws.resolve("input").resolve(name);
                storage.download(props.getInputBucket(), job.getObjectName(), file);
            }
            JobContext ctx = new JobContext(job, ws, url, file, hb::progress, hb::register);
            JobExecution result = executor.process(ctx);
            checkLease(hb);
            scope = result.attemptScope();
            storage.uploadAll(result.outputs(), props.getUploadBatchSize());
            checkLease(hb);
            if (store.finalizeSucceeded(job, result)) {
                if (scope != null) storage.removeLosingAttempts(scope, attemptId);
                log.info("hoan tat job={} attempt={}", jobId, attemptId);
            } else {
                throw new LeaseLostException();
            }
        } catch (LeaseLostException e) {
            log.warn("fencing reject: job={} attempt={} mat lease, bo ket qua", jobId, attemptId);
            cleanupScope(scope, attemptId);
        } catch (PermanentJobException e) {
            if (hb.isLost()) lostLease(job, scope); else fail(job, executor, JobErrorEntry.Kind.PERMANENT, e.getMessage(), true, scope);
        } catch (TransientJobException e) {
            if (hb.isLost()) lostLease(job, scope); else fail(job, executor, JobErrorEntry.Kind.TRANSIENT, e.getMessage(), false, scope);
        } catch (Exception e) {
            if (hb.isLost()) {
                lostLease(job, scope);
            } else {
                log.error("job={} attempt={} loi khong du kien", jobId, attemptId, e);
                fail(job, executor, JobErrorEntry.Kind.TRANSIENT, String.valueOf(e.getMessage()), false, scope);
            }
        } finally {
            hb.stop();
            deleteRecursively(ws);
        }
    }

    private void lostLease(ProcessingJobEntity job, AttemptScope scope) {
        log.warn("fencing reject: job={} attempt={} mat lease giua chung, bo ket qua", job.getJobId(), job.getAttemptId());
        cleanupScope(scope, job.getAttemptId());
    }

    private void checkLease(LeaseHeartbeat hb) throws LeaseLostException {
        if (hb.isLost()) throw new LeaseLostException();
    }

    private void fail(ProcessingJobEntity job, JobExecutor executor, JobErrorEntry.Kind kind,
                      String message, boolean permanent, AttemptScope scope) {
        cleanupScope(scope, job.getAttemptId());
        int rc = job.getRetryCount() == null ? 0 : job.getRetryCount();
        int max = job.getMaxRetries() == null ? props.getMaxRetries() : job.getMaxRetries();
        JobErrorEntry err = JobErrorEntry.builder().attemptId(job.getAttemptId()).workerId(identity.workerId())
                .at(Instant.now()).kind(kind).message(JobStore.trim(message)).build();
        boolean ok;
        if (permanent || rc + 1 >= max) {
            ok = store.finalizeDeadLetter(job, err);
            log.error("DEAD_LETTER job={} attempt={} kind={} loi={}", job.getJobId(), job.getAttemptId(), kind, message);
        } else {
            ok = store.finalizeRetry(job, err);
            log.warn("retry job={} attempt={} lan={} loi={}", job.getJobId(), job.getAttemptId(), rc + 1, message);
        }
        if (!ok) {
            log.warn("fencing reject khi finalize loi: job={} attempt={}", job.getJobId(), job.getAttemptId());
            return;
        }
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

    // Don workspace mo coi cu hon 24h (JVM chet giua chung)
    @Scheduled(cron = "0 0 3 * * *")
    public void cleanupStaleWorkspaces() {
        Path root = Path.of(props.getWorkspaceDir());
        if (!Files.isDirectory(root)) return;
        Instant limit = Instant.now().minus(Duration.ofHours(24));
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
