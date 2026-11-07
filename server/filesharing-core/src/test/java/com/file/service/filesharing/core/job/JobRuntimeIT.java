package com.file.service.filesharing.core.job;

import com.file.service.filesharing.core.entity.models.ProcessingJobEntity;
import com.file.service.filesharing.core.enums.ProcessingJobStatus;
import com.file.service.filesharing.core.enums.ProcessingJobType;
import com.file.service.filesharing.core.job.exception.PermanentJobException;
import com.file.service.filesharing.core.job.exception.TransientJobException;
import com.mongodb.ConnectionString;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import io.github.resilience4j.bulkhead.Bulkhead;
import io.github.resilience4j.bulkhead.BulkheadConfig;
import org.bson.Document;
import org.bson.types.ObjectId;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/** Chi chay tren database filesharing_it. Thieu IT_MONGO_URI thi fail, khong skip. */
class JobRuntimeIT {
    private static MongoClient client;
    private static MongoTemplate mongo;

    private JobRuntimeProperties props;
    private JobStore store;
    private WorkerIdentity identity;

    interface Behavior {
        void run(JobContext ctx) throws Exception;
    }

    static class FakeExecutor implements JobExecutor {
        volatile Behavior behavior = ctx -> { };

        public Set<ProcessingJobType> supportedTypes() { return Set.of(ProcessingJobType.TRANSCODE_IMAGE); }
        public InputMode inputMode() { return InputMode.STREAM; }
        public JobExecution process(JobContext ctx) throws PermanentJobException, TransientJobException {
            try {
                behavior.run(ctx);
            } catch (PermanentJobException | TransientJobException e) {
                throw e;
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
            return JobExecution.empty();
        }
    }

    @BeforeAll
    static void connect() {
        String uri = System.getenv("IT_MONGO_URI");
        assertNotNull(uri, "thieu bien moi truong IT_MONGO_URI");
        ConnectionString cs = new ConnectionString(uri);
        assertEquals("filesharing_it", cs.getDatabase(), "IT chi duoc chay tren database filesharing_it");
        client = MongoClients.create(cs);
        mongo = new MongoTemplate(client, cs.getDatabase());
    }

    @AfterAll
    static void close() {
        client.close();
    }

    @BeforeEach
    void setUp() {
        mongo.dropCollection("processing_jobs");
        props = new JobRuntimeProperties();
        props.setJobTypes(List.of(ProcessingJobType.TRANSCODE_IMAGE));
        props.setLeaseDuration(Duration.ofSeconds(3));
        props.setWorkspaceDir(System.getProperty("java.io.tmpdir") + "/job-it");
        store = new JobStore(mongo, props);
        identity = new WorkerIdentity();
    }

    private String insertJob(int maxRetries) {
        ProcessingJobEntity j = ProcessingJobEntity.builder()
                .jobId(new ObjectId().toHexString())
                .metadataId(new ObjectId().toHexString())
                .objectName("job-test/x.png")
                .jobType(ProcessingJobType.TRANSCODE_IMAGE)
                .status(ProcessingJobStatus.PENDING)
                .priority(0).retryCount(0).maxRetries(maxRetries)
                .dueAt(Instant.now().minusSeconds(1))
                .build();
        return mongo.insert(j).getJobId();
    }

    private ProcessingJobEntity get(String id) {
        return mongo.findById(id, ProcessingJobEntity.class);
    }

    private JobRuntime runtime(FakeExecutor ex) {
        return new JobRuntime(store, Mockito.mock(JobStorage.class), props, identity, List.of(ex));
    }

    @Test
    void claimIsExclusive() throws Exception {
        for (int i = 0; i < 20; i++) insertJob(3);
        List<String> claimed = Collections.synchronizedList(new ArrayList<>());
        ExecutorService pool = Executors.newFixedThreadPool(8);
        CountDownLatch go = new CountDownLatch(1);
        List<java.util.concurrent.Future<?>> fs = new ArrayList<>();
        for (int t = 0; t < 8; t++) {
            fs.add(pool.submit(() -> {
                go.await();
                ProcessingJobEntity j;
                while ((j = store.claimOne(props.getJobTypes(), "w")) != null) claimed.add(j.getJobId());
                return null;
            }));
        }
        go.countDown();
        for (var f : fs) f.get(30, TimeUnit.SECONDS);
        pool.shutdown();
        assertEquals(20, claimed.size());
        assertEquals(20, new java.util.HashSet<>(claimed).size());
    }

    @Test
    void legacyRowWithoutDueAtNotClaimed() {
        mongo.getCollection("processing_jobs").insertOne(new Document("_id", "legacy-1")
                .append("status", "PENDING").append("jobType", "TRANSCODE_IMAGE"));
        assertNull(store.claimOne(props.getJobTypes(), "w"));
    }

    @Test
    void transientRetriesWithBackoff() {
        String id = insertJob(3);
        FakeExecutor ex = new FakeExecutor();
        ex.behavior = ctx -> { throw new TransientJobException("minio chap chon"); };
        Instant before = Instant.now();
        runtime(ex).run(store.claimOne(props.getJobTypes(), "w"));
        ProcessingJobEntity j = get(id);
        assertEquals(ProcessingJobStatus.PENDING, j.getStatus());
        assertEquals(1, j.getRetryCount());
        long base = props.getBackoffBase().toMillis();
        long delay = Duration.between(before, j.getDueAt()).toMillis();
        assertTrue(delay >= 0.8 * 2 * base - 2000 && delay <= 1.2 * 2 * base + 2000, "delay=" + delay);
        assertEquals(1, j.getErrorHistory().size());
    }

    @Test
    void permanentGoesToDeadLetter() {
        String id = insertJob(3);
        FakeExecutor ex = new FakeExecutor();
        ex.behavior = ctx -> { throw new PermanentJobException("file hong"); };
        runtime(ex).run(store.claimOne(props.getJobTypes(), "w"));
        ProcessingJobEntity j = get(id);
        assertEquals(ProcessingJobStatus.DEAD_LETTER, j.getStatus());
        assertEquals(0, j.getRetryCount());
        assertEquals("file hong", j.getLastError());
        assertNull(j.getResultPublishedAt());
    }

    @Test
    void staleAttemptIsFenced() throws Exception {
        String id = insertJob(3);
        FakeExecutor ex = new FakeExecutor();
        CountDownLatch started = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        ex.behavior = ctx -> { started.countDown(); release.await(); };
        ProcessingJobEntity claimed = store.claimOne(props.getJobTypes(), "w");
        Thread t = new Thread(() -> runtime(ex).run(claimed));
        t.start();
        assertTrue(started.await(5, TimeUnit.SECONDS));
        String stolen = new ObjectId().toHexString();
        mongo.updateFirst(Query.query(Criteria.where("_id").is(id)), new Update().set("attemptId", stolen), ProcessingJobEntity.class);
        release.countDown();
        t.join(10_000);
        ProcessingJobEntity j = get(id);
        assertEquals(ProcessingJobStatus.PROCESSING, j.getStatus());
        assertEquals(stolen, j.getAttemptId());
        assertFalse(store.finalizeSucceeded(claimed, JobExecution.empty()));
    }

    @Test
    void reaperDeadLettersAfterMaxRetries() {
        String id = insertJob(3);
        LeaseReaper reaper = new LeaseReaper(store, props);
        for (int i = 0; i < 3; i++) {
            assertNotNull(store.claimOne(props.getJobTypes(), "w"), "claim lan " + i);
            mongo.updateFirst(Query.query(Criteria.where("_id").is(id)),
                    new Update().set("leaseUntil", Instant.now().minusSeconds(5)), ProcessingJobEntity.class);
            reaper.reapExpired();
        }
        ProcessingJobEntity j = get(id);
        assertEquals(ProcessingJobStatus.DEAD_LETTER, j.getStatus());
        assertEquals(3, j.getErrorHistory().size());
        assertTrue(j.getErrorHistory().stream().allMatch(e -> e.getKind().name().equals("LEASE_EXPIRED")));
        Document raw = mongo.getCollection("processing_jobs").find(new Document("_id", new ObjectId(id))).first();
        assertTrue(raw.containsKey("resultPublishedAt"));
        assertNull(raw.get("resultPublishedAt"));
    }

    @Test
    void relayClaimIsExclusiveAndSkipsLegacy() throws Exception {
        // 10 job COMPLETED chua publish (resultPublishedAt = null tuong minh)
        for (int i = 0; i < 10; i++) {
            mongo.getCollection("processing_jobs").insertOne(new Document("_id", new ObjectId())
                    .append("status", "COMPLETED").append("jobType", "TRANSCODE_IMAGE").append("resultPublishedAt", null));
        }
        // 5 job cu: khong co field resultPublishedAt
        for (int i = 0; i < 5; i++) {
            mongo.getCollection("processing_jobs").insertOne(new Document("_id", new ObjectId())
                    .append("status", "COMPLETED").append("jobType", "TRANSCODE_IMAGE"));
        }
        List<String> claimed = Collections.synchronizedList(new ArrayList<>());
        ExecutorService pool = Executors.newFixedThreadPool(2);
        List<java.util.concurrent.Future<?>> fs = new ArrayList<>();
        for (int t = 0; t < 2; t++) {
            fs.add(pool.submit(() -> {
                ProcessingJobEntity j;
                while ((j = store.claimUnpublishedResult(props.getJobTypes(), Duration.ofSeconds(30))) != null) {
                    claimed.add(j.getJobId());
                }
                return null;
            }));
        }
        for (var f : fs) f.get(30, TimeUnit.SECONDS);
        pool.shutdown();
        assertEquals(10, claimed.size());
        assertEquals(10, new java.util.HashSet<>(claimed).size());
        // da claim (co lease) thi chua duoc claim lai; danh dau publish xong thi het hang
        assertNull(store.claimUnpublishedResult(props.getJobTypes(), Duration.ofSeconds(30)));
        store.markResultPublished(claimed.get(0));
        assertNotNull(get(claimed.get(0)).getResultPublishedAt());
    }

    @Test
    void bulkheadPermitsReturnAfterFailures() throws Exception {
        for (int i = 0; i < 10; i++) insertJob(3);
        Bulkhead bulkhead = Bulkhead.of("it", BulkheadConfig.custom().maxConcurrentCalls(2).build());
        FakeExecutor ex = new FakeExecutor();
        AtomicInteger n = new AtomicInteger();
        ex.behavior = ctx -> {
            switch (n.getAndIncrement() % 3) {
                case 0 -> throw new IllegalStateException("bug");
                case 1 -> throw new TransientJobException("tam thoi");
                default -> throw new PermanentJobException("vinh vien");
            }
        };
        JobDispatcher d = new JobDispatcher(bulkhead, store, runtime(ex), props, identity);
        long end = System.currentTimeMillis() + 30_000;
        while (System.currentTimeMillis() < end) {
            d.tick();
            long open = mongo.count(Query.query(new Criteria().orOperator(
                    Criteria.where("status").is(ProcessingJobStatus.PROCESSING),
                    Criteria.where("status").is(ProcessingJobStatus.PENDING).and("dueAt").lte(Instant.now()))),
                    ProcessingJobEntity.class);
            if (open == 0) break;
            Thread.sleep(100);
        }
        long until = System.currentTimeMillis() + 5000;
        while (bulkhead.getMetrics().getAvailableConcurrentCalls() != 2 && System.currentTimeMillis() < until) Thread.sleep(50);
        assertEquals(2, bulkhead.getMetrics().getAvailableConcurrentCalls());
        assertEquals(10, n.get());
    }
}
