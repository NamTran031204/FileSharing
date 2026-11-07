package com.file.service.filesharing.core.job;

import com.file.service.filesharing.core.entity.models.ProcessingJobEntity;
import com.file.service.filesharing.core.entity.models.processing.JobErrorEntry;
import com.file.service.filesharing.core.enums.ProcessingJobStatus;
import com.file.service.filesharing.core.enums.ProcessingJobType;
import org.bson.types.ObjectId;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Moi lenh ghi job di qua MongoTemplate voi filter co dieu kien, khong bao gio save() ca document.
 * Lenh ghi cua worker deu loc {_id, attemptId, status: PROCESSING} (fencing).
 */
public class JobStore {
    private static final int MAX_MESSAGE = 2000;

    private final MongoTemplate mongo;
    private final JobRuntimeProperties props;

    public JobStore(MongoTemplate mongo, JobRuntimeProperties props) {
        this.mongo = mongo;
        this.props = props;
    }

    public ProcessingJobEntity findById(String id) {
        return mongo.findById(id, ProcessingJobEntity.class);
    }

    public ProcessingJobEntity claimOne(Collection<ProcessingJobType> types, String workerId) {
        Instant now = Instant.now();
        Query q = Query.query(Criteria.where("status").is(ProcessingJobStatus.PENDING)
                        .and("jobType").in(types)
                        .and("dueAt").lte(now))
                .with(Sort.by(Sort.Order.desc("priority"), Sort.Order.asc("dueAt")));
        Update u = new Update()
                .set("status", ProcessingJobStatus.PROCESSING)
                .set("workerId", workerId)
                .set("attemptId", new ObjectId().toHexString())
                .set("startedAt", now)
                .set("leaseUntil", now.plus(props.getLeaseDuration()))
                .set("workerHeartbeat", now);
        return mongo.findAndModify(q, u, FindAndModifyOptions.options().returnNew(true), ProcessingJobEntity.class);
    }

    private Query fence(String id, String attemptId) {
        return Query.query(Criteria.where("_id").is(id)
                .and("attemptId").is(attemptId)
                .and("status").is(ProcessingJobStatus.PROCESSING));
    }

    private boolean matched(Query q, Update u) {
        return mongo.updateFirst(q, u, ProcessingJobEntity.class).getMatchedCount() > 0;
    }

    public boolean heartbeat(String id, String attemptId, Integer percent, String step) {
        Instant now = Instant.now();
        Update u = new Update()
                .set("leaseUntil", now.plus(props.getLeaseDuration()))
                .set("workerHeartbeat", now);
        if (percent != null) {
            u.set("progress.percent", percent).set("progress.currentStep", step);
        }
        return matched(fence(id, attemptId), u);
    }

    public boolean finalizeSucceeded(ProcessingJobEntity job, JobExecution ex) {
        List<String> keys = ex.outputs().stream().map(OutputObject::key).toList();
        Update u = new Update()
                .set("status", ProcessingJobStatus.COMPLETED)
                .set("completedAt", Instant.now())
                .set("progress.percent", 100)
                .set("progress.currentStep", "COMPLETED")
                .set("result.success", true)
                .set("result.outputKeys", keys)
                .set("result.manifestKey", ex.manifestKey())
                .set("result.thumbnailUrl", ex.thumbnailUrl())
                .set("leaseUntil", null)
                .set("resultPublishedAt", null);
        return matched(fence(job.getJobId(), job.getAttemptId()), u);
    }

    public boolean finalizeRetry(ProcessingJobEntity job, JobErrorEntry err) {
        int rc = job.getRetryCount() == null ? 0 : job.getRetryCount();
        Instant due = Instant.now().plus(JobBackoff.next(rc, props.getBackoffBase(), props.getBackoffMax(),
                () -> ThreadLocalRandom.current().nextDouble()));
        Update u = new Update()
                .set("status", ProcessingJobStatus.PENDING)
                .set("retryCount", rc + 1)
                .set("dueAt", due)
                .set("lastError", err.getMessage())
                .set("workerId", null)
                .set("leaseUntil", null)
                .push("errorHistory", err);
        return matched(fence(job.getJobId(), job.getAttemptId()), u);
    }

    public boolean finalizeDeadLetter(ProcessingJobEntity job, JobErrorEntry err) {
        return matched(fence(job.getJobId(), job.getAttemptId()), deadLetterUpdate(err));
    }

    private Update deadLetterUpdate(JobErrorEntry err) {
        return new Update()
                .set("status", ProcessingJobStatus.DEAD_LETTER)
                .set("completedAt", Instant.now())
                .set("lastError", err.getMessage())
                .set("result.success", false)
                .set("result.errorMessage", err.getMessage())
                .set("leaseUntil", null)
                .set("resultPublishedAt", null)
                .push("errorHistory", err);
    }

    public List<ProcessingJobEntity> findExpired(Collection<ProcessingJobType> types, int limit) {
        Query q = Query.query(Criteria.where("status").is(ProcessingJobStatus.PROCESSING)
                .and("jobType").in(types)
                .and("leaseUntil").lt(Instant.now())).limit(limit);
        return mongo.find(q, ProcessingJobEntity.class);
    }

    // Thu hoi 1 job het lease. Loc them leaseUntil < now de khong de len heartbeat vua gia han.
    public boolean reap(ProcessingJobEntity doc) {
        int rc = doc.getRetryCount() == null ? 0 : doc.getRetryCount();
        int max = doc.getMaxRetries() == null ? props.getMaxRetries() : doc.getMaxRetries();
        JobErrorEntry err = JobErrorEntry.builder()
                .attemptId(doc.getAttemptId()).workerId(doc.getWorkerId()).at(Instant.now())
                .kind(JobErrorEntry.Kind.LEASE_EXPIRED).message("lease het han, worker co the da chet").build();
        Query q = fence(doc.getJobId(), doc.getAttemptId());
        q.addCriteria(Criteria.where("leaseUntil").lt(Instant.now()));
        Update u;
        if (rc + 1 >= max) {
            u = deadLetterUpdate(err);
        } else {
            u = new Update()
                    .set("status", ProcessingJobStatus.PENDING)
                    .set("retryCount", rc + 1)
                    .set("dueAt", Instant.now())
                    .set("lastError", err.getMessage())
                    .set("workerId", null)
                    .set("leaseUntil", null)
                    .push("errorHistory", err);
        }
        return matched(q, u);
    }

    // Claim ket qua cuoi chua publish. Document cu khong co field resultPublishedAt thi khong bao gio khop.
    public ProcessingJobEntity claimUnpublishedResult(Collection<ProcessingJobType> types, Duration lease) {
        Instant now = Instant.now();
        Query q = Query.query(Criteria.where("status").in(ProcessingJobStatus.COMPLETED, ProcessingJobStatus.DEAD_LETTER)
                .and("jobType").in(types)
                .and("resultPublishedAt").type(10)
                .andOperator(new Criteria().orOperator(
                        Criteria.where("relayLeaseUntil").is(null),
                        Criteria.where("relayLeaseUntil").lt(now))));
        return mongo.findAndModify(q, new Update().set("relayLeaseUntil", now.plus(lease)),
                FindAndModifyOptions.options().returnNew(true), ProcessingJobEntity.class);
    }

    public void markResultPublished(String id) {
        mongo.updateFirst(Query.query(Criteria.where("_id").is(id)),
                new Update().set("resultPublishedAt", Instant.now()).set("relayLeaseUntil", null),
                ProcessingJobEntity.class);
    }

    public static String trim(String s) {
        if (s == null) return null;
        return s.length() > MAX_MESSAGE ? s.substring(0, MAX_MESSAGE) : s;
    }

    public static Duration jitterOf(Duration d, double maxFraction) {
        return Duration.ofMillis((long) (d.toMillis() * maxFraction * ThreadLocalRandom.current().nextDouble()));
    }
}
