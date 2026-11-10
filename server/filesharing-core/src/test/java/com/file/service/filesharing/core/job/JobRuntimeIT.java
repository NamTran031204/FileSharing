package com.file.service.filesharing.core.job;

import com.file.service.filesharing.core.entity.models.ProcessingJobEntity;
import com.file.service.filesharing.core.enums.ProcessingJobStatus;
import com.file.service.filesharing.core.enums.ProcessingJobType;
import com.file.service.filesharing.core.job.exception.PermanentJobException;
import com.file.service.filesharing.core.job.exception.TransientJobException;
import com.file.service.filesharing.core.entity.models.processing.JobErrorEntry;
import com.file.service.filesharing.core.job.tool.ChildProcessMain;
import com.file.service.filesharing.core.job.tool.LineParser;
import com.file.service.filesharing.core.job.tool.ToolCommand;
import com.file.service.filesharing.core.job.tool.ToolResult;
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
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.file.service.filesharing.core.entity.models.processing.JobResourceUsage;
import com.file.service.filesharing.core.entity.models.processing.ProcessingJobProgress;
import com.mongodb.MongoClientSettings;
import com.mongodb.event.CommandListener;
import com.mongodb.event.CommandStartedEvent;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.LongConsumer;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
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
        volatile InputMode mode = InputMode.STREAM;

        public Set<ProcessingJobType> supportedTypes() { return Set.of(ProcessingJobType.TRANSCODE_IMAGE); }
        public InputMode inputMode() { return mode; }
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
    void setUp() throws Exception {
        storage = stubStorage();
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

    private JobStorage storage;

    // Storage gia: input 100 byte, download tra 100 byte, upload tra 42 byte
    private JobStorage stubStorage() throws Exception {
        JobStorage st = Mockito.mock(JobStorage.class);
        Mockito.when(st.stat(Mockito.any(), Mockito.any())).thenReturn(100L);
        Mockito.when(st.download(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.anyLong(), Mockito.any(), Mockito.any()))
                .thenReturn(100L);
        Mockito.when(st.uploadAll(Mockito.any(), Mockito.anyInt(), Mockito.any(), Mockito.any())).thenReturn(42L);
        return st;
    }

    private JobRuntime runtime(FakeExecutor ex) {
        return new JobRuntime(store, storage, props, identity, List.of(ex));
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

    @Test
    void transientDetailOnlyInHistory() {
        String id = insertJob(3);
        FakeExecutor ex = new FakeExecutor();
        ex.behavior = ctx -> {
            ToolResult r = ctx.exec(new ToolCommand("child", ChildProcessMain.cmd("lines", "3", "100"),
                    Duration.ofSeconds(30), List.of(), Map.of(), null));
            throw new TransientJobException(r.brief(), r.detail());
        };
        runtime(ex).run(store.claimOne(props.getJobTypes(), "w"));
        ProcessingJobEntity j = get(id);
        assertEquals("child: exit 3", j.getLastError());
        JobErrorEntry e = j.getErrorHistory().get(0);
        assertEquals("child: exit 3", e.getMessage());
        assertFalse(e.getMessage().contains("LINE-"));
        assertTrue(e.getDetail().length() <= 1500, "len=" + e.getDetail().length());
        assertTrue(e.getDetail().contains("LINE-100"), e.getDetail());
        assertFalse(e.getDetail().contains("LINE-061"));
    }

    @Test
    void leaseLostKillsToolTree() throws Exception {
        String id = insertJob(3);
        List<Long> pids = Collections.synchronizedList(new ArrayList<>());
        Pattern pidLine = Pattern.compile("child=(\\d+) grandchild=(\\d+)");
        LineParser catcher = (stderr, line) -> {
            Matcher m = pidLine.matcher(line);
            if (m.find()) {
                pids.add(Long.parseLong(m.group(1)));
                pids.add(Long.parseLong(m.group(2)));
            }
        };
        FakeExecutor ex = new FakeExecutor();
        ex.behavior = ctx -> {
            ToolResult r = ctx.exec(new ToolCommand("child", ChildProcessMain.cmd("spawn-grandchild", "60000"),
                    Duration.ofSeconds(120), List.of(), Map.of(), catcher));
            throw new TransientJobException(r.brief());
        };
        ProcessingJobEntity claimed = store.claimOne(props.getJobTypes(), "w");
        Thread t = new Thread(() -> runtime(ex).run(claimed));
        t.start();
        long until = System.currentTimeMillis() + 15_000;
        while (pids.size() < 2 && System.currentTimeMillis() < until) Thread.sleep(50);
        assertEquals(2, pids.size(), "khong bat duoc PID con/chau");

        String stolen = new ObjectId().toHexString();
        mongo.updateFirst(Query.query(Criteria.where("_id").is(id)), new Update().set("attemptId", stolen), ProcessingJobEntity.class);
        // lease 3s -> heartbeat moi 1s; fence tra 0 ban ghi -> markLost -> huy ca cay
        until = System.currentTimeMillis() + 5_000;
        while (System.currentTimeMillis() < until && pids.stream().anyMatch(p -> ProcessHandle.of(p).map(ProcessHandle::isAlive).orElse(false))) {
            Thread.sleep(100);
        }
        assertTrue(pids.stream().noneMatch(p -> ProcessHandle.of(p).map(ProcessHandle::isAlive).orElse(false)), "cay tien trinh con song");
        t.join(10_000);
        assertFalse(t.isAlive());
        ProcessingJobEntity j = get(id);
        assertEquals(ProcessingJobStatus.PROCESSING, j.getStatus());
        assertEquals(stolen, j.getAttemptId());
        assertTrue(j.getErrorHistory() == null || j.getErrorHistory().isEmpty());
    }

    private static final ToolCommand EXIT0 = new ToolCommand("child", ChildProcessMain.cmd("exit", "0"),
            Duration.ofSeconds(30), List.of(), Map.of(), null);

    // 3 job lan luot: thanh cong, transient, permanent. Tra ve {jobId, attemptId}
    private List<String[]> runThreeOutcomes() {
        FakeExecutor ex = new FakeExecutor();
        ex.mode = InputMode.DOWNLOAD;
        List<Behavior> behaviors = List.of(
                ctx -> ctx.exec(EXIT0),
                ctx -> { ctx.exec(EXIT0); throw new TransientJobException("tam thoi"); },
                ctx -> { ctx.exec(EXIT0); throw new PermanentJobException("vinh vien"); });
        List<String[]> ids = new ArrayList<>();
        for (Behavior b : behaviors) {
            insertJob(3);
            ex.behavior = b;
            ProcessingJobEntity claimed = store.claimOne(props.getJobTypes(), "w");
            runtime(ex).run(claimed);
            ids.add(new String[]{claimed.getJobId(), claimed.getAttemptId()});
        }
        return ids;
    }

    @Test
    void resourceUsageOnEveryOutcome() {
        List<String[]> ids = runThreeOutcomes();
        for (int i = 0; i < 3; i++) {
            JobResourceUsage u = get(ids.get(i)[0]).getResourceUsage();
            assertNotNull(u, "job " + i);
            assertEquals(ids.get(i)[1], u.getAttemptId());
            assertTrue(u.getStages().containsKey("fetch"), u.getStages().toString());
            assertEquals(100L, u.getBytesIn());
            assertEquals(1, u.getToolRuns().size());
            assertEquals("child", u.getToolRuns().get(0).getTool());
            assertEquals(0, u.getToolRuns().get(0).getExitCode());
            assertTrue(u.getWallSeconds() > 0);
        }
        JobResourceUsage ok = get(ids.get(0)[0]).getResourceUsage();
        assertTrue(ok.getStages().containsKey("upload"));
        assertEquals(42L, ok.getBytesOut());
        assertEquals(ProcessingJobStatus.PENDING, get(ids.get(1)[0]).getStatus());
        assertEquals(ProcessingJobStatus.DEAD_LETTER, get(ids.get(2)[0]).getStatus());
    }

    @Test
    void metricsLogLineOnce() {
        Logger logger = (Logger) LoggerFactory.getLogger(JobRuntime.class);
        ListAppender<ILoggingEvent> logs = new ListAppender<>();
        logs.start();
        logger.addAppender(logs);
        try {
            List<String[]> ids = runThreeOutcomes();
            String[] outcomes = {"success", "retry", "dead_letter"};
            for (int i = 0; i < 3; i++) {
                String prefix = "job-metrics job=" + ids.get(i)[0] + " ";
                List<String> lines = logs.list.stream().map(ILoggingEvent::getFormattedMessage)
                        .filter(m -> m.startsWith(prefix)).toList();
                assertEquals(1, lines.size(), lines.toString());
                assertTrue(lines.get(0).contains("outcome=" + outcomes[i]), lines.get(0));
                assertTrue(lines.get(0).contains("tools=child:0:"), lines.get(0));
            }
        } finally {
            logger.detachAppender(logs);
        }
    }

    @Test
    void writesPerAttempt() throws Exception {
        // Dem moi lenh ghi tren processing_jobs o tang driver; so heartbeat dem rieng bang JobStore con
        List<String> writes = Collections.synchronizedList(new ArrayList<>());
        CommandListener listener = new CommandListener() {
            @Override
            public void commandStarted(CommandStartedEvent e) {
                String n = e.getCommandName();
                if (List.of("insert", "update", "delete", "findAndModify").contains(n)
                        && "processing_jobs".equals(e.getCommand().getString(n).getValue())) {
                    writes.add(n);
                }
            }
        };
        ConnectionString cs = new ConnectionString(System.getenv("IT_MONGO_URI"));
        try (MongoClient c2 = MongoClients.create(MongoClientSettings.builder()
                .applyConnectionString(cs).addCommandListener(listener).build())) {
            AtomicInteger hbCalls = new AtomicInteger();
            JobStore store2 = new JobStore(new MongoTemplate(c2, cs.getDatabase()), props) {
                @Override
                public boolean heartbeat(String id, String attemptId, Integer percent, String step, Long etaMs) {
                    hbCalls.incrementAndGet();
                    return super.heartbeat(id, attemptId, percent, step, etaMs);
                }
            };
            insertJob(3);
            FakeExecutor ex = new FakeExecutor();
            ex.behavior = ctx -> Thread.sleep(2500);
            long t0 = System.currentTimeMillis();
            new JobRuntime(store2, storage, props, identity, List.of(ex)).run(store2.claimOne(props.getJobTypes(), "w"));
            long elapsed = System.currentTimeMillis() - t0;
            long interval = props.getLeaseDuration().toMillis() / 3;
            assertEquals(1, writes.stream().filter("findAndModify"::equals).count(), "claim: " + writes);
            assertEquals(hbCalls.get() + 1, writes.stream().filter("update"::equals).count(), "heartbeat + finalize: " + writes);
            assertEquals(0, writes.stream().filter(w -> w.equals("insert") || w.equals("delete")).count(), writes.toString());
            assertTrue(hbCalls.get() >= 1 && hbCalls.get() <= elapsed / interval + 1, "heartbeat=" + hbCalls + " elapsed=" + elapsed);
        }
    }

    @Test
    void progressMonotoneAndEtaCleared() {
        String id = insertJob(3);
        AtomicReference<ProcessingJobProgress> seen = new AtomicReference<>();
        FakeExecutor ex = new FakeExecutor();
        ex.behavior = ctx -> {
            try (JobContext.Stage st = ctx.stage("process", 10, 90)) {
                ctx.progress(0.5, "half");
                ctx.reportProgress(20, "lower");
                ctx.progress(2.0, "tran");
                ctx.eta(Duration.ofSeconds(40));
                Thread.sleep(1500);
                seen.set(store.findById(ctx.job().getJobId()).getProgress());
            }
        };
        runtime(ex).run(store.claimOne(props.getJobTypes(), "w"));
        ProcessingJobProgress mid = seen.get();
        assertNotNull(mid);
        // 10 + 80 * 1.0 = 90: khong giam sau reportProgress(20), khong vuot 99
        assertEquals(90, mid.getPercent());
        assertEquals(40_000L, mid.getEstimatedTimeRemainingMs());
        ProcessingJobProgress end = get(id).getProgress();
        assertEquals(100, end.getPercent());
        assertNull(end.getEstimatedTimeRemainingMs());
    }

    @Test
    void inputMissingOrEmptyIsPermanent() throws Exception {
        Mockito.when(storage.stat(Mockito.any(), Mockito.any()))
                .thenThrow(new PermanentJobException("khong tim thay file input trong MinIO"))
                .thenReturn(0L);
        AtomicInteger calls = new AtomicInteger();
        FakeExecutor ex = new FakeExecutor();
        ex.behavior = ctx -> calls.incrementAndGet();
        String missing = insertJob(3);
        runtime(ex).run(store.claimOne(props.getJobTypes(), "w"));
        String empty = insertJob(3);
        runtime(ex).run(store.claimOne(props.getJobTypes(), "w"));
        for (String id : List.of(missing, empty)) {
            ProcessingJobEntity j = get(id);
            assertEquals(ProcessingJobStatus.DEAD_LETTER, j.getStatus());
            assertEquals(0, j.getRetryCount());
        }
        assertTrue(get(missing).getLastError().contains("khong tim thay"));
        assertTrue(get(empty).getLastError().contains("0 byte"));
        assertEquals(0, calls.get());
    }

    @Test
    void fetchReportsStep() throws Exception {
        long size = 100L * 1024 * 1024;
        Mockito.when(storage.stat(Mockito.any(), Mockito.any())).thenReturn(size);
        AtomicReference<String> step = new AtomicReference<>();
        AtomicReference<Integer> pct = new AtomicReference<>();
        String id = insertJob(3);
        Mockito.when(storage.download(Mockito.any(), Mockito.any(), Mockito.any(), Mockito.anyLong(), Mockito.any(), Mockito.any()))
                .thenAnswer(inv -> {
                    LongConsumer cb = inv.getArgument(4);
                    cb.accept(size / 2);
                    Thread.sleep(1500);
                    ProcessingJobProgress p = store.findById(id).getProgress();
                    step.set(p.getCurrentStep());
                    pct.set(p.getPercent());
                    return size;
                });
        FakeExecutor ex = new FakeExecutor();
        ex.mode = InputMode.DOWNLOAD;
        runtime(ex).run(store.claimOne(props.getJobTypes(), "w"));
        assertNotNull(step.get());
        assertTrue(step.get().matches("FETCH \\d+/\\d+ MB"), step.get());
        assertEquals("FETCH 50/100 MB", step.get());
        assertEquals(15, pct.get());
    }
}
