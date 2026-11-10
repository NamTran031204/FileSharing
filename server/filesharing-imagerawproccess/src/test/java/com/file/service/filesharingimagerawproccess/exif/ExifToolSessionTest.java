package com.file.service.filesharingimagerawproccess.exif;

import com.file.service.filesharing.core.job.exception.PermanentJobException;
import com.file.service.filesharing.core.job.exception.TransientJobException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

class ExifToolSessionTest {
    private ExifToolSession session;

    private ExifToolSession open(Duration timeout, Duration lockWait) {
        session = new ExifToolSession(FakeExifToolMain.cmd(), timeout, lockWait);
        return session;
    }

    @AfterEach
    void close() {
        if (session != null) session.close();
    }

    @Test
    void crlfArgRejected() {
        open(Duration.ofSeconds(5), Duration.ofSeconds(5));
        assertThrows(PermanentJobException.class, () -> session.execute(() -> false, List.of("a\n-if\n1")));
        assertThrows(PermanentJobException.class, () -> session.execute(() -> false, List.of("x\r")));
    }

    @Test
    void timeoutKillsSessionAndNextCommandWorks() throws Exception {
        open(Duration.ofSeconds(1), Duration.ofSeconds(5));
        session.execute(() -> false, List.of("id=1"));
        long oldPid = session.pid();
        TransientJobException e = assertThrows(TransientJobException.class, () -> session.execute(() -> false, List.of("hang")));
        assertTrue(e.getMessage().contains("timeout"), e.getMessage());
        long until = System.currentTimeMillis() + 5000;
        while (ProcessHandle.of(oldPid).map(ProcessHandle::isAlive).orElse(false) && System.currentTimeMillis() < until) Thread.sleep(50);
        assertFalse(ProcessHandle.of(oldPid).map(ProcessHandle::isAlive).orElse(false), "phien cu con song");
        ExifToolSession.Result r = session.execute(() -> false, List.of("id=2"));
        assertTrue(r.stdout().contains("result id=2"), r.stdout());
        assertNotEquals(oldPid, session.pid());
    }

    @Test
    void timeoutCountsOnlyAfterLock() throws Exception {
        // khoa fair: A, C giu khoa ~900ms moi lenh (duoi timeout 1s); B xep sau ca hai, cho ~1.8s roi van thanh cong
        open(Duration.ofSeconds(1), Duration.ofSeconds(10));
        session.execute(() -> false, List.of("id=warm"));
        List<Throwable> errors = Collections.synchronizedList(new ArrayList<>());
        AtomicReference<String> outB = new AtomicReference<>();
        Thread a = new Thread(() -> run(errors, null, "slow", "900", "id=A"));
        Thread c = new Thread(() -> run(errors, null, "slow", "900", "id=C"));
        Thread b = new Thread(() -> run(errors, outB, "id=B"));
        long t0 = System.currentTimeMillis();
        a.start();
        Thread.sleep(150);
        c.start();
        Thread.sleep(150);
        b.start();
        a.join(10_000);
        c.join(10_000);
        b.join(10_000);
        assertEquals(List.of(), errors);
        assertTrue(outB.get().contains("result id=B"), outB.get());
        assertTrue(System.currentTimeMillis() - t0 > 1500, "B phai cho lau hon timeout");
    }

    @Test
    void lostLeaseStopsWaiting() throws Exception {
        open(Duration.ofSeconds(5), Duration.ofSeconds(30));
        session.execute(() -> false, List.of("id=warm"));
        AtomicReference<String> outA = new AtomicReference<>();
        List<Throwable> errors = Collections.synchronizedList(new ArrayList<>());
        Thread a = new Thread(() -> run(errors, outA, "slow", "3000", "id=A"));
        a.start();
        Thread.sleep(200);
        AtomicBoolean lost = new AtomicBoolean();
        CountDownLatch done = new CountDownLatch(1);
        AtomicReference<Throwable> errB = new AtomicReference<>();
        long t0 = System.currentTimeMillis();
        Thread b = new Thread(() -> {
            try {
                session.execute(lost::get, List.of("id=B"));
            } catch (Throwable e) {
                errB.set(e);
            }
            done.countDown();
        });
        b.start();
        Thread.sleep(500);
        lost.set(true);
        done.await();
        assertInstanceOf(TransientJobException.class, errB.get());
        assertTrue(System.currentTimeMillis() - t0 < 2500, "B phai thoi cho truoc khi A xong");
        a.join(10_000);
        assertEquals(List.of(), errors);
        assertTrue(outA.get().contains("result id=A") && !outA.get().contains("id=B"), outA.get());
    }

    @Test
    void noCrossRead() throws Exception {
        open(Duration.ofSeconds(5), Duration.ofSeconds(30));
        List<Throwable> errors = Collections.synchronizedList(new ArrayList<>());
        Runnable worker = () -> {
            String me = Thread.currentThread().getName();
            for (int i = 0; i < 50; i++) {
                try {
                    ExifToolSession.Result r = session.execute(() -> false, List.of("id=" + me + "-" + i));
                    String out = r.stdout().trim();
                    if (!out.equals("result id=" + me + "-" + i)) errors.add(new AssertionError(me + " nhan: " + out));
                } catch (Exception e) {
                    errors.add(e);
                }
            }
        };
        Thread x = new Thread(worker, "X");
        Thread y = new Thread(worker, "Y");
        x.start();
        y.start();
        x.join(60_000);
        y.join(60_000);
        assertEquals(List.of(), errors);
    }

    private void run(List<Throwable> errors, AtomicReference<String> out, String... args) {
        try {
            ExifToolSession.Result r = session.execute(() -> false, List.of(args));
            if (out != null) out.set(r.stdout());
        } catch (Throwable e) {
            errors.add(e);
        }
    }
}
