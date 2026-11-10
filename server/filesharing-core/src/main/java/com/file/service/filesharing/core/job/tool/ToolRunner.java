package com.file.service.filesharing.core.job.tool;

import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.Duration;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

/**
 * Diem nghen duy nhat de chay cong cu ngoai cho moi worker. Khong phai Spring bean, khong biet ten cong cu nao.
 * - Moi truong tien trinh con chi gom ENV_WHITELIST + env cua lenh: credential cua JVM khong lot xuong cong cu.
 * - stdout/stderr luon doc toi EOF, moi dong da che bi mat truoc khi vao parser, duoi log va log DEBUG.
 * - Qua timeout, bi interrupt, hoac ket thuc ma tien trinh con song: huy ca cay tien trinh.
 * Cho cam sampler RSS (P1-03.c): vong waitFor ben duoi, noi duy nhat biet PID.
 */
@Slf4j
public final class ToolRunner {
    public static final List<String> ENV_WHITELIST =
            List.of("PATH", "PATHEXT", "SystemRoot", "SystemDrive", "windir", "TEMP", "TMP", "LANG", "LC_ALL");
    static final int MAX_LINE = 8192;
    static final int TAIL_LINES = 40;

    private ToolRunner() {
    }

    // Noi duy nhat tao ProcessBuilder trong du an (ca ExifToolSession cung goi ham nay)
    public static ProcessBuilder builder(List<String> args, Map<String, String> env, Path workDir) {
        ProcessBuilder pb = new ProcessBuilder(args);
        if (workDir != null) pb.directory(workDir.toFile());
        Map<String, String> keep = new LinkedHashMap<>();
        for (String k : ENV_WHITELIST) {
            String v = System.getenv(k);
            if (v != null) keep.put(k, v);
        }
        Map<String, String> e = pb.environment();
        e.clear();
        e.putAll(keep);
        if (env != null) e.putAll(env);
        return pb;
    }

    public static ToolResult run(ToolCommand c, Path workDir, Consumer<Process> onStart, String jobId, String attemptId)
            throws IOException, InterruptedException {
        Redactor red = new Redactor(c.secrets());
        TailBuffer tail = new TailBuffer(TAIL_LINES);
        Object lock = new Object();
        long t0 = System.nanoTime();
        Process p = builder(c.args(), c.env(), workDir).start();
        log.info("tool-start job={} attempt={} tool={} pid={} cmd={}",
                jobId, attemptId, c.tool(), p.pid(), red.apply(String.join(" ", c.args())));
        Thread out = null;
        Thread err = null;
        Long cpuMs = null;
        boolean timedOut = false;
        boolean killed = false;
        Set<ProcessHandle> seen = new HashSet<>();
        try {
            p.getOutputStream().close();
            onStart.accept(p);
            out = pump(p.getInputStream(), false, c, red, tail, lock);
            err = pump(p.getErrorStream(), true, c, red, tail, lock);
            long deadline = t0 + c.timeout().toNanos();
            while (!p.waitFor(1, TimeUnit.SECONDS)) {
                // CPU chi doc duoc khi tien trinh con song, nen thieu toi da ~1s cuoi
                cpuMs = p.info().totalCpuDuration().map(Duration::toMillis).orElse(cpuMs);
                p.descendants().forEach(seen::add);
                if (System.nanoTime() - deadline > 0) {
                    timedOut = true;
                    break;
                }
            }
        } finally {
            if (p.isAlive()) {
                p.descendants().forEach(seen::add);
                killTree(p.toHandle());
                killed = true;
            }
            // tien trinh chau con song sau khi con da thoat
            seen.stream().filter(ProcessHandle::isAlive).forEach(ProcessHandle::destroyForcibly);
            awaitQuietly(p, out, err);
            int exit = p.isAlive() ? -1 : p.exitValue();
            log.info("tool-end job={} attempt={} tool={} exit={} timedOut={} killed={} wallMs={} cpuMs={}",
                    jobId, attemptId, c.tool(), exit, timedOut, killed, (System.nanoTime() - t0) / 1_000_000, cpuMs);
        }
        int exit = timedOut ? -1 : p.exitValue();
        return new ToolResult(c.tool(), exit, timedOut, killed, (System.nanoTime() - t0) / 1_000_000, cpuMs, tail.lines());
    }

    public static void killTree(ProcessHandle h) {
        h.descendants().forEach(ProcessHandle::destroyForcibly);
        h.destroyForcibly();
    }

    private static void awaitQuietly(Process p, Thread out, Thread err) {
        try {
            p.waitFor(5, TimeUnit.SECONDS);
            if (out != null) out.join(5000);
            if (err != null) err.join(5000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private static Thread pump(InputStream in, boolean stderr, ToolCommand c, Redactor red, TailBuffer tail, Object lock) {
        return Thread.ofVirtual().name("tool-" + c.tool() + (stderr ? "-err" : "-out")).start(() -> {
            try (Reader r = new InputStreamReader(in, StandardCharsets.UTF_8)) {
                char[] buf = new char[8192];
                StringBuilder line = new StringBuilder();
                int n;
                while ((n = r.read(buf)) != -1) {
                    for (int i = 0; i < n; i++) {
                        char ch = buf[i];
                        if (ch == '\n') {
                            emit(line, stderr, c, red, tail, lock);
                            line.setLength(0);
                        } else if (line.length() < MAX_LINE) {
                            // vuot MAX_LINE: bo phan con lai cua dong
                            line.append(ch);
                        }
                    }
                }
                if (!line.isEmpty()) emit(line, stderr, c, red, tail, lock);
            } catch (IOException e) {
                // pipe dong khi tien trinh bi huy
            }
        });
    }

    private static void emit(StringBuilder raw, boolean stderr, ToolCommand c, Redactor red, TailBuffer tail, Object lock) {
        int len = raw.length();
        if (len > 0 && raw.charAt(len - 1) == '\r') len--;
        String line = red.apply(raw.substring(0, len));
        synchronized (lock) {
            if (stderr) tail.add(line);
            if (c.parser() != null) {
                try {
                    c.parser().onLine(stderr, line);
                } catch (RuntimeException e) {
                    // parser loi o 1 dong: bo dong do, van doc tiep de pipe khong day
                }
            }
        }
        log.debug("{} {}: {}", c.tool(), stderr ? "err" : "out", line);
    }
}
