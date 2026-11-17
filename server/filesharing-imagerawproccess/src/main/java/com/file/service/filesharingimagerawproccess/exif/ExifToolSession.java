package com.file.service.filesharingimagerawproccess.exif;

import com.file.service.filesharing.core.job.exception.PermanentJobException;
import com.file.service.filesharing.core.job.exception.TransientJobException;
import com.file.service.filesharing.core.job.tool.Redactor;
import com.file.service.filesharing.core.job.tool.TailBuffer;
import com.file.service.filesharing.core.job.tool.ToolResult;
import com.file.service.filesharing.core.job.tool.ToolRunner;
import lombok.extern.slf4j.Slf4j;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.BooleanSupplier;

/**
 * Mot tien trinh exiftool -stay_open True -@ - dung chung cho moi job RAW; lenh chay tuan tu duoi 1 khoa.
 * Khong dang ky fencing cua job (job A mat lease khong duoc huy lenh cua job B). 4 bat bien:
 * 1. timeout cua lenh chi tinh tu luc da giu khoa;
 * 2. chi job dang giu khoa duoc huy/mo lai phien;
 * 3. chi nha khoa khi da doc toi {ready<n>} cua lenh minh, hoac phien da bi huy;
 * 4. cho khoa co gioi han, job da mat lease thi thoi cho.
 */
@Slf4j
public class ExifToolSession implements AutoCloseable {
    public static final String TOOL = "exiftool(shared)";
    private static final Object EOF = new Object();
    private static final Redactor RED = new Redactor(List.of());

    public record Result(ToolResult tool, String stdout) {
    }

    private final List<String> launch;
    // doi duoc luc chay (raw.command-timeout, raw.lock-wait); executor dat lai o dau moi job
    private volatile Duration commandTimeout;
    private volatile Duration lockWait;
    private final ReentrantLock lock = new ReentrantLock(true);

    // chi doc/ghi khi dang giu khoa
    private Process proc;
    private Writer stdin;
    private BlockingQueue<Object> out;
    private BlockingQueue<Object> err;
    private int seq;
    private String pendingErrMarker;

    /** launch: lenh goc (duong dan exiftool), phien them -stay_open True -@ -. */
    public ExifToolSession(List<String> launch, Duration commandTimeout, Duration lockWait) {
        this.launch = List.copyOf(launch);
        this.commandTimeout = commandTimeout;
        this.lockWait = lockWait;
    }

    public void setTimeouts(Duration commandTimeout, Duration lockWait) {
        this.commandTimeout = commandTimeout;
        this.lockWait = lockWait;
    }

    public Result execute(BooleanSupplier leaseLost, List<String> args) throws PermanentJobException, TransientJobException {
        // Luoi thu hai sau khi runtime da doi ten file: moi dong stdin la 1 argument
        for (String a : args) {
            if (a.indexOf('\n') >= 0 || a.indexOf('\r') >= 0) {
                throw new PermanentJobException("exiftool: argument co ky tu xuong dong");
            }
        }
        acquire(leaseLost);
        try {
            return run(args);
        } finally {
            lock.unlock();
        }
    }

    private void acquire(BooleanSupplier leaseLost) throws TransientJobException {
        long deadline = System.nanoTime() + lockWait.toNanos();
        try {
            while (true) {
                if (leaseLost.getAsBoolean()) throw new TransientJobException("exiftool: mat lease khi cho phien");
                if (System.nanoTime() - deadline > 0) {
                    throw new TransientJobException("exiftool: cho phien qua " + lockWait.toSeconds() + "s");
                }
                if (lock.tryLock(1, TimeUnit.SECONDS)) return;
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new TransientJobException("exiftool: bi ngat khi cho phien");
        }
    }

    private Result run(List<String> args) throws TransientJobException {
        long t0 = System.nanoTime();
        TailBuffer tail = new TailBuffer(40);
        try {
            ensureStarted();
            drainStaleStderr();
            int n = ++seq;
            String marker = "{ready" + n + "}";
            StringBuilder cmd = new StringBuilder();
            for (String a : args) cmd.append(a).append('\n');
            cmd.append("-charset\nfilename=utf8\n-echo4\n").append(marker).append("\n-execute").append(n).append('\n');
            stdin.write(cmd.toString());
            stdin.flush();

            // Bat bien 1: dong ho cua lenh chi bat dau khi da giu khoa
            long deadline = t0 + commandTimeout.toNanos();
            StringBuilder stdout = new StringBuilder();
            while (true) {
                Object o = out.poll(remaining(deadline), TimeUnit.NANOSECONDS);
                if (o == null) return fail(tail, t0, true, "exiftool: timeout " + commandTimeout.toSeconds() + "s");
                if (o == EOF) return fail(tail, t0, false, "exiftool: phien bi dong giua chung");
                String line = (String) o;
                if (line.equals(marker)) break;
                stdout.append(line).append('\n');
            }
            // stderr cua lenh nay ket thuc bang marker (-echo4); cho ngan, khong kip thi lenh sau bo phan con lai
            pendingErrMarker = marker;
            long errDeadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(2);
            while (pendingErrMarker != null) {
                Object o = err.poll(remaining(errDeadline), TimeUnit.NANOSECONDS);
                if (o == null || o == EOF) break;
                String line = (String) o;
                if (line.equals(marker)) pendingErrMarker = null;
                else tail.add(line);
            }
            long wall = (System.nanoTime() - t0) / 1_000_000;
            return new Result(new ToolResult(TOOL, 0, false, false, wall, null, tail.lines()), stdout.toString());
        } catch (IOException e) {
            kill();
            throw new TransientJobException("exiftool: loi I/O voi phien: " + e.getMessage(), e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            kill();
            throw new TransientJobException("exiftool: bi ngat giua lenh");
        }
    }

    private static long remaining(long deadline) {
        return Math.max(0, deadline - System.nanoTime());
    }

    // Bat bien 2 va 3: nguoi dang giu khoa huy phien roi moi nha khoa
    private Result fail(TailBuffer tail, long t0, boolean timedOut, String message) throws TransientJobException {
        kill();
        ToolResult r = new ToolResult(TOOL, -1, timedOut, true, (System.nanoTime() - t0) / 1_000_000, null, tail.lines());
        throw new TransientJobException(message, r.detail());
    }

    private void drainStaleStderr() throws InterruptedException {
        if (pendingErrMarker == null) return;
        long deadline = System.nanoTime() + TimeUnit.MILLISECONDS.toNanos(500);
        while (pendingErrMarker != null) {
            Object o = err.poll(remaining(deadline), TimeUnit.NANOSECONDS);
            if (o == null || o == EOF || pendingErrMarker.equals(o)) pendingErrMarker = null;
        }
    }

    private void ensureStarted() throws IOException {
        if (proc != null && proc.isAlive()) return;
        kill();
        List<String> cmd = new ArrayList<>(launch);
        cmd.addAll(List.of("-stay_open", "True", "-@", "-"));
        proc = ToolRunner.builder(cmd, Map.of(), null).start();
        // UTF-8 khong BOM: BOM lam argument dau thanh "﻿-..." (W0 muc 8)
        stdin = new OutputStreamWriter(proc.getOutputStream(), StandardCharsets.UTF_8);
        out = new LinkedBlockingQueue<>();
        err = new LinkedBlockingQueue<>();
        pendingErrMarker = null;
        pump(proc.getInputStream(), out, "out");
        pump(proc.getErrorStream(), err, "err");
        log.info("exiftool session start pid={}", proc.pid());
    }

    private static void pump(InputStream in, BlockingQueue<Object> q, String name) {
        Thread.ofVirtual().name("exiftool-" + name).start(() -> {
            try (BufferedReader r = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
                String line;
                while ((line = r.readLine()) != null) {
                    String s = RED.apply(line.length() > 8192 ? line.substring(0, 8192) : line);
                    q.add(s);
                }
            } catch (IOException e) {
                // phien bi huy
            } finally {
                q.add(EOF);
            }
        });
    }

    private void kill() {
        if (proc != null) {
            log.warn("exiftool session huy pid={}", proc.pid());
            if (proc.isAlive()) ToolRunner.killTree(proc.toHandle());
            try {
                proc.waitFor(5, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        }
        proc = null;
        stdin = null;
    }

    // PID phien hien tai (test va log)
    public long pid() {
        lock.lock();
        try {
            return proc == null ? -1 : proc.pid();
        } finally {
            lock.unlock();
        }
    }

    @Override
    public void close() {
        lock.lock();
        try {
            if (proc != null && proc.isAlive() && stdin != null) {
                try {
                    stdin.write("-stay_open\nFalse\n");
                    stdin.flush();
                    proc.waitFor(5, TimeUnit.SECONDS);
                } catch (IOException | InterruptedException e) {
                    // huy cung ben duoi
                }
            }
            kill();
        } finally {
            lock.unlock();
        }
    }
}
