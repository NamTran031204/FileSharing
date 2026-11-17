package com.file.service.filesharing.core.node;

import com.file.service.filesharing.core.entity.models.WorkerNodeEntity;
import com.sun.management.OperatingSystemMXBean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.DisposableBean;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;

import java.lang.management.ManagementFactory;
import java.net.InetAddress;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;

/**
 * Moi nhip upsert 1 doc worker_nodes (CPU may/JVM/tien trinh con, heap, RAM, o tam, slot bulkhead)
 * va doc lai co draining. Dung luong rieng thay vi @Scheduled vi notification khong bat scheduling.
 * Loi chi log.warn, khong bao gio lam hong service.
 */
public class NodeHeartbeat implements InitializingBean, DisposableBean {

    private static final Logger log = LoggerFactory.getLogger(NodeHeartbeat.class);
    static final int MAX_SAMPLES = 120;

    private final MongoTemplate mongo;
    private final NodeControl control;
    private final String nodeId;
    private final String service;
    private final String kind;
    private final Duration every;
    private final Supplier<WorkerNodeEntity.Worker> worker;
    private final Instant startedAt = Instant.now();
    private final int cores = Runtime.getRuntime().availableProcessors();

    private ScheduledExecutorService scheduler;
    private long lastChildNanos;
    private long lastWallNanos;

    public NodeHeartbeat(MongoTemplate mongo, NodeControl control, String nodeId, String service, String kind,
                         Duration every, Supplier<WorkerNodeEntity.Worker> worker) {
        this.mongo = mongo;
        this.control = control;
        this.nodeId = nodeId;
        this.service = service;
        this.kind = kind;
        this.every = every;
        this.worker = worker;
    }

    @Override
    public void afterPropertiesSet() {
        scheduler = Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "node-heartbeat");
            t.setDaemon(true);
            return t;
        });
        scheduler.scheduleWithFixedDelay(this::beat, 0, every.toMillis(), TimeUnit.MILLISECONDS);
    }

    @Override
    public void destroy() {
        if (scheduler != null) scheduler.shutdownNow();
    }

    public void beat() {
        try {
            doBeat();
        } catch (Throwable e) {
            log.warn("node heartbeat loi: {}", e.getClass().getSimpleName());
        }
    }

    private void doBeat() throws Exception {
        Instant now = Instant.now();
        OperatingSystemMXBean os = (OperatingSystemMXBean) ManagementFactory.getOperatingSystemMXBean();
        Runtime rt = Runtime.getRuntime();
        double sys = clamp(os.getCpuLoad());
        double proc = clamp(os.getProcessCpuLoad());
        Double children = childrenCpu();
        long heapUsed = rt.totalMemory() - rt.freeMemory();

        WorkerNodeEntity.Cpu cpu = new WorkerNodeEntity.Cpu(sys, proc, children);
        WorkerNodeEntity.Memory mem = new WorkerNodeEntity.Memory(heapUsed, rt.maxMemory(),
                os.getTotalMemorySize(), os.getFreeMemorySize());
        long free = Files.getFileStore(Path.of(System.getProperty("java.io.tmpdir"))).getUsableSpace();
        WorkerNodeEntity.Sample sample = new WorkerNodeEntity.Sample(now, sys, proc, children, heapUsed);

        Update u = new Update()
                .set("service", service).set("kind", kind).set("host", host())
                .set("pid", ProcessHandle.current().pid()).set("cores", cores)
                .set("lastSeenAt", now).set("cpu", cpu).set("memory", mem).set("workspaceFreeBytes", free)
                .set("worker", worker == null ? null : worker.get())
                // khong set draining: upsert khong duoc de len co do SA dat
                .setOnInsert("startedAt", startedAt).setOnInsert("draining", false);
        u.push("samples").slice(-MAX_SAMPLES).each(List.of(sample));
        WorkerNodeEntity doc = mongo.findAndModify(Query.query(Criteria.where("_id").is(nodeId)), u,
                FindAndModifyOptions.options().upsert(true).returnNew(true), WorkerNodeEntity.class);
        control.setDraining(doc != null && Boolean.TRUE.equals(doc.getDraining()));
    }

    /**
     * CPU tien trinh con (ffmpeg/vips/exiftool) khong nam trong getProcessCpuLoad: lay delta CPU time cua
     * cac descendants giua 2 nhip chia (wall * cores). Khong co con hoac OS khong tra CPU time thi null.
     * ponytail: tien trinh con ket thuc giua 2 nhip lam mat phan CPU cuoi, delta am kep ve 0.
     */
    private Double childrenCpu() {
        long wall = System.nanoTime();
        long total = 0;
        boolean any = false;
        try {
            for (ProcessHandle h : (Iterable<ProcessHandle>) ProcessHandle.current().descendants()::iterator) {
                var d = h.info().totalCpuDuration();
                if (d.isPresent()) {
                    any = true;
                    total += d.get().toNanos();
                }
            }
        } catch (RuntimeException e) {
            any = false;
        }
        long prevWall = lastWallNanos;
        long prevChild = lastChildNanos;
        lastWallNanos = wall;
        lastChildNanos = total;
        if (!any) return null;
        if (prevWall == 0 || wall <= prevWall) return 0.0;
        return clamp(Math.max(0, total - prevChild) / (double) ((wall - prevWall) * cores));
    }

    private static double clamp(double v) {
        // getCpuLoad tra am khi chua do duoc
        return Double.isNaN(v) || v < 0 ? 0 : Math.min(1, v);
    }

    private static String host() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            return "unknown";
        }
    }
}
