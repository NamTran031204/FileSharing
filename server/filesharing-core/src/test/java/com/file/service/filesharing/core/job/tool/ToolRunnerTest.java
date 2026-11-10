package com.file.service.filesharing.core.job.tool;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;

import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

class ToolRunnerTest {
    private static final Path DIR = Path.of(System.getProperty("java.io.tmpdir"));
    private static final Pattern PIDS = Pattern.compile("child=(\\d+)(?: grandchild=(\\d+))?");

    private ListAppender<ILoggingEvent> logs;
    private Logger logger;

    @BeforeEach
    void attachLogs() {
        logger = (Logger) LoggerFactory.getLogger(ToolRunner.class);
        logs = new ListAppender<>();
        logs.start();
        logger.addAppender(logs);
        logger.setLevel(Level.DEBUG);
    }

    @AfterEach
    void detachLogs() {
        logger.detachAppender(logs);
    }

    private static ToolCommand cmd(Duration timeout, LineParser parser, String... args) {
        return new ToolCommand("child", ChildProcessMain.cmd(args), timeout, List.of(), Map.of(), parser);
    }

    private static ToolResult run(ToolCommand c) throws Exception {
        return ToolRunner.run(c, DIR, p -> { }, "J1", "A1");
    }

    // Bat PID con/chau tu stdout cua ChildProcessMain
    private static LineParser pidCatcher(List<Long> pids) {
        return (stderr, line) -> {
            Matcher m = PIDS.matcher(line);
            if (!stderr && m.find()) {
                pids.add(Long.parseLong(m.group(1)));
                if (m.group(2) != null) pids.add(Long.parseLong(m.group(2)));
            }
        };
    }

    private static void assertAllDead(List<Long> pids, long withinMs) throws InterruptedException {
        long end = System.currentTimeMillis() + withinMs;
        while (System.currentTimeMillis() < end) {
            if (pids.stream().noneMatch(ToolRunnerTest::alive)) return;
            Thread.sleep(100);
        }
        fail("con tien trinh song: " + pids.stream().filter(ToolRunnerTest::alive).toList());
    }

    private static boolean alive(long pid) {
        return ProcessHandle.of(pid).map(ProcessHandle::isAlive).orElse(false);
    }

    private static void awaitSize(List<?> list, int n, long ms) throws InterruptedException {
        long end = System.currentTimeMillis() + ms;
        while (list.size() < n && System.currentTimeMillis() < end) Thread.sleep(50);
        assertTrue(list.size() >= n, "khong bat duoc PID");
    }

    @Test
    void nonZeroExitHasBriefAndRedactedTail() throws Exception {
        ToolResult r = run(cmd(Duration.ofSeconds(30), null, "stderr", "3", "LINE-A", "LINE-B", "LINE-C"));
        assertFalse(r.ok());
        assertEquals(3, r.exitCode());
        assertTrue(r.brief().contains("child") && r.brief().contains("exit 3"), r.brief());
        assertFalse(r.brief().contains("LINE-"), r.brief());
        assertTrue(r.detail().endsWith("LINE-C"), r.detail());

        // 100 dong dai: tail giu 40 dong cuoi, detail <= 1500 ky tu, bo dong cu truoc
        ToolResult big = run(cmd(Duration.ofSeconds(30), null, "lines", "3", "100"));
        assertTrue(big.tail().size() <= 40);
        assertTrue(big.detail().length() <= 1500, "len=" + big.detail().length());
        assertTrue(big.detail().contains("LINE-100"));
        assertFalse(big.detail().contains("LINE-061"));
        assertFalse(big.detail().contains("LINE-001"));
    }

    @Test
    void timeoutKillsTree() throws Exception {
        List<Long> pids = Collections.synchronizedList(new ArrayList<>());
        ToolResult r = run(cmd(Duration.ofSeconds(3), pidCatcher(pids), "spawn-grandchild", "60000"));
        assertTrue(r.timedOut());
        assertTrue(r.brief().contains("timeout"), r.brief());
        assertEquals(2, pids.size(), "phai bat duoc PID con va chau");
        assertAllDead(pids, 5000);
    }

    @Test
    void noProcessLeftAfterAnyOutcome() throws Exception {
        // thoat 0
        List<Long> p1 = Collections.synchronizedList(new ArrayList<>());
        ToolRunner.run(cmd(Duration.ofSeconds(30), null, "exit", "0"), DIR, p -> p1.add(p.pid()), "J", "A");
        assertAllDead(p1, 5000);

        // timeout
        List<Long> p2 = Collections.synchronizedList(new ArrayList<>());
        ToolRunner.run(cmd(Duration.ofSeconds(2), pidCatcher(p2), "spawn-grandchild", "60000"), DIR, p -> { }, "J", "A");
        assertAllDead(p2, 5000);

        // onStart nem exception
        List<Long> p3 = Collections.synchronizedList(new ArrayList<>());
        assertThrows(IllegalStateException.class, () -> ToolRunner.run(cmd(Duration.ofSeconds(30), null, "sleep", "60000"),
                DIR, p -> { p3.add(p.pid()); throw new IllegalStateException("dang ky loi"); }, "J", "A"));
        assertAllDead(p3, 5000);

        // thread goi bi interrupt
        List<Long> p4 = Collections.synchronizedList(new ArrayList<>());
        AtomicReference<Throwable> err = new AtomicReference<>();
        Thread t = new Thread(() -> {
            try {
                ToolRunner.run(cmd(Duration.ofSeconds(60), pidCatcher(p4), "spawn-grandchild", "60000"), DIR, p -> { }, "J", "A");
            } catch (Throwable e) {
                err.set(e);
            }
        });
        t.start();
        awaitSize(p4, 2, 10_000);
        t.interrupt();
        t.join(10_000);
        assertInstanceOf(InterruptedException.class, err.get());
        assertAllDead(p4, 5000);
    }

    @Test
    void logsToolStartEnd() throws Exception {
        run(cmd(Duration.ofSeconds(30), null, "exit", "0"));
        List<String> info = logs.list.stream().filter(e -> e.getLevel() == Level.INFO)
                .map(ILoggingEvent::getFormattedMessage).toList();
        List<String> start = info.stream().filter(m -> m.startsWith("tool-start")).toList();
        List<String> end = info.stream().filter(m -> m.startsWith("tool-end")).toList();
        assertEquals(1, start.size(), info.toString());
        assertEquals(1, end.size(), info.toString());
        for (String m : List.of(start.get(0), end.get(0))) {
            assertTrue(m.contains("job=J1") && m.contains("attempt=A1") && m.contains("tool=child"), m);
        }
        assertTrue(end.get(0).contains("exit=0") && end.get(0).contains("wallMs="), end.get(0));
    }

    @Test
    void throwingParserDoesNotHang() throws Exception {
        LineParser bad = (stderr, line) -> { throw new IllegalArgumentException("parser loi"); };
        ToolResult r = run(cmd(Duration.ofSeconds(60), bad, "flood", "512"));
        assertEquals(0, r.exitCode());
        assertFalse(r.timedOut());
        assertTrue(r.wallMs() < 10_000, "wallMs=" + r.wallMs());
    }

    @Test
    void envIsWhitelisted() throws Exception {
        List<String> names = Collections.synchronizedList(new ArrayList<>());
        ToolCommand c = new ToolCommand("child", ChildProcessMain.cmd("print-env"), Duration.ofSeconds(30),
                List.of(), Map.of("FOO_BAR", "1"), (stderr, line) -> { if (!stderr) names.add(line); });
        ToolResult r = run(c);
        assertEquals(0, r.exitCode());
        Set<String> allowed = ToolRunner.ENV_WHITELIST.stream().map(s -> s.toUpperCase(Locale.ROOT)).collect(Collectors.toSet());
        allowed.add("FOO_BAR");
        assertTrue(names.contains("FOO_BAR"), names.toString());
        List<String> extra = names.stream().filter(n -> !allowed.contains(n.toUpperCase(Locale.ROOT))).toList();
        assertEquals(List.of(), extra);
    }

    @Test
    void redactsSecretsAndSignature() throws Exception {
        String url = "http://h:9000/b/x.mp4?X-Amz-Signature=SIGVAL123&X-AMZ-CREDENTIAL=CREDVAL456&a=1";
        List<String> args = new ArrayList<>(ChildProcessMain.cmd("stderr", "1", "Input #0 from '" + url + "'", "token SECRETXYZ"));
        args.add(url);
        List<String> seen = Collections.synchronizedList(new ArrayList<>());
        ToolCommand c = new ToolCommand("child", args, Duration.ofSeconds(30), List.of("SECRETXYZ"), Map.of(),
                (stderr, line) -> seen.add(line));
        ToolResult r = run(c);
        String all = String.join("\n", r.tail()) + r.brief() + r.detail() + String.join("\n", seen)
                + logs.list.stream().map(ILoggingEvent::getFormattedMessage).collect(Collectors.joining("\n"));
        assertTrue(all.contains("Input #0"), all);
        for (String leak : List.of("SIGVAL123", "CREDVAL456", "SECRETXYZ")) {
            assertFalse(all.contains(leak), "lo " + leak + ":\n" + all);
        }
    }
}
